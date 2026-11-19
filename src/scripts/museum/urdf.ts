// Minimal URDF reader for the museum: enough to place links, meshes, primitives, and
// revolute joints. It is not a general URDF implementation (no collision, no mimic joints).
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

export interface UrdfJoint {
  motion: THREE.Object3D;
  axis: THREE.Vector3;
  lower: number;
  upper: number;
  set: (angle: number) => void;
}

export interface UrdfRobot {
  root: THREE.Group;
  joints: Map<string, UrdfJoint>;
}

const numbers = (value: string | null, fallback = '0 0 0') => (value ?? fallback).trim().split(/\s+/).map(Number);

// URDF rpy is roll-pitch-yaw about fixed axes, which is Euler order ZYX in three.js.
const applyOrigin = (object: THREE.Object3D, origin: Element | null) => {
  const [x, y, z] = numbers(origin?.getAttribute('xyz') ?? null);
  const [r, p, yaw] = numbers(origin?.getAttribute('rpy') ?? null);
  object.position.set(x, y, z);
  object.rotation.set(r, p, yaw, 'ZYX');
};

export async function loadUrdf(url: string, meshBase: string): Promise<UrdfRobot> {
  const xml = new DOMParser().parseFromString(await (await fetch(url)).text(), 'application/xml');
  const robot = xml.querySelector('robot');
  if (!robot) throw new Error('URDF has no <robot> element.');

  const colours = new Map<string, THREE.Color>();
  robot.querySelectorAll(':scope > material').forEach((material) => {
    const rgba = material.querySelector('color')?.getAttribute('rgba');
    if (rgba) {
      const [r, g, b] = numbers(rgba);
      colours.set(material.getAttribute('name') ?? '', new THREE.Color(r, g, b));
    }
  });

  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const materialFor = (name: string) => {
    if (!materials.has(name)) {
      materials.set(name, new THREE.MeshStandardMaterial({ color: colours.get(name) ?? new THREE.Color(0.7, 0.7, 0.7), roughness: 0.55, metalness: 0.12 }));
    }
    return materials.get(name)!;
  };

  const stl = new STLLoader();
  const geometryCache = new Map<string, Promise<THREE.BufferGeometry>>();
  const loadMesh = (filename: string) => {
    const file = `${meshBase}/${filename.split('/').pop()}`;
    if (!geometryCache.has(file)) {
      geometryCache.set(file, stl.loadAsync(file).then((geometry) => { geometry.computeVertexNormals(); return geometry; }));
    }
    return geometryCache.get(file)!;
  };

  const links = new Map<string, THREE.Group>();
  const pending: Promise<void>[] = [];
  robot.querySelectorAll(':scope > link').forEach((link) => {
    const group = new THREE.Group();
    group.name = link.getAttribute('name') ?? '';
    links.set(group.name, group);
    link.querySelectorAll(':scope > visual').forEach((visual) => {
      const shape = visual.querySelector('geometry')?.firstElementChild;
      if (!shape) return;
      const material = materialFor(visual.querySelector('material')?.getAttribute('name') ?? '');
      const holder = new THREE.Group();
      applyOrigin(holder, visual.querySelector('origin'));
      group.add(holder);
      const place = (geometry: THREE.BufferGeometry, scale?: string | null) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        if (scale) mesh.scale.fromArray(numbers(scale, '1 1 1'));
        holder.add(mesh);
      };
      switch (shape.tagName) {
        case 'mesh':
          pending.push(loadMesh(shape.getAttribute('filename') ?? '').then((geometry) => place(geometry, shape.getAttribute('scale'))));
          break;
        case 'box': {
          const [x, y, z] = numbers(shape.getAttribute('size'));
          place(new THREE.BoxGeometry(x, y, z));
          break;
        }
        case 'cylinder': {
          const radius = Number(shape.getAttribute('radius'));
          const geometry = new THREE.CylinderGeometry(radius, radius, Number(shape.getAttribute('length')), 24);
          geometry.rotateX(Math.PI / 2); // URDF cylinders run along z; three.js along y.
          place(geometry);
          break;
        }
        case 'sphere':
          place(new THREE.SphereGeometry(Number(shape.getAttribute('radius')), 20, 14));
          break;
      }
    });
  });

  const joints = new Map<string, UrdfJoint>();
  const children = new Set<string>();
  robot.querySelectorAll(':scope > joint').forEach((joint) => {
    const parent = links.get(joint.querySelector('parent')?.getAttribute('link') ?? '');
    const childName = joint.querySelector('child')?.getAttribute('link') ?? '';
    const child = links.get(childName);
    if (!parent || !child) return;
    children.add(childName);
    const frame = new THREE.Group();
    applyOrigin(frame, joint.querySelector('origin'));
    const motion = new THREE.Group();
    frame.add(motion);
    motion.add(child);
    parent.add(frame);
    const type = joint.getAttribute('type');
    if (type === 'revolute' || type === 'continuous') {
      const axis = new THREE.Vector3(...numbers(joint.querySelector('axis')?.getAttribute('xyz') ?? null, '1 0 0')).normalize();
      const limit = joint.querySelector('limit');
      const lower = type === 'continuous' ? -Math.PI : Number(limit?.getAttribute('lower') ?? -Math.PI);
      const upper = type === 'continuous' ? Math.PI : Number(limit?.getAttribute('upper') ?? Math.PI);
      joints.set(joint.getAttribute('name') ?? '', {
        motion,
        axis,
        lower,
        upper,
        set: (angle) => motion.quaternion.setFromAxisAngle(axis, Math.min(upper, Math.max(lower, angle)))
      });
    }
  });

  const root = new THREE.Group();
  links.forEach((link, name) => { if (!children.has(name)) root.add(link); });
  await Promise.all(pending);
  return { root, joints };
}
