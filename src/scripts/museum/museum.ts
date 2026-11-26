// "Night at the museum": one long gallery hall rendered behind the page. Each scroll snaps to
// one room; the hall cuts to that room's pose off-screen and slides in over a frozen frame of
// the last one, so nothing between two rooms is ever drawn. Each exhibit wakes up (lights,
// curtains, motion) as it arrives. All content lives in the HTML placards; the canvas is decorative.
import * as THREE from 'three';
import { damask, giltFrame, materials, parquet, pictureLight, plaque, stanchions, walnut } from './interior';
import { barrier, hashChain, ikArm, moonGlobe, motorBus, roverLoop, snakeBoard, waybionicArm, washSlab, type IkArm, type Sculpture } from './sculptures';
import { SWEEP } from './sweep';
import { sweepFor, type Tour } from './tour';

const SPACING = 10;
const HALF_WIDTH = 5;
const HEIGHT = 5.2;

type Stop = { camera: THREE.Vector3; look: THREE.Vector3; focus: THREE.Vector3; wall?: { centre: THREE.Vector3; side: number; width: number } };
type Room = {
  element: HTMLElement;
  stop: Stop;
  sculpture?: Sculpture;
  images: THREE.MeshBasicMaterial[];
  mats: THREE.MeshBasicMaterial[];
  letters: THREE.MeshBasicMaterial[];
  lamps: THREE.MeshBasicMaterial[];
  glows: THREE.MeshBasicMaterial[];
  wake: number;
  curtains: Curtain[];
  curtainOpen: number;
  curtainManual: number | null;
};

const sculptures: Record<string, () => Sculpture> = {
  'waybionic-arm': waybionicArm,
  'motor-bus': motorBus,
  'hash-chain': hashChain,
  snake: snakeBoard,
  rover: roverLoop,
  moon: moonGlobe,
  wash: washSlab,
  barrier
};

const plinths: Record<string, { size: [number, number, number]; round?: boolean }> = {
  'waybionic-arm': { size: [1.3, 0.85, 1.3] },
  'motor-bus': { size: [3.4, 0.7, 1.2] },
  'hash-chain': { size: [1.0, 0.9, 1.0] },
  snake: { size: [2.0, 0.85, 2.0] },
  rover: { size: [2.6, 0.22, 2.6], round: true },
  moon: { size: [1.0, 0.75, 1.0] }
};

const radialTexture = (() => {
  let texture: THREE.CanvasTexture | undefined;
  return () => {
    if (texture) return texture;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,232,190,1)');
    gradient.addColorStop(0.5, 'rgba(255,232,190,0.35)');
    gradient.addColorStop(1, 'rgba(255,232,190,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    texture = new THREE.CanvasTexture(canvas);
    return texture;
  };
})();

const letteringTexture = (lines: string[], small?: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#d9b866';
  context.textBaseline = 'top';
  let y = 40;
  if (small) {
    context.font = '500 52px "IBM Plex Mono", monospace';
    context.fillStyle = '#b8913e';
    context.fillText(small, 8, y);
    y += 100;
    context.fillStyle = '#d9b866';
  }
  const size = lines.length > 2 ? 210 : 230;
  context.font = `italic 500 ${size}px "Cormorant Garamond", Georgia, serif`;
  lines.forEach((line) => { context.fillText(line, 0, y); y += size * 0.98; });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

// A pair of velvet curtains hung in front of a wall alcove. `set(open)` gathers each half
// toward its outer edge and deepens the folds, so opening reads as cloth bunching up.
type Curtain = { group: THREE.Group; meshes: THREE.Mesh[]; set: (open: number, time: number) => void };
const velvet = new THREE.MeshStandardMaterial({ color: 0x151012, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
function makeCurtain(width: number, height: number): Curtain {
  const group = new THREE.Group();
  const halves = [-1, 1].map((direction) => {
    const geometry = new THREE.PlaneGeometry(width / 2, height, 40, 1);
    const mesh = new THREE.Mesh(geometry, velvet);
    mesh.castShadow = true;
    group.add(mesh);
    return { mesh, direction, base: Float32Array.from(geometry.attributes.position.array as Float32Array) };
  });
  const set = (open: number, time: number) => {
    halves.forEach(({ mesh, direction, base }) => {
      const positions = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const half = width / 2;
      for (let index = 0; index < positions.count; index += 1) {
        const x0 = base[index * 3];
        // u = 0 at the outer edge (fixed to the rail end), 1 at the inner edge.
        const u = direction < 0 ? (x0 + half / 2) / half : (half / 2 - x0) / half;
        const span = half * (1 - 0.84 * open);
        const outer = direction * width / 2;
        const x = outer - direction * u * span;
        const fold = Math.sin(u * Math.PI * 9) * (0.05 + 0.13 * open) + Math.sin(time * 0.8 + u * 4) * 0.012;
        positions.setXYZ(index, x, base[index * 3 + 1], fold);
      }
      positions.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    });
  };
  set(0, 0);
  return { group, meshes: halves.map((half) => half.mesh), set };
}

export async function startMuseum(root: HTMLElement, tour: Tour) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-museum-canvas]');
  const live = root.querySelector<HTMLElement>('[data-stage-live]');
  const ghost = root.querySelector<HTMLCanvasElement>('[data-stage-ghost]');
  const ghostContext = ghost?.getContext('2d');
  const roomElements = tour.rooms;
  if (!canvas || !live || !ghost || !ghostContext || !roomElements.length) throw new Error('museum markup missing');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Throws without WebGL; the caller falls back to the pocket guide.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  await document.fonts?.ready;

  const m = materials();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070505);
  scene.fog = new THREE.Fog(0x070505, 13, 36);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);

  scene.add(new THREE.HemisphereLight(0xffe2b8, 0x1a120a, 0.6));
  const followSpot = new THREE.SpotLight(0xffdcae, 0, 14, 0.6, 0.65, 1.3);
  followSpot.castShadow = true;
  followSpot.shadow.mapSize.set(1024, 1024);
  followSpot.shadow.bias = -0.0005;
  scene.add(followSpot, followSpot.target);
  const entranceKey = new THREE.SpotLight(0xffe6c0, 70, 16, 0.6, 0.6, 1.4);
  entranceKey.position.set(3.5, 5, 5);
  entranceKey.target.position.set(2.4, 0.5, 1.5);
  entranceKey.castShadow = true;
  scene.add(entranceKey, entranceKey.target);

  // The hall: floor, walls, ceiling, and two rows of strip lights receding into the dark.
  const length = roomElements.length * SPACING + 16;
  const midZ = 8 - length / 2;
  // Herringbone parquet underfoot, walnut wainscoting to dado height, green damask above,
  // a gilt cornice, and a coffered ceiling with a dim skylight down the middle.
  const floorTexture = parquet();
  floorTexture.repeat.set((HALF_WIDTH * 2) / 1.4, length / 1.4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_WIDTH * 2, length), new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.42, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = midZ;
  floor.receiveShadow = true;
  scene.add(floor);
  const DADO = 1.1;
  const damaskTexture = damask();
  damaskTexture.repeat.set(length / 1.7, (HEIGHT - DADO) / 1.7);
  const wallMaterial = new THREE.MeshStandardMaterial({ map: damaskTexture, roughness: 0.88 });
  const panelTexture = walnut();
  panelTexture.repeat.set(length / 1.3, 1);
  const panelMaterial = new THREE.MeshStandardMaterial({ map: panelTexture, roughness: 0.6 });
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(length, HEIGHT - DADO), wallMaterial);
    wall.rotation.y = -side * Math.PI / 2;
    wall.position.set(side * HALF_WIDTH, DADO + (HEIGHT - DADO) / 2, midZ);
    wall.receiveShadow = true;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(length, DADO), panelMaterial);
    panel.rotation.y = wall.rotation.y;
    panel.position.set(side * (HALF_WIDTH - 0.01), DADO / 2, midZ);
    panel.receiveShadow = true;
    const dado = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, length), m.walnut);
    dado.position.set(side * (HALF_WIDTH - 0.03), DADO, midZ);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, length), m.giltDeep);
    cornice.position.set(side * (HALF_WIDTH - 0.08), HEIGHT - 0.1, midZ);
    scene.add(wall, panel, dado, cornice);
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(HALF_WIDTH * 2, length), new THREE.MeshStandardMaterial({ color: 0x0c0909, roughness: 0.8 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, HEIGHT, midZ);
  scene.add(ceiling);
  const skylight = new THREE.Mesh(new THREE.PlaneGeometry(2.4, length), new THREE.MeshBasicMaterial({ color: 0x2a1416 }));
  skylight.rotation.x = Math.PI / 2;
  skylight.position.set(0, HEIGHT - 0.01, midZ);
  scene.add(skylight);
  const beamGeometry = new THREE.BoxGeometry(HALF_WIDTH * 2, 0.16, 0.14);
  for (let z = 8; z > 8 - length; z -= 2.5) {
    const beam = new THREE.Mesh(beamGeometry, m.walnut);
    beam.position.set(0, HEIGHT - 0.08, z);
    scene.add(beam);
  }
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(HALF_WIDTH * 2, HEIGHT), wallMaterial);
  backWall.position.set(0, HEIGHT / 2, 8 - length);
  scene.add(backWall);

  const textureLoader = new THREE.TextureLoader();
  const plinthMaterial = m.marble;
  const frameMaterial = m.brass;

  const wallGlow = (side: number, z: number, width: number, glows: THREE.MeshBasicMaterial[]) => {
    const material = new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(width, 4), material);
    glow.rotation.y = -side * Math.PI / 2;
    glow.position.set(side * (HALF_WIDTH - 0.03), 2.2, z);
    scene.add(glow);
    glows.push(material);
  };
  const floorGlow = (x: number, z: number, radius: number, glows: THREE.MeshBasicMaterial[]) => {
    const material = new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), material);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, 0.01, z);
    scene.add(glow);
    glows.push(material);
  };

  let ik: IkArm | undefined;
  const rooms: Room[] = roomElements.map((element, index) => {
    const kind = element.dataset.sculpture ?? '';
    const paintingsData = JSON.parse(element.dataset.paintings ?? '[]') as { src: string }[];
    const room: Room = { element, stop: { camera: new THREE.Vector3(), look: new THREE.Vector3(), focus: new THREE.Vector3() }, images: [], mats: [], letters: [], lamps: [], glows: [], wake: 0, curtains: [], curtainOpen: 0, curtainManual: null };

    if (index === 0) {
      ik = ikArm();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.66, 0.3, 48), plinthMaterial);
      base.position.set(2.4, 0.15, 1.5);
      base.receiveShadow = true;
      scene.add(base);
      ik.object.position.set(2.4, 0.3, 1.5);
      ik.object.rotation.y = 0.5;
      scene.add(ik.object);
      room.sculpture = ik;
      room.stop.camera.set(0, 1.75, 8.2);
      room.stop.look.set(0, 1.45, -6);
      room.stop.focus.set(2.4, 1, 1.5);
      floorGlow(2.4, 1.5, 2.2, room.glows);
      return room;
    }

    const z = -index * SPACING + 2;
    const finale = index === roomElements.length - 1 && kind === 'barrier';
    const side = finale ? 0 : index % 2 === 1 ? -1 : 1;

    if (finale) {
      const piece = barrier();
      piece.object.position.set(0, 0, z - 2.5);
      scene.add(piece.object);
      room.sculpture = piece;
      const lettering = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshBasicMaterial({ map: letteringTexture(['The next wing', 'is still being built.'], element.dataset.accession), transparent: true, opacity: 0.2 }));
      lettering.position.set(0, 3.0, 8 - length + 0.02);
      scene.add(lettering);
      room.letters.push(lettering.material as THREE.MeshBasicMaterial);
      room.stop.camera.set(0, 1.7, z + 4);
      room.stop.look.set(0, 1.7, z - 6);
      room.stop.focus.set(0, 1, z - 2.5);
      floorGlow(0, z - 2.5, 3, room.glows);
      return room;
    }

    // Gallery hang, read left to right as the visitor faces the wall: the sculpture on its
    // plinth first, then the paintings. `along` is the wall direction that reads as screen-right.
    const hasSculpture = Boolean(sculptures[kind]);
    const along = new THREE.Vector3(0, 0, side);
    const wallX = side * (HALF_WIDTH - 0.06);
    const paintingScale = paintingsData.length > 1 ? 0.86 : 1;
    const plaques = JSON.parse(element.dataset.plaques ?? '[]') as { title: string; role: string; when: string }[];
    const slots = [...(hasSculpture ? [{ type: 'sculpture', width: kind === 'motor-bus' ? 3.8 : 2.8 }] : []), ...paintingsData.map(() => ({ type: 'painting', width: 3.3 * paintingScale })), ...(plaques.length ? [{ type: 'plaques', width: 6.0 }] : [])];
    if (!slots.length) slots.push({ type: 'lettering', width: 6.4 });
    const total = slots.reduce((sum, slot) => sum + slot.width, 0);
    const centre = new THREE.Vector3(wallX, 2.0, z);
    let cursor = -total / 2;
    const slotCentres = slots.map((slot) => { const at = cursor + slot.width / 2; cursor += slot.width; return centre.clone().addScaledVector(along, at); });

    if (hasSculpture) {
      const at = slotCentres[0];
      const depth = side * (HALF_WIDTH - 1.7);
      const piece = sculptures[kind]();
      const plinth = plinths[kind];
      let top = 0;
      if (plinth) {
        const [w, h, d] = plinth.size;
        const geometry = plinth.round ? new THREE.CylinderGeometry(w / 2, w / 2 + 0.04, h, 64) : new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geometry, plinthMaterial);
        mesh.position.set(depth, h / 2, at.z);
        if (kind === 'motor-bus') mesh.rotation.y = Math.PI / 2;
        mesh.castShadow = mesh.receiveShadow = true;
        scene.add(mesh);
        top = h;
      }
      piece.object.position.set(kind === 'wash' ? side * (HALF_WIDTH - 0.9) : depth, top, at.z);
      // Face the visitor across the hall.
      piece.object.rotation.y = kind === 'motor-bus' ? (side < 0 ? 0 : Math.PI) : side < 0 ? Math.PI / 2 : -Math.PI / 2;
      if (kind === 'waybionic-arm') piece.object.rotation.y += side * 0.6;
      scene.add(piece.object);
      room.sculpture = piece;
      floorGlow(depth, at.z, 1.8, room.glows);
      if (kind !== 'wash') {
        const rope = stanchions(Math.min(3.2, slots[0].width - 0.2), m);
        rope.position.set(depth - side * 1.35, 0, at.z);
        rope.rotation.y = Math.PI / 2;
        scene.add(rope);
      }
    }

    slots.forEach((slot, order) => {
      if (slot.type !== 'painting') return;
      const painting = paintingsData[order - (hasSculpture ? 1 : 0)];
      const holder = new THREE.Group();
      holder.position.set(wallX, 2.15, slotCentres[order].z);
      holder.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      holder.scale.setScalar(paintingScale);
      const material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
      const image = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), material);
      image.position.z = 0.05;
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.9), new THREE.MeshBasicMaterial({ color: 0xf2f2ee }));
      mat.position.z = 0.04;
      const frame = giltFrame(2.9, 1.9, m);
      const lamp = pictureLight(2.9, m);
      lamp.group.position.y = 1.32;
      room.lamps.push(lamp.glow);
      holder.add(frame, mat, image, lamp.group);
      scene.add(holder);
      room.mats.push(mat.material as THREE.MeshBasicMaterial);
      room.images.push(material);
      textureLoader.load(painting.src, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const aspect = texture.image.width / texture.image.height;
        image.scale.set(Math.min(1, aspect / 1.625), Math.min(1, 1.625 / aspect), 1);
        material.map = texture;
        material.needsUpdate = true;
      });
      wallGlow(side, holder.position.z, 4.4 * paintingScale, room.glows);

      // Each painting has its own pair of curtains on a short rail.
      const curtain = makeCurtain(3.4 * paintingScale, 3.0 * paintingScale);
      curtain.group.position.set(side * (HALF_WIDTH - 0.3), 2.15, holder.position.z);
      curtain.group.rotation.y = holder.rotation.y;
      curtain.meshes.forEach((mesh) => { mesh.userData.room = index; });
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 3.6 * paintingScale, 12), frameMaterial);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(side * (HALF_WIDTH - 0.3), 2.15 + 1.55 * paintingScale, holder.position.z);
      scene.add(curtain.group, rail);
      room.curtains.push(curtain);
    });

    // Societies wall: engraved brass plaques in a three-column grid.
    slots.forEach((slot, order) => {
      if (slot.type !== 'plaques') return;
      plaques.forEach((item, itemIndex) => {
        const { mesh } = plaque(item, m);
        const col = itemIndex % 3;
        const row = Math.floor(itemIndex / 3);
        const rows = Math.ceil(plaques.length / 3);
        mesh.position.set(wallX, 2.35 + ((rows - 1) / 2 - row) * 1.08, slotCentres[order].z + (col - 1) * 1.85 * side);
        mesh.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        scene.add(mesh);
      });
      wallGlow(side, slotCentres[order].z, 7, room.glows);
    });

    // Wall lettering: the exhibit title, painted above the hang (or filling an empty wall).
    const title = element.dataset.wall;
    if (title) {
      const lettering = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshBasicMaterial({ map: letteringTexture(title.split('|'), element.dataset.accession), transparent: true, opacity: 0.2 }));
      lettering.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      const empty = slots[0].type === 'lettering';
      const anchor = empty ? centre.clone() : slotCentres[slots.length - 1].clone().addScaledVector(along, slots[slots.length - 1].width / 2 - 1.2);
      lettering.position.set(side * (HALF_WIDTH - 0.04), empty ? 2.3 : 4.35, anchor.z);
      lettering.scale.setScalar(empty ? 1.6 : 0.42);
      scene.add(lettering);
      room.letters.push(lettering.material as THREE.MeshBasicMaterial);
    }

    room.stop.wall = { centre, side, width: total + 0.6 };
    room.stop.focus.copy(hasSculpture ? new THREE.Vector3(side * (HALF_WIDTH - 1.7), 1.2, slotCentres[0].z) : centre);
    return room;
  });

  // Framing. Wall rooms are viewed nearly head-on from far enough back that the whole hang
  // fits in the part of the screen the placard leaves free (right side, or top on tall screens).
  type Pose = { camera: THREE.Vector3; look: THREE.Vector3; right: THREE.Vector3; back: THREE.Vector3 };
  let poses: Pose[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const framed = (aspect: number, narrow: boolean) => rooms.map(({ stop }, index) => {
    let pose: { camera: THREE.Vector3; look: THREE.Vector3 };
    if (!stop.wall) {
      const direction = new THREE.Vector3().subVectors(stop.look, stop.camera).normalize();
      const right = new THREE.Vector3().crossVectors(direction, up).normalize();
      const shift = narrow ? new THREE.Vector3(0, -0.6, 0).addScaledVector(direction, -1.2) : right.multiplyScalar(index === 0 ? -0.2 : -1.2);
      pose = { camera: stop.camera.clone().add(shift), look: stop.look.clone().add(narrow ? new THREE.Vector3(0, -0.6, 0) : shift) };
    } else {
      const { centre, side, width } = stop.wall;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const freeFraction = narrow ? 0.92 : 0.56;
      const distance = Math.min(HALF_WIDTH * 2 - 0.5, Math.max(6.2, width / (freeFraction * 2 * tanHalf * aspect)));
      const normal = new THREE.Vector3(-side, 0, 0);
      const along = new THREE.Vector3(0, 0, side);
      const look = centre.clone().setY(narrow ? 1.6 : 1.85);
      const cameraPosition = look.clone().addScaledVector(normal, distance).addScaledVector(along, -0.6).setY(narrow ? 1.6 : 1.75);
      const visibleWidth = 2 * distance * tanHalf * aspect;
      const visibleHeight = 2 * distance * tanHalf;
      // Slide both points so the hang's centre lands at ~68% across (desktop) or ~30% down (tall).
      const shift = narrow ? new THREE.Vector3(0, -0.2 * visibleHeight, 0) : along.clone().multiplyScalar(-0.18 * visibleWidth);
      pose = { camera: cameraPosition.add(shift), look: look.add(shift) };
    }
    const forward = new THREE.Vector3().subVectors(pose.look, pose.camera).setY(0).normalize();
    return { ...pose, right: new THREE.Vector3().crossVectors(forward, up).normalize(), back: forward.negate() };
  });

  // Sizes come from the canvas's own CSS box (100lvh), not innerHeight, so a sliding URL bar
  // never rebuilds the renderer.
  let sized = '';
  const resize = () => {
    const width = canvas.clientWidth || innerWidth;
    const height = canvas.clientHeight || innerHeight;
    const key = `${width}x${height}@${devicePixelRatio}`;
    if (key === sized) return;
    sized = key;
    const narrow = width / height < 0.9;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = narrow ? 64 : 50;
    camera.updateProjectionMatrix();
    poses = framed(width / height, narrow);
  };
  resize();
  addEventListener('resize', resize);

  // Entrance interaction: the arm reaches for the pointer while the visitor is in the foyer.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane();
  let pointerSeen = -Infinity;
  let pointerActive = false;
  addEventListener('pointermove', (event) => {
    pointer.set((event.clientX / canvas.clientWidth) * 2 - 1, -(event.clientY / canvas.clientHeight) * 2 + 1);
    pointerSeen = performance.now();
    pointerActive = true;
  }, { passive: true });

  // The visitor's torch: a narrow warm beam that follows the pointer through the dark hall.
  const torch = new THREE.SpotLight(0xfff0d8, 0, 18, 0.2, 0.75, 1.2);
  scene.add(torch, torch.target);
  const curtainMeshes = rooms.flatMap((room) => room.curtains.flatMap((curtain) => curtain.meshes));
  const hoverRay = new THREE.Raycaster();
  const curtainAt = (clientX: number, clientY: number) => {
    hoverRay.setFromCamera(new THREE.Vector2((clientX / canvas.clientWidth) * 2 - 1, -(clientY / canvas.clientHeight) * 2 + 1), camera);
    const hit = hoverRay.intersectObjects(curtainMeshes, false)[0];
    return hit && hit.distance < 14 ? rooms[hit.object.userData.room as number] : undefined;
  };
  // Clicks pass through the page to the hall only where no placard or control sits on top.
  addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!running || target.closest('a, button, input, select, textarea, summary, label, dialog, .placard, .night, .paper, .paper-deep')) return;
    const room = curtainAt(event.clientX, event.clientY);
    if (room) room.curtainManual = room.curtainOpen > 0.5 ? 0 : 1;
  });
  addEventListener('pointermove', (event) => {
    const over = running && !(event.target as HTMLElement).closest('.placard, a, button, .night, .paper, .paper-deep') && curtainAt(event.clientX, event.clientY);
    document.documentElement.classList.toggle('over-curtain', Boolean(over));
  }, { passive: true });
  addEventListener('museum:control', (event) => {
    const { room, key, value } = (event as CustomEvent<{ room: string; key: string; value: number }>).detail;
    if (key !== 'curtain') return;
    const match = rooms.find((item) => item.element.dataset.room === room);
    if (match) match.curtainManual = value;
  });

  const readout = root.querySelector<HTMLElement>('[data-readout]');
  const jointNodes = [...root.querySelectorAll<HTMLElement>('[data-joint]')];
  const stateNode = root.querySelector<HTMLElement>('[data-ik-state]');

  let active = Math.max(0, tour.current());
  let last = performance.now();
  let lastUi = 0;
  // The arrival: when the last cut happened and which way the room came in (+1 from the right).
  let arrivedAt = -Infinity;
  let arrivedFrom = 0;
  let pendingCut: { to: number; direction: number } | null = null;
  let slide: Animation[] = [];
  const lookNow = new THREE.Vector3();

  tour.on((to, from) => { pendingCut = { to, direction: reduced.matches ? 0 : sweepFor(to, from) }; });

  // Freeze what is on screen into the ghost layer, cut the camera to the next room, and slide
  // the live hall in over the frozen frame. A new scroll during the first half of a slide just
  // retargets the cut, so a fast flick or a long jump still reads as one sweep.
  const cut = (now: number, to: number, direction: number) => {
    const inFlight = slide.some((animation) => (Number(animation.currentTime) || 0) < SWEEP.slide.duration * 0.5);
    if (direction && !inFlight) {
      renderer.render(scene, camera);
      if (ghost.width !== canvas.width || ghost.height !== canvas.height) { ghost.width = canvas.width; ghost.height = canvas.height; }
      ghostContext.drawImage(canvas, 0, 0);
      slide.forEach((animation) => animation.cancel());
      root.dataset.sweep = direction > 0 ? 'from-right' : 'from-left';
      slide = [
        live.animate([{ transform: `translate3d(${direction * 100}%, 0, 0)` }, { transform: 'none' }], SWEEP.slide),
        ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translate3d(${-direction * 28}%, 0, 0) scale(0.94)`, opacity: 0.18 }], SWEEP.slide)
      ];
    }
    rooms[active].wake = 0;
    active = to;
    const room = rooms[to];
    room.wake = 0;
    if (direction) { room.curtainOpen = 0; room.curtainManual = null; }
    arrivedAt = now;
    arrivedFrom = direction;
  };

  const frame = (now: number) => {
    // Smoothing follows real elapsed time so slow devices still arrive; physics stays capped.
    const elapsed = Math.min(0.5, (now - last) / 1000);
    const dt = Math.min(0.05, elapsed);
    last = now;
    const time = now / 1000;
    if (pendingCut) { cut(now, pendingCut.to, pendingCut.direction); pendingCut = null; }

    // After the cut the camera keeps drifting the way the room came in, and eases forward a
    // step, so the hall settles with parallax instead of stopping dead with the slide.
    const pose = poses[active];
    const age = (now - arrivedAt) / SWEEP.settle.duration;
    const carry = arrivedFrom && age < 1 ? (1 - age) ** 4 : 0;
    camera.position.copy(pose.camera).addScaledVector(pose.right, -arrivedFrom * SWEEP.drift * carry).addScaledVector(pose.back, 0.7 * carry);
    lookNow.copy(pose.look).addScaledVector(pose.right, -arrivedFrom * SWEEP.drift * 0.6 * carry);
    camera.lookAt(lookNow);

    if (ik) {
      if (active === 0 && pointerActive && now - pointerSeen < 2600) {
        raycaster.setFromCamera(pointer, camera);
        const focus = rooms[0].stop.focus;
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3().subVectors(camera.position, focus).setY(0).normalize(), focus);
        const hit = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
        ik.aim(hit && hit.distanceTo(focus) < 3 ? hit : null);
      } else ik.aim(null);
    }

    rooms.forEach((room, index) => {
      const target = index === active ? 1 : 0;
      room.wake += (target - room.wake) * (1 - Math.exp(-elapsed * 3));
      const level = 0.1 + room.wake * 0.9;
      // Paintings sit in near-darkness until their picture light comes on.
      room.images.forEach((material) => material.color.setScalar(material.map ? level : 0.08));
      room.mats.forEach((material) => material.color.setRGB(0.06 + room.wake * 0.8, 0.05 + room.wake * 0.74, 0.04 + room.wake * 0.62));
      room.letters.forEach((material) => { material.opacity = 0.18 + room.wake * 0.82; });
      room.lamps.forEach((material) => material.color.setRGB(0.25 + room.wake * 0.75, 0.2 + room.wake * 0.69, 0.12 + room.wake * 0.54));
      room.glows.forEach((material) => { material.opacity = room.wake * 0.5; });
      if (room.wake > 0.02 || index === active) room.sculpture?.update(time, dt, room.wake);
    });

    rooms.forEach((room, index) => {
      if (!room.curtains.length) return;
      if (index !== active) room.curtainManual = null; // reset once the visitor walks on
      const auto = Math.min(1, Math.max(0, (room.wake - 0.35) / 0.5));
      const goalOpen = room.curtainManual ?? auto;
      room.curtainOpen += (goalOpen - room.curtainOpen) * (1 - Math.exp(-elapsed * (reduced.matches ? 30 : 2.6)));
      if (room.wake > 0.02 || room.curtainOpen > 0.01) room.curtains.forEach((curtain) => curtain.set(room.curtainOpen, time));
    });

    const torchOn = pointerActive && now - pointerSeen < 4000 && active > 0;
    torch.intensity += ((torchOn ? 45 : 0) - torch.intensity) * (1 - Math.exp(-elapsed * 5));
    if (torch.intensity > 0.5) {
      raycaster.setFromCamera(pointer, camera);
      torch.position.copy(camera.position).add(new THREE.Vector3(0.2, -0.3, 0));
      torch.target.position.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, 8);
    }

    const here = rooms[active];
    followSpot.position.set(here.stop.focus.x * 0.6, HEIGHT - 0.3, here.stop.focus.z + 2.2);
    followSpot.target.position.copy(here.stop.focus);
    followSpot.intensity = active === 0 ? 0 : 140 * here.wake;
    entranceKey.intensity = 70 * rooms[0].wake;

    renderer.render(scene, camera);

    if (now - lastUi > 80) {
      lastUi = now;
      if (ik && readout && active === 0) {
        const { angles, limited } = ik.readout();
        angles.forEach((value, index) => {
          const degrees = (value * 180) / Math.PI;
          if (jointNodes[index]) jointNodes[index].textContent = `${degrees >= 0 ? '+' : ''}${degrees.toFixed(1)}°`;
        });
        if (stateNode) stateNode.textContent = limited ? 'limit' : now - pointerSeen < 2600 ? 'tracking' : 'idle sweep';
        readout.dataset.state = limited ? 'limit' : 'ok';
      }
    }
  };

  // Placard controls talk to their exhibit through one window event.
  addEventListener('museum:control', (event) => {
    const { room, key, value } = (event as CustomEvent<{ room: string; key: string; value: number }>).detail;
    rooms.find((item) => item.element.dataset.room === room)?.sculpture?.control?.(key, value);
  });

  let running = false;
  const run = (on: boolean) => {
    if (on === running) return;
    running = on;
    last = performance.now();
    renderer.setAnimationLoop(on ? frame : null);
  };
  new IntersectionObserver(([entry]) => run(entry.isIntersecting && !document.hidden)).observe(root);
  document.addEventListener('visibilitychange', () => run(!document.hidden && root.getBoundingClientRect().bottom > 0));
  root.classList.add('is-live');
}
