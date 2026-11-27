// Surface detail drawn on canvases at load, so the world ships no image files of its own:
// the rover's solar cells and gold foil, house siding and shingles, campus brick, asphalt.
// Each returns its own repeating texture (sharing one drawn canvas), so callers can set
// `repeat` to their surface's size without changing anyone else's.
import * as THREE from 'three';
import { seeded } from '../util';

const cache = new Map<string, THREE.CanvasTexture>();

function canvasTexture(key: string, size: [number, number], draw: (c: CanvasRenderingContext2D, w: number, h: number, random: () => number) => void, colour = true) {
  const hit = cache.get(key);
  if (hit) return hit.clone();
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = size;
  draw(canvas.getContext('2d')!, size[0], size[1], seeded(key.length * 97 + size[0]));
  const texture = new THREE.CanvasTexture(canvas);
  // Colour maps are sRGB; height data (bump maps) must be read as plain numbers.
  texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  cache.set(key, texture);
  return texture.clone();
}

// Speckle: fine noise that keeps flat colour from reading as plastic.
function speckle(c: CanvasRenderingContext2D, w: number, h: number, random: () => number, amount: number, alpha: number) {
  for (let i = 0; i < amount; i += 1) {
    const shade = random() > 0.5 ? 255 : 0;
    c.fillStyle = `rgba(${shade},${shade},${shade},${random() * alpha})`;
    c.fillRect(random() * w, random() * h, 1 + random() * 2, 1 + random() * 2);
  }
}

// Solar cells: a grid of dark blue cells with silver bus lines.
export const solarCells = () => canvasTexture('solar', [512, 512], (c, w, h, random) => {
  c.fillStyle = '#c9ccd2';
  c.fillRect(0, 0, w, h);
  const cell = w / 8;
  for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) {
    const tone = 22 + random() * 10;
    c.fillStyle = `rgb(${tone},${tone + 12},${tone + 42})`;
    c.fillRect(x * cell + 3, y * cell + 3, cell - 6, cell - 6);
    c.strokeStyle = 'rgba(170,180,200,0.35)';
    c.lineWidth = 1;
    for (let line = 1; line < 4; line += 1) { c.beginPath(); c.moveTo(x * cell + 3, y * cell + (cell * line) / 4); c.lineTo(x * cell + cell - 3, y * cell + (cell * line) / 4); c.stroke(); }
  }
});

// Gold foil: crinkled multilayer insulation, bright and dark creases.
export const foil = () => canvasTexture('foil', [512, 256], (c, w, h, random) => {
  const gradient = c.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#d9a74a'); gradient.addColorStop(0.5, '#f0c96e'); gradient.addColorStop(1, '#b8862e');
  c.fillStyle = gradient;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i += 1) {
    const x = random() * w; const y = random() * h; const len = 20 + random() * 70; const a = random() * Math.PI;
    c.strokeStyle = random() > 0.5 ? 'rgba(255,240,190,0.5)' : 'rgba(90,60,15,0.35)';
    c.lineWidth = 1 + random() * 2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
  }
});

// Lap siding: horizontal boards with a shadow line under each.
export const siding = (colour: string) => canvasTexture(`siding${colour}`, [256, 256], (c, w, h, random) => {
  c.fillStyle = colour;
  c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) {
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, y + 28, w, 4);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, y, w, 3);
  }
  speckle(c, w, h, random, 1600, 0.05);
});

// Asphalt shingles: staggered tabs in a dark grey with tone variation.
export const shingles = () => canvasTexture('shingles', [256, 256], (c, w, h, random) => {
  c.fillStyle = '#2f3036';
  c.fillRect(0, 0, w, h);
  for (let row = 0; row < 8; row += 1) {
    for (let x = (row % 2) * 16 - 16; x < w; x += 32) {
      const tone = 38 + random() * 22;
      c.fillStyle = `rgb(${tone},${tone},${tone + 6})`;
      c.fillRect(x + 1, row * 32 + 1, 30, 30);
    }
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, row * 32 + 29, w, 3);
  }
  speckle(c, w, h, random, 2500, 0.12);
});

// Brick: running bond with mortar joints and per-brick colour variation.
export const brick = (base = '#9a4a3a') => canvasTexture(`brick${base}`, [256, 256], (c, w, h, random) => {
  c.fillStyle = '#c9bfae';
  c.fillRect(0, 0, w, h);
  const colour = new THREE.Color(base);
  for (let row = 0; row < 16; row += 1) {
    for (let x = (row % 2) * 16 - 16; x < w; x += 32) {
      const shade = colour.clone().offsetHSL((random() - 0.5) * 0.03, 0, (random() - 0.5) * 0.12);
      c.fillStyle = `#${shade.getHexString()}`;
      c.fillRect(x + 1, row * 16 + 1, 30, 14);
    }
  }
  speckle(c, w, h, random, 2000, 0.1);
});

// Asphalt: dark aggregate with lighter patches and a few cracks.
export const asphalt = () => canvasTexture('asphalt', [512, 512], (c, w, h, random) => {
  c.fillStyle = '#2b2c31';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i += 1) {
    c.fillStyle = `rgba(${random() > 0.5 ? '70,70,76' : '20,20,24'},${0.15 + random() * 0.2})`;
    c.beginPath(); c.ellipse(random() * w, random() * h, 30 + random() * 90, 20 + random() * 60, random() * 3, 0, Math.PI * 2); c.fill();
  }
  speckle(c, w, h, random, 9000, 0.18);
  c.strokeStyle = 'rgba(10,10,12,0.6)';
  for (let i = 0; i < 6; i += 1) {
    let x = random() * w; let y = random() * h;
    c.lineWidth = 1 + random();
    c.beginPath(); c.moveTo(x, y);
    for (let s = 0; s < 8; s += 1) { x += (random() - 0.5) * 40; y += (random() - 0.3) * 30; c.lineTo(x, y); }
    c.stroke();
  }
});

// Concrete: pale with soft blotches and form-panel lines.
export const concrete = () => canvasTexture('concrete', [256, 256], (c, w, h, random) => {
  c.fillStyle = '#a9a49a';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 20; i += 1) {
    c.fillStyle = `rgba(${random() > 0.5 ? '255,255,255' : '0,0,0'},${random() * 0.06})`;
    c.beginPath(); c.arc(random() * w, random() * h, 10 + random() * 50, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = 'rgba(0,0,0,0.12)';
  c.strokeRect(0.5, 0.5, w - 1, h - 1);
  speckle(c, w, h, random, 2500, 0.08);
});

// River water: long pale streaks along the flow, used as a bump map and slid downstream.
export const ripples = () => canvasTexture('ripples', [512, 256], (c, w, h, random) => {
  c.fillStyle = '#808080';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i += 1) {
    const x = random() * w; const y = random() * h; const len = 30 + random() * 120;
    c.strokeStyle = `rgba(${random() > 0.5 ? '255,255,255' : '0,0,0'},${0.08 + random() * 0.18})`;
    c.lineWidth = 1 + random() * 2.5;
    c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + len * 0.3, y - 3, x + len * 0.7, y + 3, x + len, y); c.stroke();
  }
}, false);
