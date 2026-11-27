// The ground chapters, grey-boxed: the street, the foothills, campus, the badlands and the
// prairie pad, joined by one winding road. Terrain takes its colour and relief from the
// chapter it belongs to; ridges sit inside the bends so each stop appears as you round it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { flight, type StopId } from '../../../data/journey';
import { fbm, seeded, smoothstep, softDot } from '../util';
import { peaceBridge } from './calgary';
import { biomes, biomeWeights, createLand, earthRoad, river, ROAD_WIDTH, type Ridge } from './route';
import { asphalt as asphaltTexture, concrete, ripples } from './textures';
import { buildSites } from './sites';
import { createSky } from './sky';

const BOARD = { centre: new THREE.Vector3(0, 0, -340), width: 720, depth: 920 };
const FIELD = '#7a7448';

// `still` is prefers-reduced-motion: the river, banners and torch hold still.
export function createEarth(still: boolean) {
  const scene = new THREE.Scene();
  const road = earthRoad;
  const sites = buildSites(scene, still);

  // The pad sits past the end of the road.
  const end = road.frameAt(1);
  const pad = end.position.clone().addScaledVector(end.forward, 18);
  // The Peace Bridge stands square across the river, 38 m downstream (east) of the road bridge.
  const bridgeAt = road.frameAt(road.u(river.crossing));
  const peaceX = bridgeAt.position.x + 38;
  const peaceAt = new THREE.Vector3(peaceX, 0, river.centre(peaceX));
  const flats = [...sites.flats, { at: pad, radius: 36 }, { at: peaceAt, radius: 22 }];
  // The road bridge spans every metre where the river's channel meets the road, which is
  // longer than the river is wide because the road crosses it aslant.
  const span = (() => {
    const reach = river.width / 2 + 8;
    const overRiver = (metres: number) => { const p = road.frameAt(road.u(metres)).position; return river.distance(p.x, p.z) < reach; };
    let from = river.crossing; let to = river.crossing;
    while (overRiver(from - 1)) from -= 1;
    while (overRiver(to + 1)) to += 1;
    return [from - 2, to + 2];
  })();
  const ridge = (metres: number, side: number, radius: number, height: number): Ridge => ({ at: road.beside(metres, side), radius, height });
  const ridges = [ridge(116, 46, 28, 55), ridge(400, 50, 30, 26), ridge(518, -44, 40, 70), ridge(602, 46, 36, 60), ridge(708, -40, 40, 66)];
  const land = createLand(flats, ridges, BOARD);

  // Terrain, flat-shaded so it reads as a hand-built model landscape.
  const geometry = new THREE.PlaneGeometry(BOARD.width, BOARD.depth, 180, 230);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(BOARD.centre.x, 0, BOARD.centre.z);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const grass = biomes.map((biome) => new THREE.Color(biome.grass));
  const dry = biomes.map((biome) => new THREE.Color(biome.dry));
  const rock = new THREE.Color('#7b7166'); const field = new THREE.Color(FIELD);
  const tint = new THREE.Color(); const mix = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i); const z = position.getZ(i);
    const h = land.heightAt(x, z);
    position.setY(i, h);
    const weights = biomeWeights(road.nearest(x, z).metres);
    const patch = fbm(x * 0.03 + 9, z * 0.03, 3);
    tint.setRGB(0, 0, 0);
    weights.forEach((w, b) => { if (w > 0) tint.add(mix.copy(grass[b]).lerp(dry[b], patch).multiplyScalar(w)); });
    // Badlands show their layers: pale and dark bands by height.
    if (weights[3] > 0) tint.lerp(mix.set(Math.floor(h / 3.5) % 2 ? '#c9875a' : '#9a5534'), weights[3] * smoothstep(1, 4, h));
    tint.lerp(rock, smoothstep(34, 60, h) * (1 - weights[3]));
    tint.lerp(field, smoothstep(0.36, 0.5, Math.max(Math.abs(x - BOARD.centre.x) / BOARD.width, Math.abs(z - BOARD.centre.z) / BOARD.depth)));
    colors.set([tint.r, tint.g, tint.b], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  terrain.receiveShadow = true;
  scene.add(terrain);
  // The fields beyond the board: a sheet with the board cut out of it (slightly overlapped),
  // so nothing lies under the board to show through where the river cuts below ground.
  const fields = new THREE.Shape([new THREE.Vector2(-6000, -6000), new THREE.Vector2(6000, -6000), new THREE.Vector2(6000, 6000), new THREE.Vector2(-6000, 6000)]);
  const inset = { x: BOARD.width / 2 - 6, z: BOARD.depth / 2 - 6 };
  fields.holes.push(new THREE.Path([new THREE.Vector2(-inset.x, -inset.z), new THREE.Vector2(-inset.x, inset.z), new THREE.Vector2(inset.x, inset.z), new THREE.Vector2(inset.x, -inset.z)]));
  const outer = new THREE.Mesh(new THREE.ShapeGeometry(fields), new THREE.MeshStandardMaterial({ color: FIELD, roughness: 1 }));
  outer.rotation.x = -Math.PI / 2;
  outer.position.set(BOARD.centre.x, -0.4, BOARD.centre.z);
  outer.receiveShadow = true;
  scene.add(outer);

  // The road: an asphalt ribbon with a dashed centre line, each built as one mesh.
  const ribbon = (width: number, y: number, ranges: [number, number][], steps: number) => {
    const vertices: number[] = []; const uvs: number[] = []; const indices: number[] = []; const frame = road.frameAt(0);
    ranges.forEach(([from, to]) => {
      const base = vertices.length / 3;
      for (let s = 0; s <= steps; s += 1) {
        const t = from + (to - from) * (s / steps);
        road.frameAt(t, frame);
        const { position: p, right } = frame;
        vertices.push(p.x - right.x * width / 2, y, p.z - right.z * width / 2, p.x + right.x * width / 2, y, p.z + right.z * width / 2);
        // Texture coordinates in road widths, so the asphalt never stretches along the bends.
        const v = (t * road.length) / width;
        uvs.push(0, v, 1, v);
        if (s < steps) { const a = base + s * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
    });
    const built = new THREE.BufferGeometry();
    built.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    built.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    built.setIndex(indices);
    built.computeVertexNormals();
    return built;
  };
  const asphalt = new THREE.Mesh(ribbon(ROAD_WIDTH, 0.04, [[0, 1]], 900), new THREE.MeshStandardMaterial({ map: asphaltTexture(), roughness: 0.92 }));
  asphalt.receiveShadow = true;
  const dashLength = 3 / road.length; const dashGap = 9 / road.length;
  const dashes: [number, number][] = [];
  for (let t = 0; t < 1; t += dashLength + dashGap) dashes.push([t, Math.min(1, t + dashLength)]);
  const paint = new THREE.Mesh(ribbon(0.15, 0.06, dashes, 2), new THREE.MeshStandardMaterial({ color: '#e8dcb8', roughness: 0.7 }));
  scene.add(asphalt, paint);

  // The Bow: glacier-green water in its channel, sliding east, under a concrete road bridge,
  // with the Peace Bridge just downstream.
  const flow = ripples();
  flow.repeat.set(BOARD.width / 60, 1);
  const water = new THREE.MeshStandardMaterial({ color: '#3f9d96', roughness: 0.24, metalness: 0.15, envMapIntensity: 2.2, bumpMap: flow, bumpScale: 0.8 });
  {
    const vertices: number[] = []; const uvs: number[] = []; const indices: number[] = [];
    const half = river.width / 2 + 2;
    const left = BOARD.centre.x - BOARD.width / 2; const steps = 180;
    for (let i = 0; i <= steps; i += 1) {
      const x = left + (i / steps) * BOARD.width;
      const z = river.centre(x);
      const across = half * Math.sqrt(1 + river.slope(x) ** 2); // keep the width even through bends
      vertices.push(x, river.water, z - across, x, river.water, z + across);
      uvs.push(i / steps, 0, i / steps, 1);
      if (i < steps) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const surface = new THREE.BufferGeometry();
    surface.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    surface.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    surface.setIndex(indices);
    surface.computeVertexNormals();
    const stream = new THREE.Mesh(surface, water);
    stream.receiveShadow = true;
    scene.add(stream);

    // The road bridge: a concrete deck under the asphalt and a parapet on each edge, built
    // along the road itself so it follows the bend, over the whole span found above.
    const frame = road.frameAt(0);
    const [from, to] = span;
    // A strip between two lines that run along the road, each given by (offset right, height).
    const strip = (a: [number, number], b: [number, number]) => {
      const vertices: number[] = []; const uvs: number[] = []; const indices: number[] = [];
      const steps = Math.ceil((to - from) / 2);
      for (let i = 0; i <= steps; i += 1) {
        const metres = from + ((to - from) * i) / steps;
        const { position: p, right } = road.frameAt(road.u(metres), frame);
        vertices.push(p.x + right.x * a[0], a[1], p.z + right.z * a[0], p.x + right.x * b[0], b[1], p.z + right.z * b[0]);
        uvs.push(metres / 4, 0, metres / 4, 1);
        if (i < steps) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    };
    const concreteMaterial = new THREE.MeshStandardMaterial({ color: '#b9b4aa', map: concrete(), roughness: 0.9, side: THREE.DoubleSide });
    const edge = ROAD_WIDTH / 2;
    const parts = [strip([-edge - 0.5, -1.1], [edge + 0.5, -1.1])]; // the deck's underside
    [-1, 1].forEach((side) => {
      const inner = side * (edge + 0.12); const outer = side * (edge + 0.5);
      parts.push(
        strip([outer, -1.1], [outer, 0.9]), // the deck's fascia and the parapet's outer face
        strip([inner, 0], [inner, 0.9]), // the parapet's inner face
        strip([inner, 0.9], [outer, 0.9]) // its top
      );
    });
    const bridge = new THREE.Mesh(mergeGeometries(parts), concreteMaterial);
    parts.forEach((part) => part.dispose());
    bridge.castShadow = bridge.receiveShadow = true;
    scene.add(bridge);

    const peace = peaceBridge(river.width + 14);
    peace.position.copy(peaceAt);
    peace.rotation.y = Math.atan2(-river.slope(peaceX), 1); // its axis runs across the flow
    scene.add(peace);
  }

  // The launch pad: a concrete deck, a lattice service tower and floodlights.
  const padGroup = new THREE.Group();
  padGroup.position.copy(pad);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 1.2, 48), new THREE.MeshStandardMaterial({ color: '#8b8780', roughness: 0.95 }));
  deck.position.y = 0.6;
  deck.receiveShadow = deck.castShadow = true;
  padGroup.add(deck);
  const steel = new THREE.MeshStandardMaterial({ color: '#4a4b52', roughness: 0.5, metalness: 0.6 });
  const tower = new THREE.Group();
  tower.position.set(-8, 1.2, -2);
  [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 40, 0.35), steel);
    leg.position.set(x, 20, z); leg.castShadow = true; tower.add(leg);
  });
  for (let y = 2; y < 40; y += 3) {
    [0, Math.PI / 2].forEach((turn) => {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 0.18), steel);
      brace.position.y = y; brace.rotation.y = turn; brace.rotation.z = 0.7; tower.add(brace);
    });
  }
  const arm = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.6, 1), steel);
  arm.position.set(3.6, 28, 0);
  tower.add(arm);
  padGroup.add(tower);
  const flood = new THREE.SpotLight(0xfff0d8, 0, 90, 0.42, 0.6, 1.2);
  flood.position.set(20, 22, 18);
  flood.target.position.set(0, 12, 0);
  padGroup.add(flood, flood.target);
  scene.add(padGroup);

  // Street lamps on the street and through campus, sodium-orange before dawn.
  const lampHead = new THREE.MeshStandardMaterial({ color: '#2b2b2b', emissive: '#ffb257', emissiveIntensity: 1 });
  const glowMaterial = new THREE.SpriteMaterial({ map: softDot(), color: '#ffb257', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const streetLamps = [...Array.from({ length: 6 }, (_, i) => 26 + i * 22), ...Array.from({ length: 6 }, (_, i) => 162 + i * 18), ...Array.from({ length: 8 }, (_, i) => 290 + i * 26)];
  // Lamps alternate sides; none stands where the road is a bridge over the Bow.
  const lamps = streetLamps.map((metres, i) => ({ metres, side: i % 2 ? 1 : -1 })).filter(({ metres }) => metres < span[0] - 2 || metres > span[1] + 2);
  const poles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 6, 0.16), new THREE.MeshStandardMaterial({ color: '#3a3a40', roughness: 0.6 }), lamps.length);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.2, 0.4), lampHead, lamps.length);
  poles.castShadow = true;
  const matrix = new THREE.Matrix4(); const quaternion = new THREE.Quaternion(); const scale = new THREE.Vector3(1, 1, 1);
  lamps.forEach(({ metres, side }, i) => {
    const base = road.beside(metres, side * (ROAD_WIDTH / 2 + 1.2));
    poles.setMatrixAt(i, matrix.compose(base.clone().setY(3), quaternion, scale));
    heads.setMatrixAt(i, matrix.compose(base.clone().setY(6), quaternion, scale));
    const glow = new THREE.Sprite(glowMaterial);
    glow.position.copy(base).setY(6);
    glow.scale.setScalar(4.5);
    scene.add(glow);
  });
  scene.add(poles, heads);
  const porch = new THREE.PointLight(0xffc27a, 0, 18, 1.6);
  porch.position.copy(road.beside(8, -12)).setY(3);
  scene.add(porch);

  // Spruce in the street and foothills, round trees on campus, sparse on the prairie, none in
  // the badlands (rocks instead).
  const random = seeded(19);
  const spruce = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 6, 7), new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.9 }), 1300);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2, 0), new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.9 }), 260);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.28, 1.6, 6), new THREE.MeshStandardMaterial({ color: '#4a3527', roughness: 1 }), 1560);
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#b26a42', flatShading: true, roughness: 1 }), 320);
  spruce.castShadow = crowns.castShadow = rocks.castShadow = true;
  const density = [0.45, 0.12, 0.35, 0, 0.12];
  const counts = { spruce: 0, crowns: 0, trunks: 0, rocks: 0 };
  const color = new THREE.Color(); const at = new THREE.Vector3(); const turn = new THREE.Euler();
  for (let attempt = 0; attempt < 20000; attempt += 1) {
    const x = BOARD.centre.x + (random() - 0.5) * BOARD.width * 0.92;
    const z = BOARD.centre.z + (random() - 0.5) * BOARD.depth * 0.92;
    const { distance, metres } = road.nearest(x, z);
    if (distance < ROAD_WIDTH + 4 || river.distance(x, z) < river.width / 2 + 4 || flats.some((flat) => Math.hypot(x - flat.at.x, z - flat.at.z) < flat.radius)) continue;
    const weights = biomeWeights(metres);
    const y = land.heightAt(x, z);
    const s = 0.7 + random() * 0.9;
    if (weights[3] > 0.5) {
      if (counts.rocks < rocks.count && random() < 0.25) {
        quaternion.setFromEuler(turn.set(random(), random(), random()));
        rocks.setMatrixAt(counts.rocks++, matrix.compose(at.set(x, y, z), quaternion, scale.setScalar(s * 1.4)));
      }
      continue;
    }
    const chance = weights.reduce((sum, w, b) => sum + w * density[b], 0);
    if (random() > chance) continue;
    const round = weights[2] > 0.5;
    if (round ? counts.crowns >= crowns.count : counts.spruce >= spruce.count) continue;
    quaternion.identity();
    trunks.setMatrixAt(counts.trunks++, matrix.compose(at.set(x, y + 0.8 * s, z), quaternion, scale.setScalar(s)));
    if (round) {
      crowns.setMatrixAt(counts.crowns, matrix.compose(at.set(x, y + 3.2 * s, z), quaternion, scale.setScalar(s)));
      crowns.setColorAt(counts.crowns++, color.set('#4f7a3a').offsetHSL(0, 0, (random() - 0.5) * 0.1));
    } else {
      spruce.setMatrixAt(counts.spruce, matrix.compose(at.set(x, y + 4.4 * s, z), quaternion, scale.setScalar(s)));
      spruce.setColorAt(counts.spruce++, color.set('#2f4a33').offsetHSL(0, 0, (random() - 0.5) * 0.08));
    }
  }
  spruce.count = counts.spruce; crowns.count = counts.crowns; trunks.count = counts.trunks; rocks.count = counts.rocks;
  scene.add(spruce, crowns, trunks, rocks);

  // The Rockies on the western horizon, hazed toward the sky colour so they sit far away.
  const peaks = new THREE.Group();
  const mountain = new THREE.MeshStandardMaterial({ color: '#5b6478', flatShading: true, roughness: 1, fog: false });
  const snow = new THREE.MeshStandardMaterial({ color: '#e9edf2', flatShading: true, roughness: 1, fog: false });
  for (let z = 200; z > -1000; z -= 46 + random() * 30) {
    const height = 160 + random() * 220; const radius = 130 + random() * 90; const x = -760 - random() * 220;
    const sides = 6 + Math.floor(random() * 3);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(radius, height, sides), mountain);
    peak.position.set(x, height / 2 - 20, z);
    peak.rotation.y = random() * Math.PI;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.3, height * 0.3, sides), snow);
    cap.position.set(x, height - 20 - height * 0.15 + 0.5, z);
    cap.rotation.y = peak.rotation.y;
    peaks.add(peak, cap);
  }
  scene.add(peaks);

  // The cloud deck the rocket punches through. From the ground it's a high, thin layer.
  const clouds = new THREE.Group();
  const cloudMaterial = new THREE.SpriteMaterial({ map: softDot(), color: '#ffffff', transparent: true, opacity: 0.85, depthWrite: false, fog: false });
  for (let i = 0; i < 90; i += 1) {
    const sprite = new THREE.Sprite(cloudMaterial);
    sprite.position.set(pad.x + (random() - 0.5) * 1400, flight.cloudDeck + (random() - 0.5) * 50, pad.z + (random() - 0.5) * 1400);
    sprite.scale.set(220 + random() * 260, 90 + random() * 80, 1);
    clouds.add(sprite);
  }
  scene.add(clouds);

  const sky = createSky(scene);
  const haze = new THREE.Color();
  // Each stop's live parts run while the rover is near, and once more as it leaves so they can
  // settle (the driveway regrimes, motors spin down).
  const wasActive = new Map<StopId, number>();
  return {
    scene,
    interact(time: number, dt: number, activity: (id: StopId) => number) {
      if (!still) flow.offset.x = time * 0.02; // downstream
      sites.tick(time, dt);
      (Object.keys(sites.interactions) as StopId[]).forEach((id) => {
        const active = activity(id);
        if (active > 0 || (wasActive.get(id) ?? 0) > 0) sites.interactions[id]?.update(time, dt, active);
        wasActive.set(id, active);
      });
    },
    control(id: StopId, key: string, value: number) { sites.interactions[id]?.control?.(key, value); },
    road,
    heightAt: land.heightAt,
    pad: pad.clone().setY(1.2),
    update(time: number, altitude: number, eye: THREE.Vector3, focus: THREE.Vector3, rocketLit: number) {
      sky.update(time, altitude, eye, focus);
      const lamps = sky.state.lamps;
      lampHead.emissiveIntensity = 0.2 + lamps * 2.4;
      glowMaterial.opacity = lamps * 0.8;
      porch.intensity = lamps * 60;
      flood.intensity = rocketLit * 300;
      sites.update(lamps);
      cloudMaterial.color.copy(sky.cloudTint);
      mountain.color.set('#59617a').lerp(haze.copy(sky.horizon), 0.45);
      snow.color.set('#eef1f5').lerp(haze.copy(sky.horizon), 0.3);
      return lamps;
    }
  };
}
