// Small maths and texture helpers shared by every part of the journey.
import * as THREE from 'three';

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (value: number, from: number, to: number) => clamp((value - from) / (to - from));
export const smoothstep = (from: number, to: number, value: number) => { const t = range(value, from, to); return t * t * (3 - 2 * t); };
export const easeIn = (t: number, power = 2) => t ** power;
export const easeOut = (t: number, power = 3) => 1 - (1 - t) ** power;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Seeded random, so the world is laid out the same on every visit.
export const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// Value noise and fractal noise for terrain heights.
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = (x: number, y: number) => {
  const xi = Math.floor(x); const yi = Math.floor(y);
  const xf = x - xi; const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
};
export const fbm = (x: number, y: number, octaves = 4) => {
  let total = 0; let amplitude = 0.5; let frequency = 1;
  for (let i = 0; i < octaves; i += 1) { total += noise(x * frequency, y * frequency) * amplitude; amplitude *= 0.5; frequency *= 2; }
  return total;
};

// A soft round sprite, for glows, smoke and clouds.
export const softDot = (() => {
  let texture: THREE.CanvasTexture | undefined;
  return () => {
    if (texture) return texture;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    texture = new THREE.CanvasTexture(canvas);
    return texture;
  };
})();

// A star field on a sphere, drawn as fixed-size points so stars stay pin-sharp at any zoom.
export function starField(count: number, radius: number, seed = 3) {
  const random = seeded(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const u = random() * 2 - 1; const angle = random() * Math.PI * 2; const r = Math.sqrt(1 - u * u);
    positions.set([Math.cos(angle) * r * radius, u * radius, Math.sin(angle) * r * radius], i * 3);
    const brightness = 0.35 + random() ** 3 * 0.65; const warm = random() * 0.15;
    colors.set([brightness, brightness - warm * 0.3, brightness - warm], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false });
  return new THREE.Points(geometry, material);
}

// A cratered surface texture, for the Moon seen from space.
export function craterTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#8f8d88';
  context.fillRect(0, 0, width, height);
  const random = seeded(7);
  for (let i = 0; i < 260; i += 1) {
    const shade = 95 + random() * 70;
    context.fillStyle = `rgba(${shade},${shade},${shade - 4},0.35)`;
    context.beginPath();
    context.ellipse(random() * width, random() * height, 20 + random() * 120, 14 + random() * 70, random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  for (let i = 0; i < 1100; i += 1) {
    const x = random() * width; const y = random() * height; const r = random() ** 3 * 26 + 1.5;
    const shade = 80 + random() * 70;
    context.fillStyle = `rgb(${shade},${shade},${shade - 3})`;
    context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
    context.strokeStyle = 'rgba(225,223,216,0.4)';
    context.lineWidth = Math.max(1, r * 0.14);
    context.beginPath(); context.arc(x - r * 0.12, y - r * 0.12, r, Math.PI * 0.9, Math.PI * 1.75); context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// A procedural Earth: oceans, continents, ice caps and a separate cloud layer.
export function earthTextures(width = 1024, height = 512) {
  const surface = document.createElement('canvas');
  surface.width = width; surface.height = height;
  const clouds = document.createElement('canvas');
  clouds.width = width; clouds.height = height;
  const s = surface.getContext('2d')!; const c = clouds.getContext('2d')!;
  const land = s.createImageData(width, height); const sky = c.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    const lat = Math.abs(y / height - 0.5) * 2;
    for (let x = 0; x < width; x += 1) {
      const u = x / width * 6; const v = y / height * 3;
      const h = fbm(u + 11, v + 3, 5) + (1 - lat) * 0.06;
      const i = (y * width + x) * 4;
      let rgb: [number, number, number];
      if (lat > 0.86) rgb = [232, 238, 242];
      else if (h > 0.52) {
        const dry = fbm(u * 2 + 40, v * 2, 3);
        rgb = dry > 0.55 ? [176, 150, 104] : [62 + dry * 40, 104 + dry * 30, 58];
      } else rgb = [16 + h * 30, 52 + h * 70, 112 + h * 90];
      land.data.set([rgb[0], rgb[1], rgb[2], 255], i);
      const cloud = smoothstep(0.5, 0.72, fbm(u * 1.7 + 5, v * 2.4 + 9, 5));
      sky.data.set([255, 255, 255, cloud * 230], i);
    }
  }
  s.putImageData(land, 0, 0); c.putImageData(sky, 0, 0);
  const map = new THREE.CanvasTexture(surface); map.colorSpace = THREE.SRGBColorSpace;
  const cloudMap = new THREE.CanvasTexture(clouds); cloudMap.colorSpace = THREE.SRGBColorSpace;
  return { map, cloudMap };
}

// A thin glowing shell, brighter at the rim, for Earth's atmosphere.
export function atmosphere(radius: number, color: THREE.ColorRepresentation, power = 3.2, strength = 1.4) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uStrength: { value: strength } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal; varying vec3 vView;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uPower; uniform float uStrength;
      varying vec3 vNormal; varying vec3 vView;
      void main() {
        float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), uPower);
        gl_FragColor = vec4(uColor * rim * uStrength, rim);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), material);
}
