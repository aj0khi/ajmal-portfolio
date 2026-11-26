// The rocket, its engine plume, and the smoke it leaves behind. The rocket's origin is the
// bottom of the engine bell, so standing it on a pad is just setting y. Smoke lives in world
// space (not on the rocket), so the column hangs in the air after lift-off.
import * as THREE from 'three';
import { softDot } from '../util';

export function createRocket() {
  const object = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xeceae4, roughness: 0.45, metalness: 0.15 });
  const charcoal = new THREE.MeshStandardMaterial({ color: 0x24252b, roughness: 0.6, metalness: 0.3 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.3, metalness: 0.85, side: THREE.DoubleSide });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y: number, parent: THREE.Object3D = object) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  add(new THREE.CylinderGeometry(0.95, 1.9, 2.2, 32, 1, true), metal, 1.1);
  add(new THREE.CylinderGeometry(2.6, 2.6, 26, 48), white, 15.2);
  add(new THREE.CylinderGeometry(2.63, 2.63, 1.6, 48), charcoal, 7);
  add(new THREE.CylinderGeometry(2.63, 2.63, 0.8, 48), charcoal, 26.4);
  add(new THREE.ConeGeometry(2.6, 7.5, 48), white, 31.95);
  for (let i = 0; i < 4; i += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.5, 3.2), charcoal);
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    fin.position.set(Math.cos(angle) * 3.4, 4.6, Math.sin(angle) * 3.4);
    fin.rotation.y = -angle;
    fin.castShadow = true;
    object.add(fin);
  }
  // Cargo hatch and the ramp the rover drives up. The ramp folds away for flight.
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.2), charcoal);
  hatch.position.set(0, 4.2, 2.55);
  object.add(hatch);
  const ramp = new THREE.Group();
  ramp.position.set(0, 3, 2.7);
  const plank = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 6), metal);
  plank.position.z = 3;
  plank.castShadow = plank.receiveShadow = true;
  ramp.add(plank);
  object.add(ramp);
  const rampDown = Math.asin(3 / 6); // tilts the 6 m plank from the 3 m-high hatch to the ground

  // The plume: an outer flame and a white-hot core, additive so they glow over anything.
  const plume = new THREE.Group();
  const flame = (radius: number, length: number, color: number, opacity: number) => {
    const mesh = new THREE.Mesh(
      new THREE.ConeGeometry(radius, length, 24, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
    );
    mesh.rotation.x = Math.PI;
    mesh.position.y = -length / 2;
    plume.add(mesh);
    return mesh;
  };
  const outer = flame(1.7, 11, 0xff7a2e, 0.55);
  const core = flame(0.85, 6, 0xfff0c4, 0.9);
  object.add(plume);
  const glow = new THREE.PointLight(0xff8a3c, 0, 160, 1.3);
  glow.position.y = -3;
  object.add(glow);

  return {
    object,
    // How far down the ramp is (1 = on the ground, 0 = stowed) and how hard the engine burns.
    update(time: number, thrust: number, rampOut: number, glowScale = 1, still = false) {
      ramp.rotation.x = rampDown * rampOut;
      ramp.visible = rampOut > 0.01;
      const flicker = still ? 1 : 1 + Math.sin(time * 61) * 0.06 + Math.sin(time * 37) * 0.05;
      plume.visible = thrust > 0.01;
      plume.scale.set(0.6 + thrust * 0.4, thrust * flicker * 1.35, 0.6 + thrust * 0.4);
      (outer.material as THREE.MeshBasicMaterial).opacity = 0.55 * Math.min(1, thrust * 1.5);
      (core.material as THREE.MeshBasicMaterial).opacity = 0.9 * Math.min(1, thrust * 1.5);
      glow.intensity = thrust * flicker * 2400 * glowScale;
    },
    // Where the rover parks to start up the ramp, and where it vanishes inside, in rocket space.
    rampFoot: new THREE.Vector3(0, 0, 8.5),
    hatchPoint: new THREE.Vector3(0, 3, 2.8)
  };
}


// Billowing exhaust smoke (or Moon dust): particles spawn at a nozzle, fall, spread out
// along the ground, swell and fade. Simulated on the CPU; a few hundred is plenty.
export function createSmoke(count: number, smokeColor: number, fireColor: number) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const heats = new Float32Array(count);
  const velocities = new Float32Array(count * 3);
  const ages = new Float32Array(count).fill(Infinity);
  const lives = new Float32Array(count).fill(1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aHeat', new THREE.BufferAttribute(heats, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: softDot() }, uSmoke: { value: new THREE.Color(smokeColor) }, uFire: { value: new THREE.Color(fireColor) }, uScale: { value: 600 } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aAlpha; attribute float aHeat;
      uniform float uScale; varying float vAlpha; varying float vHeat;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(1.0, -mv.z);
        gl_Position = projectionMatrix * mv;
        vAlpha = aAlpha; vHeat = aHeat;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform vec3 uSmoke; uniform vec3 uFire;
      varying float vAlpha; varying float vHeat;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(mix(uSmoke, uFire, vHeat), a);
      }`,
    transparent: true,
    depthWrite: false
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  let cursor = 0;
  let owed = 0;

  return {
    object: points,
    material,
    update(dt: number, rate: number, nozzle: THREE.Vector3, groundY: number, spread: number) {
      owed += rate * dt;
      while (owed >= 1) {
        owed -= 1;
        const i = cursor; cursor = (cursor + 1) % count;
        positions.set([nozzle.x + (Math.random() - 0.5), nozzle.y, nozzle.z + (Math.random() - 0.5)], i * 3);
        velocities.set([(Math.random() - 0.5) * 3, -14 - Math.random() * 6, (Math.random() - 0.5) * 3], i * 3);
        ages[i] = 0;
        lives[i] = 2.5 + Math.random() * 3.5;
      }
      for (let i = 0; i < count; i += 1) {
        if (ages[i] > lives[i]) { alphas[i] = 0; continue; }
        ages[i] += dt;
        const k = i * 3;
        // Hitting the ground turns the downward blast into an outward billow.
        if (positions[k + 1] <= groundY + 0.5 && velocities[k + 1] < 0) {
          const angle = Math.random() * Math.PI * 2;
          const push = spread * (0.6 + Math.random() * 0.8);
          velocities[k] = Math.cos(angle) * push; velocities[k + 1] = 0.6 + Math.random(); velocities[k + 2] = Math.sin(angle) * push;
        }
        const drag = Math.exp(-dt * 0.9);
        velocities[k] *= drag; velocities[k + 2] *= drag;
        velocities[k + 1] = velocities[k + 1] * drag + dt * 0.35;
        positions[k] += velocities[k] * dt; positions[k + 1] += velocities[k + 1] * dt; positions[k + 2] += velocities[k + 2] * dt;
        const life = ages[i] / lives[i];
        sizes[i] = 2.5 + life * 16;
        alphas[i] = Math.min(1, ages[i] * 4) * (1 - life) * 0.55;
        heats[i] = Math.max(0, 1 - ages[i] * 2.2);
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
      geometry.attributes.aHeat.needsUpdate = true;
    }
  };
}

