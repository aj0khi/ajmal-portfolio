// What stands at each stop, grey-boxed for Phase 1: houses on the street, the Chinook Clean job
// site, the HVAC Express house, three road signs, the campus (gate, lab, BlackBox cart, arcade
// lounge, soccer pitch), the rover team garage, the Mars yard in the badlands, and the pad.
// Everything is placed by stop metres, so moving a stop in journey.ts moves its site with it.
import * as THREE from 'three';
import { stops, type StopId } from '../../../data/journey';
import { hashChain, motorBus, roverLoop, snakeBoard, waybionicArm, type Sculpture } from '../../museum/sculptures';
import { seeded } from '../util';
import { earthRoad, type Flat } from './route';

// A stop's live parts: `update` runs while the stop is near (`active` 0..1, 1 = parked here);
// `control` takes the card's sliders and buttons.
export interface Interaction {
  update: (time: number, dt: number, active: number) => void;
  control?: (key: string, value: number) => void;
}
const fromSculpture = (piece: Sculpture): Interaction => ({ update: piece.update, control: piece.control });

// Win, draw and loss chances when each side's goals follow a Poisson distribution with the
// given expected goals: the model family the Soccer Intelligence Lab uses (uncalibrated here).
function outcomes(home: number, away: number) {
  const pmf = (rate: number) => { const out: number[] = []; let p = Math.exp(-rate); for (let k = 0; k <= 10; k += 1) { out.push(p); p *= rate / (k + 1); } return out; };
  const h = pmf(home); const a = pmf(away);
  let win = 0; let draw = 0; let loss = 0;
  h.forEach((ph, i) => a.forEach((pa, j) => { if (i > j) win += ph * pa; else if (i === j) draw += ph * pa; else loss += ph * pa; }));
  const total = win + draw + loss;
  return { home: win / total, draw: draw / total, away: loss / total };
}

const metresOf = (id: StopId) => stops.find((stop) => stop.id === id)!.at;
const material = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra });

function box(w: number, h: number, d: number, paint: THREE.Material | THREE.ColorRepresentation, x = 0, y = h / 2, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paint instanceof THREE.Material ? paint : material(paint));
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// A group standing beside the road at a stop, turned so its front (+z) faces the road.
function site(metres: number, side: number, along = 0) {
  const group = new THREE.Group();
  const at = earthRoad.beside(metres, side, along);
  group.position.copy(at);
  const facing = earthRoad.beside(metres, 0, along);
  group.lookAt(facing.x, 0, facing.z);
  return { group, at };
}

// Canvas text on a board, redrawn once the display font has loaded.
function signTexture(text: string, colors: { board: string; ink: string }, size: [number, number] = [512, 192]) {
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = size;
  const context = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    context.fillStyle = colors.board;
    context.fillRect(0, 0, size[0], size[1]);
    context.strokeStyle = colors.ink;
    context.lineWidth = 6;
    context.strokeRect(10, 10, size[0] - 20, size[1] - 20);
    context.fillStyle = colors.ink;
    context.font = `800 ${Math.round(size[1] * 0.5)}px "Big Shoulders", "Arial Narrow", sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, size[0] / 2, size[1] / 2 + 4);
    texture.needsUpdate = true;
  };
  draw();
  document.fonts?.load('800 64px "Big Shoulders"').then(draw, () => undefined);
  return texture;
}

export function buildSites(scene: THREE.Scene) {
  const flats: Flat[] = [];
  const interactions: Partial<Record<StopId, Interaction>> = {};
  const windowGlow = material('#2a2a30', { emissive: '#ffc77a', emissiveIntensity: 1 });

  // ---------- The street ----------
  const house = (metres: number, side: number, siding: string, along = 0) => {
    const { group, at } = site(metres, side, along);
    group.add(box(9, 4.6, 8, siding, 0, 2.3));
    const roofShape = new THREE.Shape([new THREE.Vector2(-5.2, 0), new THREE.Vector2(5.2, 0), new THREE.Vector2(0, 3.2)]);
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 9, bevelEnabled: false }), material('#34353d', { roughness: 0.85 }));
    roof.position.set(0, 4.6, -4.5);
    roof.castShadow = true;
    group.add(roof);
    group.add(box(3.6, 2.8, 0.2, '#cfc6b4', 2.2, 1.4, 4.05));
    [-2.6, 0].forEach((x) => { const pane = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 0.1), windowGlow); pane.position.set(x, 2.8, 4.05); group.add(pane); });
    group.add(box(4, 0.08, 7, '#9a978f', 2.2, 0.05, 7.5));
    scene.add(group);
    flats.push({ at, radius: 16 });
    return group;
  };
  house(metresOf('home'), -12, '#d9ccb2');
  house(54, 13, '#c9b49a');
  house(66, -13, '#b9c2c4');
  house(128, 13, '#d3c7a4');

  // Chinook Clean: a neighbour's driveway, half washed, with the pressure-washer trailer.
  {
    const chinook = house(metresOf('chinook'), -12, '#c8bfae');
    // The driveway is clean concrete under a grime layer; the cleaner erases grime as it passes.
    const W = 128; const H = 224;
    const display = document.createElement('canvas'); display.width = W; display.height = H;
    const grime = document.createElement('canvas'); grime.width = W; grime.height = H;
    const view = display.getContext('2d')!; const dirt = grime.getContext('2d')!;
    const random = seeded(31);
    const soil = () => {
      dirt.globalCompositeOperation = 'source-over';
      dirt.fillStyle = '#3f3c34';
      dirt.fillRect(0, 0, W, H);
      for (let i = 0; i < 900; i += 1) { dirt.fillStyle = `rgba(24,22,18,${random() * 0.5})`; dirt.fillRect(random() * W, random() * H, 3 + random() * 8, 3 + random() * 8); }
    };
    const compose = () => {
      view.fillStyle = '#e2ded2';
      view.fillRect(0, 0, W, H);
      view.strokeStyle = '#a9a598'; view.lineWidth = 2;
      for (let y = 0; y <= H; y += 32) { view.beginPath(); view.moveTo(0, y); view.lineTo(W, y); view.stroke(); }
      view.drawImage(grime, 0, 0);
      texture.needsUpdate = true;
    };
    const texture = new THREE.CanvasTexture(display);
    texture.colorSpace = THREE.SRGBColorSpace;
    soil();
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(4, 7), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }));
    slab.rotation.x = -Math.PI / 2;
    slab.position.set(2.2, 0.1, 7.5);
    slab.receiveShadow = true;
    chinook.add(slab);
    compose();
    // A flat surface cleaner, the tool for driveways, with its spray skirt.
    const cleaner = new THREE.Group();
    cleaner.add(box(0.06, 1.1, 0.06, '#2b2c31', 0, 0.75, -0.45));
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.16, 24), material('#d8342c'));
    deck.position.y = 0.12;
    deck.castShadow = true;
    cleaner.add(deck);
    const mist = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.12, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#d9f2ff', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
    mist.position.y = 0.08;
    cleaner.add(mist);
    chinook.add(cleaner);
    // A work light on the trailer, the way crews light a driveway before sunrise.
    const worklight = new THREE.PointLight(0xfff1dc, 45, 16, 1.4);
    worklight.position.set(1.2, 3.4, 9);
    chinook.add(worklight);
    // The cleaner works in rows across the driveway. Until the visitor takes over it runs as a
    // demo; after that it only cleans while they hold the button.
    let progress = 0; let spraying = false; let touched = false;
    const ROWS = 7;
    const placeCleaner = () => {
      const row = Math.min(ROWS - 1, Math.floor(progress * ROWS));
      const across = (progress * ROWS) % 1;
      const u = row % 2 ? 1 - across : across;
      const v = (row + 0.5) / ROWS;
      cleaner.position.set(2.2 - 1.6 + u * 3.2, 0.1, 7.5 - 3.5 + v * 7);
      return { x: (0.1 + u * 0.8) * W, y: v * H };
    };
    placeCleaner();
    interactions.chinook = {
      control: (key, value) => {
        if (key === 'spray') { spraying = value > 0; touched = true; }
        if (key === 'reset') { progress = 0; soil(); compose(); placeCleaner(); }
      },
      update: (time, dt, active) => {
        const working = touched ? spraying : active > 0.6;
        mist.visible = working;
        deck.rotation.y = working ? time * 14 : deck.rotation.y;
        if (active < 0.05 && !touched && progress > 0) { progress = 0; soil(); compose(); }
        if (!working || progress >= 1) return;
        progress = Math.min(1, progress + dt * 0.08);
        const at = placeCleaner();
        dirt.globalCompositeOperation = 'destination-out';
        dirt.beginPath(); dirt.arc(at.x, at.y, W / ROWS * 0.95, 0, Math.PI * 2); dirt.fill();
        compose();
      }
    };
    const trailer = new THREE.Group();
    trailer.add(box(2.2, 1.3, 3.4, '#e9e4d8', 0, 1.15));
    trailer.add(box(1.2, 0.9, 1, '#2b2c31', 0, 2.25, -0.8));
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 18), material('#d8342c'));
    reel.rotation.z = Math.PI / 2;
    reel.position.set(0, 2.1, 0.9);
    trailer.add(reel);
    [-1.2, 1.2].forEach((x) => { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 14), material('#1e1f23')); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.4, 0); trailer.add(wheel); });
    trailer.position.set(-1.6, 0, 9.5);
    trailer.rotation.y = 0.35;
    chinook.add(trailer);
  }

  // HVAC Express: a house with a condenser on the roof and the company van out front.
  {
    const hvac = house(metresOf('hvac'), 13, '#d6cdb8');
    const condenser = box(2.2, 1.3, 2.2, '#c3c6c8', -2.2, 6.2, -1.2);
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 28), material('#2b2c31'));
    guard.position.set(-2.2, 6.88, -1.2);
    const fan = new THREE.Group();
    fan.position.set(-2.2, 6.95, -1.2);
    for (let i = 0; i < 3; i += 1) { const blade = box(0.22, 0.04, 0.72, '#9ea3a8', 0, 0, 0.36); const arm = new THREE.Group(); arm.rotation.y = (i / 3) * Math.PI * 2; arm.add(blade); fan.add(arm); }
    hvac.add(condenser, guard, fan);
    let setpoint = 21; let spin = 0;
    interactions.hvac = {
      control: (key, value) => { if (key === 'setpoint') setpoint = value; },
      update: (_time, dt, active) => {
        // An illustration, not a model: below about 24°C the cooling side runs, harder the lower it goes.
        const target = active * Math.max(0, 24.5 - setpoint) * 2.2;
        spin += (target - spin) * (1 - Math.exp(-dt * 2));
        fan.rotation.y += spin * dt;
      }
    };
    const van = new THREE.Group();
    van.add(box(2.2, 2.3, 5.2, '#f1efe9', 0, 1.55));
    van.add(box(2.24, 0.9, 1.4, '#2a2d35', 0, 2.1, 1.9));
    [-1.7, 1.7].forEach((z) => [-1.12, 1.12].forEach((x) => { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), material('#1e1f23')); wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.42, z); van.add(wheel); }));
    van.position.set(2.2, 0, 9.4);
    hvac.add(van);
  }

  // ---------- The foothills: three road signs at the crest ----------
  ['Compressors.', 'Nozzles.', 'Joints.'].forEach((word, i) => {
    const metres = metresOf('thread') + 14 + i * 13;
    const width = Math.max(4.6, word.length * 0.46);
    const { group, at } = site(metres, 5.5);
    const behind = earthRoad.beside(metres - 25, 5.5); // faces oncoming traffic
    group.lookAt(behind.x, 0, behind.z);
    [-1, 1].forEach((x) => group.add(box(0.14, 3.4, 0.14, '#6d6f74', x * (width / 2 - 0.7), 1.7)));
    const board = new THREE.Mesh(new THREE.BoxGeometry(width, 1.75, 0.12), [
      material('#1c5a3c'), material('#1c5a3c'), material('#1c5a3c'), material('#1c5a3c'),
      material('#ffffff', { map: signTexture(word, { board: '#1c5a3c', ink: '#f3eee4' }, [Math.round(512 * width / 4.6), 192]), roughness: 0.6 }), material('#1c5a3c')
    ]);
    board.position.y = 3.6;
    board.castShadow = true;
    group.add(board);
    scene.add(group);
    flats.push({ at, radius: 6 });
  });

  // ---------- Campus ----------
  // The gate: brick pillars, a lintel over the road, and club banners on the approach.
  {
    const { group, at } = site(metresOf('societies') + 16, 0);
    [-5.2, 5.2].forEach((x) => group.add(box(1.6, 8, 1.6, '#8f4436', x, 4)));
    group.add(box(12, 1.2, 1.4, '#8f4436', 0, 8.4));
    group.add(box(7, 0.9, 0.2, '#e8dfc9', 0, 8.4, 0.72));
    scene.add(group);
    flats.push({ at, radius: 26 });
    const colors = ['#9a2b2b', '#d9a84a', '#1f3b5a', '#9a2b2b', '#d9a84a', '#2f5a3c'];
    colors.forEach((color, i) => {
      const side = i % 2 ? 1 : -1;
      const pole = site(metresOf('societies') - 6 + Math.floor(i / 2) * 7, side * 4.3);
      pole.group.add(box(0.16, 6.5, 0.16, '#3a3a40', 0, 3.25));
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), material(color, { side: THREE.DoubleSide }));
      flag.position.set(0.7, 4.6, 0);
      flag.rotation.y = Math.PI / 2;
      pole.group.add(flag);
      scene.add(pole.group);
    });
  }
  const campusBuilding = (metres: number, side: number, w: number, h: number, d: number, color: string, along = 0) => {
    const { group, at } = site(metres, side, along);
    group.add(box(w, h, d, color, 0, h / 2, -d / 2));
    scene.add(group);
    flats.push({ at, radius: Math.max(w, d) * 0.75 });
    return group;
  };
  // WayBionic: a concrete lab with a lit window wall, and the arm on a bench out front.
  {
    const lab = campusBuilding(metresOf('waybionic'), -21, 24, 10, 14, '#a9a49a');
    const glass = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 0.1), material('#1a2230', { emissive: '#bcd6ff', emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.4 }));
    glass.position.set(-2, 3.6, 0.06);
    lab.add(glass);
    const bench = new THREE.Group();
    bench.add(box(3, 0.9, 1.4, '#3a3b40', 0, 0.45));
    // The WayBionic old arm, loaded from the team's MIT-licensed URDF and meshes.
    const arm = waybionicArm();
    arm.object.position.y = 0.9;
    arm.object.scale.setScalar(2.4);
    arm.object.rotation.y = 0.5;
    bench.add(arm.object);
    bench.position.set(4, 0, 5);
    lab.add(bench);
    interactions.waybionic = fromSculpture(arm);
  }
  // BlackBox: the flight recorder on a cart by the loading dock. Real ones are orange.
  {
    const { group, at } = site(metresOf('blackbox'), 9);
    group.add(box(1.8, 0.12, 1.2, '#55575d', 0, 0.75));
    [-0.7, 0.7].forEach((x) => [-0.45, 0.45].forEach((z) => group.add(box(0.12, 0.62, 0.12, '#55575d', x, 0.37, z))));
    group.add(box(1.2, 0.9, 0.9, '#ea6a1f', 0, 1.26));
    group.add(box(1.22, 0.14, 0.92, '#1d1d20', 0, 1.26));
    const chain = hashChain();
    chain.object.position.y = 1.6;
    chain.object.scale.setScalar(1.5);
    group.add(chain.object);
    interactions.blackbox = fromSculpture(chain);
    const dock = box(16, 7, 10, '#9d968a', 0, 3.5, -12);
    group.add(dock);
    group.add(box(4.5, 4, 0.12, '#2b2c31', -3, 2, -6.95));
    scene.add(group);
    flats.push({ at, radius: 14 });
  }
  // The arcade: a glass pavilion with three cabinets glowing inside.
  {
    const lounge = campusBuilding(metresOf('lounge'), -18, 18, 7, 12, '#d9d4c8');
    lounge.children[0].visible = false; // swapped for glass walls
    const glass = material('#9fb6c8', { transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.2, depthWrite: false });
    lounge.add(box(18, 7, 12, glass, 0, 3.5, -6));
    lounge.add(box(18.4, 0.5, 12.4, '#d9d4c8', 0, 7.2, -6));
    lounge.add(box(18.4, 0.2, 12.4, '#b9b3a6', 0, 0.1, -6));
    ['#46e0b0', '#ff8a3c', '#8a7dff'].forEach((screen, i) => {
      const cabinet = new THREE.Group();
      cabinet.add(box(1.3, 2.3, 1.1, '#1e1f24', 0, 1.15));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.8), material('#000000', { emissive: screen, emissiveIntensity: 1.4 }));
      face.position.set(0, 1.75, 0.56);
      face.rotation.x = -0.2;
      cabinet.add(face);
      cabinet.position.set(-4 + i * 4, 0.2, -3.5);
      lounge.add(cabinet);
    });
    const table = box(2.4, 0.9, 2.4, '#3a3b40', 0, 0.65, -8.5);
    const snake = snakeBoard();
    snake.object.position.set(0, 1.1, -8.5);
    snake.object.scale.setScalar(1.4);
    lounge.add(table, snake.object);
    interactions.lounge = fromSculpture(snake);
  }
  // Soccer Intelligence: a pitch with goals and a scoreboard.
  {
    const { group, at } = site(metresOf('soccer'), 32);
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 340;
    const context = canvas.getContext('2d')!;
    for (let i = 0; i < 10; i += 1) { context.fillStyle = i % 2 ? '#4c8a3e' : '#559645'; context.fillRect(i * 51.2, 0, 51.2, 340); }
    context.strokeStyle = 'rgba(255,255,255,0.85)'; context.lineWidth = 4;
    context.strokeRect(12, 12, 488, 316); context.beginPath(); context.moveTo(256, 12); context.lineTo(256, 328); context.stroke();
    context.beginPath(); context.arc(256, 170, 46, 0, Math.PI * 2); context.stroke();
    context.strokeRect(12, 100, 60, 140); context.strokeRect(440, 100, 60, 140);
    const turf = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.95 });
    (turf.map as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(44, 29), turf);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.04;
    pitch.receiveShadow = true;
    group.add(pitch);
    [-21.5, 21.5].forEach((x) => {
      const goal = new THREE.Group();
      [-3.6, 3.6].forEach((z) => goal.add(box(0.15, 2.4, 0.15, '#f3f1ea', 0, 1.2, z)));
      goal.add(box(0.15, 0.15, 7.4, '#f3f1ea', 0, 2.4, 0));
      goal.position.x = x;
      group.add(goal);
    });
    const board = new THREE.Group();
    [-3, 3].forEach((x) => board.add(box(0.3, 6, 0.3, '#3a3a40', x, 3)));
    board.add(box(7.6, 3.2, 0.5, '#1e1f24', 0, 7));
    const scoreCanvas = document.createElement('canvas');
    scoreCanvas.width = 680; scoreCanvas.height = 250;
    const score = scoreCanvas.getContext('2d')!;
    const scoreTexture = new THREE.CanvasTexture(scoreCanvas);
    scoreTexture.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 2.5), material('#000000', { emissive: '#ffffff', emissiveMap: scoreTexture, emissiveIntensity: 1 }));
    screen.position.set(0, 7, 0.27);
    board.add(screen);
    const xg = { home: 1.6, away: 1.1 };
    const drawScoreboard = () => {
      const { home, draw, away } = outcomes(xg.home, xg.away);
      score.fillStyle = '#0d0f14';
      score.fillRect(0, 0, 680, 250);
      score.font = '600 30px "Public Sans", system-ui, sans-serif';
      score.textBaseline = 'middle';
      [['Home', home, '#7fc4ad'], ['Draw', draw, '#bdb7aa'], ['Away', away, '#d8342c']].forEach(([label, share, colour], row) => {
        const y = 52 + row * 72;
        score.fillStyle = '#f3eee4';
        score.fillText(label as string, 24, y);
        score.fillStyle = '#262a33';
        score.fillRect(140, y - 18, 400, 36);
        score.fillStyle = colour as string;
        score.fillRect(140, y - 18, 400 * (share as number), 36);
        score.fillStyle = '#f2a541';
        score.fillText(`${Math.round((share as number) * 100)}%`, 560, y);
      });
      scoreTexture.needsUpdate = true;
    };
    drawScoreboard();
    document.fonts?.ready.then(drawScoreboard, () => undefined);
    interactions.soccer = {
      control: (key, value) => { if (key === 'home' || key === 'away') { xg[key] = value; drawScoreboard(); } },
      update: () => undefined
    };
    board.position.set(0, 0, -17);
    group.add(board);
    scene.add(group);
    flats.push({ at, radius: 30 });
  }

  // ---------- The badlands ----------
  // The rover team garage: a shed with the door rolled up, three motors on the bench inside.
  {
    const { group, at } = site(metresOf('garage'), -17);
    const wall = material('#8b8f93', { metalness: 0.3, roughness: 0.6 });
    group.add(box(16, 7, 0.3, wall, 0, 3.5, -12));
    [-8, 8].forEach((x) => group.add(box(0.3, 7, 12, wall, x, 3.5, -6)));
    group.add(box(16.4, 0.4, 12.4, '#6f7377', 0, 7.2, -6));
    [-5, 5].forEach((x) => group.add(box(6, 7, 0.3, wall, x, 3.5, 0)));
    group.add(box(4, 1.6, 0.3, wall, 0, 6.2, 0));
    group.add(box(5, 0.9, 1.6, '#4a3a2c', 0, 0.45, -5));
    // The three CAN motors on one bus, with data pulses running along the cable.
    const bus = motorBus();
    bus.object.position.set(0.3, 0.9, -5);
    bus.object.scale.setScalar(1.5);
    group.add(bus.object);
    interactions.garage = fromSculpture(bus);
    const bulb = new THREE.PointLight(0xffd7a0, 30, 16, 1.6);
    bulb.position.set(0, 6, -6);
    group.add(bulb);
    scene.add(group);
    flats.push({ at, radius: 18 });
  }
  // The Mars yard: red rock, hoodoos, cones, and the little obstacle-avoiding rover.
  {
    const { group, at } = site(metresOf('mars'), 20);
    const random = seeded(41);
    const sandstone = material('#c07a4c', { flatShading: true });
    const cap = material('#6b4a36', { flatShading: true });
    for (let i = 0; i < 9; i += 1) {
      const angle = random() * Math.PI * 2; const r = 6 + random() * 16; const h = 3 + random() * 6;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.5 + random() * 0.4, 1.1 + random() * 0.6, h, 7), sandstone);
      column.position.set(Math.cos(angle) * r, h / 2, Math.sin(angle) * r - 6);
      column.castShadow = true;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.1, 0.6, 7), cap);
      top.position.set(column.position.x, h + 0.2, column.position.z);
      top.castShadow = true;
      group.add(column, top);
    }
    for (let i = 0; i < 18; i += 1) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + random() * 0.9), sandstone);
      rock.position.set((random() - 0.5) * 30, 0.2, (random() - 0.5) * 22 - 4);
      rock.rotation.set(random(), random(), random());
      rock.castShadow = true;
      group.add(rock);
    }
    [[-3, 2], [2, -1], [5, 4]].forEach(([x, z]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 12), material('#ff7a1f'));
      cone.position.set(x, 0.38, z);
      group.add(cone);
    });
    // The high-school rover, sonar cone out front, steering around the pillars on its own.
    const rover = roverLoop();
    rover.object.position.set(-1, 0, 0);
    rover.object.scale.setScalar(4.2);
    group.add(rover.object);
    interactions.mars = fromSculpture(rover);
    scene.add(group);
    flats.push({ at, radius: 22 });
  }

  return {
    flats,
    interactions,
    update(lamps: number) {
      windowGlow.emissiveIntensity = 0.05 + lamps * 1.6;
    }
  };
}
