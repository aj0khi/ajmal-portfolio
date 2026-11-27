// The high tier's finish: bloom on the bright things (lamps, the tower's torch, the plume, the
// sun), a tilt-shift that blurs the top and bottom of the frame so Calgary reads as a model on
// a table, a soft vignette, then tone mapping. Everything before the output pass works in
// linear HDR, so only light that is genuinely brighter than white blooms.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// One direction of a 9-tap Gaussian whose radius grows away from a horizontal band in focus.
// Run once across and once down. The second run also applies the vignette.
const tiltShift = (vignette: boolean) => ({
  uniforms: {
    tDiffuse: { value: null },
    uStep: { value: new THREE.Vector2() },
    uFocus: { value: 0.45 },
    uBand: { value: 0.18 },
    uAmount: { value: 1 },
    uVignette: { value: vignette ? 1 : 0 },
    uAspect: { value: 1 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uStep;
    uniform float uFocus, uBand, uAmount, uVignette, uAspect;
    varying vec2 vUv;
    void main() {
      float blur = uAmount * smoothstep(uBand, uBand + 0.32, abs(vUv.y - uFocus));
      vec2 s = uStep * blur;
      vec4 sum = texture2D(tDiffuse, vUv) * 0.1633;
      sum += (texture2D(tDiffuse, vUv - s) + texture2D(tDiffuse, vUv + s)) * 0.1531;
      sum += (texture2D(tDiffuse, vUv - 2.0 * s) + texture2D(tDiffuse, vUv + 2.0 * s)) * 0.12245;
      sum += (texture2D(tDiffuse, vUv - 3.0 * s) + texture2D(tDiffuse, vUv + 3.0 * s)) * 0.0918;
      sum += (texture2D(tDiffuse, vUv - 4.0 * s) + texture2D(tDiffuse, vUv + 4.0 * s)) * 0.051;
      // Vignette: measured on a circle, not the screen's rectangle, and kept faint.
      vec2 c = (vUv - 0.5) * vec2(uAspect, 1.0);
      sum.rgb *= mix(1.0, 1.0 - 0.32 * smoothstep(0.35, 1.05, length(c)), uVignette);
      gl_FragColor = sum;
    }`
});

// How each scene blooms: [threshold, strength, radius]. Thresholds are in linear light, so a
// sunlit wall (around 1) stays crisp and lamps, flames and the sun (several times that) glow.
export type Look = 'earth' | 'space' | 'moon';
const blooms: Record<Look, [number, number, number]> = {
  earth: [1.4, 0.45, 0.55],
  space: [1.2, 0.7, 0.6],
  moon: [1.6, 0.35, 0.4]
};

export function createPost(renderer: THREE.WebGLRenderer) {
  // MSAA on the scene target: the renderer's own antialiasing doesn't reach render targets.
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  const scenePass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.5, 1.4);
  const across = new ShaderPass(tiltShift(false));
  const down = new ShaderPass(tiltShift(true));
  composer.addPass(scenePass);
  composer.addPass(bloom);
  composer.addPass(across);
  composer.addPass(down);
  composer.addPass(new OutputPass());

  const BLUR_PX = 1.8; // per tap at full blur, so the far edges blur by about 7px
  return {
    setSize(width: number, height: number, pixelRatio: number) {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
      (across.uniforms.uStep.value as THREE.Vector2).set(BLUR_PX / width, 0);
      (down.uniforms.uStep.value as THREE.Vector2).set(0, BLUR_PX / height);
      down.uniforms.uAspect.value = width / height;
    },
    /** `tilt` 0..1 is how strongly the model-landscape blur applies; `focus` is its band's
     *  height on screen (0 bottom, 1 top). */
    render(scene: THREE.Scene, camera: THREE.Camera, look: Look, tilt: number, focus: number) {
      scenePass.scene = scene;
      scenePass.camera = camera;
      [bloom.threshold, bloom.strength, bloom.radius] = blooms[look];
      across.enabled = tilt > 0.01;
      across.uniforms.uAmount.value = down.uniforms.uAmount.value = tilt;
      across.uniforms.uFocus.value = down.uniforms.uFocus.value = focus;
      composer.render();
    },
    dispose() { composer.dispose(); bloom.dispose(); across.dispose(); down.dispose(); }
  };
}
