// Period interior for the hall: damask walls, walnut wainscoting, herringbone parquet,
// marble plinths, gilt frames, brass picture lights, and velvet-rope stanchions.
// Every texture is drawn on a canvas at load, so the scene ships no image files of its own.
import * as THREE from 'three';

const canvasTexture = (size: number, draw: (context: CanvasRenderingContext2D, size: number) => void, srgb = true) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size);
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
};

let seed = 11;
const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

export const damask = () => canvasTexture(512, (c, s) => {
  c.fillStyle = '#5c111a';
  c.fillRect(0, 0, s, s);
  // A mirrored acanthus-and-lozenge motif, drawn twice per tile in a half-drop.
  const motif = (cx: number, cy: number, scale: number) => {
    c.save();
    c.translate(cx, cy);
    c.scale(scale, scale);
    c.fillStyle = 'rgba(150, 38, 48, 0.45)';
    [-1, 1].forEach((mirror) => {
      c.save();
      c.scale(mirror, 1);
      c.beginPath();
      c.moveTo(0, -120);
      c.bezierCurveTo(30, -95, 60, -70, 40, -30);
      c.bezierCurveTo(80, -40, 95, 10, 60, 30);
      c.bezierCurveTo(85, 60, 50, 100, 18, 80);
      c.bezierCurveTo(22, 105, 10, 120, 0, 128);
      c.lineTo(0, -120);
      c.fill();
      c.beginPath();
      c.ellipse(52, -2, 9, 22, 0.5, 0, Math.PI * 2);
      c.fillStyle = 'rgba(58, 8, 14, 0.9)';
      c.fill();
      c.fillStyle = 'rgba(150, 38, 48, 0.45)';
      c.restore();
    });
    c.beginPath();
    c.arc(0, -6, 12, 0, Math.PI * 2);
    c.fillStyle = 'rgba(176, 58, 66, 0.35)';
    c.fill();
    c.restore();
  };
  motif(s / 2, s / 4, 0.85);
  motif(0, (s * 3) / 4, 0.85);
  motif(s, (s * 3) / 4, 0.85);
});

export const parquet = () => canvasTexture(512, (c, s) => {
  c.fillStyle = '#120c0a';
  c.fillRect(0, 0, s, s);
  const plankL = 128;
  const plankW = 32;
  const tones = ['#2a1a12', '#33201a', '#241610', '#3b261c', '#2e1d15'];
  // Herringbone: alternating 45° planks marching across the tile.
  for (let row = -4; row < 12; row += 1) {
    for (let col = -4; col < 12; col += 1) {
      const x = col * plankW * 2 + row * plankW;
      const y = row * plankW;
      [0, 1].forEach((flip) => {
        c.save();
        c.translate(x + flip * plankW, y);
        c.rotate(flip ? -Math.PI / 4 : Math.PI / 4);
        c.fillStyle = tones[Math.floor(random() * tones.length)];
        c.fillRect(0, 0, plankL * 0.7, plankW * 0.7);
        c.strokeStyle = 'rgba(20, 10, 4, 0.55)';
        c.lineWidth = 1.5;
        c.strokeRect(0, 0, plankL * 0.7, plankW * 0.7);
        c.strokeStyle = 'rgba(255, 220, 170, 0.06)';
        for (let grain = 4; grain < plankW * 0.7; grain += 5) {
          c.beginPath();
          c.moveTo(0, grain);
          c.lineTo(plankL * 0.7, grain + (random() - 0.5) * 3);
          c.stroke();
        }
        c.restore();
      });
    }
  }
});

export const walnut = () => canvasTexture(512, (c, s) => {
  c.fillStyle = '#100c0c';
  c.fillRect(0, 0, s, s);
  for (let line = 0; line < s; line += 3) {
    c.strokeStyle = `rgba(${50 + random() * 30}, ${36 + random() * 18}, ${30 + random() * 12}, 0.16)`;
    c.beginPath();
    c.moveTo(0, line);
    c.bezierCurveTo(s * 0.3, line + random() * 6, s * 0.6, line - random() * 6, s, line);
    c.stroke();
  }
  // One raised panel per tile: bevel highlight on top/left, shadow on bottom/right.
  c.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  c.lineWidth = 10;
  c.strokeRect(48, 64, s - 96, s - 128);
  c.strokeStyle = 'rgba(255, 210, 160, 0.12)';
  c.lineWidth = 4;
  c.strokeRect(58, 74, s - 116, s - 148);
});

export const marble = () => canvasTexture(512, (c, s) => {
  c.fillStyle = '#141212';
  c.fillRect(0, 0, s, s);
  for (let vein = 0; vein < 14; vein += 1) {
    c.strokeStyle = `rgba(220, 214, 204, ${0.1 + random() * 0.3})`;
    c.lineWidth = 0.6 + random() * 2.4;
    c.beginPath();
    let x = random() * s;
    let y = 0;
    c.moveTo(x, y);
    while (y < s) {
      x += (random() - 0.45) * 60;
      y += 20 + random() * 40;
      c.lineTo(x, y);
    }
    c.stroke();
  }
});

export const materials = () => ({
  gilt: new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.9, roughness: 0.32 }),
  giltDeep: new THREE.MeshStandardMaterial({ color: 0x8c6a26, metalness: 0.85, roughness: 0.45 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb8913e, metalness: 0.95, roughness: 0.28 }),
  velvetRope: new THREE.MeshStandardMaterial({ color: 0x9a1424, roughness: 0.8 }),
  marble: new THREE.MeshStandardMaterial({ map: marble(), roughness: 0.35, metalness: 0.02 }),
  walnut: new THREE.MeshStandardMaterial({ color: 0x1c1414, roughness: 0.45 }),
  lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe2a8 })
});

export type Materials = ReturnType<typeof materials>;

// A gilt frame: deep outer moulding, a raised inner lip, and corner bosses.
export function giltFrame(width: number, height: number, m: Materials) {
  const group = new THREE.Group();
  const bar = (w: number, h: number, depth: number, material: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
  };
  const t = 0.2;
  [[width + t * 2, t, 0, (height + t) / 2], [width + t * 2, t, 0, -(height + t) / 2], [t, height, -(width + t) / 2, 0], [t, height, (width + t) / 2, 0]].forEach(([w, h, x, y]) => bar(w, h, 0.12, m.gilt, x, y, 0.02));
  const lip = 0.05;
  [[width + lip * 2, lip, 0, (height + lip) / 2], [width + lip * 2, lip, 0, -(height + lip) / 2], [lip, height, -(width + lip) / 2, 0], [lip, height, (width + lip) / 2, 0]].forEach(([w, h, x, y]) => bar(w, h, 0.16, m.giltDeep, x, y, 0.03));
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sy]) => {
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), m.gilt);
    boss.position.set(sx * (width / 2 + t / 2), sy * (height / 2 + t / 2), 0.1);
    group.add(boss);
  });
  return group;
}

// Brass picture light on a swan-neck arm; its shade glows when the painting wakes.
export function pictureLight(width: number, m: Materials) {
  const group = new THREE.Group();
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, width * 0.55, 16, 1, false, 0, Math.PI), m.brass);
  shade.rotation.z = Math.PI / 2;
  shade.rotation.y = Math.PI / 2;
  shade.position.set(0, 0, 0.32);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.012, 0.04), m.lampGlow.clone());
  glow.position.set(0, -0.06, 0.32);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 16, Math.PI / 2), m.brass);
  arm.rotation.y = Math.PI / 2;
  arm.position.set(0, -0.16, 0.16);
  group.add(shade, glow, arm);
  return { group, glow: glow.material as THREE.MeshBasicMaterial };
}

// Two brass stanchions joined by a sagging velvet rope.
export function stanchions(span: number, m: Materials) {
  const group = new THREE.Group();
  [-span / 2, span / 2].forEach((x) => {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.04, 24), m.brass);
    base.position.set(x, 0.02, 0);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.9, 12), m.brass);
    post.position.set(x, 0.47, 0);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), m.brass);
    knob.position.set(x, 0.95, 0);
    group.add(base, post, knob);
  });
  const sag = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-span / 2, 0.88, 0), new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(span / 2, 0.88, 0));
  const rope = new THREE.Mesh(new THREE.TubeGeometry(sag, 32, 0.022, 8), m.velvetRope);
  group.add(rope);
  return group;
}

// An engraved brass plaque for the societies wall.
export function plaque(lines: { title: string; role: string; when: string }, m: Materials) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 560;
  const c = canvas.getContext('2d')!;
  const gradient = c.createLinearGradient(0, 0, 1024, 560);
  gradient.addColorStop(0, '#d8b765');
  gradient.addColorStop(0.5, '#b8913e');
  gradient.addColorStop(1, '#c9a452');
  c.fillStyle = gradient;
  c.fillRect(0, 0, 1024, 560);
  c.strokeStyle = 'rgba(60, 40, 10, 0.7)';
  c.lineWidth = 6;
  c.strokeRect(26, 26, 972, 508);
  c.lineWidth = 2;
  c.strokeRect(42, 42, 940, 476);
  c.fillStyle = '#3a2808';
  c.textAlign = 'center';
  c.font = '500 34px "IBM Plex Mono", monospace';
  c.fillText(lines.when.toUpperCase(), 512, 120);
  c.font = '600 76px "Cormorant Garamond", Georgia, serif';
  const words = lines.title.split(' ');
  let line = '';
  let y = 230;
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > 880) { c.fillText(line, 512, y); line = word; y += 80; }
    else line = test;
  });
  c.fillText(line, 512, y);
  c.font = 'italic 500 50px "Cormorant Garamond", Georgia, serif';
  c.fillText(lines.role, 512, Math.min(470, y + 100));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const face = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.75, roughness: 0.38 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.875, 0.04), [m.brass, m.brass, m.brass, m.brass, face, m.brass]);
  plate.castShadow = true;
  return { mesh: plate, face };
}
