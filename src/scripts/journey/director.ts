// The director turns one number, the journey position `p` (stop index, fractional between
// stops), into everything on screen: which scene is live, where the rover and rocket are, where
// the camera sits, the sky, the white-out, and the odometer. It keeps no history (only smoke,
// which is pure decoration), so any scroll position renders the same frame whichever way you
// arrive. Three kinds of segment: a drive on Earth, the flight, and a drive on the Moon.
import * as THREE from 'three';
import { FLIGHT, flight, follow, odometer, stops, type Framing, type StopId } from '../../data/journey';
import { createRocket, createSmoke } from './actors/rocket';
import { createRover } from './actors/rover';
import { createEarth } from './world/earth';
import type { Road, RoadFrame } from './world/route';
import { createMoon, createSpace } from './world/space';
import type { Look } from './post';
import { clamp, easeIn, easeInOut, easeOut, lerp, range, smoothstep } from './util';

const UP = new THREE.Vector3(0, 1, 0);
const LAUNCH = FLIGHT - 1;

// `still` is prefers-reduced-motion: no camera shake, body bob or plume flicker.
export function createDirector(still: boolean) {
  const earth = createEarth(still);
  const space = createSpace();
  const moon = createMoon(space.textures);
  const rover = createRover();
  const rocket = createRocket();
  const smoke = createSmoke(700, 0xd9cfc8, 0xffb36b);
  const dust = createSmoke(400, 0x8c877f, 0xb5ab9c);
  earth.scene.add(smoke.object);
  moon.scene.add(dust.object);

  const metres = (stop: (typeof stops)[number], road: Road) => (stop.at < 0 ? road.length + stop.at : stop.at);
  const parked = earth.road.frameAt(earth.road.u(metres(stops[LAUNCH], earth.road)));
  // On the pad the hatch faces the road, so the rover drives straight up the ramp.
  const toRoad = parked.position.clone().sub(earth.pad).setY(0).normalize();
  const padYaw = Math.atan2(toRoad.x, toRoad.z);
  const moonYaw = 0.6;
  const moonPark = moon.road.frameAt(0).position.clone();
  const moonStart = moon.road.frameAt(0).forward.clone(); // the way the Moon road sets off
  const ROLLOUT = 9; // metres from the ramp's foot to the parking spot
  // Where the landing storyboard leaves the camera: low behind the rover, Earth in the sky.
  const landedPose = { position: new THREE.Vector3(16.8, 2.6, 20.9), look: new THREE.Vector3(2.2, 9, -18.5) };

  // Scratch values, reused every frame so the render loop makes no garbage.
  const camPos = new THREE.Vector3(); const camLook = new THREE.Vector3();
  const a = new THREE.Vector3(); const b = new THREE.Vector3(); const c = new THREE.Vector3(); const d = new THREE.Vector3();
  const e = new THREE.Vector3(); const g = new THREE.Vector3(); const h = new THREE.Vector3(); const k = new THREE.Vector3();
  const flat = new THREE.Vector3(); const nozzle = new THREE.Vector3(); const retro = new THREE.Quaternion();
  const roadFrame: RoadFrame = { position: new THREE.Vector3(), forward: new THREE.Vector3(), right: new THREE.Vector3() };
  const blended: Framing = { yaw: 0, pitch: 0, distance: 0, lift: 0, ahead: 0, toward: 0, fov: 42 };
  const motion = still ? 0 : 1;

  // A camera pose orbiting the rover: blend framings by their numbers (not positions), so a
  // change of framing sweeps the camera around the rover instead of through it. Tall screens
  // see less sideways, so every framing stands further back there.
  let reach = 1;
  let tall = false;
  // A stop's framing, with its tall-screen adjustments applied on phones and portrait tablets.
  const framingOf = (stop: (typeof stops)[number]): Framing => (tall && stop.tall ? { ...stop.framing, ...stop.tall } : stop.framing);
  const orbit = (frame: RoadFrame, f: Framing, outPos: THREE.Vector3, outLook: THREE.Vector3) => {
    const distance = f.distance * reach;
    flat.copy(frame.forward).multiplyScalar(-Math.cos(f.yaw)).addScaledVector(frame.right, Math.sin(f.yaw));
    outPos.copy(frame.position).addScaledVector(flat, Math.cos(f.pitch) * distance).addScaledVector(UP, Math.sin(f.pitch) * distance + f.lift * 0.5);
    outLook.copy(frame.position).addScaledVector(UP, f.lift).addScaledVector(frame.forward, f.ahead).addScaledVector(frame.right, f.toward);
  };
  const blend = (weights: [number, Framing][]) => {
    (Object.keys(blended) as (keyof Framing)[]).forEach((key) => { blended[key] = 0; });
    weights.forEach(([w, f]) => { (Object.keys(blended) as (keyof Framing)[]).forEach((key) => { blended[key] += f[key] * w; }); });
    return blended;
  };
  // Leaving a stop the camera swings from its framing to the follow rig, and on arrival into
  // the next stop's framing.
  const leaving = (f: number) => 1 - smoothstep(0, 0.42, f);
  const arriving = (f: number) => smoothstep(0.58, 1, f);

  const place = (object: THREE.Object3D, scene: THREE.Scene) => { if (object.parent !== scene) scene.add(object); };
  const shake = (time: number, amount: number) => a.set(Math.sin(time * 47.3) + Math.sin(time * 23.1), Math.sin(time * 39.7) + Math.sin(time * 17.9), Math.sin(time * 31.3)).multiplyScalar(amount * motion);
  // `look` and `tilt` steer the high tier's post-processing: which scene's bloom to use, and
  // how strongly the model-landscape blur applies (full on Earth, none in space).
  const result = { scene: earth.scene, fov: 42, flash: 0, km: 0, look: 'earth' as Look, tilt: 1 };
  const groundKm = (m: number) => m * odometer.perMetre;
  const padKm = groundKm(metres(stops[LAUNCH], earth.road));

  // How present each stop is: 1 parked there, fading to 0 half a stop away.
  const stopIndex = new Map(stops.map((stop, i) => [stop.id, i]));
  let position = 0;
  const activity = (id: StopId) => 1 - smoothstep(0.15, 0.6, Math.abs(position - (stopIndex.get(id) ?? -9)));

  // `pointer` is the cursor in -1..1 screen space (null when there's no hover pointer).
  const frame = (p: number, time: number, dt: number, camera: THREE.PerspectiveCamera, pointer: { x: number; y: number } | null) => {
    position = p;
    // Tall screens see less sideways, so every framing stands further back there, and some
    // stops re-aim (see `tall` in the stop data) to keep the rover above the card.
    tall = camera.aspect < 0.9;
    reach = tall ? 1.45 : 1;
    const seg = Math.min(stops.length - 2, Math.floor(p));
    const f = clamp(p - seg);
    const from = stops[seg]; const to = stops[seg + 1];
    let thrust = 0; let rampOut = 1; let altitude = 0; let skyTime = 4; let rocketLit = 1; let lamps = 0;
    let smoked = false; let dusted = false;
    const onEarth = from.world === 'earth' && to.world === 'earth';
    const onMoon = from.world === 'moon';
    result.flash = 0;
    result.fov = 42;
    result.look = 'earth';
    result.tilt = 1;
    rover.object.visible = true;
    rover.object.scale.setScalar(1);

    if (onEarth) {
      // ---------- A drive on Earth ----------
      const m = lerp(metres(from, earth.road), metres(to, earth.road), f);
      const here = earth.road.frameAt(earth.road.u(m), roadFrame);
      rover.object.position.copy(here.position);
      rover.object.lookAt(c.copy(here.position).add(here.forward));
      place(rover.object, earth.scene);
      orbit(here, blend([[leaving(f), framingOf(from)], [1 - leaving(f) - arriving(f), follow], [arriving(f), framingOf(to)]]), camPos, camLook);
      result.fov = blended.fov;
      // The miniature blur deepens while driving and eases off when parked at a stop.
      result.tilt = lerp(0.45, 1, Math.sin(f * Math.PI));
      skyTime = lerp(from.sky, to.sky, f);
      rocketLit = seg >= LAUNCH - 1 ? smoothstep(0.6, 1, f) : 0;
      result.scene = earth.scene;
      result.km = groundKm(m);
      place(rocket.object, earth.scene);
      rocket.object.position.copy(earth.pad);
      rocket.object.rotation.set(0, padYaw, 0);
    } else if (onMoon) {
      // ---------- A drive on the Moon, from the landing site to the end of the paving ----------
      const m = lerp(metres(from, moon.road), metres(to, moon.road), f);
      const here = moon.road.frameAt(moon.road.u(m), roadFrame);
      rover.object.position.copy(here.position);
      rover.object.lookAt(c.copy(here.position).add(here.forward));
      place(rover.object, moon.scene);
      // The landing pose is a fixed shot, so blend it by position into the rover rig.
      orbit(here, blend([[1 - arriving(f), follow], [arriving(f), framingOf(to)]]), camPos, camLook);
      const settle = leaving(f);
      camPos.lerp(landedPose.position, settle);
      camLook.lerp(landedPose.look, settle);
      place(rocket.object, moon.scene);
      rocket.object.position.set(0, 0, 0);
      rocket.object.rotation.set(0, moonYaw, 0);
      rover.update(6 + ROLLOUT + m, time, 0.6, Math.sin(f * Math.PI) * motion);
      result.fov = 44;
      result.scene = moon.scene;
      result.look = 'moon';
      result.tilt = 0.5;
      result.km = odometer.moon + groundKm(m);
      moon.update(time);
    } else if (f < flight.toSpace) {
      // ---------- Boarding, ignition, ascent ----------
      const climb = easeIn(range(f, flight.ignited, flight.toSpace), 2.6);
      const height = climb * flight.ascentHeight;
      place(rocket.object, earth.scene);
      rocket.object.position.copy(earth.pad).add(c.set(70 * climb ** 1.5, height, 0));
      rocket.object.rotation.set(0, padYaw, -0.22 * climb);
      rocket.object.updateMatrixWorld();
      thrust = range(f, flight.boarded, flight.ignited);
      rampOut = 1 - range(f, flight.boarded, flight.boarded + 0.03);

      // The rover drives to the foot of the ramp, climbs it, and disappears into the hatch.
      const board = range(f, 0, flight.boarded);
      const foot = rocket.object.localToWorld(b.copy(rocket.rampFoot));
      const hatch = rocket.object.localToWorld(d.copy(rocket.hatchPoint));
      const leg = easeInOut(range(board, 0, 0.6));
      const climbRamp = range(board, 0.6, 1);
      rover.object.position.copy(parked.position).lerp(foot, leg).lerp(hatch, climbRamp);
      const heading = climbRamp > 0 ? c.subVectors(hatch, foot) : c.subVectors(foot, parked.position);
      rover.object.lookAt(heading.add(rover.object.position));
      rover.object.scale.setScalar(1 - smoothstep(0.82, 1, board));
      rover.object.visible = board < 1;
      place(rover.object, earth.scene);
      rover.update(metres(stops[LAUNCH], earth.road) + board * 30, time, 0, board < 1 ? motion : 0);

      // Camera: the launch framing, then wide on the pad, then chasing the climb from below,
      // then looking down the plume at a shrinking map as the clouds close in.
      orbit(parked, framingOf(stops[LAUNCH]), a, b);
      const pad = earth.pad;
      const back = toRoad;
      const side = e.crossVectors(back, UP).normalize();
      const wide = d.copy(pad).addScaledVector(back, 72).addScaledVector(side, -10).setY(pad.y + 6);
      const settle = smoothstep(0, flight.boarded, f);
      camPos.copy(a).lerp(wide, settle);
      camLook.copy(b).lerp(c.copy(pad).setY(pad.y + 18), settle);
      const ascent = range(f, flight.ignited, flight.toSpace);
      const rocketAt = rocket.object.position;
      const below = g.copy(rocketAt).addScaledVector(back, 42).addScaledVector(side, -20).add(c.set(0, -14, 0));
      below.y = Math.max(below.y, pad.y + 3);
      const above = h.copy(rocketAt).addScaledVector(back, 26).addScaledVector(side, 14).add(c.set(0, 46, 0));
      const chase = smoothstep(0, 0.32, ascent); const topDown = smoothstep(0.45, 0.8, ascent);
      camPos.lerp(below, chase).lerp(above, topDown);
      camLook.lerp(c.copy(rocketAt).add(d.set(0, 14, 0)), chase).lerp(c.copy(rocketAt).add(d.set(0, -40, 0)), topDown);
      camPos.add(shake(time, thrust * (1 - ascent) * 0.22));

      altitude = smoothstep(0, flight.cloudDeck, height);
      result.fov = lerp(42, 56, smoothstep(0, 0.5, ascent));
      result.tilt = lerp(0.45, 1, settle) * (1 - smoothstep(0, 0.35, ascent));
      result.flash = smoothstep(flight.cloudsIn, flight.toSpace, f);
      result.scene = earth.scene;
      result.km = padKm + (odometer.orbit - padKm) * climb;
      nozzle.copy(rocketAt);
      smoke.update(dt, thrust * (height < 120 ? 320 : 70), nozzle, pad.y, 16);
      smoked = true;
    } else if (f < flight.toMoon) {
      // ---------- The coast: Earth below, the Moon ahead ----------
      const s = range(f, flight.toSpace, flight.toMoon);
      const along = easeInOut(s);
      const at = space.path.getPoint(along, a);
      const tangent = space.path.getTangent(along, b).normalize();
      place(rocket.object, space.scene);
      rocket.object.position.copy(at);
      const flip = smoothstep(0.62, 0.8, s);
      rocket.object.quaternion.setFromUnitVectors(UP, tangent).slerp(retro.setFromUnitVectors(UP, c.copy(tangent).negate()), flip);
      thrust = Math.max(1 - smoothstep(0, 0.14, s), smoothstep(0.84, 0.95, s) * 0.7);
      rampOut = 0;
      rover.object.visible = false;
      const side = c.crossVectors(tangent, UP).normalize();
      const ahead = d.copy(at).addScaledVector(tangent, 45).addScaledVector(side, 14).addScaledVector(UP, 6);
      const beside = e.copy(at).addScaledVector(side, 80).addScaledVector(UP, 15).addScaledVector(tangent, -10);
      const behind = g.copy(at).addScaledVector(tangent, -60).addScaledVector(side, 12).addScaledVector(UP, 4);
      const w1 = smoothstep(0.1, 0.45, s); const w2 = smoothstep(0.55, 0.95, s);
      camPos.copy(ahead).lerp(beside, w1).lerp(behind, w2);
      const lookBack = h.copy(at).addScaledVector(tangent, -10).addScaledVector(UP, -25);
      const lookBeside = k.copy(at).addScaledVector(tangent, 25);
      camLook.copy(lookBack).lerp(lookBeside, w1).lerp(space.moon.position, w2);
      result.fov = lerp(56, 46, s);
      result.flash = 1 - smoothstep(flight.toSpace, flight.cloudsOut, f);
      result.scene = space.scene;
      result.look = 'space';
      result.tilt = 0;
      result.km = odometer.orbit + (odometer.moon - 400 - odometer.orbit) * along;
      space.update(time);
    } else {
      // ---------- Landing, the ramp, and the rover's first metres on the Moon ----------
      const m = range(f, flight.toMoon, flight.landed);
      const out = range(f, flight.landed, 1);
      const height = 200 * (1 - easeOut(m, 3));
      place(rocket.object, moon.scene);
      rocket.object.position.set(0, height, 0);
      rocket.object.rotation.set(0, moonYaw, 0);
      rocket.object.updateMatrixWorld();
      thrust = m < 1 ? 0.95 - m * 0.35 : 0.6 * (1 - smoothstep(0, 0.25, out));
      rampOut = smoothstep(0.05, 0.35, out);
      const hatch = rocket.object.localToWorld(b.copy(rocket.hatchPoint));
      const foot = rocket.object.localToWorld(c.copy(rocket.rampFoot));
      const down = range(out, 0.3, 0.62); const roll = easeInOut(range(out, 0.62, 1));
      rover.object.visible = out > 0.3;
      rover.object.scale.setScalar(smoothstep(0.3, 0.4, out));
      rover.object.position.copy(hatch).lerp(foot, down).lerp(moonPark, roll);
      place(rover.object, moon.scene);
      const heading = roll > 0 ? d.subVectors(moonPark, foot).normalize().lerp(moonStart, smoothstep(0.5, 1, roll)) : d.subVectors(foot, hatch);
      rover.object.lookAt(heading.add(rover.object.position));
      rover.update(down * 6 + roll * ROLLOUT, time, 0.6, out > 0.3 && roll < 1 ? motion : 0);
      const descend = smoothstep(0.1, 0.95, m);
      camPos.set(0, 300, 0.01).lerp(landedPose.position, descend);
      camLook.set(0, 0, -0.5).lerp(landedPose.look, descend);
      camPos.add(shake(time, thrust * (1 - m) * 0.15));
      result.fov = lerp(46, 44, descend);
      result.scene = moon.scene;
      result.look = 'moon';
      result.tilt = 0.5 * smoothstep(0.3, 1, out);
      result.km = odometer.moon - 400 + 400 * Math.max(m, out);
      nozzle.copy(rocket.object.position);
      dust.update(dt, height < 45 ? thrust * 260 : 0, nozzle, 0.5, 22);
      dusted = true;
      moon.update(time);
    }

    // Particles left in the air keep fading out after you scroll away from their segment.
    if (!smoked) smoke.update(dt, 0, nozzle, 0, 0);
    if (!dusted) dust.update(dt, 0, nozzle, 0, 0);
    rocket.update(time, thrust, rampOut, result.scene === moon.scene ? 0.12 : 1, still);
    // At the first stop the rover's camera mast follows the visitor's cursor.
    const greeting = 1 - smoothstep(0.1, 0.5, p);
    if (pointer && greeting > 0) rover.aim(pointer.x * greeting, pointer.y * greeting, dt);
    else rover.aim(0, 0, dt);
    if (result.scene === earth.scene) {
      earth.interact(time, dt, activity);
      // The camera never dips into a hill, wherever a framing or blend puts it; the sky dome
      // then follows this frame's camera position, not last frame's.
      camPos.y = Math.max(camPos.y, earth.heightAt(camPos.x, camPos.z) + 2.5);
      lamps = earth.update(skyTime, altitude, camPos, rover.object.visible ? rover.object.position : earth.pad, rocketLit);
      if (onEarth) rover.update(lerp(metres(from, earth.road), metres(to, earth.road), f), time, lamps, Math.sin(f * Math.PI) * motion);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    return result;
  };

  // The cards' controls: sliders and buttons talk to whichever stop they belong to.
  const control = (id: StopId, key: string, value: number) => {
    if (id === 'southpoint' || id === 'next') moon.control(key, value);
    else earth.control(id, key, value);
  };

  return { frame, control, smoke, dust, rover, scenes: [earth.scene, space.scene, moon.scene] };
}
