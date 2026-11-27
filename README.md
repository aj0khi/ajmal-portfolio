# Ajmal Khidri: Driveway to the Moon

Personal portfolio as a scroll-driven 3D journey: a rover drives from a Calgary driveway, through downtown and the University of Calgary campus, onto a rocket in the badlands, and lands at the Moon's south pole. Each stop is a project, with something to try. Built with Astro, TypeScript, Three.js, GSAP ScrollTrigger and Lenis.

## Local development

Astro 7 needs Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

## Production build

```bash
npm run check
npm run build
```

The static site is generated in `dist/`. Hostinger builds it from `main` on each push (Astro preset, `npm run build`, output `dist`, Node 22).

Routes: `/` (the journey) and the 404 page. The old `/journey/` and `/os` addresses redirect to `/`.

## How it fits together

- `src/data/journey.ts`: the stops, in order: where each sits on the road, its camera framing, how long the drive and glide take, the time of day.
- `src/pages/index.astro`: one card per stop, its controls, and the kiosks (full interactive demos in native `<dialog>` elements).
- `src/scripts/journey/`: the scene. `main.ts` boots it, `scroll.ts` turns scroll into the journey position and snaps one stop per gesture, `director.ts` turns that position into the frame, `world/` builds Calgary, the space scene and the Moon, `actors/` the rover and rocket, `models/` the project models at the stops, `quality.ts` and `post.ts` the quality tiers and post-processing.
- Project text comes from `src/content/projects/` (schema in `src/content.config.ts`) and `src/data/profile.ts`.

Without WebGL (or if the scene fails to load) the cards stack as an ordinary page, each with a photograph of its stop. With reduced motion the scene cuts between stops instead of driving.

## Assets

- `npm run models:rover` rebuilds the rover from `cad/rover.py` (CadQuery in `~/cad-env`).
- `npm run models:arm` converts the WayBionic arm from the team's description package (set `WAYBIONIC` to its folder).
- `scripts/capture-journey.mjs` re-shoots the stop photographs and the loading posters from the dev server (see its header).

Every borrowed asset, logo and library is listed in `CREDITS.md`. The plan is in `docs/09-JOURNEY-PLAN.md` and decisions are logged in `docs/08-DECISIONS-AND-SESSION-LOG.md`.
