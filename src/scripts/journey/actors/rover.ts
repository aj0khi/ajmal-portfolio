// The rover: a stand-in built from primitives until the CadQuery model lands (Phase 3).
// Forward is +Z, so `lookAt` points it down the road. Wheels turn by distance travelled,
// so scrubbing backward rolls them backward.
import * as THREE from 'three';

const WHEEL_RADIUS = 0.38;

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

  const wheels: THREE.Mesh[] = [];
  const wheelGeometry = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.32, 20);
  wheelGeometry.rotateZ(Math.PI / 2);
  [-1, 1].forEach((side) => [-0.95, 0, 0.95].forEach((z) => {
    const wheel = add(wheelGeometry, dark, side * 1.12, WHEEL_RADIUS, z, object);
    wheels.push(wheel);
  }));

  // Headlights: real light only before sunrise, when they matter.
  const headlight = new THREE.SpotLight(0xffe2b0, 0, 34, 0.55, 0.7, 1.2);
  headlight.position.set(0, 1, 1.3);
  headlight.target.position.set(0, 0, 10);
  object.add(headlight, headlight.target);

  let yaw = 0; let pitch = 0;
  return {
    object,
    // Point the mast head: x and y in -1..1 (the cursor's place on screen), or 0, 0 to rest.
    aim(x: number, y: number, dt: number) {
      const k = 1 - Math.exp(-dt * 6);
      yaw += (x * 1.1 - yaw) * k;
      pitch += (y * 0.45 - pitch) * k;
      head.rotation.set(-pitch, yaw, 0, 'YXZ');
    },
    update(distance: number, time: number, lights: number, moving: number) {
      wheels.forEach((wheel) => { wheel.rotation.x = distance / WHEEL_RADIUS; });
      body.position.y = Math.sin(time * 9) * 0.015 * moving;
      body.rotation.x = Math.sin(time * 5.3) * 0.006 * moving;
      headlight.intensity = 40 * lights;
      lamp.emissiveIntensity = 0.4 + 2.2 * lights;
    }
  };
}

