// Generates the AjmalOS icon set: one shared Win97 bevel tile, one glyph per app.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons', 'app');
mkdirSync(outDir, { recursive: true });

const W = '#ffffff';
const Y = '#ffe066';
const D = '#0b1f2a';

const star = (cx, cy, r, fill) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 ? r * 0.45 : r;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`;
  });
  return `<polygon points="${points.join(' ')}" fill="${fill}"/>`;
};

const rotated = (count, build) =>
  Array.from({ length: count }, (_, i) => `<g transform="rotate(${(360 / count) * i} 24 24)">${build(i)}</g>`).join('');

// Glyphs are drawn on a 48x48 grid. `a` is the light accent for the app.
const glyphs = {
  portfolio: (a) => `<path d="M6 12h13l4 4h19v24H6z" fill="${Y}"/><path d="M6 21h36v19H6z" fill="#fff3b0"/>${star(24, 30.5, 6.5, a)}`,
  waybionic: (a) => `<rect x="7" y="38" width="22" height="5" fill="${W}"/><path d="M14 38 20 21 34 15" stroke="${W}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="14" cy="38" r="4.5" fill="${Y}"/><circle cx="20" cy="21" r="4.2" fill="${Y}"/><circle cx="34" cy="15" r="3.4" fill="${a}"/><path d="m36 14 6-3m-6 4 5 5" stroke="${W}" stroke-width="2.6" stroke-linecap="round"/>`,
  blackbox: (a) => `<rect x="7" y="12" width="34" height="26" rx="2" fill="#141414" stroke="${W}" stroke-width="2"/><rect x="7" y="12" width="34" height="7" fill="#ff7a1a"/><circle cx="24" cy="28" r="3.6" fill="${W}"/><rect x="22.6" y="29" width="2.8" height="6" fill="${W}"/><rect x="9" y="40" width="7" height="4" fill="${Y}"/><rect x="19" y="40" width="7" height="4" fill="${a}"/><rect x="29" y="40" width="7" height="4" fill="${Y}"/>`,
  rover: (a) => `<rect x="8" y="21" width="28" height="11" rx="2" fill="${W}"/><rect x="14" y="14" width="13" height="8" rx="1.5" fill="${a}"/><circle cx="14" cy="35" r="5" fill="#1d1d1d" stroke="${W}" stroke-width="1.8"/><circle cx="31" cy="35" r="5" fill="#1d1d1d" stroke="${W}" stroke-width="1.8"/><path d="m30 21 4-9" stroke="${W}" stroke-width="1.8"/><circle cx="34.5" cy="10.5" r="2.4" fill="${Y}"/><path d="M39 24q4 3 0 8M42 21q7 6 0 14" stroke="${Y}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  resume: (a) => `<path d="M11 5h19l8 8v30H11z" fill="${W}"/><path d="M30 5v8h8z" fill="#cdd6e8"/><circle cx="19" cy="21" r="3.5" fill="${a}"/><rect x="25" y="19" width="9" height="2.4" fill="#9aa9c8"/><rect x="25" y="23" width="7" height="2.4" fill="#9aa9c8"/><rect x="15" y="30" width="19" height="2.4" fill="#9aa9c8"/><rect x="15" y="35" width="15" height="2.4" fill="#9aa9c8"/>`,
  about: (a) => `<circle cx="24" cy="15" r="7.5" fill="${W}"/><path d="M9 41c0-9.5 6.5-15 15-15s15 5.500 15 15z" fill="${W}"/>${star(37, 12, 5.5, Y)}<circle cx="24" cy="15" r="3" fill="${a}" opacity=".35"/>`,
  browser: (a) => `<circle cx="24" cy="24" r="16" fill="${a}" fill-opacity=".28" stroke="${W}" stroke-width="2.6"/><ellipse cx="24" cy="24" rx="7" ry="16" fill="none" stroke="${W}" stroke-width="1.8"/><path d="M8 24h32M10 16.500h28M10 31.500h28" stroke="${W}" stroke-width="1.6" fill="none"/><circle cx="36" cy="12" r="3" fill="${Y}"/>`,
  calculator: (a) => `<rect x="11" y="5" width="26" height="38" rx="2.500" fill="${W}"/><rect x="14" y="8" width="20" height="9" fill="#173a2a"/><rect x="26" y="10" width="6" height="2.600" fill="#66ff88"/>${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${14 + c * 7}" y="${21 + r * 7}" width="5" height="5" fill="${r === 2 && c === 2 ? Y : a}"/>`)).join('')}`,
  recycle: (a) => `<path d="M12 14h24l-2.200 28H14.200z" fill="${W}"/><rect x="9" y="9.500" width="30" height="4.500" fill="${a}"/><path d="M19 9.500V6h10v3.500" stroke="${W}" stroke-width="2.500" fill="none"/><path d="M19.500 19v18M24 19v18M28.500 19v18" stroke="#9aa9c8" stroke-width="1.800"/>`,
  system: (a) => `<rect x="7" y="7" width="34" height="26" rx="2" fill="${W}"/><rect x="10" y="10" width="28" height="20" fill="#16305c"/><circle cx="24" cy="15.500" r="2" fill="${W}"/><rect x="22.500" y="19.500" width="3" height="8" fill="${W}"/><path d="M19 33h10v5h8v3H11v-3h8z" fill="${a}"/>`,
  work: (a) => `<rect x="7" y="16" width="34" height="23" rx="3" fill="${W}"/><path d="M18 16v-4.500h12V16" stroke="${W}" stroke-width="3" fill="none"/><path d="M7 27h34" stroke="${a}" stroke-width="2.200"/><rect x="21" y="24.500" width="6" height="5.500" fill="${Y}"/>`,
  skills: (a) => `${rotated(8, () => `<rect x="21.500" y="5" width="5" height="7.500" fill="${W}"/>`)}<circle cx="24" cy="24" r="12" fill="${W}"/><circle cx="24" cy="24" r="5" fill="${a}"/>`,
  research: (a) => `${rotated(3, (i) => `<ellipse cx="24" cy="24" rx="17" ry="6.500" fill="none" stroke="${i === 1 ? Y : W}" stroke-width="2" transform="rotate(${i * 0} 24 24)"/>`)}<circle cx="24" cy="24" r="3.800" fill="${a}"/>`,
  notes: (a) => `<rect x="10" y="9" width="28" height="33" rx="1.500" fill="#fff4bd"/>${[14, 19.500, 25, 30.500, 36].map((y) => `<rect x="14" y="${y + 2}" width="20" height="1.800" fill="${a}" opacity=".8"/>`).join('')}${[15, 20, 25, 30, 35].map((x) => `<circle cx="${x}" cy="9" r="2.200" fill="#3a3a3a" stroke="${W}" stroke-width="1"/>`).join('')}<path d="m33 38 8-9" stroke="${Y}" stroke-width="3.500" stroke-linecap="round"/>`,
  terminal: () => `<rect x="5" y="9" width="38" height="30" fill="#0a0a0a" stroke="${W}" stroke-width="2"/><rect x="5" y="9" width="38" height="6" fill="${W}"/><path d="m11 22 7 5.500L11 33" stroke="#66ff88" stroke-width="2.800" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="21" y="32" width="9" height="2.800" fill="#66ff88"/>`,
  media: (a) => `<rect x="6" y="9" width="36" height="26" rx="2" fill="#16182c" stroke="${W}" stroke-width="2.200"/><path d="M20 15.500 33 22l-13 6.500z" fill="${W}"/><rect x="14" y="38" width="20" height="3.500" fill="${a}"/><circle cx="11" cy="14" r="1.400" fill="${Y}"/>`,
  restore: (a) => `<circle cx="26" cy="25" r="13" fill="${a}" fill-opacity=".35" stroke="${W}" stroke-width="2.600"/><path d="M26 17v8.500l6 3.500" stroke="${W}" stroke-width="2.600" fill="none" stroke-linecap="round"/><path d="M8.500 19A18 18 0 0 1 22 7.500" stroke="${Y}" stroke-width="3.200" fill="none" stroke-linecap="round"/><path d="m17.500 3.500 6 4.200-5 5" stroke="${Y}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  hvacsim: (a) => `<circle cx="24" cy="24" r="19" fill="none" stroke="${a}" stroke-width="2.200"/>${rotated(4, () => `<ellipse cx="24" cy="14" rx="5.500" ry="9" fill="${W}"/>`)}<circle cx="24" cy="24" r="3.800" fill="${Y}"/>`,
  rosgraph: (a) => `<path d="M12 35 24 13l12 22M12 35h24" stroke="${a}" stroke-width="2.400" fill="none"/><circle cx="24" cy="13" r="5.500" fill="${W}"/><circle cx="12" cy="35" r="5.500" fill="${W}"/><circle cx="36" cy="35" r="5.500" fill="${Y}"/><circle cx="24" cy="13" r="2" fill="${a}"/>`,
  monitor: () => `<rect x="5" y="8" width="38" height="30" fill="#0a1a12" stroke="${W}" stroke-width="2"/><path d="M5 17h38" stroke="${W}" stroke-width="1"/><path d="M9 31l6-8 5 6 6-12 5 9 5-5 4 5" stroke="#66ff88" stroke-width="2.200" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22v13M24 22v13M36 22v13" stroke="#66ff88" stroke-opacity=".25"/>`,
  oldarm: (a) => `${[14, 24, 34].map((y, i) => `<rect x="7" y="${y - 1.500}" width="34" height="3" fill="${W}" opacity=".9"/><rect x="${[26, 14, 31][i]}" y="${y - 5}" width="7" height="10" rx="1" fill="${i === 1 ? Y : a}" stroke="${W}" stroke-width="1.400"/>`).join('')}`,
  filesystem: (a) => `<rect x="10" y="6" width="28" height="36" rx="1.500" fill="${W}"/><rect x="13" y="9.500" width="22" height="13" fill="${a}"/><rect x="13" y="25.500" width="22" height="13" fill="${a}"/><rect x="20" y="14.500" width="8" height="2.600" fill="${D}"/><rect x="20" y="30.500" width="8" height="2.600" fill="${D}"/>`,
  chinook: (a) => `<path d="M24 5c8 10 12.500 15.500 12.500 22a12.500 12.500 0 0 1-25 0C11.500 20.500 16 15 24 5z" fill="${a}"/><path d="M17 28a7.500 7.500 0 0 0 5 7" stroke="${W}" stroke-width="2.600" fill="none" stroke-linecap="round"/>${star(38, 11, 5, Y)}${star(10, 38, 3.500, W)}`,
  teachgame: (a) => `<path d="M12 14h24c4 0 7 3 8 7l2.500 11c.8 4-4 6.500-6.500 3.500L35 29H13l-5 6.500c-2.500 3-7.300.5-6.500-3.500L4 21c1-4 4-7 8-7z" fill="${W}"/><rect x="11" y="19.500" width="9" height="3" fill="${a}"/><rect x="14" y="16.500" width="3" height="9" fill="${a}"/><circle cx="33" cy="20" r="2.500" fill="${Y}"/><circle cx="38" cy="24.500" r="2.500" fill="#ff6b6b"/>`,
  soccerlab: () => `<circle cx="24" cy="24" r="16.500" fill="${W}" stroke="#1d1d1d" stroke-width="2"/><polygon points="24,16.500 31,21.500 28.300,29.500 19.700,29.500 17,21.500" fill="#1d1d1d"/><path d="M24 16.500V8.500M31 21.500l7.500-2.500M28.300 29.500l4.700 6.500M19.700 29.500 15 36M17 21.500 9.500 19" stroke="#1d1d1d" stroke-width="1.800"/>`,
  ask: (a) => `<rect x="6" y="7" width="36" height="25" rx="4" fill="${W}"/><path d="m15 32-2.500 9 11-9z" fill="${W}"/><path d="M19 16.500a5.200 5.200 0 1 1 7.300 4.800c-1.500.8-2.300 1.600-2.300 3.200v.8" stroke="${a}" stroke-width="3.200" fill="none" stroke-linecap="round"/><circle cx="24" cy="28.200" r="2" fill="${a}"/>`,
  mail: (a) => `<rect x="5" y="11" width="38" height="27" rx="2" fill="${W}"/><path d="m5.500 13 18.500 15L42.500 13" stroke="${a}" stroke-width="2.800" fill="none" stroke-linejoin="round"/><path d="M5.500 37.500 18 25m24.500 12.500L30 25" stroke="#9aa9c8" stroke-width="1.600"/>`,
  mines: () => `<circle cx="24" cy="24" r="10.500" fill="#141414" stroke="${W}" stroke-width="1.800"/>${rotated(8, () => `<path d="M24 11.500V5" stroke="${W}" stroke-width="3.200" stroke-linecap="round"/>`)}<circle cx="20.500" cy="20.500" r="3" fill="${W}"/>`,
  github: (a) => `<path d="M14 10v26M14 25c8 0 14-3 14-12" stroke="${W}" stroke-width="3" fill="none"/><circle cx="14" cy="10" r="5" fill="${a}" stroke="${W}" stroke-width="2.200"/><circle cx="14" cy="38" r="5" fill="${a}" stroke="${W}" stroke-width="2.200"/><circle cx="28" cy="12" r="5" fill="${Y}" stroke="${W}" stroke-width="2.200"/>`,
  programs: (a) => `<path d="M5 12h14l4 4h20v25H5z" fill="${Y}"/>${[0, 1].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${11 + c * 10}" y="${21 + r * 10}" width="7" height="7" fill="${W}" stroke="${a}" stroke-width="1.200"/>`)).join('')}`
};

// Light/dark panel gradient per app.
const palettes = {
  portfolio: ['#3a63c9', '#13296b', '#9bd2ff'],
  waybionic: ['#1fa1ad', '#08454d', '#9ff3f0'],
  blackbox: ['#b97a1a', '#4d2e05', '#ffc866'],
  rover: ['#2d7ad6', '#0f2f66', '#a8d4ff'],
  resume: ['#2f9f55', '#0f4a25', '#baf3c9'],
  about: ['#4a5fd1', '#1a2370', '#b9c4ff'],
  browser: ['#2b8fd9', '#0e3d6e', '#a6dcff'],
  calculator: ['#6b7b8c', '#2a3541', '#cfe0f0'],
  recycle: ['#4e9a8a', '#173f37', '#b8f0e0'],
  system: ['#3d6bd0', '#14296a', '#a9c4ff'],
  work: ['#6a7a93', '#262f42', '#d0dcf5'],
  skills: ['#1f9aa4', '#094148', '#a4f0ee'],
  research: ['#7d52c9', '#33206d', '#d6bcff'],
  notes: ['#c4901f', '#59390a', '#ffd988'],
  terminal: ['#4a5560', '#14181d', '#b6c4d2'],
  media: ['#7a4fc2', '#2e1a66', '#d7bfff'],
  restore: ['#1f9aa4', '#094148', '#a4f0ee'],
  hvacsim: ['#2aa0d8', '#0b3f66', '#b4e6ff'],
  rosgraph: ['#1fa1ad', '#08454d', '#9ff3f0'],
  monitor: ['#2f9f55', '#0f4a25', '#baf3c9'],
  oldarm: ['#1fa1ad', '#08454d', '#9ff3f0'],
  filesystem: ['#5a7099', '#202d47', '#c8d8f7'],
  chinook: ['#1b9fd1', '#073f5e', '#b0ecff'],
  teachgame: ['#7d52c9', '#33206d', '#d6bcff'],
  soccerlab: ['#2f9f55', '#0f4a25', '#baf3c9'],
  ask: ['#3a63c9', '#13296b', '#9bd2ff'],
  mail: ['#2d7ad6', '#0f2f66', '#a8d4ff'],
  mines: ['#c4473a', '#5f1b14', '#ffb3a8'],
  github: ['#4d5864', '#14181d', '#c9d4df'],
  programs: ['#1f9aa4', '#094148', '#a4f0ee']
};

const tile = (id, [light, dark, accent]) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${id}">
<defs>
<linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="d" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="1.6" stdDeviation=".7" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="64" height="64" fill="#c0c0c0"/>
<path d="M0 0h64v1H1v63H0z" fill="#fff"/><path d="M64 64H0v-1h63V0h1z" fill="#000"/>
<path d="M1 1h62v1H2v61H1z" fill="#dfdfdf"/><path d="M63 63H1v-1h61V1h1z" fill="#808080"/>
<rect x="7" y="7" width="50" height="50" fill="url(#p)"/>
<path d="M7 57V7h50" fill="none" stroke="#404040" stroke-width="1.500"/><path d="M57 7v50H7" fill="none" stroke="#fff" stroke-width="1.500" stroke-opacity=".85"/>
<rect x="8" y="8" width="48" height="22" fill="url(#s)"/>
<g transform="translate(8 8)" filter="url(#d)">${glyphs[id](accent)}</g>
</svg>
`;

for (const id of Object.keys(glyphs)) {
  writeFileSync(join(outDir, `${id}.svg`), tile(id, palettes[id]));
}
console.log(`Wrote ${Object.keys(glyphs).length} icons to ${outDir}`);
