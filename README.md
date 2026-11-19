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

The static build has three routes:

- `/`: the main portfolio ("Workcell"), a scrolling page with a live Three.js robot arm in the hero.
- `/os/`: the classic AjmalOS desktop, kept as-is and linked from the contact section and the terminal (`os`).
- `/404.html`: the not-found page.

## Hosting

Upload the contents of `dist/` to a static host such as Hostinger. The main site is static, while `public/proxy.php` is an optional Hostinger PHP endpoint used by the in-app browser for destinations that block iframe embedding. Keep it behind HTTPS and do not use it for private URLs or authenticated browsing.

## Content

Project entries live in `src/content/projects/`; the schema is defined in `src/content.config.ts`. Entries with a `group` (`robotics`, `software`, `business`) appear on the main page with their problem, system, key decision, contribution, next step, and `highlights`. Status labels distinguish active work from prototypes and shipped projects.

Everything that is not a project (roles, education, awards, certifications, skills mapped to projects, roadmap, coursework, GitHub snapshot) lives in `src/data/profile.ts`. Every skill lists the project ids where it was used, and the Toolbox section links to those projects.

## Design system

`src/styles/site.css` defines the tokens: night navy `#0a1322`, drafting-film paper `#e6eaec`, safety-tape yellow `#ffc72c` (status and primary actions only), and telemetry cyan `#5cc8d6` (live data only). Type is Big Shoulders Display (headlines), Instrument Sans (body), and IBM Plex Mono (data only). Interactive demos sit in dark "instrument" panels.

The hero arm (`src/components/site/WorkcellHero.astro`) is built from primitives with no model files. It solves closed-form inverse kinematics toward the pointer: base yaw from the target bearing, a two-link planar solve for the wrist centre, and a wrist angle that holds the tool pitch. A critically damped spring drives each joint toward the solution. The scene renders only while the hero is on screen, caps the pixel ratio at 2 (1.5 on narrow screens), and skips the power-up and idle sweep when reduced motion is requested.

Technical claims are limited to inspected source or approved records. The portfolio's Snake Reward Lab is a separate, browser-only tabular Q-learning demonstration; it is not the Python PPO runner in Teach to Game. Its reward readout is a stochastic training metric, not a held-out result, and neither its policy nor score is saved. Aircade motion controls remain labeled experimental until the full device-to-game path has been tested on hardware.

## Architecture, accessibility, and evidence

The site is a static Astro build. Project metadata is content-driven; interactive demonstrations run locally in the browser, and the site does not connect to a live robot. Case-study disclosures use native `<details>` and `<summary>` elements, and the Snake controls support keyboard input and slow autoplay for reduced-motion preferences.

Media rights, privacy review, and publication follow-ups are tracked in `docs/asset-register.csv`. Content evidence and implementation decisions are recorded in `docs/08-DECISIONS-AND-SESSION-LOG.md`. Do not add performance claims, team media, or hardware-validation claims without the corresponding evidence and permission.

## Media

The existing WayBionic images are mock RViz states and the arm video is already in `public/assets/waybionic/`. Treat team media as permission-sensitive and label simulated content accurately. Do not connect the public site to a live robot.
