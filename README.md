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

The current static build contains the portfolio at `/` and the not-found page at `/404.html`. There is no `/explore/` route in this checkout; earlier Aero Explorer instructions in this README were stale.

## Hosting

Upload the contents of `dist/` to a static host such as Hostinger. The main site is static, while `public/proxy.php` is an optional Hostinger PHP endpoint used by the in-app browser for destinations that block iframe embedding. Keep it behind HTTPS and do not use it for private URLs or authenticated browsing.

## Content

Project entries live in `src/content/projects/`; the schema is defined in `src/content.config.ts`. Authored contributions appear on each card; problem, system, key decision, and next milestone appear in a native disclosure. Status labels distinguish active work from prototypes and shipped projects.

Technical claims are limited to inspected source or approved records. The portfolio's Snake Reward Lab is a separate, browser-only tabular Q-learning demonstration; it is not the Python PPO runner in Teach to Game. Its reward readout is a stochastic training metric, not a held-out result, and neither its policy nor score is saved. Aircade motion controls remain labeled experimental until the full device-to-game path has been tested on hardware.

## Architecture, accessibility, and evidence

The site is a static Astro build. Project metadata is content-driven; interactive demonstrations run locally in the browser, and the site does not connect to a live robot. Case-study disclosures use native `<details>` and `<summary>` elements, and the Snake controls support keyboard input and slow autoplay for reduced-motion preferences.

Media rights, privacy review, and publication follow-ups are tracked in `docs/asset-register.csv`. Content evidence and implementation decisions are recorded in `docs/08-DECISIONS-AND-SESSION-LOG.md`. Do not add performance claims, team media, or hardware-validation claims without the corresponding evidence and permission.

## Media

The existing WayBionic images are mock RViz states and the arm video is already in `public/assets/waybionic/`. Treat team media as permission-sensitive and label simulated content accurately. Do not connect the public site to a live robot.
