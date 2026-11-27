// Boot: one renderer and camera, the director's three scenes, the scroll engine and the DOM.
// Each frame asks the director for the scene at the current journey position and renders it.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { wireControls, wireKiosks } from './controls';
import { createDirector } from './director';
import { createPost } from './post';
import { frameWatch, guessTier, tierNames, tiers, type Tier } from './quality';
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
  // A soft studio environment, so the rover's metal and the glass have something to reflect.
  // Kept faint: the sun and sky do the lighting; space gets none, so its night sides stay black.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  const [earthScene, , moonScene] = director.scenes;
  earthScene.environment = moonScene.environment = environment;
  earthScene.environmentIntensity = 0.3;
  moonScene.environmentIntensity = 0.08;
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
  let post: ReturnType<typeof createPost> | null = null;
  const start = guessTier();
  let tier: Tier = start.tier;
  const resize = () => {
    width = canvas.clientWidth || innerWidth;
    height = canvas.clientHeight || innerHeight;
    const ratio = Math.min(devicePixelRatio, tiers[tier].pixelRatio);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    post?.setSize(width, height, ratio);
    camera.aspect = width / height;
  };
  const applyTier = () => {
    const settings = tiers[tier];
    if (renderer.shadowMap.enabled !== settings.shadows) {
      renderer.shadowMap.enabled = settings.shadows;
      // Shadow support is compiled into each material's shader, so they all rebuild once.
      director.scenes.forEach((scene) => scene.traverse((object) => {
        const material = (object as THREE.Mesh).material;
        (Array.isArray(material) ? material : material ? [material] : []).forEach((m) => { m.needsUpdate = true; });
      }));
    }
    if (settings.post && !post) post = createPost(renderer);
    if (!settings.post && post) { post.dispose(); post = null; }
    root.dataset.quality = tierNames[tier];
    resize();
  };
  applyTier();
  addEventListener('resize', resize);
  const watch = start.pinned ? null : frameWatch(() => { if (tier > 0) { tier = (tier - 1) as Tier; applyTier(); } });

  // Reduced motion: no drives between stops. The scene shows the last stop reached and cuts to
  // the next one as its card comes up (so scene and card change together), with a short fade
  // instead of the camera travelling. Fades are at least 350 ms apart, so a fast scroll across
  // several stops never strobes.
  const cuts = reducedMotion.matches;
  let shown = -1;
  let fadedAt = -Infinity;
  const heldStop = () => {
    const time = scroll.timeline.time();
    let stop = 0;
    // 0.28 is where ui.ts makes a card live (more than half shown).
    scroll.dwellTimes.forEach(([arrive], i) => { if (time > arrive - 0.28) stop = i; });
    return stop;
  };

  let last = performance.now();
  let shift = 0;
  let focus = 0.45;
  const subject = new THREE.Vector3();
  const frame = (now: number) => {
    // The frame clock can trail performance.now() on the first frame; never step backward.
    const elapsed = Math.max(0, (now - last) / 1000);
    const dt = Math.min(0.05, elapsed);
    last = now;
    watch?.sample(elapsed);
    const p = cuts ? heldStop() : scroll.state.p;
    if (cuts && p !== shown) {
      // Up from dark rather than from transparent, so the poster under the canvas never shows.
      if (shown >= 0 && now - fadedAt > 350) {
        canvas.animate([{ filter: 'brightness(0.4)' }, { filter: 'brightness(1)' }], { duration: 320, easing: 'ease-out' });
        fadedAt = now;
      }
      shown = p;
    }
    const out = director.frame(p, now / 1000, dt, camera, pointer);
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
    if (post) {
      // Focus the tilt-shift between the rover and the middle of the frame, so both the rover
      // and the landmark it has stopped beside stay sharp. Eased so the band never jumps.
      let target = 0.45;
      if (director.rover.object.visible && director.rover.object.parent === out.scene) {
        camera.updateMatrixWorld();
        subject.copy(director.rover.object.position).setY(director.rover.object.position.y + 0.8).project(camera);
        if (Math.abs(subject.z) < 1) target = (THREE.MathUtils.clamp((subject.y + 1) / 2, 0.1, 0.9) + 0.5) / 2;
      }
      focus += (target - focus) * (1 - Math.exp(-dt * 6));
      post.render(out.scene, camera, out.look, out.tilt, focus);
    } else renderer.render(out.scene, camera);
  };

  let running = false;
  const run = (on: boolean) => {
    if (on === running) return;
    running = on;
    last = performance.now();
    watch?.reset();
    renderer.setAnimationLoop(on ? frame : null);
  };
  // Render only while the journey is on screen: not in a hidden tab, not under the page below.
  let onScreen = true;
  document.addEventListener('visibilitychange', () => run(onScreen && !document.hidden));
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; run(onScreen && !document.hidden); }).observe(track);
  // Dev only (stripped from production builds): lets tests and the tuning panel read the scene.
  if (import.meta.env.DEV) Object.assign(window, { __journey: { camera, director, scroll, tier: () => tierNames[tier] } });
  run(true);
  root.classList.add('is-live');
}
