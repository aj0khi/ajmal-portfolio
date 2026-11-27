// Procedural models of the projects, placed at the journey's stops. Each returns an object and
// an update hook that receives `wake` (0 = the rover is far away, 1 = it is parked here).
import * as THREE from 'three';
import { loadUrdf } from './urdf';

export interface Sculpture {
  object: THREE.Object3D;
  update: (time: number, dt: number, wake: number) => void;
  // Visitor input from the exhibit's placard controls.
  control?: (key: string, value: number) => void;
}

export const palette = {
  brass: 0xd4a94f,
  teal: 0x4f8f7d,
  data: 0x80bba7,
  fault: 0xff6a5c,
  steel: 0x2a3a40,
  bone: 0xe9ece6
};

const standard = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2, ...extra });

const smooth = (current: number, target: number, dt: number, rate = 6) => current + (target - current) * (1 - Math.exp(-dt * rate));

/* ---------- WayBionic: the team's arm, loaded from its URDF ---------- */
// The current five-joint arm (base yaw, shoulder, elbow, and a differential wrist that pitches
// and rolls), from the team's description package, converted by `npm run models:arm`.
const REST = { joint_1: 0.6, joint_2: 0.45, joint_3: 0.95, joint_4: 0.55, joint_5: 0 }; // matches src/data/arm.ts

export function waybionicArm(): Sculpture {
  const object = new THREE.Group();
  let joints: Awaited<ReturnType<typeof loadUrdf>>['joints'] | undefined;
  loadUrdf('/models/waybionic-arm/waybionic_arm.urdf', '/models/waybionic-arm')
    .then((robot) => {
      robot.root.rotation.x = -Math.PI / 2; // URDF is z-up
      robot.root.scale.setScalar(3.6);
      object.add(robot.root);
      joints = robot.joints;
      // Start in the motion test's resting pose, not bolt upright.
      Object.entries(REST).forEach(([name, angle]) => joints?.get(name)?.set(angle));
    })
    .catch(() => undefined);
  let phase = 0;
  let energy = 0;
  let manualUntil = 0;
  const manual = new Map<string, number>();
  return {
    object,
    control: (key, value) => {
      manual.set(key, value);
      manualUntil = performance.now() + 9000;
    },
    update: (_time, dt, wake) => {
      energy = smooth(energy, wake > 0.5 ? 1 : 0, dt, 2);
      phase += dt * energy;
      if (!joints) return;
      if (performance.now() < manualUntil) {
        // The visitor has the controls; the motion test waits.
        manual.forEach((angle, name) => joints?.get(name)?.set(angle));
        return;
      }
      // A slow motion test, the kind the ground station runs against the real drives. The wrist
      // roll turns the differential's side gears with it.
      joints.get('joint_1')?.set(REST.joint_1 + Math.sin(phase * 0.5) * 0.9 * energy);
      joints.get('joint_2')?.set(REST.joint_2 + Math.sin(phase * 0.7) * 0.35 * energy);
      joints.get('joint_3')?.set(REST.joint_3 + Math.sin(phase * 0.9 + 1) * 0.45 * energy);
      joints.get('joint_4')?.set(REST.joint_4 + Math.sin(phase * 1.1 + 2) * 0.5 * energy);
      joints.get('joint_5')?.set(REST.joint_5 + Math.sin(phase * 1.3) * 1.2 * energy);
    }
  };
}

/* ---------- Rover arm motors: three CAN motors on one bus ---------- */

export function motorBus(): Sculpture {
  const object = new THREE.Group();
  const body = standard(0x1d2629, { metalness: 0.6, roughness: 0.35 });
  const ring = standard(palette.brass, { metalness: 0.5, roughness: 0.3 });
  const sizes = [0.34, 0.27, 0.19];
  const xs = [-0.8, 0, 0.75];
  xs.forEach((x, index) => {
    const motor = new THREE.Group();
    const can = new THREE.Mesh(new THREE.CylinderGeometry(sizes[index], sizes[index], 0.32, 40), body);
    can.castShadow = true;
    const face = new THREE.Mesh(new THREE.CylinderGeometry(sizes[index] * 0.55, sizes[index] * 0.55, 0.06, 32), ring);
    face.position.y = 0.19;
    motor.add(can, face);
    motor.position.set(x, sizes[0] + 0.02, 0);
    motor.rotation.x = Math.PI / 2;
    object.add(motor);
  });
  const adapter = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.2), standard(palette.teal));
  adapter.position.set(-1.45, 0.06, 0.35);
  object.add(adapter);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.45, 0.06, 0.35), new THREE.Vector3(-1.1, 0.04, 0.45), new THREE.Vector3(-0.8, 0.05, 0.4),
    new THREE.Vector3(0, 0.05, 0.4), new THREE.Vector3(0.75, 0.05, 0.4), new THREE.Vector3(1.05, 0.04, 0.35)
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.014, 8), new THREE.MeshBasicMaterial({ color: palette.data }));
  object.add(cable);
  const pulses = Array.from({ length: 4 }, () => {
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    object.add(pulse);
    return pulse;
  });
  return {
    object,
    update: (time, _dt, wake) => {
      pulses.forEach((pulse, index) => {
        pulse.visible = wake > 0.2;
        pulse.position.copy(curve.getPointAt(((time * 0.35 + index / pulses.length) % 1)));
      });
    }
  };
}

/* ---------- BlackBox: a hash chain that notices a tampered record ---------- */

export function hashChain(): Sculpture {
  const object = new THREE.Group();
  const count = 6;
  const blocks = Array.from({ length: count }, (_, index) => {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), new THREE.MeshStandardMaterial({ color: 0x9fd6d0, transparent: true, opacity: 0.18, roughness: 0.1, metalness: 0 }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry), new THREE.LineBasicMaterial({ color: palette.data }));
    cube.add(edges);
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: palette.data }));
    cube.add(core);
    const angle = (index / count) * Math.PI * 2.2;
    cube.position.set(Math.sin(angle) * 0.42, 0.35 + index * 0.22, Math.cos(angle) * 0.42);
    object.add(cube);
    return { cube, edges, core };
  });
  const links = new THREE.Group();
  for (let index = 1; index < count; index += 1) {
    const geometry = new THREE.BufferGeometry().setFromPoints([blocks[index - 1].cube.position, blocks[index].cube.position]);
    links.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: palette.data, transparent: true, opacity: 0.6 })));
  }
  object.add(links);
  const TAMPERED = 3;
  let offset = 0;
  return {
    object,
    control: (key) => {
      // Jump the loop to the moment the record is edited.
      if (key === 'tamper') offset = (performance.now() / 1000) % 8 - 3.2;
    },
    update: (time, _dt, wake) => {
      // 0–3s seal blocks in order, 3–4.5s one record is edited, 4.5–7s the chain fails from there on.
      const cycle = (((time - offset) % 8) + 8) % 8 / 8;
      const sealed = Math.min(count, Math.floor(cycle * 8 / 3 * count));
      blocks.forEach(({ cube, edges, core }, index) => {
        cube.rotation.y = time * 0.3 + index;
        let colour = palette.data;
        if (wake < 0.3) colour = 0x35575a;
        else if (cycle > 0.56 && index >= TAMPERED) colour = palette.fault;
        else if (cycle > 0.375 && index === TAMPERED) colour = palette.brass;
        else if (index >= sealed) colour = 0x35575a;
        (edges.material as THREE.LineBasicMaterial).color.setHex(colour);
        (core.material as THREE.MeshBasicMaterial).color.setHex(colour);
      });
    }
  };
}

/* ---------- Teach to Game: a snake that learns toward the food ---------- */

export function snakeBoard(): Sculpture {
  const object = new THREE.Group();
  const N = 8;
  const cell = 0.2;
  const board = new THREE.Mesh(new THREE.BoxGeometry(N * cell + 0.1, 0.05, N * cell + 0.1), standard(0x10201f));
  board.position.y = 0.025;
  object.add(board);
  const grid = new THREE.GridHelper(N * cell, N, 0x2bb3a8, 0x1c3a38);
  grid.position.y = 0.052;
  object.add(grid);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: palette.data, emissive: palette.data, emissiveIntensity: 0.25 });
  const headMaterial = new THREE.MeshStandardMaterial({ color: palette.brass, emissive: palette.brass, emissiveIntensity: 0.3 });
  const segments = Array.from({ length: 12 }, (_, index) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(cell * 0.85, cell * 0.85, cell * 0.85), index === 0 ? headMaterial : bodyMaterial);
    mesh.visible = false;
    object.add(mesh);
    return mesh;
  });
  const food = new THREE.Mesh(new THREE.SphereGeometry(cell * 0.32, 16, 16), new THREE.MeshStandardMaterial({ color: palette.fault, emissive: palette.fault, emissiveIntensity: 0.4 }));
  object.add(food);
  let body = [{ x: 2, y: 4 }, { x: 1, y: 4 }, { x: 0, y: 4 }];
  let apple = { x: 6, y: 2 };
  let clock = 0;
  const toWorld = (p: { x: number; y: number }, mesh: THREE.Object3D, lift: number) => mesh.position.set((p.x - N / 2 + 0.5) * cell, lift, (p.y - N / 2 + 0.5) * cell);
  const step = () => {
    const head = body[0];
    const options = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
      .map((d) => ({ x: head.x + d.x, y: head.y + d.y }))
      .filter((p) => p.x >= 0 && p.y >= 0 && p.x < N && p.y < N && !body.some((b) => b.x === p.x && b.y === p.y));
    if (!options.length) { body = [{ x: 2, y: 4 }, { x: 1, y: 4 }, { x: 0, y: 4 }]; return; }
    options.sort((a, b) => Math.hypot(a.x - apple.x, a.y - apple.y) - Math.hypot(b.x - apple.x, b.y - apple.y));
    const next = Math.random() < 0.85 ? options[0] : options[Math.floor(Math.random() * options.length)];
    body.unshift(next);
    if (next.x === apple.x && next.y === apple.y) {
      if (body.length >= segments.length) body = body.slice(0, 3);
      do { apple = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; } while (body.some((b) => b.x === apple.x && b.y === apple.y));
    } else body.pop();
  };
  return {
    object,
    update: (time, dt, wake) => {
      if (wake > 0.4) {
        clock += dt;
        if (clock > 0.16) { clock = 0; step(); }
      }
      segments.forEach((mesh, index) => {
        mesh.visible = index < body.length;
        if (mesh.visible) toWorld(body[index], mesh, 0.05 + cell * 0.45);
      });
      toWorld(apple, food, 0.05 + cell * 0.4 + Math.sin(time * 3) * 0.02);
    }
  };
}

/* ---------- Rover: drives a loop and swerves when the sonar sees a pillar ---------- */

export function roverLoop(): Sculpture {
  const object = new THREE.Group();
  const rover = new THREE.Group();
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.3), standard(palette.bone, { roughness: 0.6 }));
  chassis.position.y = 0.12;
  chassis.castShadow = true;
  rover.add(chassis);
  const wheelGeometry = new THREE.CylinderGeometry(0.075, 0.075, 0.05, 20);
  wheelGeometry.rotateX(Math.PI / 2);
  [[-0.13, 0.17], [0.13, 0.17], [-0.13, -0.17], [0.13, -0.17]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(wheelGeometry, standard(0x111111));
    wheel.position.set(x, 0.075, z);
    rover.add(wheel);
  });
  const sonarMaterial = new THREE.MeshBasicMaterial({ color: palette.data, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  const sonar = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 24, 1, true), sonarMaterial);
  sonar.rotation.z = Math.PI / 2;
  sonar.position.set(0.56, 0.13, 0);
  rover.add(sonar);
  object.add(rover);
  const pillars = [[0.75, 0.15], [-0.55, -0.5], [-0.35, 0.65]].map(([x, z]) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 20), standard(0x5b6b6a));
    pillar.position.set(x, 0.25, z);
    pillar.castShadow = true;
    object.add(pillar);
    return pillar.position;
  });
  let heading = 0;
  let turning = 0;
  const position = new THREE.Vector3(-0.6, 0, 0.1);
  const RADIUS = 1.15;
  return {
    object,
    update: (_time, dt, wake) => {
      const speed = 0.45 * wake;
      const forward = new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading));
      const probe = position.clone().addScaledVector(forward, 0.42);
      const near = pillars.some((p) => Math.hypot(p.x - probe.x, p.z - probe.z) < 0.3) || probe.length() > RADIUS;
      if (near) turning = 0.7;
      if (turning > 0) { heading += dt * 2.6 * wake; turning -= dt; }
      else position.addScaledVector(forward, speed * dt);
      rover.position.copy(position);
      rover.rotation.y = heading;
      sonarMaterial.color.setHex(turning > 0 ? palette.brass : palette.data);
    }
  };
}
