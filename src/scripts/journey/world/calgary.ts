// Calgary landmarks, simplified into the model-landscape style: the Calgary Tower (with the torch
// on top that the city lights for big occasions), the Saddledome and its saddle-shaped roof, a
// downtown skyline, the Peace Bridge over the Bow, a glass library for the university campus,
// and the Olympic Oval beside it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { seeded, softDot } from '../util';
import { concrete } from './textures';

const material = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
const shadowed = <T extends THREE.Object3D>(object: T) => { object.traverse((part) => { part.castShadow = part.receiveShadow = true; }); return object; };

// A canvas of lit and dark windows, for towers and the tower's observation level.
function windows(columns: number, rows: number, lit = 0.35, seed = 5) {
  const canvas = document.createElement('canvas');
  canvas.width = columns * 16; canvas.height = rows * 16;
  const c = canvas.getContext('2d')!;
  const random = seeded(seed);
  c.fillStyle = '#20252e';
  c.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y += 1) for (let x = 0; x < columns; x += 1) {
    c.fillStyle = random() < lit ? `rgb(255,${200 + random() * 40},${130 + random() * 60})` : `rgb(${40 + random() * 30},${52 + random() * 30},${70 + random() * 30})`;
    c.fillRect(x * 16 + 3, y * 16 + 3, 10, 11);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The Calgary Tower: a concrete shaft, the flared observation level, and the torch on top. */
export function calgaryTower(still = false) {
  const group = new THREE.Group();
  const shaftMaterial = material('#c9c3b6', { map: concrete() });
  (shaftMaterial.map as THREE.Texture).repeat.set(2, 12);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 6.4, 128, 24), shaftMaterial);
  shaft.position.y = 64;
  // Lift shafts run up the outside of the real tower; two ribs suggest them.
  const ribs = [-1, 1].map((side) => { const rib = new THREE.Mesh(new THREE.BoxGeometry(1.4, 128, 2.2), shaftMaterial); rib.position.set(side * 5.2, 64, 0); return rib; });
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(13, 5, 10, 32), material('#bdb6a8'));
  flare.position.y = 132;
  const glassTexture = windows(48, 2, 0.55, 9);
  glassTexture.wrapS = THREE.RepeatWrapping;
  const pod = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 13.5, 8, 48), material('#ffffff', { map: glassTexture, emissive: '#ffffff', emissiveMap: glassTexture, emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.3 }));
  pod.position.y = 141;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(9, 15, 6, 48), material('#d8d2c4'));
  roof.position.y = 148;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 7, 16), material('#a63a2a'));
  crown.position.y = 154.5;
  const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 1.6, 2.2, 16), material('#3a3a40', { metalness: 0.7, roughness: 0.4 }));
  cauldron.position.y = 159;
  group.add(shaft, ...ribs, flare, pod, roof, crown, cauldron);
  shadowed(group);

  // The torch: an additive flame and a glow sprite, plus a real light on the tower top.
  const flame = new THREE.Group();
  flame.position.y = 160;
  const outer = new THREE.Mesh(new THREE.ConeGeometry(3.2, 13, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#ff7a1f', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  outer.position.y = 6.5;
  const core = new THREE.Mesh(new THREE.ConeGeometry(1.2, 5.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff0b8', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  core.position.y = 2.8;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: '#ff9a3c', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.scale.setScalar(48);
  glow.position.y = 4;
  // The light hangs on the tower, not in the flame group, which is hidden while dark: three.js
  // drops lights under hidden parents, and a change in the light count recompiles every shader.
  const light = new THREE.PointLight(0xff8a3c, 0, 90, 1.4);
  light.position.y = 166;
  flame.add(outer, core, glow);
  group.add(flame, light);
  flame.visible = false; // dark until someone lights it
  flame.scale.setScalar(0.001);
  let lit = 0; let target = 0;
  return {
    group,
    light(on: boolean) { target = on ? 1 : 0; },
    update(time: number, dt: number) {
      lit += (target - lit) * (1 - Math.exp(-dt * 2.5));
      flame.visible = lit > 0.01;
      const flicker = still ? 1 : 1 + Math.sin(time * 17) * 0.08 + Math.sin(time * 29) * 0.05;
      flame.scale.set(lit, lit * flicker, lit);
      light.intensity = lit * flicker * 3000;
    }
  };
}

/** The Saddledome: an oval bowl under its hyperbolic-paraboloid roof, high at the ends and
 *  dipping in the middle, like a saddle. */
export function saddledome() {
  const group = new THREE.Group();
  const A = 38; const B = 32; const H = 21; const SAG = 7; const SEGMENTS = 72; const RINGS = 14;
  const roofHeight = (r: number, angle: number) => H + SAG * r * r * Math.cos(2 * angle) + 2.5 * (1 - r * r);
  // The roof, built as a polar grid so it follows the saddle exactly.
  const vertices: number[] = []; const indices: number[] = [];
  for (let ring = 0; ring <= RINGS; ring += 1) {
    const r = ring / RINGS;
    for (let s = 0; s <= SEGMENTS; s += 1) {
      const angle = (s / SEGMENTS) * Math.PI * 2;
      vertices.push(Math.cos(angle) * A * r * 1.04, roofHeight(r, angle), Math.sin(angle) * B * r * 1.04);
    }
  }
  for (let ring = 0; ring < RINGS; ring += 1) for (let s = 0; s < SEGMENTS; s += 1) {
    const a = ring * (SEGMENTS + 1) + s; const b = a + SEGMENTS + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const roofGeometry = new THREE.BufferGeometry();
  roofGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  roofGeometry.setIndex(indices);
  roofGeometry.computeVertexNormals();
  const roof = new THREE.Mesh(roofGeometry, material('#d6d1c4', { side: THREE.DoubleSide, roughness: 0.6, flatShading: true }));
  // The bowl's wall: dark glass and concrete, its top edge riding the saddle's rim.
  const wallVertices: number[] = []; const wallIndices: number[] = []; const wallUv: number[] = [];
  for (let s = 0; s <= SEGMENTS; s += 1) {
    const angle = (s / SEGMENTS) * Math.PI * 2;
    const x = Math.cos(angle) * A; const z = Math.sin(angle) * B;
    wallVertices.push(x * 0.92, 0, z * 0.92, x, roofHeight(1, angle) - 0.4, z);
    wallUv.push(s / SEGMENTS * 12, 0, s / SEGMENTS * 12, 1);
    if (s < SEGMENTS) { const a = s * 2; wallIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const wallGeometry = new THREE.BufferGeometry();
  wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wallVertices, 3));
  wallGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(wallUv, 2));
  wallGeometry.setIndex(wallIndices);
  wallGeometry.computeVertexNormals();
  const glass = windows(12, 6, 0.25, 21);
  glass.wrapS = THREE.RepeatWrapping;
  const wall = new THREE.Mesh(wallGeometry, material('#ffffff', { map: glass, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.3 }));
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(1, 64), material('#9d988c', { map: concrete() }));
  plaza.scale.set(A + 14, B + 14, 1);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.06;
  group.add(plaza, wall, roof);
  return shadowed(group);
}

/** Downtown towers: boxes of lit windows, placed by the caller. */
export function skyline(spots: { x: number; z: number; height: number; width: number; depth: number }[]) {
  const group = new THREE.Group();
  const facades = [windows(10, 30, 0.3, 3), windows(8, 36, 0.4, 7), windows(12, 24, 0.25, 11)].map((map) => material('#ffffff', { map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.35 }));
  const roofs = material('#3a3d44');
  spots.forEach((spot, i) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(spot.width, spot.height, spot.depth), [facades[i % 3], facades[i % 3], roofs, roofs, facades[i % 3], facades[i % 3]]);
    tower.position.set(spot.x, spot.height / 2, spot.z);
    group.add(tower);
  });
  return { group: shadowed(group), facades };
}

/** A glass library in the spirit of the campus's modern buildings: a box of coloured panes. */
export function glassLibrary() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const c = canvas.getContext('2d')!;
  const random = seeded(17);
  const tints = ['#bfe3d6', '#9cc7c9', '#e7efe9', '#7fa9b8', '#d7e8c9'];
  for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) {
    c.fillStyle = tints[Math.floor(random() * tints.length)];
    c.fillRect(x * 32, y * 32, 32, 32);
  }
  c.strokeStyle = '#4b5056'; c.lineWidth = 3;
  for (let i = 0; i <= 8; i += 1) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 256); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(256, i * 32); c.stroke(); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  const group = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(26, 18, 22), material('#ffffff', { map: texture, roughness: 0.2, metalness: 0.45 }));
  block.position.y = 9;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(27, 0.8, 23), material('#e9e6df'));
  cap.position.y = 18.4;
  group.add(block, cap);
  return shadowed(group);
}

/** The Peace Bridge: a red tube woven from crossing helices, with the deck running through it.
 *  Built along local z, `span` metres long, its deck at y 0.5. */
export function peaceBridge(span: number) {
  const group = new THREE.Group();
  const RX = 2.8; const RY = 2.5; const COUNT = 12; const TURNS = 0.8;
  const strands: THREE.BufferGeometry[] = [];
  for (const hand of [1, -1]) {
    for (let i = 0; i < COUNT; i += 1) {
      const phase = (i / COUNT) * Math.PI * 2;
      const points = Array.from({ length: 25 }, (_, s) => {
        const t = s / 24;
        const angle = phase + hand * t * TURNS * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * RX, RY + Math.sin(angle) * RY, (t - 0.5) * span);
      });
      strands.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 56, 0.09, 5));
    }
  }
  // One mesh for all the strands: one draw call instead of two dozen.
  const lattice = new THREE.Mesh(mergeGeometries(strands), material('#c3262b', { roughness: 0.45, metalness: 0.35 }));
  strands.forEach((strand) => strand.dispose());
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, span), material('#d6d1c7'));
  deck.position.y = 0.45;
  // The glazed roof strip along the top.
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, span), material('#9fc3d1', { roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.55 }));
  roof.position.y = RY * 2 - 0.15;
  group.add(lattice, deck, roof);
  return shadowed(group);
}

/** The Olympic Oval: a long hall under a shallow barrel roof, a band of glass below the eaves.
 *  Its long side runs along local x; the front faces +z. */
export function olympicOval() {
  const group = new THREE.Group();
  const L = 76; const W = 36; const WALL = 7; const RISE = 6.5;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(L, WALL, W), material('#d8d3c8', { map: concrete() }));
  (walls.material.map as THREE.Texture).repeat.set(8, 1);
  walls.position.y = WALL / 2;
  const glazing = new THREE.Mesh(new THREE.BoxGeometry(L + 0.2, 1.8, W + 0.2), material('#1c252e', { emissive: '#ffcf8a', emissiveIntensity: 0.12, roughness: 0.15, metalness: 0.6 }));
  glazing.position.y = WALL - 1.5;
  // The roof: an arc of a cylinder whose chord is the hall's width and whose height is RISE.
  const R = (W * W / 4 + RISE * RISE) / (2 * RISE);
  const arc = 2 * Math.asin(W / 2 / R);
  const roofMaterial = material('#b8bfc5', { metalness: 0.55, roughness: 0.38, side: THREE.DoubleSide });
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 64, 1, true, Math.PI / 2 - arc / 2, arc), roofMaterial);
  roof.rotation.z = Math.PI / 2;
  roof.position.y = WALL + RISE - R;
  // The gable ends: the arc's segment, closed by the eave line.
  const gable = new THREE.Shape();
  gable.moveTo(-W / 2, 0);
  for (let i = 0; i <= 32; i += 1) {
    const a = Math.PI / 2 + arc / 2 - (i / 32) * arc;
    gable.lineTo(Math.cos(a) * R, Math.sin(a) * R - R + RISE);
  }
  const ends = [-1, 1].map((side) => {
    const end = new THREE.Mesh(new THREE.ShapeGeometry(gable), material('#c9c4b8', { side: THREE.DoubleSide }));
    end.rotation.y = Math.PI / 2;
    end.position.set(side * L / 2, WALL, 0);
    return end;
  });
  group.add(walls, glazing, roof, ...ends);
  return shadowed(group);
}
