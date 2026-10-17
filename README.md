# Ajmal Khidri - Build Log

Personal portfolio built with Astro, TypeScript, semantic HTML, CSS, and small client-side scripts.

## Local development

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

## Production build

```bash
npm run check
npm run build
```

The deployable static site is generated in `dist/`.

The original WayBionic arm video was compressed to `public/assets/waybionic/arm-demo.mp4` for web delivery and remains under GitHub's file limit. The Media Player keeps the Drive fallback available.

The Aero Explorer is available at `/explore/`. Its current milestone boots into a client-side Three.js floating-island scene with a fallback path back to the AjmalOS archive.

## Hosting

Upload the contents of `dist/` to a static host such as Hostinger. The main site is static, while `public/proxy.php` is an optional Hostinger PHP endpoint used by the in-app browser for destinations that block iframe embedding. Keep it behind HTTPS and do not use it for private URLs or authenticated browsing.

## Content

Project entries live in `src/content/projects/`. Add a new Markdown file using the schema in `src/content.config.ts`.

## Aero Explorer handoff

The latest explorer milestone is committed on `main` and pushed to GitHub. The original AjmalOS desktop remains the homepage, while the full Three.js experience is available at `/explore/`.

### Current state

- The homepage opens directly to the AjmalOS portfolio desktop.
- The obsolete embedded Systems Field layer and redundant Games window are no longer mounted.
- `/explore/` contains the boot flow, genuine Three.js Home Island, third-person movement, camera follow, landmarks, portfolio panels, collectibles, secrets, inventory and local progress persistence.
- Home Island has a larger walkable footprint, a clear central path, distributed points of interest, smaller side mounds, a glass arch, wind spinners and Aero vegetation.
- Portfolio content, external project links, `public/proxy.php`, hosting configuration and existing project files remain unchanged.
- Three.js is already present in `package.json`; do not add another rendering engine without a specific reason.

### Before the next development session

From the repository root:

```bash
npm install
npm run check
npm run build
npm run dev
```

Then manually verify:

1. Open `/` and confirm the boot sequence, portfolio window, desktop icons and original navigation.
2. Open `/explore/`, click `START EXPLORING`, and test movement with WASD/arrows, `E`, `Escape`, touch controls and resizing.
3. Visit each Home Island landmark and verify the portfolio, project and contact panels.
4. Test orb collection, duplicate prevention, inventory, secret discoveries, reset confirmation and reload persistence.
5. Check a mobile viewport and reduced-motion mode.
6. Confirm the original contact/proxy behavior without changing the PHP endpoint contract.

### Known limitations and next work

- Only Home Island is currently reachable. Robotics Island, Developer Island and the bonus-island unlock are represented in progress/UI state but do not yet have playable environments.
- The Three.js production chunk is larger than Vite's advisory 500 kB threshold. If bundle size becomes a problem, profile and code-split the explorer before adding assets.
- The scene uses lightweight procedural geometry rather than downloaded models to keep licensing, loading and performance predictable.
- The existing `/favicon.ico` 404 may appear in local browser console output and is unrelated to the explorer.
- Before adding more gameplay, audit the full traversal of all orb and secret locations, storage-disabled behavior, keyboard focus restoration, and low-end/mobile performance.
- Do not modify `public/proxy.php`, its request format, secret environment variables or deployment configuration while continuing the game work.
