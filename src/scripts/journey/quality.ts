// Quality tiers. The journey starts at a tier guessed from the device, then watches its own
// frame rate and steps down (never back up, so it can't flicker between tiers) when frames run
// slow for a few seconds. `?quality=low|medium|high` pins a tier and turns the watching off.
//
//   high    post-processing (bloom, tilt-shift, vignette, MSAA), shadows, sharp pixels
//   medium  shadows, the browser's own antialiasing, a little softer
//   low     no shadows, one pixel per CSS pixel
export type Tier = 0 | 1 | 2;
export const tierNames = ['low', 'medium', 'high'] as const;

export interface TierSettings { pixelRatio: number; shadows: boolean; post: boolean }
export const tiers: Record<Tier, TierSettings> = {
  0: { pixelRatio: 1, shadows: false, post: false },
  1: { pixelRatio: 1.5, shadows: true, post: false },
  2: { pixelRatio: 1.75, shadows: true, post: true }
};

// A first guess from what the browser tells us. deviceMemory is Chromium-only, so a missing
// value means "assume a capable laptop", not "assume the worst".
export function guessTier(): { tier: Tier; pinned: boolean } {
  const asked = new URLSearchParams(location.search).get('quality');
  const pinned = tierNames.indexOf(asked as (typeof tierNames)[number]);
  if (pinned >= 0) return { tier: pinned as Tier, pinned: true };
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820;
  if (cores <= 2 || memory <= 2) return { tier: 0, pinned: false };
  if (phone || cores <= 4 || memory <= 4) return { tier: 1, pinned: false };
  return { tier: 2, pinned: false };
}

// Watches frame times and says when to step down. It judges a window of frames by its median,
// so one-off hitches (a shader compiling as a new scene appears) don't count against it. A
// window closes after 90 frames or 3 seconds, whichever comes first, so a device managing only
// a few frames a second is caught quickly too.
export function frameWatch(onSlow: () => void) {
  const FRAMES = 90;
  const SECONDS = 3;
  const SLOW = 1 / 38; // seconds per frame: a median under ~38 fps is "slow"
  const samples: number[] = [];
  let elapsed = 0;
  let warmup = 2.5; // seconds to ignore after start and after each step down
  const close = () => { samples.length = 0; elapsed = 0; };
  return {
    /** `seconds` is the real time since the last frame, before any clamping. */
    sample(seconds: number) {
      if (seconds <= 0) return;
      if (warmup > 0) { warmup -= seconds; return; }
      samples.push(seconds);
      elapsed += seconds;
      if (samples.length < FRAMES && (elapsed < SECONDS || samples.length < 8)) return;
      const median = [...samples].sort((x, y) => x - y)[samples.length >> 1];
      close();
      if (median > SLOW) { warmup = 2.5; onSlow(); }
    },
    // A paused loop (hidden tab, page scrolled past) resumes with a fresh window.
    reset() { close(); warmup = Math.max(warmup, 0.5); }
  };
}
