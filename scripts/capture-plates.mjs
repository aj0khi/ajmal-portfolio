// Photographs every room of the live 3D hall for the pocket guide (phones, portrait tablets,
// no-WebGL browsers) and the desktop loading poster. Re-run after changing an exhibit.
//
//   npm run dev                                   # in another terminal
//   PLAYWRIGHT=/path/to/playwright/index.mjs node scripts/capture-plates.mjs
//
// Playwright is not a project dependency; point PLAYWRIGHT at any local install
// (for example one cached by `npx playwright`). sharp comes with Astro's image service;
// set SHARP to another install if it is ever missing. Output: public/plates/<room-id>.webp
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const { default: sharp } = await import(process.env.SHARP ?? 'sharp');

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const base = process.env.SITE ?? 'http://localhost:4321/';
const out = new URL('../public/plates/', import.meta.url);
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForSelector('.museum.is-3d', { timeout: 30000 });
// Only the hall itself: no labels, chrome, vignette, or grain in the photograph.
await page.addStyleTag({ content: '.room > *, .topbar, .floorplan, .stage-vignette, .stage-grain, .stage-progress, astro-dev-toolbar { visibility: hidden !important; }' });

const ids = await page.$$eval('[data-room]', (rooms) => rooms.map((room) => room.id));
for (const id of ids) {
  await page.evaluate((target) => {
    const link = document.querySelector(`a[href="#${target}"]`);
    if (link) link.click();
    else document.getElementById(target)?.scrollIntoView({ behavior: 'instant' });
  }, id);
  await page.waitForTimeout(4200); // the sweep, the camera's settle, and the curtains opening
  // The hall frames each hang right of the placard; keep that part, letterboxed into a square
  // so phones (which show it square) never crop a painting.
  const shot = await page.screenshot({ clip: { x: 1440 * 0.3, y: 0, width: 1440 * 0.7, height: 900 } });
  await sharp(shot).resize(1080, 1080, { fit: 'contain', background: '#070505' }).webp({ quality: 74, effort: 6 }).toFile(fileURLToPath(new URL(`${id}.webp`, out)));
  console.log('captured', id);
}
await browser.close();
