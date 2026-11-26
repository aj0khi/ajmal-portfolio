// Boot: one renderer and camera, the director's three scenes, the scroll engine and the DOM.
// Each frame asks the director for the scene at the current journey position and renders it.
import * as THREE from 'three';
import { wireControls, wireKiosks } from './controls';
import { createDirector } from './director';
import { createScroll } from './scroll';
import { createUi } from './ui';

export function startJourney(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-journey-canvas]');
  const track = root.querySelector<HTMLElement>('[data-journey-track]');
  if (!canvas || !track) throw new Error('journey markup missing');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.3, 6000);

  // Build the world before the scroll engine: if anything here throws, nothing has hooked the
  // page's wheel, touch or keys yet, and the static fallback stays an ordinary page.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const director = createDirector(reducedMotion.matches);
  const scroll = createScroll(track, reducedMotion.matches);
  const ui = createUi(root, scroll);
  wireControls(root, director.control);
  wireKiosks(document, scroll.pause);
  // The cursor, for the rover's mast at the first stop. Only a hovering pointer counts.
  let pointer: { x: number; y: number } | null = null;
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  addEventListener('pointermove', (event) => {
    if (hover.matches) pointer = { x: (event.clientX / innerWidth) * 2 - 1, y: -((event.clientY / innerHeight) * 2 - 1) };
  }, { passive: true });
  // Motion settings are baked in at start-up; if the visitor changes them, start over.
  reducedMotion.addEventListener('change', () => location.reload());

  let width = 0;
  let height = 0;
  const resize = () => {
    width = canvas.clientWidth || innerWidth;
    height = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
  };
  resize();
  addEventListener('resize', resize);

  let last = performance.now();
  let shift = 0;
  const frame = (now: number) => {
    // The frame clock can trail performance.now() on the first frame; never step backward.
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const out = director.frame(scroll.state.p, now / 1000, dt, camera, pointer);
    const presence = ui.update(out.flash, out.km);
    // Make room for the card without re-aiming the camera: shift the projection itself,
    // right on wide screens (card on the left), up on tall ones (card at the bottom).
    shift += (presence - shift) * (1 - Math.exp(-dt * 6));
    camera.fov = out.fov;
    if (width / height >= 0.9) camera.setViewOffset(width, height, -0.17 * width * shift, 0, width, height);
    else camera.setViewOffset(width, height, 0, 0.27 * height * shift, width, height);
    camera.updateProjectionMatrix();
    // Smoke particles are sized in world units: pixels per unit at distance 1.
    // gl_PointSize is in drawing-buffer pixels, so include the pixel ratio.
    const pixelsPerUnit = (height * renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    director.smoke.material.uniforms.uScale.value = pixelsPerUnit;
    director.dust.material.uniforms.uScale.value = pixelsPerUnit;
    renderer.render(out.scene, camera);
  };

  let running = false;
  const run = (on: boolean) => {
    if (on === running) return;
    running = on;
    last = performance.now();
    renderer.setAnimationLoop(on ? frame : null);
  };
  // Render only while the journey is on screen: not in a hidden tab, not under the page below.
  let onScreen = true;
  document.addEventListener('visibilitychange', () => run(onScreen && !document.hidden));
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; run(onScreen && !document.hidden); }).observe(track);
  // Dev only (stripped from production builds): lets tests and the tuning panel read the scene.
  if (import.meta.env.DEV) Object.assign(window, { __journey: { camera, director, scroll } });
  run(true);
  root.classList.add('is-live');
}
