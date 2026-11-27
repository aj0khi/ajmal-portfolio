// Photographs every stop of the 3D journey, for browsers that can't run it (no WebGL, or the
// scene failed) and for the loading poster that sits under the canvas while the world builds.
// Re-run after changing the scene or a stop's framing.
//
//   npm run dev                                   # in another terminal
//   PLAYWRIGHT=/path/to/playwright/index.mjs node scripts/capture-journey.mjs
//   ONLY=hvac,poster node scripts/capture-journey.mjs   # just these (stop ids, poster, poster-tall)
//
// Playwright is not a project dependency; point PLAYWRIGHT at any local install (for example
// one cached by `npx playwright`). sharp comes with Astro's image service; set SHARP to another
// install if it is ever missing. It drives the dev-only `window.__journey` hook, so it needs the
// dev server, not a production build.
//
// Output, in public/journey/stills/:
//   <stop>.webp       each stop, cropped to the scene beside the card (1008 x 900)
//   poster.webp       the first stop, full frame, for wide screens (1440 x 900)
//   poster-tall.webp  the first stop, full frame, for tall screens (780 x 1688)
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const { default: sharp } = await import(process.env.SHARP ?? 'sharp');
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const base = new URL('?quality=high', process.env.SITE ?? 'http://localhost:4321/').href;
const out = new URL('../public/journey/stills/', import.meta.url);
await mkdir(out, { recursive: true });
const file = (name) => fileURLToPath(new URL(name, out));
const only = process.env.ONLY?.split(',');
const wanted = (name) => !only || only.includes(name);

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// Software rendering is slow (a few frames a second), so each shot waits for the scene to settle.
const SETTLE = Number(process.env.SETTLE ?? 6000);

async function open(viewport, deviceScaleFactor) {
  const page = await browser.newPage({ viewport, deviceScaleFactor });
  page.setDefaultTimeout(180000);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__journey);
  // Only the scene: no cards, chrome, scrim or grain in the photograph.
  await page.addStyleTag({ content: '.j-cards, .trip, .j-bar, .j-scrim, .j-grain, .j-flash, astro-dev-toolbar { visibility: hidden !important; }' });
  return page;
}
// Park the journey at a stop directly, without the glide that scrolling would play.
const park = (page, index) => page.evaluate((p) => { window.__journey.scroll.state.p = p; }, index);

const wide = await open({ width: 1440, height: 900 }, 1);
const ids = await wide.$$eval('[data-card]', (cards) => cards.map((card) => card.dataset.card));
for (const [index, id] of ids.entries()) {
  if (!wanted(id) && !(index === 0 && wanted('poster'))) continue;
  await park(wide, index);
  await wide.waitForTimeout(SETTLE);
  const shot = await wide.screenshot();
  if (index === 0 && wanted('poster')) await sharp(shot).webp({ quality: 70, effort: 6 }).toFile(file('poster.webp'));
  // The scene is framed to the right of the card; keep that part.
  if (wanted(id)) await sharp(shot).extract({ left: 432, top: 0, width: 1008, height: 900 }).webp({ quality: 72, effort: 6 }).toFile(file(`${id}.webp`));
  console.log('captured', id);
}
await wide.close();

if (wanted('poster-tall')) {
  const tall = await open({ width: 390, height: 844 }, 2);
  await park(tall, 0);
  await tall.waitForTimeout(SETTLE);
  await sharp(await tall.screenshot()).webp({ quality: 68, effort: 6 }).toFile(file('poster-tall.webp'));
  console.log('captured poster-tall');
}
await browser.close();
