// The two scenes after the cloud deck. Space: Earth's limb below, the Moon ahead, hard
// sunlight, silence. The Moon: a cratered landing site at the south pole, where the sun sits
// on the horizon and every rim throws a long shadow, with Earth hanging in the black sky.
import * as THREE from 'three';
import { atmosphere, craterTexture, earthTextures, fbm, seeded, smoothstep, starField } from '../util';
import { makeRoad } from './route';

const SUN_DIRECTION = new THREE.Vector3(1, 0.28, 0.35).normalize();

function makeEarth(radius: number, textures: ReturnType<typeof earthTextures>) {
  const group = new THREE.Group();
  const surface = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), new THREE.MeshStandardMaterial({ map: textures.map, roughness: 0.85, metalness: 0 }));
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.008, 96, 64), new THREE.MeshStandardMaterial({ map: textures.cloudMap, transparent: true, depthWrite: false, roughness: 1 }));
  group.add(surface, clouds, atmosphere(radius * 1.035, '#5fa8ff', 3.4, 1.6));
  return { group, spin: (time: number) => { surface.rotation.y = time * 0.004; clouds.rotation.y = time * 0.0055; } };
}

export function createSpace() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#010103');
  scene.add(starField(4200, 3000, 5));
  const sun = new THREE.DirectionalLight(0xfff6e8, 3.4);
  sun.position.copy(SUN_DIRECTION).multiplyScalar(1000);
  scene.add(sun, new THREE.AmbientLight(0x1a2236, 0.25));
  const glare = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff4dc', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
  glare.position.copy(SUN_DIRECTION).multiplyScalar(2600);
  glare.scale.setScalar(160);
  scene.add(glare);

  const textures = earthTextures();
  const earth = makeEarth(620, textures);
  earth.group.position.set(0, -720, 300);
  earth.group.rotation.z = 0.35;
  scene.add(earth.group);

  const moonMap = craterTexture();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(160, 128, 96), new THREE.MeshStandardMaterial({ map: moonMap, bumpMap: moonMap, bumpScale: 3, roughness: 1, metalness: 0 }));
  moon.position.set(0, 60, -1650);
  moon.rotation.x = 0.8;
  scene.add(moon);

  // The transfer arc: a bulge to the side, so the rocket never flies a straight line.
  const start = new THREE.Vector3(0, 0, 0);
  const toStart = start.clone().sub(moon.position).normalize();
  const arrival = moon.position.clone().addScaledVector(toStart, 160 + 40);
  const path = new THREE.QuadraticBezierCurve3(start, new THREE.Vector3(280, 150, -760), arrival);

  return { scene, path, moon, textures, update: (time: number) => earth.spin(time) };
}

// The Moon's road: from where the rover rolls off the ramp, toward Earth on the horizon. It is
// paved for the first stretch; past that it is only survey stakes. That's the next wing.
const moonRoad = makeRoad([[12.6, 9.6], [17, -8], [14, -26], [6, -44], [-2, -62]], 200);
const PAVED = 0.62;

export function createMoon(textures: ReturnType<typeof earthTextures>) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#010103');
  scene.add(starField(3200, 2400, 9));

  // Regolith with craters: bowl, raised rim, fine noise. The landing site stays flat.
  const random = seeded(23);
  const craters = Array.from({ length: 46 }, () => ({ x: (random() - 0.5) * 700, z: (random() - 0.5) * 700 - 120, r: 6 + random() ** 2 * 46, depth: 0 }));
  craters.forEach((crater) => { crater.depth = crater.r * (0.16 + random() * 0.1); });
  const geometry = new THREE.PlaneGeometry(900, 900, 220, 220);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i); const z = position.getZ(i);
    let h = fbm(x * 0.02, z * 0.02, 4) * 7 + fbm(x * 0.15, z * 0.15, 2) * 0.8;
    for (const crater of craters) {
      const d = Math.hypot(x - crater.x, z - crater.z) / crater.r;
      if (d < 1) h -= crater.depth * (1 - d * d);
      h += crater.depth * 0.3 * Math.exp(-(((d - 1) / 0.22) ** 2));
    }
    h *= smoothstep(18, 46, Math.hypot(x, z)) * smoothstep(4, 16, moonRoad.nearest(x, z).distance);
    position.setY(i, h);
    const shade = 0.42 + fbm(x * 0.05 + 4, z * 0.05, 3) * 0.22;
    colors.set([shade, shade * 0.985, shade * 0.96], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  ground.receiveShadow = ground.castShadow = true;
  scene.add(ground);

  // South-pole light: the sun barely above the horizon.
  const sun = new THREE.DirectionalLight(0xfff3e2, 3.2);
  sun.position.set(160, 18, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -70;
  sun.shadow.camera.right = sun.shadow.camera.top = 70;
  sun.shadow.camera.far = 500;
  sun.shadow.bias = -0.0005;
  scene.add(sun, new THREE.HemisphereLight(0x3a4a7a, 0x0a0a0c, 0.35));

  const earth = makeEarth(26, textures);
  earth.group.position.set(-150, 92, -430);
  scene.add(earth.group);

  // The paved stretch, then stakes and a string line where the road will go.
  const vertices: number[] = []; const indices: number[] = [];
  const frame = moonRoad.frameAt(0);
  const steps = 80;
  for (let i = 0; i <= steps; i += 1) {
    moonRoad.frameAt((i / steps) * PAVED, frame);
    const { position: p, right } = frame;
    vertices.push(p.x - right.x * 2.4, 0.05, p.z - right.z * 2.4, p.x + right.x * 2.4, 0.05, p.z + right.z * 2.4);
    if (i < steps) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const paved = new THREE.BufferGeometry();
  paved.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  paved.setIndex(indices);
  paved.computeVertexNormals();
  const pavement = new THREE.Mesh(paved, new THREE.MeshStandardMaterial({ color: '#3f3f44', roughness: 0.95 }));
  pavement.receiveShadow = true;
  scene.add(pavement);
  const stakeMaterial = new THREE.MeshStandardMaterial({ color: '#ff7a1f', roughness: 0.6 });
  const line: THREE.Vector3[][] = [[], []];
  for (let t = PAVED; t <= 1; t += 0.035) {
    moonRoad.frameAt(t, frame);
    [-1, 1].forEach((side, i) => {
      const stake = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), stakeMaterial);
      stake.position.copy(frame.position).addScaledVector(frame.right, side * 2.4).setY(0.45);
      stake.castShadow = true;
      scene.add(stake);
      line[i].push(stake.position.clone().setY(0.82));
    });
  }
  line.forEach((points) => scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#f3eee4' }))));
  // A dish at the end of the paving, pointed home: the contact stop.
  const dish = new THREE.Group();
  const grey = new THREE.MeshStandardMaterial({ color: '#d9d6cf', roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.2, 10), grey);
  mast.position.y = 1.6;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.32), grey);
  bowl.position.y = 3.4;
  bowl.lookAt(earth.group.position);
  bowl.rotateX(Math.PI / 2);
  dish.add(mast, bowl);
  dish.traverse((part) => { part.castShadow = true; });
  dish.position.copy(moonRoad.beside(moonRoad.length * PAVED, -5));
  scene.add(dish);

  // A transmission: rings leave the dish and travel toward Earth, widening as they go.
  const from = dish.position.clone().setY(3.6);
  const toward = earth.group.position.clone().sub(from).normalize();
  const rings = Array.from({ length: 3 }, () => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 48), new THREE.MeshBasicMaterial({ color: '#f2a541', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.lookAt(toward);
    scene.add(ring);
    return ring;
  });
  let sentAt = -Infinity;
  let sunAngle = Math.atan2(60, 160);

  return {
    scene,
    road: moonRoad,
    control(key: string, value: number) {
      // The low south-pole sun, swung around the horizon: every crater shadow sweeps with it.
      if (key === 'sun') sunAngle = value;
      if (key === 'transmit') sentAt = performance.now() / 1000;
    },
    update(time: number) {
      earth.spin(time);
      sun.position.set(Math.cos(sunAngle) * 170, 18, Math.sin(sunAngle) * 170);
      const age = performance.now() / 1000 - sentAt;
      rings.forEach((ring, i) => {
        const t = (age - i * 0.45) / 2.6;
        const material = ring.material as THREE.MeshBasicMaterial;
        if (t < 0 || t > 1) { material.opacity = 0; return; }
        ring.position.copy(from).addScaledVector(toward, t * 90);
        ring.scale.setScalar(1.5 + t * 9);
        material.opacity = Math.sin(t * Math.PI);
      });
    }
  };
}
