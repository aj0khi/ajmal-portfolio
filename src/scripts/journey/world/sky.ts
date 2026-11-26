// Time of day for the ground chapters. One number (0 pre-dawn, 1 morning, 2 dusk) blends
// the sky dome, sun, fog, street lamps and stars; altitude then drains it all to black as
// the rocket climbs. The cloud band above the horizon is the Chinook arch: a lid of cloud
// with a strip of clear amber sky under it, the weather Calgary is known for.
import * as THREE from 'three';
import { clamp, lerp, starField } from '../util';

interface Keyframe {
  top: string; horizon: string; ground: string; arch: string; archStrength: number;
  sun: string; sunIntensity: number; sunElevation: number; sunAzimuth: number;
  hemiSky: string; hemiGround: string; hemi: number; lamps: number; stars: number; fog: string;
}

// 0 pre-dawn on the street, 1 the Chinook arch at dawn, 2 morning on campus, 3 hard noon over
// the badlands, 4 dusk at the pad.
const keys: Keyframe[] = [
  { top: '#070b18', horizon: '#2a2440', ground: '#0b0a10', arch: '#1a1c2c', archStrength: 0.5, sun: '#9aa6ff', sunIntensity: 1.1, sunElevation: 0.55, sunAzimuth: 2.6, hemiSky: '#5a6a9a', hemiGround: '#221a1c', hemi: 1.3, lamps: 1, stars: 1, fog: '#1b1a2b' },
  { top: '#2c4a7c', horizon: '#f6b46a', ground: '#3b3226', arch: '#353c55', archStrength: 1, sun: '#ffc98a', sunIntensity: 2.2, sunElevation: 0.12, sunAzimuth: 0.4, hemiSky: '#a9bde0', hemiGround: '#4a3a28', hemi: 0.95, lamps: 0.25, stars: 0.1, fog: '#b9917a' },
  { top: '#4a7cbd', horizon: '#f3d3a4', ground: '#3b3226', arch: '#5a6480', archStrength: 0.45, sun: '#ffe2bd', sunIntensity: 2.7, sunElevation: 0.45, sunAzimuth: 0.7, hemiSky: '#c4d6f0', hemiGround: '#4a3a28', hemi: 1.1, lamps: 0, stars: 0, fog: '#cbbfa8' },
  { top: '#3f78c4', horizon: '#e9e2cf', ground: '#4a3a2a', arch: '#7a8298', archStrength: 0.15, sun: '#fff4e2', sunIntensity: 3.2, sunElevation: 1.05, sunAzimuth: -0.6, hemiSky: '#d2def0', hemiGround: '#5a4030', hemi: 1.2, lamps: 0, stars: 0, fog: '#d8c8ae' },
  { top: '#1b2249', horizon: '#ec7a3f', ground: '#251612', arch: '#3a2a3e', archStrength: 0.6, sun: '#ff9a5c', sunIntensity: 1.9, sunElevation: 0.1, sunAzimuth: -1.9, hemiSky: '#6a5c8e', hemiGround: '#2a1a14', hemi: 0.75, lamps: 0.7, stars: 0.25, fog: '#7c4a44' }
];
const space: Pick<Keyframe, 'top' | 'horizon' | 'ground' | 'fog'> = { top: '#000004', horizon: '#0d1638', ground: '#02030a', fog: '#05070f' };

const mixTarget = new THREE.Color();
const mixColor = (a: string, b: string, t: number, out: THREE.Color) => out.set(a).lerp(mixTarget.set(b), t);

export function createSky(scene: THREE.Scene) {
  const uniforms = {
    uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color() },
    uArch: { value: new THREE.Color() }, uArchStrength: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color() }
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1200, 48, 24),
    new THREE.ShaderMaterial({
      uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGround; uniform vec3 uArch; uniform float uArchStrength;
        uniform vec3 uSunDir; uniform vec3 uSunColor;
        varying vec3 vDir;
        void main() {
          vec3 dir = normalize(vDir);
          float h = dir.y;
          vec3 color = mix(uHorizon, uTop, smoothstep(0.0, 0.6, h));
          color = mix(color, uGround, smoothstep(0.0, -0.2, h));
          // The arch: a lid of cloud from about 9 to 40 degrees up, ragged along its lower edge.
          float ragged = sin(dir.x * 9.0 + sin(dir.z * 6.0) * 2.0) * 0.025 + sin(dir.z * 23.0 + dir.x * 4.0) * 0.012;
          float lid = smoothstep(0.15 + ragged, 0.24 + ragged, h) * (1.0 - smoothstep(0.42, 0.7, h));
          color = mix(color, uArch, lid * uArchStrength);
          float sun = max(dot(dir, uSunDir), 0.0);
          color += uSunColor * (pow(sun, 6.0) * 0.28 + pow(sun, 900.0) * 2.0) * (1.0 - lid * uArchStrength * 0.8);
          gl_FragColor = vec4(color, 1.0);
        }`
    })
  );
  dome.renderOrder = -10;
  scene.add(dome);

  const stars = starField(1800, 1100, 11);
  scene.add(stars);

  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -60;
  sun.shadow.camera.right = sun.shadow.camera.top = 60;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
  scene.add(sun, sun.target, hemi);
  scene.fog = new THREE.Fog(0x000000, 40, 280);

  const scratch = new THREE.Color();
  const state = { lamps: 0 };
  // Clouds take the colour of the light: lilac before dawn, gold in the morning, pink at dusk.
  const cloudTint = new THREE.Color();

  // `time` is 0..4 along the ground chapters; `altitude` is 0 on the ground, 1 at the cloud deck.
  const update = (time: number, altitude: number, eye: THREE.Vector3, focus: THREE.Vector3) => {
    const i = Math.min(keys.length - 2, Math.floor(clamp(time, 0, keys.length - 1.001)));
    const t = clamp(time - i);
    const a = keys[i]; const b = keys[i + 1];
    const up = clamp(altitude);
    mixColor(a.top, b.top, t, uniforms.uTop.value).lerp(scratch.set(space.top), up);
    mixColor(a.horizon, b.horizon, t, uniforms.uHorizon.value).lerp(scratch.set(space.horizon), up * up);
    mixColor(a.ground, b.ground, t, uniforms.uGround.value).lerp(scratch.set(space.ground), up);
    mixColor(a.arch, b.arch, t, uniforms.uArch.value);
    uniforms.uArchStrength.value = lerp(a.archStrength, b.archStrength, t) * (1 - up);
    mixColor(a.sun, b.sun, t, uniforms.uSunColor.value);
    const elevation = lerp(a.sunElevation, b.sunElevation, t);
    const azimuth = lerp(a.sunAzimuth, b.sunAzimuth, t);
    uniforms.uSunDir.value.set(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.sin(azimuth) * Math.cos(elevation));

    sun.color.copy(uniforms.uSunColor.value);
    sun.intensity = lerp(a.sunIntensity, b.sunIntensity, t);
    sun.position.copy(focus).addScaledVector(uniforms.uSunDir.value, 200);
    sun.target.position.copy(focus);
    hemi.color.set(a.hemiSky).lerp(scratch.set(b.hemiSky), t);
    hemi.groundColor.set(a.hemiGround).lerp(scratch.set(b.hemiGround), t);
    hemi.intensity = lerp(a.hemi, b.hemi, t);

    const fog = scene.fog as THREE.Fog;
    mixColor(a.fog, b.fog, t, fog.color).lerp(scratch.set(space.fog), up);
    fog.near = 40 + up * 400;
    fog.far = 280 + up * 3200;
    (stars.material as THREE.PointsMaterial).opacity = Math.max(lerp(a.stars, b.stars, t), up);
    state.lamps = lerp(a.lamps, b.lamps, t);
    cloudTint.copy(uniforms.uHorizon.value).lerp(scratch.set('#ffffff'), 0.45 + up * 0.4);

    dome.position.copy(eye);
    stars.position.copy(eye);
  };

  return { update, state, cloudTint, horizon: uniforms.uHorizon.value };
}
