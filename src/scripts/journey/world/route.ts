// Roads and the land around them. A road is a spline the rover follows, measured in metres,
// with fast "how far am I from the road, and how far along it" lookups for the terrain,
// trees and props. The Earth road also decides the landscape: which chapter (biome) each
// place belongs to, how hilly it is, and where ridges hide the next stop.
import * as THREE from 'three';
import { fbm, smoothstep } from '../util';

export type RoadFrame = { position: THREE.Vector3; forward: THREE.Vector3; right: THREE.Vector3 };
const UP = new THREE.Vector3(0, 1, 0);

export function makeRoad(points: [number, number][], sampleCount = 600) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const length = curve.getLength();
  const samples = curve.getSpacedPoints(sampleCount);
  const spacing = length / sampleCount;
  // Every road here runs steadily toward -z, so samples are already sorted by z (descending):
  // a binary search finds the nearest stretch without scanning the whole road.
  const nearest = (x: number, z: number) => {
    let lo = 0; let hi = samples.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (samples[mid].z > z) lo = mid; else hi = mid; }
    let best = Infinity; let bestIndex = lo;
    for (const step of [-1, 1]) {
      for (let i = step < 0 ? lo : hi; i >= 0 && i < samples.length; i += step) {
        const dz = samples[i].z - z;
        if (dz * dz > best) break;
        const dx = samples[i].x - x;
        const d = dx * dx + dz * dz;
        if (d < best) { best = d; bestIndex = i; }
      }
    }
    return { distance: Math.sqrt(best), metres: bestIndex * spacing };
  };
  const u = (metres: number) => Math.min(1, Math.max(0, (metres < 0 ? length + metres : metres) / length));
  const frameAt = (t: number, out: RoadFrame = { position: new THREE.Vector3(), forward: new THREE.Vector3(), right: new THREE.Vector3() }) => {
    const clamped = Math.min(1, Math.max(0, t));
    curve.getPointAt(clamped, out.position);
    curve.getTangentAt(clamped, out.forward).setY(0).normalize();
    out.right.crossVectors(out.forward, UP).normalize();
    return out;
  };
  // A point beside the road: `side` metres to the right (negative: left), `along` further on.
  const beside = (metres: number, side: number, along = 0) => {
    const frame = frameAt(u(metres));
    return frame.position.addScaledVector(frame.right, side).addScaledVector(frame.forward, along);
  };
  return { curve, length, nearest, u, frameAt, beside };
}

export type Road = ReturnType<typeof makeRoad>;

// ---------- The Earth road and its landscape ----------

export const ROAD_WIDTH = 5;

export const earthRoad = makeRoad([
  [0, 12], [0, -18], [10, -48], [14, -80], [2, -112], [-16, -140], [-24, -175], [-12, -210], [10, -240],
  [22, -272], [16, -305], [0, -335], [-14, -365], [-16, -400], [-4, -432], [14, -462], [24, -495], [18, -530],
  [0, -560], [-18, -592], [-24, -628], [-10, -662], [2, -690]
]);

// Chapters by metres along the road. Each blends into the next over `blend` metres.
export const biomes = [
  { name: 'street', from: 0, grass: '#5d7744', dry: '#8c8a55', amplitude: 16 },
  { name: 'foothills', from: 150, grass: '#7a7a48', dry: '#a8935c', amplitude: 70 },
  { name: 'campus', from: 270, grass: '#527a3e', dry: '#7a8a50', amplitude: 12 },
  { name: 'badlands', from: 515, grass: '#b2673f', dry: '#d3a072', amplitude: 46 },
  { name: 'prairie', from: 690, grass: '#a8935a', dry: '#c4ad6c', amplitude: 14 }
] as const;
const BLEND = 30;

// How much of each chapter a point belongs to, from where it sits along the road.
export const biomeWeights = (metres: number) => biomes.map((biome, i) => {
  const next = biomes[i + 1];
  const entered = i === 0 ? 1 : smoothstep(biome.from - BLEND, biome.from + BLEND, metres);
  const left = next ? smoothstep(next.from - BLEND, next.from + BLEND, metres) : 0;
  return entered * (1 - left);
});

export interface Flat { at: THREE.Vector3; radius: number }
export interface Ridge { at: THREE.Vector3; radius: number; height: number }

// Hills rise only away from the road and the sites; ridges sit inside bends so the road
// curls around them and the next stop stays hidden until you round it.
export function createLand(flats: Flat[], ridges: Ridge[], board: { centre: THREE.Vector3; width: number; depth: number }) {
  const heightAt = (x: number, z: number) => {
    const { distance, metres } = earthRoad.nearest(x, z);
    let mask = smoothstep(ROAD_WIDTH + 2, 22, distance);
    for (const flat of flats) mask *= smoothstep(flat.radius * 0.75, flat.radius * 1.3, Math.hypot(x - flat.at.x, z - flat.at.z));
    if (mask <= 0) return 0;
    const weights = biomeWeights(metres);
    const amplitude = weights.reduce((sum, w, i) => sum + w * biomes[i].amplitude, 0);
    let h = (fbm(x * 0.011 + 3, z * 0.011 + 7, 4) - 0.3) * amplitude * 1.6 + fbm(x * 0.05, z * 0.05, 2) * 5;
    for (const ridge of ridges) h += ridge.height * Math.exp(-((Math.hypot(x - ridge.at.x, z - ridge.at.z) / ridge.radius) ** 2));
    // Badlands: the hills step into flat-topped terraces, like the coulees east of Calgary.
    const badlands = weights[3];
    if (badlands > 0 && h > 0) h = h * (1 - badlands) + (Math.floor(h / 7) * 7 + (h % 7) * 0.25) * badlands;
    const edge = 1 - smoothstep(0.36, 0.5, Math.max(Math.abs(x - board.centre.x) / board.width, Math.abs(z - board.centre.z) / board.depth));
    return Math.max(0, h) * mask * edge;
  };
  return { heightAt };
}
