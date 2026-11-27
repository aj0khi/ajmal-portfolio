// Street banners for the teams, hackathons and businesses on the journey. Each carries the
// organisation's own logo (used with their permission; see CREDITS.md). Chinook Clean has no
// logo yet, so its banner keeps a simple mark drawn for this site, as does any banner whose
// logo hasn't loaded.
import * as THREE from 'three';

type Mark = (c: CanvasRenderingContext2D, x: number, y: number, s: number) => void;

const marks: Record<string, Mark> = {
  // A three-link arm on a base.
  arm: (c, x, y, s) => {
    c.lineWidth = s * 0.09; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - s * 0.35, y + s * 0.35); c.lineTo(x - s * 0.1, y - s * 0.15); c.lineTo(x + s * 0.3, y - s * 0.3); c.lineTo(x + s * 0.38, y); c.stroke();
    [[x - s * 0.1, y - s * 0.15], [x + s * 0.3, y - s * 0.3]].forEach(([jx, jy]) => { c.beginPath(); c.arc(jx, jy, s * 0.08, 0, Math.PI * 2); c.fill(); });
    c.fillRect(x - s * 0.5, y + s * 0.33, s * 0.32, s * 0.08);
  },
  // A rocker-bogie rover in profile.
  rover: (c, x, y, s) => {
    c.lineWidth = s * 0.06;
    c.strokeRect(x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.2);
    c.beginPath(); c.moveTo(x - s * 0.4, y + s * 0.2); c.lineTo(x - s * 0.05, y - s * 0.08); c.lineTo(x + s * 0.4, y + s * 0.2); c.moveTo(x - s * 0.05, y - s * 0.08); c.lineTo(x + s * 0.05, y + s * 0.2); c.stroke();
    [-0.4, 0.05, 0.4].forEach((dx) => { c.beginPath(); c.arc(x + dx * s, y + s * 0.26, s * 0.1, 0, Math.PI * 2); c.fill(); });
  },
  // A padlock.
  lock: (c, x, y, s) => {
    c.lineWidth = s * 0.08;
    c.beginPath(); c.arc(x, y - s * 0.1, s * 0.2, Math.PI, 0); c.stroke();
    c.fillRect(x - s * 0.3, y - s * 0.1, s * 0.6, s * 0.45);
    c.save(); c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(x, y + s * 0.07, s * 0.06, 0, Math.PI * 2); c.fill(); c.fillRect(x - s * 0.025, y + s * 0.07, s * 0.05, s * 0.14);
    c.restore();
  },
  // A planet with an orbit and a moon.
  orbit: (c, x, y, s) => {
    c.beginPath(); c.arc(x, y, s * 0.18, 0, Math.PI * 2); c.fill();
    c.lineWidth = s * 0.04;
    c.beginPath(); c.ellipse(x, y, s * 0.42, s * 0.16, -0.4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(x + s * 0.38, y - s * 0.17, s * 0.06, 0, Math.PI * 2); c.fill();
  },
  // Code brackets.
  code: (c, x, y, s) => {
    c.font = `800 ${Math.round(s * 0.62)}px "Big Shoulders", "Arial Narrow", sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('</>', x, y);
  },
  // A game controller.
  controller: (c, x, y, s) => {
    c.beginPath(); c.roundRect(x - s * 0.42, y - s * 0.18, s * 0.84, s * 0.38, s * 0.18); c.fill();
    c.save(); c.globalCompositeOperation = 'destination-out';
    c.fillRect(x - s * 0.3, y - s * 0.02, s * 0.18, s * 0.06); c.fillRect(x - s * 0.24, y - s * 0.08, s * 0.06, s * 0.18);
    [[0.2, -0.04], [0.3, 0.06]].forEach(([dx, dy]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, s * 0.045, 0, Math.PI * 2); c.fill(); });
    c.restore();
  },
  // A water drop under the Chinook arch.
  drop: (c, x, y, s) => {
    c.lineWidth = s * 0.05;
    c.beginPath(); c.arc(x, y + s * 0.1, s * 0.45, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.beginPath(); c.moveTo(x, y - s * 0.2); c.bezierCurveTo(x + s * 0.24, y + s * 0.08, x + s * 0.18, y + s * 0.32, x, y + s * 0.32); c.bezierCurveTo(x - s * 0.18, y + s * 0.32, x - s * 0.24, y + s * 0.08, x, y - s * 0.2); c.fill();
  },
  // Half snowflake, half flame: heating and cooling.
  hvac: (c, x, y, s) => {
    c.lineWidth = s * 0.05; c.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) { const a = (i / 3) * Math.PI + Math.PI / 2; c.beginPath(); c.moveTo(x - s * 0.18 + Math.cos(a) * s * 0.26, y + Math.sin(a) * s * 0.26); c.lineTo(x - s * 0.18 - Math.cos(a) * s * 0.26, y - Math.sin(a) * s * 0.26); c.stroke(); }
    c.beginPath(); c.moveTo(x + s * 0.22, y - s * 0.3); c.bezierCurveTo(x + s * 0.45, y - s * 0.02, x + s * 0.4, y + s * 0.28, x + s * 0.22, y + s * 0.28); c.bezierCurveTo(x + s * 0.04, y + s * 0.28, x + s * 0.02, y + s * 0.02, x + s * 0.22, y - s * 0.3); c.fill();
  }
};

export interface BannerSpec {
  name: string;
  colour: string;
  mark: keyof typeof marks;
  logo?: string;
  /** The logo already spells out the name, so the banner gives it the whole face. */
  logoHasName?: boolean;
}

export const banners: BannerSpec[] = [
  { name: 'WayBionic Robotics', colour: '#3b3266', mark: 'arm', logo: '/journey/logos/waybionic.webp' },
  { name: 'Schulich Space Rover Team', colour: '#8f2f24', mark: 'rover', logo: '/journey/logos/ssrt.webp' },
  { name: 'UCalgary Cybersecurity Club', colour: '#3a2d4c', mark: 'lock', logo: '/journey/logos/cybersecurity-club.webp' },
  { name: 'NASA Space Apps Calgary', colour: '#16204a', mark: 'orbit', logo: '/journey/logos/nasa-space-apps.webp', logoHasName: true },
  { name: 'Hack the Change', colour: '#1f5a5c', mark: 'code', logo: '/journey/logos/hack-the-change.webp' },
  { name: 'MRUHacks', colour: '#1d1b2e', mark: 'controller', logo: '/journey/logos/mruhacks.webp' },
  { name: 'Chinook Clean', colour: '#2c5f86', mark: 'drop' },
  { name: 'HVAC Express', colour: '#1f2328', mark: 'hvac', logo: '/journey/logos/hvac-express.webp', logoHasName: true }
];

// Fit an image inside a box, centred, keeping its proportions.
function contain(c: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale; const dh = image.naturalHeight * scale;
  c.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// One banner face: the colour field, a thin border, the logo (or emblem), and the name. Drawn
// at 1.5x on a 256 x 512 layout, so logos stay crisp at the banner's size on screen.
const SCALE = 1.5;
export function bannerTexture(spec: BannerSpec) {
  const canvas = document.createElement('canvas');
  canvas.width = 256 * SCALE; canvas.height = 512 * SCALE;
  const c = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const logo = spec.logo ? new Image() : null;
  const draw = () => {
    c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    c.clearRect(0, 0, 256, 512);
    c.fillStyle = spec.colour;
    c.fillRect(0, 0, 256, 512);
    c.strokeStyle = 'rgba(243,238,228,0.55)'; c.lineWidth = 4;
    c.strokeRect(14, 14, 228, 484);
    c.fillStyle = '#f3eee4'; c.strokeStyle = '#f3eee4';
    const ready = logo && logo.complete && logo.naturalWidth > 0;
    if (ready && spec.logoHasName) { contain(c, logo, 30, 60, 196, 392); texture.needsUpdate = true; return; }
    if (ready) contain(c, logo, 34, 56, 188, 228);
    else marks[spec.mark](c, 128, 170, 190);
    c.font = '800 44px "Big Shoulders", "Arial Narrow", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    // Wrap the name onto as many lines as it needs.
    const words = spec.name.split(' '); const lines: string[] = [];
    words.forEach((word) => { const last = lines[lines.length - 1]; if (last && c.measureText(`${last} ${word}`).width < 200) lines[lines.length - 1] = `${last} ${word}`; else lines.push(word); });
    lines.forEach((line, i) => c.fillText(line, 128, 340 + i * 46));
    texture.needsUpdate = true;
  };
  draw();
  document.fonts?.load('800 44px "Big Shoulders"').then(draw, () => undefined);
  if (logo) { logo.decoding = 'async'; logo.onload = draw; logo.src = spec.logo!; }
  return texture;
}

// A pole carrying banners on arms to either side (one or two), gently swaying. Returns the
// group and its update.
export function bannerPole(specs: BannerSpec[]) {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: '#3a3a40', metalness: 0.6, roughness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 6.6, 10), steel);
  pole.position.y = 3.3;
  pole.castShadow = true;
  group.add(pole);
  const W = 1.1; const H = 2.2;
  const cloths = specs.map((spec, i) => {
    const side = specs.length === 1 ? 1 : i === 0 ? -1 : 1;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.07, 0.07), steel);
    arm.position.set(side * (W / 2 + 0.1), 6.1, 0);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(W, H, 6, 10), new THREE.MeshStandardMaterial({ map: bannerTexture(spec), side: THREE.DoubleSide, roughness: 0.85 }));
    cloth.position.set(side * (W / 2 + 0.15), 6.05 - H / 2, 0);
    cloth.castShadow = true;
    group.add(arm, cloth);
    const positions = cloth.geometry.attributes.position as THREE.BufferAttribute;
    return { positions, base: Float32Array.from(positions.array as Float32Array), phase: Math.random() * 10 };
  });
  return {
    group,
    // A slow ripple, stronger toward each banner's free bottom edge.
    update(time: number) {
      cloths.forEach(({ positions, base, phase }) => {
        for (let i = 0; i < positions.count; i += 1) {
          const x = base[i * 3]; const y = base[i * 3 + 1];
          const free = (H / 2 - y) / H;
          positions.setZ(i, Math.sin(time * 1.6 + x * 2.4 + y * 1.3 + phase) * 0.1 * free);
        }
        positions.needsUpdate = true;
      });
    }
  };
}
