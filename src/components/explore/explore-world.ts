import * as THREE from 'three';
import type * as Three from 'three';
import { AERO_ORBS, LANDMARKS, SECRETS } from './world-data';
import type { ExploreLandmark, ExploreOrb, ExploreSecret } from './world-data';
import { ExploreProgress } from './explore-progress';
import type { ExploreProgressState } from './explore-progress';
import { ExploreInput } from './explore-input';

interface WorldElements {
  canvas: HTMLCanvasElement;
  coordinates: HTMLElement;
  prompt: HTMLElement;
  promptTitle: HTMLElement;
  promptCopy: HTMLElement;
  promptLink: HTMLAnchorElement;
  mapPlayer: HTMLElement;
  mapIslandButtons?: NodeListOf<HTMLButtonElement>;
  reduced: boolean;
  onMenuToggle?: (open: boolean) => void;
  onLandmarkOpen?: (landmark: ExploreLandmark) => void;
  onOrbCollected?: (orb: ExploreOrb) => void;
  onSecretDiscovered?: (secret: ExploreSecret) => void;
  onProgressChange?: (state: ExploreProgressState) => void;
}

const CONTROLLER = {
  moveSpeed: 4.5,
  reducedMoveSpeed: 3,
  playerRadius: 0.48,
  playerHeight: 1.9,
  islandRadius: { x: 12.2, z: 6.2 },
  camera: { distance: 15, height: 10, lookHeight: 1.5, smoothing: 8 },
  groundY: 1.3,
};

type Blocker = { x: number; z: number; radius: number };
type AnimatedObject = { object: Three.Object3D; baseY: number; speed: number; phase: number; rotation: number };

export class ExploreWorld {
  private readonly canvas: HTMLCanvasElement;
  private readonly coordinates: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly promptTitle: HTMLElement;
  private readonly promptCopy: HTMLElement;
  private readonly promptLink: HTMLAnchorElement;
  private readonly mapPlayer: HTMLElement;
  private readonly reduced: boolean;
  private readonly input: ExploreInput;
  private readonly scene: Three.Scene;
  private readonly camera: Three.PerspectiveCamera;
  private readonly renderer: Three.WebGLRenderer;
  private readonly player: Three.Group;
  private readonly cameraTarget = new THREE.Vector3();
  private readonly blockers: Blocker[] = [];
  private readonly limbs: Three.Object3D[] = [];
  private readonly animatedObjects: AnimatedObject[] = [];
  private readonly landmarkMeshes = new Map<string, Three.Object3D>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly onCanvasClick: (event: MouseEvent) => void;
  private readonly onCanvasPointerMove: (event: PointerEvent) => void;
  private readonly onLandmarkOpen?: (landmark: ExploreLandmark) => void;
  private readonly onOrbCollected?: (orb: ExploreOrb) => void;
  private readonly onSecretDiscovered?: (secret: ExploreSecret) => void;
  private readonly progress = new ExploreProgress();
  private readonly orbMeshes = new Map<string, Three.Object3D>();
  private readonly secretMeshes = new Map<string, Three.Object3D>();
  private nearbyLandmark?: ExploreLandmark;
  private oceanGeometry?: Three.PlaneGeometry;
  private oceanBasePositions?: Float32Array;
  private animationFrame = 0;
  private lastTime = 0;
  private running = false;
  private walkTime = 0;
  private playerPosition = { x: 0, z: 1.5 };
  private facing = -Math.PI;
  private readonly resizeHandler: () => void;
  private readonly visibilityHandler: () => void;

  constructor(elements: WorldElements) {
    this.canvas = elements.canvas;
    this.coordinates = elements.coordinates;
    this.prompt = elements.prompt;
    this.promptTitle = elements.promptTitle;
    this.promptCopy = elements.promptCopy;
    this.promptLink = elements.promptLink;
    this.mapPlayer = elements.mapPlayer;
    this.reduced = elements.reduced;
    this.onLandmarkOpen = elements.onLandmarkOpen;
    this.onOrbCollected = elements.onOrbCollected;
    this.onSecretDiscovered = elements.onSecretDiscovered;
    this.input = new ExploreInput(this.canvas, elements.onMenuToggle);
    this.onCanvasClick = (event) => this.selectLandmark(event.clientX, event.clientY);
    this.onCanvasPointerMove = (event) => this.updatePointer(event.clientX, event.clientY);
    elements.canvas.addEventListener('click', this.onCanvasClick);
    elements.canvas.addEventListener('pointermove', this.onCanvasPointerMove);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x52d6ee);
    this.scene.fog = new THREE.Fog(0x52d6ee, 18, 42);
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
    this.camera.position.set(0, CONTROLLER.camera.height, CONTROLLER.camera.distance);
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: elements.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'low-power',
      });
    } catch (error) {
      this.input.destroy();
      throw error;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = false;
    this.player = this.createPlayer();
    this.createEnvironment();
    this.scene.add(this.player);
    this.resizeHandler = () => this.resize();
    this.visibilityHandler = () => {
      this.input.clear();
      if (document.hidden) {
        this.running = false;
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = 0;
      } else {
        this.running = true;
        this.lastTime = performance.now();
        this.startLoop();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.resize();
    this.progress.subscribe((state) => elements.onProgressChange?.(state));
  }

  start() {
    this.player.position.set(this.playerPosition.x, CONTROLLER.groundY, this.playerPosition.z);
    this.camera.position.set(0, CONTROLLER.camera.height, -CONTROLLER.camera.distance);
    this.camera.lookAt(0, CONTROLLER.camera.lookHeight, 1.5);
    this.input.setMenu(false);
    this.running = true;
    this.lastTime = performance.now();
    this.startLoop();
  }

  press(direction: 'up' | 'down' | 'left' | 'right') { this.input.press(direction); }
  release(direction: 'up' | 'down' | 'left' | 'right') { this.input.release(direction); }
  setPaused(open: boolean) { this.input.setPaused(open); }
  resetProgress() {
    this.progress.reset();
    this.orbMeshes.forEach((mesh) => { mesh.visible = true; });
  }
  interactNearby() {
    if (this.nearbyLandmark) this.onLandmarkOpen?.(this.nearbyLandmark);
  }

  private startLoop() {
    if (this.animationFrame || document.hidden) return;
    this.animationFrame = requestAnimationFrame((time) => this.frame(time));
  }

  private frame(now: number) {
    this.animationFrame = 0;
    if (!this.running || document.hidden) return;
    const delta = Math.min(Math.max((now - this.lastTime) / 1000, 0), 0.05);
    this.lastTime = now;
    this.input.update();
    if (this.input.consumeInteract() && this.nearbyLandmark) this.onLandmarkOpen?.(this.nearbyLandmark);
    const moving = !this.input.state.menu && !this.input.state.paused && (this.input.state.x !== 0 || this.input.state.y !== 0);
    if (moving) {
      const length = Math.hypot(this.input.state.x, this.input.state.y);
      const speed = this.reduced ? CONTROLLER.reducedMoveSpeed : CONTROLLER.moveSpeed;
      const next = {
        x: this.playerPosition.x + (this.input.state.x / length) * speed * delta,
        z: this.playerPosition.z + (this.input.state.y / length) * speed * delta,
      };
      this.playerPosition.x = this.canOccupy(next.x, this.playerPosition.z) ? next.x : this.playerPosition.x;
      this.playerPosition.z = this.canOccupy(this.playerPosition.x, next.z) ? next.z : this.playerPosition.z;
      this.facing = Math.atan2(this.input.state.x, this.input.state.y);
      this.walkTime += delta * (this.reduced ? 7 : 10);
    }
    this.player.position.x += (this.playerPosition.x - this.player.position.x) * Math.min(delta * 14, 1);
    this.player.position.z += (this.playerPosition.z - this.player.position.z) * Math.min(delta * 14, 1);
    this.player.rotation.y += this.shortestAngle(this.facing - this.player.rotation.y) * Math.min(delta * 12, 1);
    this.animatePlayer(moving);
    this.animateEnvironment(now, delta);
    if (!this.input.state.menu && !this.input.state.paused) this.updateCamera(delta);
    this.updateHud();
    this.renderer.render(this.scene, this.camera);
    this.startLoop();
  }

  private updateCamera(delta: number) {
    const behindX = Math.sin(this.player.rotation.y) * CONTROLLER.camera.distance;
    const behindZ = Math.cos(this.player.rotation.y) * CONTROLLER.camera.distance;
    const desired = new THREE.Vector3(
      this.player.position.x + behindX,
      Math.max(CONTROLLER.camera.height, 2.8),
      this.player.position.z + behindZ,
    );
    this.camera.position.lerp(desired, Math.min(delta * CONTROLLER.camera.smoothing, 1));
    this.cameraTarget.set(this.player.position.x, CONTROLLER.camera.lookHeight, this.player.position.z);
    this.camera.lookAt(this.cameraTarget);
  }

  private canOccupy(x: number, z: number) {
    const normalized = (x * x) / (CONTROLLER.islandRadius.x ** 2) + (z * z) / (CONTROLLER.islandRadius.z ** 2);
    if (normalized > 1) return false;
    return this.blockers.every((blocker) => Math.hypot(x - blocker.x, z - blocker.z) >= blocker.radius + CONTROLLER.playerRadius);
  }

  private shortestAngle(angle: number) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }

  private animatePlayer(moving: boolean) {
    const swing = moving && !this.reduced ? Math.sin(this.walkTime) * 0.45 : 0;
    this.limbs[0].rotation.x = swing;
    this.limbs[1].rotation.x = -swing;
    this.limbs[2].rotation.x = -swing;
    this.limbs[3].rotation.x = swing;
    this.player.position.y = moving && !this.reduced ? CONTROLLER.groundY + Math.abs(Math.sin(this.walkTime * 2)) * 0.025 : CONTROLLER.groundY;
  }

  private createEnvironment() {
    this.scene.add(new THREE.HemisphereLight(0xdffcff, 0x176b76, 2.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-8, 14, 8);
    this.scene.add(sun);
    this.createClouds();
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70, 28, 28),
      new THREE.MeshStandardMaterial({ color: 0x11b7c1, roughness: 0.2, metalness: 0.08, transparent: true, opacity: 0.92 }),
    );
    this.oceanGeometry = ocean.geometry;
    this.oceanBasePositions = ocean.geometry.attributes.position.array.slice() as Float32Array;
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -3.4;
    this.scene.add(ocean);

    const island = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.ConeGeometry(8.2, 4.5, 14, 3), new THREE.MeshStandardMaterial({ color: 0x87614f, roughness: 0.95 }));
    rock.position.y = -1.2;
    island.add(rock);
    const rockBand = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 8.2, 1.25, 14), new THREE.MeshStandardMaterial({ color: 0xa27459, roughness: 0.9 }));
    rockBand.position.y = 0.05;
    island.add(rockBand);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 11.8, 0.65, 14), new THREE.MeshStandardMaterial({ color: 0x55bd70, roughness: 0.78 }));
    grass.position.y = 0.95;
    island.add(grass);
    const shoreline = new THREE.Mesh(
      new THREE.TorusGeometry(11.98, 0.16, 6, 32),
      new THREE.MeshStandardMaterial({ color: 0xb8f29d, roughness: 0.62, emissive: 0x1b735e, emissiveIntensity: 0.08 }),
    );
    shoreline.rotation.x = Math.PI / 2;
    shoreline.position.y = 1.3;
    island.add(shoreline);
    const hill = new THREE.Mesh(new THREE.SphereGeometry(5.5, 16, 10), new THREE.MeshStandardMaterial({ color: 0x9fe28a, roughness: 0.8 }));
    hill.scale.set(1.8, 0.45, 0.9);
    hill.position.set(-4, 1.65, -1.5);
    island.add(hill);
    this.addTree(island, -8, 1.2, -2.5);
    this.addTree(island, 7, 1.2, -3.5);
    this.addTree(island, 4, 1.2, 4);
    this.addPine(island, -1.5, 1.15, -4.1);
    this.addStone(island, 2.2, 1.25, -2.8, 0.48);
    this.addStone(island, -2.7, 1.25, 3.4, 0.35);
    this.addFlowers(island, 5.1, 1.3, 2.4);
    this.addPath(island);
    this.addAeroReeds(island, -5.4, 1.25, 2.1);
    this.addAeroReeds(island, 7.4, 1.25, 2.2);
    LANDMARKS.filter((landmark) => landmark.island === 'home' && landmark.worldX !== undefined && landmark.worldZ !== undefined)
      .forEach((landmark) => this.addLandmark(island, landmark));
    AERO_ORBS.filter((orb) => orb.island === 'home').forEach((orb) => this.addOrb(island, orb));
    SECRETS.filter((secret) => secret.island === 'home').forEach((secret) => this.addSecret(island, secret));
    island.add(this.createGlassSphere(-5, 3.8, -3, 0.7));
    island.add(this.createGlassSphere(6, 4.2, 1, 0.55));
    island.add(this.createComputerPod(1.7, 1.8, 3.1));
    this.addUndersideRocks(island);
    this.scene.add(island);
  }

  private addOrb(parent: Three.Group, orb: ExploreOrb) {
    const collectible = new THREE.Group();
    collectible.position.set(orb.worldX, 0, orb.worldZ);
    collectible.userData.orbId = orb.id;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.025, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xc4fff8, transparent: true, opacity: 0.7 }),
    );
    halo.position.y = 1.55;
    halo.rotation.x = Math.PI / 2;
    collectible.add(halo);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 16, 12),
      new THREE.MeshPhysicalMaterial({ color: 0x9cfff4, emissive: 0x2adbd0, emissiveIntensity: 0.28, roughness: 0.06, transmission: 0.3, transparent: true, opacity: 0.9, clearcoat: 1 }),
    );
    mesh.position.y = 1.55;
    mesh.userData.orbId = orb.id;
    mesh.visible = !this.progress.snapshot.collectedOrbIds.includes(orb.id);
    halo.visible = mesh.visible;
    collectible.add(mesh);
    collectible.visible = mesh.visible;
    parent.add(collectible);
    this.orbMeshes.set(orb.id, collectible);
    this.animatedObjects.push({ object: halo, baseY: 1.55, speed: 0.9, phase: orb.worldX, rotation: 0.7 });
    this.animatedObjects.push({ object: mesh, baseY: 1.55, speed: 0.9, phase: orb.worldX, rotation: 0.7 });
  }

  private addSecret(parent: Three.Group, secret: ExploreSecret) {
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.07, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0x8b6a1e, emissiveIntensity: 0.22, roughness: 0.3 }),
    );
    marker.position.set(secret.worldX, 1.2, secret.worldZ);
    marker.rotation.x = Math.PI / 2;
    marker.userData.secretId = secret.id;
    parent.add(marker);
    this.secretMeshes.set(secret.id, marker);
    this.animatedObjects.push({ object: marker, baseY: 1.2, speed: 0.45, phase: secret.worldZ, rotation: 0.35 });
  }

  private createClouds() {
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.82 });
    const cloudGeometry = new THREE.SphereGeometry(1.5, 12, 8);
    [[-15, 10, -15, 1.8], [11, 13, -19, 1.35], [18, 8, 5, 1.1]].forEach(([x, y, z, scale], index) => {
      const cloud = new THREE.Group();
      for (let puff = 0; puff < 4; puff += 1) {
        const mesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        mesh.position.set((puff - 1.5) * 1.15, Math.sin(puff) * 0.22, Math.cos(puff * 1.7) * 0.28);
        mesh.scale.setScalar(scale * (puff === 1 ? 1.15 : 0.78));
        cloud.add(mesh);
      }
      cloud.position.set(x, y, z);
      this.scene.add(cloud);
      this.animatedObjects.push({ object: cloud, baseY: y, speed: 0.08 + index * 0.025, phase: index * 2, rotation: 0 });
    });
  }

  private createPlayer() {
    const player = new THREE.Group();
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 20),
      new THREE.MeshBasicMaterial({ color: 0x1d766e, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.y = 0.55;
    shadow.position.y = 0.03;
    player.add(shadow);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.72, 4, 10), new THREE.MeshStandardMaterial({ color: 0x13a9cc, roughness: 0.35, metalness: 0.1 }));
    body.position.y = 1.35;
    player.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffe2c2, roughness: 0.6 }));
    head.position.y = 2.15;
    player.add(head);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), new THREE.MeshStandardMaterial({ color: 0xeaffff, roughness: 0.12, metalness: 0.25 }));
    visor.scale.set(1, 0.65, 0.45);
    visor.position.set(0, 2.17, -0.31);
    player.add(visor);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.42), new THREE.MeshStandardMaterial({ color: 0x087eaa, roughness: 0.45 }));
    torso.position.y = 1.35;
    player.add(torso);
    const limbMaterial = new THREE.MeshStandardMaterial({ color: 0xf6ffff, roughness: 0.4 });
    const limbPositions = [[-0.52, 1.35, 0], [0.52, 1.35, 0], [-0.22, 0.62, 0], [0.22, 0.62, 0]];
    limbPositions.forEach(([x, y, z], index) => {
      const limb = new THREE.Mesh(new THREE.CapsuleGeometry(index < 2 ? 0.11 : 0.14, index < 2 ? 0.5 : 0.58, 3, 8), limbMaterial);
      limb.position.set(x, y, z);
      player.add(limb);
      this.limbs.push(limb);
    });
    return player;
  }

  private addTree(parent: Three.Group, x: number, y: number, z: number) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x81553c }));
    trunk.position.set(x, y + 1.8, z);
    parent.add(trunk);
    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), new THREE.MeshStandardMaterial({ color: 0x32ae6f, roughness: 0.75 }));
    canopy.position.set(x, y + 3.2, z);
    parent.add(canopy);
    this.blockers.push({ x, z, radius: 0.85 });
  }

  private createGlassSphere(x: number, y: number, z: number, scale: number) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0x9cfff4, roughness: 0.08, metalness: 0.05, transmission: 0.35, transparent: true, opacity: 0.82, clearcoat: 1 }));
    sphere.position.set(x, y, z);
    sphere.scale.setScalar(scale);
    this.animatedObjects.push({ object: sphere, baseY: y, speed: 0.7, phase: x + z, rotation: 0.35 });
    return sphere;
  }

  private addLandmark(parent: Three.Group, landmark: ExploreLandmark) {
    const object = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 1.05, 0.35, 12),
      new THREE.MeshStandardMaterial({ color: 0xf2ffff, roughness: 0.2, metalness: 0.2 }),
    );
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 16, 10),
      new THREE.MeshPhysicalMaterial({ color: landmark.color, emissive: landmark.color, emissiveIntensity: 0.2, roughness: 0.1, clearcoat: 1, transmission: 0.15 }),
    );
    beacon.position.y = 1;
    object.add(base, beacon);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.67, 0.035, 6, 24),
      new THREE.MeshBasicMaterial({ color: landmark.color, transparent: true, opacity: 0.75 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    object.add(ring);
    object.position.set(landmark.worldX ?? 0, 1.3, landmark.worldZ ?? 0);
    object.userData.landmarkId = landmark.id;
    parent.add(object);
    this.landmarkMeshes.set(landmark.id, object);
    this.blockers.push({ x: landmark.worldX ?? 0, z: landmark.worldZ ?? 0, radius: 0.95 });
    this.animatedObjects.push({ object: beacon, baseY: 1, speed: 0.8, phase: landmark.worldX ?? 0, rotation: 0.5 });
    this.animatedObjects.push({ object: ring, baseY: 0.2, speed: 0.8, phase: landmark.worldX ?? 0, rotation: -0.8 });
  }

  private addPath(parent: Three.Group) {
    const path = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.45, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0xd7f5c1, roughness: 0.86 }),
    );
    path.scale.set(6.1, 1, 0.5);
    path.position.set(0, 1.32, 1.1);
    path.rotation.y = Math.PI / 2;
    parent.add(path);
    for (let index = -4; index <= 4; index += 1) {
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.025, 0.45),
        new THREE.MeshBasicMaterial({ color: 0x75cbb8, transparent: true, opacity: 0.7 }),
      );
      marker.position.set(index * 1.15, 1.38, 1.1);
      parent.add(marker);
    }
  }

  private addAeroReeds(parent: Three.Group, x: number, y: number, z: number) {
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x39ad88, roughness: 0.72 });
    const bulbMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9ffff0, emissive: 0x2adbd0, emissiveIntensity: 0.18, roughness: 0.12, clearcoat: 1 });
    for (let index = 0; index < 5; index += 1) {
      const reed = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.85, 6), stemMaterial);
      stem.position.y = 0.42;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), bulbMaterial);
      bulb.position.y = 0.9;
      reed.add(stem, bulb);
      reed.position.set(x + (index - 2) * 0.22, y, z + Math.cos(index) * 0.16);
      parent.add(reed);
      this.animatedObjects.push({ object: reed, baseY: y, speed: 0.5 + index * 0.05, phase: index, rotation: 0.04 });
    }
  }

  private addPine(parent: Three.Group, x: number, y: number, z: number) {
    const material = new THREE.MeshStandardMaterial({ color: 0x198b68, roughness: 0.72 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 1.4, 7), new THREE.MeshStandardMaterial({ color: 0x79513c }));
    trunk.position.set(x, y + 0.7, z);
    parent.add(trunk);
    for (let layer = 0; layer < 3; layer += 1) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.8 - layer * 0.13, 1.2, 8), material);
      cone.position.set(x, y + 1.35 + layer * 0.55, z);
      parent.add(cone);
    }
    this.blockers.push({ x, z, radius: 0.6 });
  }

  private addStone(parent: Three.Group, x: number, y: number, z: number, size: number) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), new THREE.MeshStandardMaterial({ color: 0xd2d6c2, roughness: 0.82 }));
    stone.position.set(x, y, z);
    stone.scale.y = 0.55;
    parent.add(stone);
  }

  private addFlowers(parent: Three.Group, x: number, y: number, z: number) {
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x2a9b63 });
    const petalMaterial = new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0x5c4a11, emissiveIntensity: 0.12 });
    for (let index = 0; index < 4; index += 1) {
      const flower = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.42, 5), stemMaterial);
      stem.position.y = 0.21;
      flower.add(stem);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), petalMaterial);
      bloom.position.y = 0.46;
      flower.add(bloom);
      flower.position.set(x + (index - 1.5) * 0.22, y, z + Math.sin(index) * 0.16);
      parent.add(flower);
      this.animatedObjects.push({ object: flower, baseY: y, speed: 0.8, phase: index, rotation: 0.1 });
    }
  }

  private createComputerPod(x: number, y: number, z: number) {
    const pod = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 10), new THREE.MeshStandardMaterial({ color: 0xf3ffff, roughness: 0.2, metalness: 0.25 }));
    shell.scale.set(1.25, 0.7, 0.85);
    pod.add(shell);
    const display = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.06), new THREE.MeshStandardMaterial({ color: 0x7cefe4, emissive: 0x2baea9, emissiveIntensity: 0.5, roughness: 0.18 }));
    display.position.set(0, 0.13, -0.71);
    pod.add(display);
    pod.position.set(x, y, z);
    this.animatedObjects.push({ object: pod, baseY: y, speed: 0.45, phase: 1.4, rotation: 0.18 });
    return pod;
  }

  private addUndersideRocks(parent: Three.Group) {
    const material = new THREE.MeshStandardMaterial({ color: 0x6f534b, roughness: 0.98 });
    [[-5, -2.2, 0.9], [3.8, -2.1, 1.1], [0, -2.9, 0.8]].forEach(([x, y, size]) => {
      const rock = new THREE.Mesh(new THREE.ConeGeometry(size, 2.7, 7), material);
      rock.position.set(x, y, 0);
      rock.rotation.z = x * 0.03;
      parent.add(rock);
    });
  }

  private animateEnvironment(now: number, delta: number) {
    if (this.reduced) return;
    const seconds = now * 0.001;
    this.animatedObjects.forEach(({ object, baseY, speed, phase, rotation }) => {
      object.position.y = baseY + Math.sin(seconds * speed + phase) * 0.12;
      object.rotation.y += rotation * delta;
    });
    if (this.oceanGeometry && this.oceanBasePositions) {
      const positions = this.oceanGeometry.attributes.position;
      for (let index = 0; index < positions.count; index += 1) {
        const baseX = this.oceanBasePositions[index * 3];
        const baseY = this.oceanBasePositions[index * 3 + 1];
        positions.setZ(index, Math.sin(baseX * 0.35 + seconds * 0.7) * 0.035 + Math.cos(baseY * 0.28 + seconds * 0.55) * 0.025);
      }
      positions.needsUpdate = true;
    }
  }

  private updateHud() {
    this.coordinates.textContent = `HOME ISLAND / ${Math.round(this.playerPosition.x)} : ${Math.round(this.playerPosition.z)}`;
    this.mapPlayer.style.left = `${Math.max(8, Math.min(88, 50 + this.playerPosition.x * 2.2))}%`;
    this.nearbyLandmark = LANDMARKS.find((landmark) => landmark.island === 'home' && landmark.worldX !== undefined && landmark.worldZ !== undefined && Math.hypot(landmark.worldX - this.playerPosition.x, landmark.worldZ - this.playerPosition.z) < 2.5);
    this.prompt.hidden = !this.nearbyLandmark;
    if (this.nearbyLandmark) {
      this.promptTitle.textContent = this.nearbyLandmark.label;
      this.promptCopy.textContent = this.nearbyLandmark.copy;
      this.promptLink.hidden = false;
      this.promptLink.textContent = 'OPEN LANDMARK / E OR TAP ↗';
    }
    AERO_ORBS.forEach((orb) => {
      const mesh = this.orbMeshes.get(orb.id);
      if (!mesh?.visible) return;
      if (Math.hypot(orb.worldX - this.playerPosition.x, orb.worldZ - this.playerPosition.z) < 1.15 && this.progress.collect(orb)) {
        mesh.visible = false;
        this.onOrbCollected?.(orb);
      }
    });
    SECRETS.forEach((secret) => {
      if (this.progress.snapshot.discoveredSecretIds.includes(secret.id)) return;
      if (Math.hypot(secret.worldX - this.playerPosition.x, secret.worldZ - this.playerPosition.z) < 1.35 && this.progress.discover(secret)) {
        this.onSecretDiscovered?.(secret);
      }
    });
  }

  private updatePointer(clientX: number, clientY: number) {
    const bounds = this.canvasBounds();
    this.pointer.set(((clientX - bounds.left) / bounds.width) * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1);
  }

  private selectLandmark(clientX: number, clientY: number) {
    if (this.input.state.menu) return;
    this.updatePointer(clientX, clientY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objects = this.raycaster.intersectObjects([...this.landmarkMeshes.values()], true);
    const landmarkId = objects[0]?.object.parent?.userData.landmarkId ?? objects[0]?.object.userData.landmarkId;
    const landmark = LANDMARKS.find((item) => item.id === landmarkId);
    if (landmark && Math.hypot((landmark.worldX ?? 0) - this.playerPosition.x, (landmark.worldZ ?? 0) - this.playerPosition.z) < 3.2) {
      this.onLandmarkOpen?.(landmark);
    }
  }

  private canvasBounds() {
    return this.renderer.domElement.getBoundingClientRect();
  }

  private resize() {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.renderer.setSize(Math.max(bounds.width, 1), Math.max(bounds.height, 1), false);
    this.camera.aspect = bounds.width / Math.max(bounds.height, 1);
    this.camera.updateProjectionMatrix();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    this.input.destroy();
    this.canvas.removeEventListener('click', this.onCanvasClick);
    this.canvas.removeEventListener('pointermove', this.onCanvasPointerMove);
    window.removeEventListener('resize', this.resizeHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.scene.traverse((object) => {
      const mesh = object as Three.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
      else mesh.material?.dispose();
    });
    this.renderer.dispose();
  }
}
