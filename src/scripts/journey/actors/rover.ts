// The rover. The real model is modelled in CadQuery (cad/rover.py) and loads as a compressed
// glTF; until it arrives (or if it can't), a primitive stand-in drives the road instead.
// Forward is +Z, so `lookAt` points it down the road. Wheels turn by distance travelled,
// so scrubbing backward rolls them backward.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { foil, solarCells } from '../world/textures';

const WHEEL_RADIUS = 0.38;
const MODEL_WHEEL_RADIUS = 0.302; // tyre plus cleats, from cad/rover.py
const MODEL_URL = '/journey/rover.glb';

export function createRover() {
  const object = new THREE.Group();
  const body = new THREE.Group();
  object.add(body);

  const shell = new THREE.MeshStandardMaterial({ color: 0xe9e5db, roughness: 0.55, metalness: 0.1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x26272c, roughness: 0.8, metalness: 0.2 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x1d2a44, roughness: 0.35, metalness: 0.6 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 0 });

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = body) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  add(new THREE.BoxGeometry(1.7, 0.5, 2.4), shell, 0, 0.98, 0);
  add(new THREE.BoxGeometry(1.9, 0.06, 1.9), panel, 0, 1.27, -0.1);
  [-1, 1].forEach((side) => add(new THREE.BoxGeometry(0.12, 0.12, 2.3), dark, side * 0.98, 0.7, 0));
  // The camera mast: it turns its head toward the visitor's cursor at the first stop.
  const mast = new THREE.Group();
  mast.position.set(0.5, 1.27, 0.8);
  body.add(mast);
  add(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), dark, 0, 0.55, 0, mast);
  const head = new THREE.Group();
  head.position.y = 1.15;
  mast.add(head);
  add(new THREE.BoxGeometry(0.46, 0.24, 0.28), shell, 0, 0, 0.06, head);
  const lens = new THREE.MeshStandardMaterial({ color: 0x0c0d10, emissive: 0x7fc4ad, emissiveIntensity: 0.8 });
  [-0.1, 0.1].forEach((x) => add(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 14).rotateX(Math.PI / 2), lens, x, 0, 0.22, head));
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), dark, -0.6, 1.75, -0.9);
  [-0.5, 0.5].forEach((x) => add(new THREE.BoxGeometry(0.28, 0.12, 0.06), lamp, x, 0.98, 1.22));

  const standIn: THREE.Mesh[] = [];
  const wheelGeometry = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.32, 20);
  wheelGeometry.rotateZ(Math.PI / 2);
  [-1, 1].forEach((side) => [-0.95, 0, 0.95].forEach((z) => {
    const wheel = add(wheelGeometry, dark, side * 1.12, WHEEL_RADIUS, z, object);
    standIn.push(wheel);
  }));

  // Headlights: real light only before sunrise, when they matter.
  const headlight = new THREE.SpotLight(0xffe2b0, 0, 34, 0.55, 0.7, 1.2);
  headlight.position.set(0, 1, 1.3);
  headlight.target.position.set(0, 0, 10);
  object.add(headlight, headlight.target);

  // The CAD model: millimetres, +X forward and Z up in its own parts (glTF's root turns it Y-up).
  // Its wheels and mast head are separate nodes with origins on their pivots.
  let model: { wheels: THREE.Object3D[]; head: THREE.Object3D | undefined; lamps: THREE.MeshStandardMaterial[] } | undefined;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  loader.load(MODEL_URL, (gltf) => {
    const holder = new THREE.Group();
    holder.rotation.y = -Math.PI / 2; // the model's +X forward becomes the rover's +Z
    holder.scale.setScalar(0.001);
    holder.add(gltf.scene);
    const lamps: THREE.MeshStandardMaterial[] = [];
    // The CAD exporter shares one material between parts of the same colour; give each part
    // its own, so restyling the solar deck doesn't restyle the camera glass.
    const owned = new Map<string, THREE.MeshStandardMaterial>();
    gltf.scene.traverse((part) => {
      if (!(part instanceof THREE.Mesh)) return;
      part.castShadow = part.receiveShadow = true;
      const owner = ancestorName(part);
      // One copy per part and original colour: meshes in one part can still differ in colour.
      const original = part.material as THREE.MeshStandardMaterial;
      const key = `${owner}:${original.uuid}`;
      const surface = owned.get(key) ?? original.clone();
      owned.set(key, surface);
      part.material = surface;
      // CAD meshes carry no texture coordinates; lay them out for the parts that get a texture.
      if (owner === 'panel') planarUv(part.geometry, 'x', 'y');
      if (owner === 'foil') planarUv(part.geometry, 'x', 'z', 'y');
      // Give the flat CAD colours their surfaces: solar cells, foil, brushed metal, rubber.
      if (owner === 'panel') { surface.map = solarCells(); surface.color.set('#ffffff'); surface.metalness = 0.55; surface.roughness = 0.28; }
      else if (owner === 'foil') { surface.map = foil(); surface.color.set('#ffffff'); surface.metalness = 0.85; surface.roughness = 0.32; }
      else if (owner.startsWith('tyre')) { surface.roughness = 0.95; surface.metalness = 0; }
      else if (/^(rocker|bogie|differential|arm|power|hub)/.test(owner)) { surface.metalness = 0.65; surface.roughness = 0.38; }
      else if (owner === 'lamps') { surface.emissive = new THREE.Color('#ffd9a0'); lamps.push(surface); }
      else { surface.roughness = 0.55; surface.metalness = 0.08; }
      surface.needsUpdate = true;
    });
    const wheels = ['lf', 'lm', 'lr', 'rf', 'rm', 'rr'].map((slot) => gltf.scene.getObjectByName(`wheel_${slot}`)).filter((wheel): wheel is THREE.Object3D => Boolean(wheel));
    model = { wheels, head: gltf.scene.getObjectByName('head'), lamps };
    // Hide the stand-in, and hang the model on the body so it keeps the drive's bob and rock.
    body.children.forEach((child) => { child.visible = false; });
    standIn.forEach((wheel) => { wheel.visible = false; });
    body.add(holder);
  }, undefined, () => undefined); // without the model, the stand-in keeps driving

  let yaw = 0; let pitch = 0;
  return {
    object,
    // Point the mast head: x and y in -1..1 (the cursor's place on screen), or 0, 0 to rest.
    aim(x: number, y: number, dt: number) {
      const k = 1 - Math.exp(-dt * 6);
      yaw += (x * 1.1 - yaw) * k;
      pitch += (y * 0.45 - pitch) * k;
      head.rotation.set(-pitch, yaw, 0, 'YXZ');
      // The model's head pans about its own Z (up) and tilts about its Y (sideways).
      model?.head?.rotation.set(0, -pitch, yaw, 'ZYX');
    },
    update(distance: number, time: number, lights: number, moving: number) {
      standIn.forEach((wheel) => { wheel.rotation.x = distance / WHEEL_RADIUS; });
      model?.wheels.forEach((wheel) => { wheel.rotation.y = distance / MODEL_WHEEL_RADIUS; });
      body.position.y = Math.sin(time * 9) * 0.015 * moving;
      body.rotation.x = Math.sin(time * 5.3) * 0.006 * moving;
      headlight.intensity = 40 * lights;
      lamp.emissiveIntensity = 0.4 + 2.2 * lights;
      model?.lamps.forEach((surface) => { surface.emissiveIntensity = 0.3 + 2.4 * lights; });
    }
  };
}


// The named assembly part a mesh belongs to (the CAD exporter nests faces under their part).
function ancestorName(object: THREE.Object3D) {
  for (let node: THREE.Object3D | null = object; node; node = node.parent) {
    const name = node.name.replace(/_\d+$/, '');
    if (/^(panel|foil|tyre|hub|cap|lamps|rocker|bogie|differential|arm|jaws|power|body|deck|mast|housing|lenses|glass|dish|hazcams)/.test(name)) return name;
  }
  return '';
}

// Texture coordinates for a CAD mesh that has none: a planar projection over its own bounds.
// `wrap` adds a second axis to the horizontal one, so a band around a box keeps running.
function planarUv(geometry: THREE.BufferGeometry, across: 'x' | 'y' | 'z', up: 'x' | 'y' | 'z', wrap?: 'x' | 'y' | 'z') {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  const axis = { x: 0, y: 1, z: 2 } as const;
  const span = (a: 'x' | 'y' | 'z') => Math.max(1e-6, max[a] - min[a]);
  for (let i = 0; i < position.count; i += 1) {
    const value = (a: 'x' | 'y' | 'z') => (position.getComponent(i, axis[a]) - min[a]) / span(a);
    uv[i * 2] = value(across) + (wrap ? value(wrap) : 0);
    uv[i * 2 + 1] = value(up);
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
