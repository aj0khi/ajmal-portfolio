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

- `/`: the main portfolio, "The Collection": a scroll-driven walk through a red-walled museum hall at night, rendered with Three.js behind HTML placards.
- `/os/`: the classic AjmalOS desktop, kept as-is and linked from the contact section and the terminal (`os`).
- `/404.html`: the not-found page.

## Hosting

Upload the contents of `dist/` to a static host such as Hostinger. The main site is static, while `public/proxy.php` is an optional Hostinger PHP endpoint used by the in-app browser for destinations that block iframe embedding. Keep it behind HTTPS and do not use it for private URLs or authenticated browsing.

## Content

Project entries live in `src/content/projects/`; the schema is defined in `src/content.config.ts`. Entries with a `group` (`robotics`, `software`, `business`) appear on the main page with their problem, system, key decision, contribution, next step, and `highlights`. Status labels distinguish active work from prototypes and shipped projects.

Everything that is not a project (roles, education, awards, certifications, skills mapped to projects, roadmap, coursework, GitHub snapshot) lives in `src/data/profile.ts`. Every skill lists the project ids where it was used, and the Toolbox section links to those projects.

## Design system and the museum

The page is a red-walled picture gallery at night: crimson damask, ebonised wainscoting, black marble plinths, gilt frames, black velvet curtains, and Garamond (Cormorant Garamond for display, EB Garamond for text, IBM Plex Mono for data). Tokens live at the top of `src/styles/site.css`.

- `src/data/exhibits.ts` defines the tour: room order, accession numbers, screenshots ("paintings"), the sculpture on each plinth, the kiosk demo, and the placard control.
- `src/scripts/museum/museum.ts` builds the hall and maps scroll position to a camera path through the rooms. Each room "wakes" (picture lights, curtains, motion) as the visitor arrives. A torch follows the pointer, and curtains open on arrival or on click.
- `src/scripts/museum/sculptures.ts` holds the plinth pieces: an IK arm at the entrance, the WayBionic old arm loaded from its real URDF and STL meshes (`public/models/waybionic-old-arm/`, MIT), a CAN motor bus, a hash chain that fails after a tampered block, a learning snake, a sonar rover, the Moon with a movable sun, and a slab you pressure-wash.
- `src/scripts/museum/interior.ts` draws every texture on a canvas at load, so the hall ships no image files.
- Placard controls (`museum:control` window events) drive the sculptures. Kiosks are native `<dialog>` elements holding the full interactive demos.
- Without WebGL, or with it failing, the museum collapses into a readable column of placards with screenshots (`.museum.is-static`). Reduced motion snaps the camera between rooms.

Screenshots in `public/exhibits/` were captured from each project running locally (Soccer Lab, SouthPoint, Aircade, Proofly, Teach to Game) or the live HVAC Express site.

## Architecture, accessibility, and evidence

The site is a static Astro build. Project metadata is content-driven; interactive demonstrations run locally in the browser, and the site does not connect to a live robot. Case-study disclosures use native `<details>` and `<summary>` elements, and the Snake controls support keyboard input and slow autoplay for reduced-motion preferences.

Media rights, privacy review, and publication follow-ups are tracked in `docs/asset-register.csv`. Content evidence and implementation decisions are recorded in `docs/08-DECISIONS-AND-SESSION-LOG.md`. Do not add performance claims, team media, or hardware-validation claims without the corresponding evidence and permission.

## Media

The existing WayBionic images are mock RViz states and the arm video is already in `public/assets/waybionic/`. Treat team media as permission-sensitive and label simulated content accurately. Do not connect the public site to a live robot.
