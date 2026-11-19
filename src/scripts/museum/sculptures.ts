// Procedural exhibit pieces. Each returns an object to place on a plinth and an update
// hook that receives `wake` (0 = asleep in the dark, 1 = the visitor is standing here).
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
  teal: 0x2bb3a8,
  data: 0x5cc8d6,
  fault: 0xff6a5c,
  steel: 0x2a3a40,
  bone: 0xe9ece6
};

const standard = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2, ...extra });

// Shared hazard-stripe texture: the same safety tape that marks real robot work cells.
export const hazardTexture = (() => {
  let texture: THREE.CanvasTexture | undefined;
  return () => {
    if (texture) return texture;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#141414';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#e8b931';
    for (let offset = -64; offset < 128; offset += 32) {
      context.beginPath();
      context.moveTo(offset, 64);
      context.lineTo(offset + 16, 64);
      context.lineTo(offset + 80, 0);
      context.lineTo(offset + 64, 0);
      context.fill();
    }
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };
})();

const smooth = (current: number, target: number, dt: number, rate = 6) => current + (target - current) * (1 - Math.exp(-dt * rate));

/* ---------- Entrance: an arm that solves IK toward the visitor's pointer ---------- */

export interface IkArm extends Sculpture {
  aim: (target: THREE.Vector3 | null) => void;
  readout: () => { angles: number[]; limited: boolean };
}

export function ikArm(): IkArm {
  const SHOULDER_H = 0.64;
  const L1 = 1.05;
  const L2 = 0.92;
  const L3 = 0.34;
  const TOOL_PITCH = -0.55;
  const LIMITS = [[-170, 170], [-15, 155], [-160, -4], [-120, 120]].map(([a, b]) => [(a * Math.PI) / 180, (b * Math.PI) / 180]);
  const housing = standard(palette.brass, { roughness: 0.38, metalness: 0.45 });
  const steel = standard(palette.steel, { metalness: 0.7, roughness: 0.3 });
  const shadowed = (mesh: THREE.Mesh) => { mesh.castShadow = true; return mesh; };

  const object = new THREE.Group();
  const yaw = new THREE.Group();
  yaw.position.y = 0.0;
  object.add(yaw);
  const turret = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.34, 48), housing));
  turret.position.y = 0.17;
  yaw.add(turret);
  const joint = (radius: number, depth: number) => {
    const mesh = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 40), housing));
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  };
  const link = (length: number, radius: number) => {
    const mesh = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 2, 8, 24), steel));
    mesh.rotation.z = -Math.PI / 2;
    mesh.position.x = length / 2;
    return mesh;
  };
  const shoulder = new THREE.Group();
  shoulder.position.y = SHOULDER_H;
  yaw.add(shoulder);
  shoulder.add(joint(0.2, 0.36), link(L1, 0.11));
  const elbow = new THREE.Group();
  elbow.position.x = L1;
  shoulder.add(elbow);
  elbow.add(joint(0.15, 0.3), link(L2, 0.085));
  const wrist = new THREE.Group();
  wrist.position.x = L2;
  elbow.add(wrist);
  wrist.add(joint(0.1, 0.22), link(L3 - 0.08, 0.06));
  [-1, 1].forEach((sign) => {
    const finger = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.04), steel));
    finger.position.set(L3 - 0.04, sign * 0.045, 0);
    wrist.add(finger);
  });

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: palette.data }));
  object.add(beacon);

  const angles = [0.3, 1.75, -2.6, 0.9];
  const velocity = [0, 0, 0, 0];
  const STIFF = 38;
  const DAMP = 2 * Math.sqrt(STIFF);
  const local = new THREE.Vector3(1.2, 0.9, 0.5);
  const desired = local.clone();
  let pointer: THREE.Vector3 | null = null;
  let limited = false;

  const solve = (tx: number, ty: number, tz: number) => {
    const yawAngle = Math.atan2(-tz, tx);
    const r = Math.hypot(tx, tz);
    const h = ty - SHOULDER_H;
    let wx = r - L3 * Math.cos(TOOL_PITCH);
    let wy = h - L3 * Math.sin(TOOL_PITCH);
    let d = Math.hypot(wx, wy);
    const max = L1 + L2 - 0.02;
    const min = Math.abs(L1 - L2) + 0.08;
    let clamped = false;
    if (d > max || d < min) {
      const next = Math.min(max, Math.max(min, d));
      wx *= next / (d || 1);
      wy *= next / (d || 1);
      d = next;
      clamped = true;
    }
    const elbowAngle = -Math.acos(Math.min(1, Math.max(-1, (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2))));
    const shoulderAngle = Math.atan2(wy, wx) - Math.atan2(L2 * Math.sin(elbowAngle), L1 + L2 * Math.cos(elbowAngle));
    const raw = [yawAngle, shoulderAngle, elbowAngle, TOOL_PITCH - shoulderAngle - elbowAngle];
    const out = raw.map((value, index) => Math.min(LIMITS[index][1], Math.max(LIMITS[index][0], value)));
    return { out, clamped: clamped || out.some((value, index) => value !== raw[index]) };
  };

  return {
    object,
    aim: (target) => { pointer = target ? object.worldToLocal(target.clone()) : null; },
    readout: () => ({ angles: [...angles], limited }),
    update: (time, dt) => {
      if (pointer) desired.copy(pointer);
      else desired.set(1.2 + Math.sin(time * 0.42) * 0.5, 0.9 + Math.sin(time * 0.77) * 0.35, 0.3 + Math.cos(time * 0.42) * 0.8);
      desired.y = Math.max(0.1, Math.min(2.4, desired.y));
      local.lerp(desired, 1 - Math.exp(-dt * 9));
      const { out, clamped } = solve(local.x, local.y, local.z);
      limited = clamped;
      out.forEach((goal, index) => {
        velocity[index] += (STIFF * (goal - angles[index]) - DAMP * velocity[index]) * dt;
        angles[index] += velocity[index] * dt;
      });
      yaw.rotation.y = angles[0];
      shoulder.rotation.z = angles[1];
      elbow.rotation.z = angles[2];
      wrist.rotation.z = angles[3];
      beacon.position.copy(local);
      (beacon.material as THREE.MeshBasicMaterial).color.setHex(limited ? palette.brass : palette.data);
    }
  };
}

/* ---------- WayBionic: the team's real old-arm model, loaded from its URDF ---------- */

export function waybionicArm(): Sculpture {
  const object = new THREE.Group();
  let joints: Awaited<ReturnType<typeof loadUrdf>>['joints'] | undefined;
  loadUrdf('/models/waybionic-old-arm/old_arm.urdf', '/models/waybionic-old-arm')
    .then((robot) => {
      robot.root.rotation.x = -Math.PI / 2; // URDF is z-up
      robot.root.scale.setScalar(5.2);
      const box = new THREE.Box3().setFromObject(robot.root);
      robot.root.position.y = -box.min.y;
      object.add(robot.root);
      joints = robot.joints;
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
      // A slow motion test, the kind the ground station runs against the simulated driver.
      joints.get('old_arm_base_yaw_joint')?.set(1.2 + Math.sin(phase * 0.5) * 0.9 * energy);
      joints.get('old_arm_shoulder_pitch_joint')?.set(0.5 + (Math.sin(phase * 0.7) * 0.5 + 0.2) * energy);
      joints.get('old_arm_elbow_pitch_joint')?.set(0.6 + Math.sin(phase * 0.9 + 1) * 0.7 * energy);
      joints.get('old_arm_wrist_roll_joint')?.set(1.5 + Math.sin(phase * 1.3) * 1.2 * energy);
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

/* ---------- SouthPoint: the Moon, with a low sun sweeping across the south pole ---------- */

export function moonGlobe(): Sculpture {
  const object = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#8d8d8a';
  context.fillRect(0, 0, 1024, 512);
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let index = 0; index < 900; index += 1) {
    const x = random() * 1024;
    const y = random() * 512;
    const r = Math.pow(random(), 3) * 38 + 2;
    const shade = 90 + random() * 80;
    context.fillStyle = `rgb(${shade},${shade},${shade - 4})`;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(220,220,214,0.35)';
    context.lineWidth = Math.max(1, r * 0.12);
    context.beginPath();
    context.arc(x - r * 0.1, y - r * 0.1, r, Math.PI * 0.9, Math.PI * 1.7);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 96, 64), new THREE.MeshStandardMaterial({ map: texture, bumpMap: texture, bumpScale: 2.2, roughness: 0.95, metalness: 0 }));
  moon.position.y = 1.0;
  moon.rotation.x = 0.9; // tip the south pole toward the visitor
  object.add(moon);
  const sun = new THREE.PointLight(0xfff1d6, 0, 6, 1.4);
  object.add(sun);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 24), new THREE.MeshStandardMaterial({ color: 0x3a7bd5, emissive: 0x0e2a55, emissiveIntensity: 0.6, roughness: 0.6 }));
  object.add(earth);
  let sunOverride: number | null = null;
  return {
    object,
    control: (key, value) => { if (key === 'sun') sunOverride = value; },
    update: (time, _dt, wake) => {
      moon.rotation.y = time * 0.05;
      const angle = sunOverride ?? time * 0.4;
      sun.position.set(Math.cos(angle) * 2.2, 0.4, Math.sin(angle) * 2.2);
      sun.intensity = 9 * wake;
      earth.position.set(Math.cos(-time * 0.25) * 1.25, 1.35, Math.sin(-time * 0.25) * 1.25);
    }
  };
}

/* ---------- Chinook Clean: a grimy slab washed clean by a moving nozzle ---------- */

export function washSlab(): Sculpture {
  const object = new THREE.Group();
  const W = 256;
  const H = 320;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const context = canvas.getContext('2d')!;
  const dirty = document.createElement('canvas');
  dirty.width = W;
  dirty.height = H;
  const dirt = dirty.getContext('2d')!;
  dirt.fillStyle = '#4a4a3f';
  dirt.fillRect(0, 0, W, H);
  for (let index = 0; index < 2400; index += 1) {
    dirt.fillStyle = `rgba(${30 + Math.random() * 40},${32 + Math.random() * 30},${20 + Math.random() * 20},${Math.random() * 0.35})`;
    dirt.fillRect(Math.random() * W, Math.random() * H, Math.random() * 14, Math.random() * 14);
  }
  const paint = (cleaned: number) => {
    // Clean concrete pavers underneath, with the grime layer cut back to `cleaned`.
    context.fillStyle = '#c9c7bd';
    context.fillRect(0, 0, W, H);
    context.strokeStyle = '#a9a69a';
    context.lineWidth = 3;
    for (let y = 0; y <= H; y += 64) { context.beginPath(); context.moveTo(0, y); context.lineTo(W, y); context.stroke(); }
    for (let row = 0; row < H / 64; row += 1) for (let x = row % 2 ? 64 : 0; x <= W; x += 128) { context.beginPath(); context.moveTo(x, row * 64); context.lineTo(x, row * 64 + 64); context.stroke(); }
    const line = cleaned * H;
    context.drawImage(dirty, 0, line, W, H - line, 0, line, W, H - line);
  };
  paint(0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.65, 0.08), [standard(0x777770), standard(0x777770), standard(0x777770), standard(0x777770), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }), standard(0x777770)]);
  slab.position.y = 0.9;
  slab.castShadow = true;
  object.add(slab);
  const wand = new THREE.Group();
  const lance = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.8, 12), standard(0x222222, { metalness: 0.8 }));
  lance.rotation.z = Math.PI / 2.6;
  wand.add(lance);
  const spray = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfeff5, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  spray.rotation.x = Math.PI / 2;
  spray.position.set(0, 0, -0.25);
  wand.add(spray);
  object.add(wand);
  let cleaned = 0;
  let painted = -1;
  let spraying = false;
  let touched = false;
  return {
    object,
    control: (key, value) => {
      if (key === 'spray') { spraying = value > 0; touched = true; }
      if (key === 'reset') cleaned = 0;
    },
    update: (time, dt, wake) => {
      // Idle demo until the visitor takes the wand; then it only cleans while held.
      const active = touched ? spraying : wake > 0.4;
      if (active) cleaned = Math.min(1, cleaned + dt * (touched ? 0.22 : 0.12));
      else if (wake < 0.1) { cleaned = 0; touched = false; }
      if (!touched && cleaned >= 1) cleaned = 0;
      const y = 1.72 - cleaned * 1.65;
      wand.position.set(Math.sin(time * 5) * 0.5, y, 0.55);
      spray.visible = touched ? spraying : wake > 0.4;
      if (Math.abs(cleaned - painted) > 0.004) { painted = cleaned; paint(cleaned); texture.needsUpdate = true; }
    }
  };
}

/* ---------- Finale: the next wing, still a construction site ---------- */

export function barrier(): Sculpture {
  const object = new THREE.Group();
  const tape = new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.6 });
  const legs = standard(0x2a2a2a);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.06), tape);
  (tape.map as THREE.Texture).repeat.set(6, 1);
  board.position.y = 1.0;
  object.add(board);
  const lower = board.clone();
  lower.position.y = 0.55;
  object.add(lower);
  [-1.05, 1.05].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), legs);
    leg.position.set(x, 0.6, 0);
    object.add(leg);
  });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffb02e }));
  lamp.position.set(-1.05, 1.28, 0);
  object.add(lamp);
  return {
    object,
    update: (time, _dt, wake) => {
      // Slow beacon, well under three flashes a second.
      (lamp.material as THREE.MeshBasicMaterial).color.setHex(wake > 0.3 && Math.sin(time * 2.4) > 0 ? 0xffb02e : 0x4a3410);
    }
  };
}
