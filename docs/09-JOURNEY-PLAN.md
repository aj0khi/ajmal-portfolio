# Driveway to the Moon: the scroll-journey plan

Status: Phases 0, 1 and 2 built at `/journey/` (2026-11-26); see the session log. Next: Phase 3 (the rover) and Phase 4 (the art pass); phones are deliberately left until everything else is built. `gsap@3.15.1` and `lenis@1.3.28` are installed and pinned.
Replaces: the museum ("The Collection") on `/`, once the journey ships.
Reference: [Maxxiiime/KameHousePortfolio](https://github.com/Maxxiiime/KameHousePortfolio). It is inspiration only so use the repo code and models/texture if applicable no one is gonna know anyways

---

## 1. The idea in one line

**Scroll drives a small rover from a driveway in Calgary to a landing site on the Moon, and every stop on the way is one of my projects, with something you can actually do there.**

This is literally true of my work: Chinook Clean washes driveways, and SouthPoint picks Moon landing sites. Everything else sits on the road between them, in the order it happened:

1. Family HVAC company and my own business at home.
2. University robotics teams.
3. A Mars-style test yard.
4. The Moon.
5. The road that isn't paved yet.

The rover is the main character because it's the clearest picture of "systems that move", and the Schulich Space Rover Team is real work of mine.

### What the reference does well, and what this does differently

| KameHouse | This journey |
| --- | --- |
| One building, room to room | A whole landscape, so each stop looks completely different |
| Stops are labels (a mug that says "React") | Every stop is a working interaction: steer the arm, spray the slab, drop obstacles, move the sun |
| Camera on hand-tuned keyframes | The rover follows a road spline and the camera rides a rig around it, so motion is continuous and tunable |
| Same light throughout | Time of day runs with scroll: pre-dawn street, sunrise campus, noon desert, dusk launch, lunar night |
| No mobile path seen | A lighter mobile tier plus a photograph fallback (we already have the pattern) |

### Why pivot from the museum

The museum worked but has a ceiling. Every room is the same red wall with a different thing on it, so the "journey" was really a corridor. A road through changing places gives the scroll a story with a beginning, middle and end. It also gives us natural tricks the museum fought against:
- Hills and corners hide the next stop, so it never flashes early.
- Changing light makes progress *felt*, not just counted.

Alternatives I considered and dropped:
- **A walk through my house or garage.** Too close to the reference, and a house has no natural ending.
- **Keep the museum and fly the camera along a spline.** Same corridor problem, nicer camera.
- **Travel along a signal inside a robot (a CAN bus).** Clever, but too abstract for a recruiter's first 30 seconds.

---

## 2. The route

```
 PRE-DAWN            SUNRISE                  NOON                    DUSK          NIGHT
 Calgary street ─── foothills ─── UCalgary campus ─── rover garage ─── Mars yard ─── launch pad ═══▶ the Moon ─── unpaved road
 │      │                    │      │      │      │            │           │                         │              │
 Chinook HVAC             Clubs  WayBionic Black  Soccer      Rover arm   Autonomous                 SouthPoint      Next wing
 Clean   Express          banners   lab    Box   pitch,       motor bus   rover                                       + contact
                                          Arcade:
                                          Teach to Game,
                                          Aircade, Proofly
```

In one sentence: **leave the house, drive to school, board a rocket, fly to the Moon.** The rover team garage and the Mars-analog yard sit on the edge of campus, on the way to the launch pad.

The road winds: every stop sits just past a bend, crest or doorway, so the next stop is out of sight until the rover rounds the corner. **Level design, not camera cuts, handles occlusion on the ground.** The flight uses two deliberate cuts, hidden inside a cloud layer and a match on the Moon's grey surface (section 2b).

### Chapters and stops

| # | Stop | Place on the road | What you can do there (all of these exist today) |
| - | --- | --- | --- |
| 0 | **Title**: "Systems that move." | Driveway, street lights on, pre-dawn | Move the cursor: the rover's camera mast tracks it (the IK arm logic, reused). "Start the drive" button. |
| 1 | **Chinook Clean** | The same driveway, grimy | Hold to spray: a clean stripe follows the wand across the concrete (reuses the wash slab shader). The clean stripe *is* the road the rover rolls onto. |
| 2 | **HVAC Express** | Next door: rooftop condenser, the live site on a lit window | Turn a thermostat dial: heat shimmer and fan speed respond, and the comfort calculator kiosk opens. |
| 3 | **The thread** | Three road signs: *Compressors. Nozzles. Joints.* | None. A breather stop that reads as you pass, like highway signs. |
| 4 | **The Societies** | Campus entrance: club banners on light poles | Tap a banner to flip it to the team's story (the dossier content). |
| 5 | **WayBionic** | Lab window, the real URDF arm on a bench | Joint sliders drive the arm. The stale-data kiosk opens on the lab monitor. |
| 6 | **Physical AI BlackBox** | A flight-recorder crate on a cart | Tamper with record 4: the chain lights red after it. |
| 7 | **Teach to Game / Aircade / Proofly** | Student lounge: arcade cabinets and a community board | Each cabinet's screen is live; walking up opens Snake lab, Aircade screenshots, or the signature kiosk. |
| 8 | **Soccer Intelligence** | Campus pitch with a scoreboard | Scoreboard sliders for expected goals; the outcome bars update (the Poisson explorer). |
| 9 | **Rover arm motors** | Team garage, three motors on the bench | Plan the arm bus: the CAN wires light as you pick options. |
| 10 | **Autonomous rover** | Mars-analog yard, red rocks | Click to drop rocks; a small rover avoids them (reuses the sonar sim). |
| 11 | **SouthPoint** | Launch at dusk, then the lunar south pole | Drag the sun around the horizon; crater shadows sweep (reuses the Moon globe). |
| 12 | **The next wing** | The road ends in survey stakes and an unfinished stretch | The roadmap as road signs ahead. "Send a transmission" opens email. |

After stop 12 the page continues into the HTML archive (Thinking, Experience, Toolbox, Activity, Contact), as it does now. A **"Skip the drive"** link in the top bar jumps straight there for recruiters in a hurry.

### The signature detail: the trip meter

A small instrument cluster in the corner replaces the museum's floor plan:
- **Odometer.** Counts from 0 km at the driveway to **384,400 km** on the Moon. The scale is logarithmic, so the early streets still tick visibly.
- **Stop name and number.**
- **Mini route map.** Clicking a stop drives there.

It doubles as navigation and progress, and nobody else's portfolio has it.

The odometer is honest about being playful: ground stops count up in small steps, the ascent climbs to about 400 km (low orbit), the coast runs to 384,000 km, and the landing ticks the last 400. Digits roll, in tabular figures, so the cluster never jitters.

---

## 2b. The launch: the set piece

This is the moment people will remember and send to friends, so it gets the longest stretch of scroll (about 4.5 screens) and its own storyboard. `f` is progress through the launch-to-Moon drive, 0 to 1.

| f | Beat | Camera | Light and sound |
| --- | --- | --- | --- |
| 0.00 to 0.10 | **Boarding.** The rover rolls up the ramp into the rocket's cargo bay; the hatch closes. | Low, wide, looking up the whole rocket at dusk | Pad floodlights, dusk sky |
| 0.10 to 0.16 | **Ignition.** Smoke billows out from the base, the engine bell glows, everything trembles. | Ground level, small camera shake that builds | Orange light floods the pad from below; low rumble |
| 0.16 to 0.46 | **Ascent.** Slow at first, then faster (thrust curve, ease-in). The ground falls away, the road and campus shrink to a map, and the sky deepens from dusk orange to navy to black. | Follows from the side and below, then rises alongside | Fog thins with altitude; stars fade in |
| 0.42 to 0.53 | **The cloud layer.** The rocket punches through a deck of cloud; the screen goes bright white for a beat. | Passes through the clouds with the rocket | **Cut 1** at the whiteout peak, from the Earth scene to space |
| 0.47 to 0.80 | **The coast.** Silence. Earth's curved limb with its blue atmosphere fills the bottom of the frame; the Moon grows ahead. The rocket arcs, never a straight line. | Swings from behind the engine to a side view, then lines up behind the rocket toward the Moon | Hard sunlight from one side; engine off |
| 0.80 | **The match cut.** The camera dives until the Moon's grey surface fills the frame. | Straight down | **Cut 2** to the landing scene, which opens on the same grey from above |
| 0.80 to 0.93 | **Landing.** Retro thrust, dust kicked sideways, touchdown. | Descends from high above to a low wide shot | Low south-pole sun, long shadows (what SouthPoint maps) |
| 0.93 to 1.00 | **Earthrise.** The ramp drops and the rover rolls onto the Moon. Earth hangs in the black sky. | Low behind the rover, Earth in frame | Dwell: the SouthPoint interaction goes live |

Why the two cuts: a real 1:1 Earth-to-Moon distance is impossible to render in one scene (floating-point precision and fog both break). Three small scenes joined by cuts the eye can't catch is how films do it too. Scrolling backward plays everything in reverse, cuts included, because every beat is a pure function of `f`.

---

## 3. How the scroll feels

This is the part the museum got wrong first, so the rules are explicit.

1. **The page scrolls natively.** A tall spacer element gives the document its height. [Lenis](https://github.com/darkroomengineering/lenis) smooths the wheel without changing scroll speed. Touch scrolling stays native on phones.
2. **One master timeline, scrubbed.** A single [GSAP](https://gsap.com/docs/v3/) timeline holds the whole drive. [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) maps scroll progress onto it with `scrub: 0.8` (a short catch-up, so motion feels weighted, not laggy).
3. **Drive, then dwell.** Each chapter's slice of the timeline is about 55% *drive* and 45% *dwell*. During the dwell the rover is parked, the camera has settled, and the stop's interaction is live. You can scroll a little inside a stop without anything running away from you.
4. **Snap to stops, in your direction.** When you stop scrolling mid-drive, the journey glides on to the next stop in the direction you were going. One flick ends at a stop, never between two. This is a small custom module, because neither built-in option fits: ScrollTrigger's own `snap` fights Lenis's smoothing, and the `lenis/snap` plugin only snaps to the *nearest* point, which would pull you back after a small flick.
   - **When it decides.** 120 ms after your input stops: no more wheel events for a wheel or trackpad, or no more scroll events after a touch's native momentum ends. It reacts to the end of your gesture, not the end of Lenis's smoothing, so the glide starts before the page has a chance to coast to a halt.
   - **Where it goes.** Inside a stop's dwell zone: nowhere, so you can linger and play. In a drive zone: the next stop's arrival when scrolling down, or the previous stop's dwell end when scrolling up.
   - **How.** `lenis.scrollTo(target, { duration, easing })`, which picks up from the current smoothed position with no jolt. Duration grows with distance: about 0.6 s for a short hop, up to about 3.5 s for the rocket flight. Any new input cancels it.
5. **Short chapters.** Each stop is about 1.3 screen-heights of scroll, so the whole drive is about 17 screens. That's roughly 8 flicks on a trackpad from driveway to Moon.
6. **Keys and links jump.** Arrow keys, Page Up/Down and trip-meter clicks tween the scroll to the previous or next label.
7. **Text arrives with the stop.** Each stop's HTML card fades and rises in during the last 30% of its drive and leaves early in the next drive. Cards are real DOM, readable and selectable, and never drawn into the canvas.

```
scroll ──────────────────────────────────────────────────────────────────▶
        │ drive ███████████ │ dwell ░░░░░░░ │ drive ███████████ │ dwell ░░░░░░░ │
label:                      stop-1                              stop-2
camera:   follow rig, low     orbit to the stop's framing          ...
card:              rise ▲   ▓▓▓▓ readable ▓▓▓▓  fall ▼
interaction:                  live ●●●●●●●●                        live ●●●●●
```

---

## 4. Architecture

### Stack decision

**Plain Three.js plus GSAP and Lenis, inside the existing Astro site.** No React.

- Everything interactive we already built is plain Three.js: the IK arm, the URDF arm loader, the hash chain, the snake board, the sonar rover, the Moon, the wash slab, the curtains. All of it moves over with small changes. React Three Fiber would mean rewriting all of it to gain conveniences (drei's `ScrollControls`, `useGLTF`) that we can do in a few lines.
- Astro stays the shell: static HTML for SEO and accessibility, deployed to Hostinger exactly as now. The journey is one client script, loaded only where it should run.
- Dependencies, versions pinned:
  - `gsap@3.15.1` (installed): the master timeline and ScrollTrigger. All plugins are free.
  - `lenis@1.3.28` (installed): smooth wheel, synced to ScrollTrigger the way its README shows (`lenis.on('scroll', ScrollTrigger.update)`, Lenis driven from `gsap.ticker`, `lagSmoothing(0)`).
  - `detect-gpu` (pmndrs, MIT): picks a quality tier on first load. Added in Phase 5.
  - `postprocessing` (pmndrs): bloom, depth of field and vignette on the high tier. Added in Phase 4.
- The page is built at **`/journey/`** while in progress, so the live museum on `/` keeps working. It moves to `/` in Phase 6.

### Three scenes, one camera

| Scene | Contains | Active for |
| --- | --- | --- |
| **Earth** | Terrain, road, house, campus, garage, Mars yard, launch pad, sky dome, clouds, ground stars | Title through ascent (f < 0.47) |
| **Space** | Star field, Earth globe with clouds and an atmosphere glow, Moon globe, sun | The coast (0.47 ≤ f < 0.80) |
| **Moon** | Cratered surface, a small Earth in the sky, low sun, landing site | Landing and the SouthPoint stop |

The rover and rocket are single objects that are re-parented into whichever scene is active, so there is never a duplicate to keep in sync.

### Composition: making room for the text without moving the camera

At a stop the card sits on the left (desktop) or the bottom (phone), so the subject has to sit right of centre, or above it. Rather than aiming the camera off-target, the plan uses `camera.setViewOffset()`, which shifts the projection itself. The scene slides right as a card arrives and back to centre while driving. The camera's aim, and so the framing tuned in `journey.ts`, never changes.

### Cards: one number per card

The timeline gives each card a single value, `--show` from 0 to 1, as a CSS custom property. Every child staggers itself in CSS from its own `--i` index (`opacity` and `translateY` are computed from `--show` and `--i`), so the text rises in reading order and scrubs backward when you scroll back, with no per-element JavaScript. Cards only take pointer events once `--show` passes 0.5.

### Files

```
src/
  pages/index.astro              HTML: stop cards, kiosks, dossiers, trip meter, archive
  data/journey.ts                THE source of truth: every stop, its place on the road, framing, timings
  scripts/journey/
    main.ts                      boot: tier detection, start the world, wire ScrollTrigger + Lenis
    timeline.ts                  builds the master GSAP timeline from journey.ts (drive/dwell/labels)
    world/
      terrain.ts                 heightfield ground per biome (street, foothills, campus, desert, regolith)
      road.ts                    CatmullRom road spline + extruded road mesh + lane paint
      sky.ts                     time-of-day: sun position, sky gradient, fog, the Chinook arch cloud band
      biomes/                    one file per place: street.ts, campus.ts, garage.ts, marsYard.ts, moon.ts
      props.ts                   instanced trees, poles, rocks, signs
    actors/
      rover.ts                   the rover: rocker-bogie wheels turn with distance, body pitches on slopes
      cameraRig.ts               follow camera with per-stop orbit, offset and FOV blending
    stops/                       one module per interaction, ported from scripts/museum/sculptures.ts
      wash.ts  hvac.ts  waybionicArm.ts  hashChain.ts  arcade.ts  scoreboard.ts  motorBus.ts  sonarRover.ts  moon.ts
    ui/
      tripMeter.ts               odometer, stop name, mini-map, jump-to-stop
      cards.ts                   shows and hides each stop's HTML card from timeline progress
    quality.ts                   tier presets: DPR, shadows, instance counts, postprocessing
    debug.ts                     dev only (?debug): lil-gui to tune camera framings live, a path helper
  scripts/museum/                kept until the journey ships, then removed
public/
  journey/                       any GLB or KTX2 assets, plus stop photographs for the fallback
```

### The data model (`src/data/journey.ts`)

Every number that controls feel lives here, so tuning never means hunting through scene code.

```ts
export interface Stop {
  id: string;                    // matches the content collection id, or 'title' | 'thread' | 'societies' | 'next'
  chapter: 'street' | 'campus' | 'garage' | 'mars' | 'moon' | 'horizon';
  at: number;                    // 0..1 position along the road spline where the rover parks
  framing: {                     // camera relative to the rover while parked
    orbit: [yaw: number, pitch: number, distance: number];
    lookOffset: [x: number, y: number, z: number];
    fov: number;
  };
  timeOfDay: number;             // 0 = pre-dawn ... 1 = lunar night; sky and sun blend to it
  interaction?: 'wash' | 'thermostat' | 'arm' | 'tamper' | 'arcade' | 'scoreboard' | 'bus' | 'rocks' | 'sun';
  kiosk?: string;                // existing dialog id to open
  scroll: number;                // screen-heights this stop takes (default 1.3)
}
```

The road spline is defined once as control points. Stops reference it by `at`, so moving a stop along the road is a one-number change.

### Per-frame loop

1. Lenis gives the scroll position, and ScrollTrigger sets timeline progress.
2. The timeline writes plain numbers: `roadT`, `cameraBlend`, `timeOfDay`, `cardIn`, `stopLive`.
3. `rover.ts` places the rover at `road(roadT)`, aligned to the road tangent and ground normal, and turns its wheels by distance travelled.
4. `cameraRig.ts` blends between the follow pose and the stop's framing by `cameraBlend`.
5. `sky.ts` sets sun, fog and sky colour from `timeOfDay`.
6. Only the current stop and its neighbours update their interaction and animation. Everything else is frozen or hidden, and whole biomes beyond the next bend are not rendered (`visible = false`).
7. Render once.

Rendering pauses when the canvas is off-screen or the tab is hidden, as the museum does now.

### Assets: built in code first

KameHouse's house came from Blender. We don't need that to get started:

- **Code (procedural), like the museum.** Terrain, road, buildings, trees, signs, rocks, the Moon and all existing sculptures. The look comes from a deliberate material palette, soft shadows and the time-of-day light, not from detailed models.
- **The rover.** Modelled in CadQuery (`~/cad-env`) as real mechanical parts: chassis, rocker-bogie, six wheels, camera mast. Exported as GLB with Draco compression, under 500 KB. It's the main character, so it deserves real geometry, and it's exactly the kind of mechanical part CadQuery is for.
- **Open-source and public-domain assets**, imported when they beat what code can make. Each one's license is checked at import and recorded in `CREDITS.md`:

| What | Source | License (verify at import) | Used for |
| --- | --- | --- | --- |
| Moon colour and height maps | NASA SVS "CGI Moon Kit" | Public domain (NASA) | The Moon globe in space and the crater detail on the landing site |
| Earth colour, clouds, night lights | NASA "Blue Marble" / "Black Marble" | Public domain (NASA) | The Earth globe during the coast and in the lunar sky |
| Sky model | three.js `examples/jsm/objects/Sky.js` (Preetham) | MIT | Physically based dusk and sunrise, blended with our own gradient for the Chinook arch |
| Props: houses, trees, lamps, fences, rocks, launch tower | [Kenney](https://kenney.nl/assets) City and Space kits, [Quaternius](https://quaternius.com/) | CC0 | Filling the street, campus edge and Mars yard |
| HDRIs and ground textures | [Poly Haven](https://polyhaven.com/) | CC0 | Lighting reference, asphalt, concrete, grass, regolith |
| Bloom, depth of field, vignette | pmndrs `postprocessing` | Zlib | The high-tier look |

- **Meshy** only if we want a hero object that code can't do well. It costs credits, so I'd ask first.
- **Not used: the KameHouse repo's code, models or textures.** It has no license, which means all rights are reserved. The house itself is Kame House from *Dragon Ball*, so its model is also Toei's character IP. Everything above is free to use, looks better on a portfolio than borrowed fan art, and avoids any takedown risk.

**Art direction: a hand-built model railway at changing times of day.**
- Matte, slightly clay-like surfaces, chunky geometry and warm practical lights.
- A tilt-shift depth of field on the high tier, so the world reads as a lovingly made miniature.
- The Calgary chapter carries the Chinook arch: a band of clear amber sky under a lid of cloud, the weather my business is named after.

| | Palette |
| --- | --- |
| Night street | slate `#1d2430`, sodium amber `#f2a541` |
| Chinook sunrise | arch amber `#f6c177`, cloud lid `#3a4256` |
| Campus | brick `#9a4a3a`, grass `#5d7a4a` |
| Mars yard | rust `#b4532a`, dust `#e3b48a` |
| Moon | regolith `#8d8a84`, space `#05060a` |
| Accent | signal red `#d8342c`, used only for the thing you can touch at each stop |

---

## 5. Phones, slow devices, and accessibility

- **Quality tiers** (`quality.ts`, chosen by `detect-gpu` and screen size):

| | High (desktop GPU) | Medium (laptops, recent phones) | Low (older phones) |
| --- | --- | --- | --- |
| Pixel ratio | up to 2 | up to 1.5 | 1 |
| Shadows | soft, one sun | one sun, small map | baked blobs only |
| Props | full | 50% instances | 25% |
| Post | depth of field, bloom | none | none |
| Biomes rendered | current + next | current + next | current only |

- **Photograph fallback.** With no WebGL, a failed load, or a "low" tier that still drops frames, each stop becomes a captured photograph with the same card and the same interactions that are pure HTML (kiosks, dossiers). This is the museum's pocket guide again, already proven. `scripts/capture-plates.mjs` is adapted to shoot every stop.
- **Phone layout.** The world fills the top 60% of the screen and the card sits below, as in the current pocket guide. Interactions get touch-sized controls in the card instead of fiddly in-scene taps.
- **Reduced motion.** No scrubbed camera: each stop is a still framing, and scrolling cross-cuts between them with no tween. Text is visible immediately.
- **Keyboard and screen readers.**
  - Every stop's card is a real section with a heading, in order.
  - Arrow keys move stop to stop, and "Skip the drive" is the first focusable link.
  - Kiosks stay native `<dialog>` elements.
  - The canvas is `aria-hidden` and decorative; nothing important exists only in 3D.

---

## 6. Performance budget

| Item | Budget |
| --- | --- |
| JS on first load, before the world | under 30 KB gz (cards, trip meter, tier check) |
| World JS (three + gsap + lenis + journey) | under 230 KB gz, loaded after first paint |
| Models and textures | under 3 MB total; the rover under 500 KB; Moon textures load at the garage stop |
| Frame rate | 60 fps on a mid-range laptop, at least 40 on a recent phone at the medium tier |
| Lighthouse (production) | 90+ performance and accessibility |
| First paint | the title card and a poster image of the driveway, before any 3D loads |

---

## 7. Build phases

Each phase ends with something you can open on localhost and judge. The order puts **feel before looks**: if the scroll doesn't feel right with grey boxes, nicer art won't save it.

| Phase | What gets built | Done when |
| --- | --- | --- |
| **0. Feel spike** | On `/journey/`: grey-box road, a box rover, 4 stops (home, campus, launch pad, Moon), the master timeline, drive/dwell, directional snapping, the trip meter, cards, and a grey-box version of the whole launch storyboard with both cuts | Scrolling home to Moon feels good with grey boxes; one flick always ends at a stop; the launch already gives you chills without textures; tested on your phone |
| **1. Blockout** | All 13 stops placed on the real route; terrain per biome; occlusion by bends and crests; time-of-day sky | No stop is visible before its bend; light changes carry the story on their own |
| **2. Interactions** | Port every stop interaction from `sculptures.ts`; wire kiosks and dossiers; cards per stop | Every stop has one working thing to do, on desktop and touch |
| **3. The rover** | CadQuery rover, GLB, wheels turn with distance, suspension follows terrain | You'd screenshot the rover on its own |
| **4. Art pass** | Materials, Chinook arch, props, practical lights, depth of field and bloom on high tier, film grain | It reads as a crafted miniature, not a tech demo; palette holds in every chapter |
| **5. Tiers and fallback** | Quality tiers, photograph fallback, reduced motion, keyboard path | Low tier holds frame rate; no-WebGL and reduced motion read fully |
| **6. Ship** | Remove the museum, update README and log, Lighthouse, deploy | Budgets met; screenshots at 375, 768 and 1440 px |

---

## 8. Risks and how the plan handles them

| Risk | Mitigation |
| --- | --- |
| It's a big build and drags on | Phases ship value in order; Phase 0 alone tells us whether to continue |
| Scroll feels hijacked | Native scroll, Lenis only smooths, and snapping happens only after you stop |
| Phones stutter | Tiers, only the nearby biomes render, photograph fallback, and phone testing from Phase 0 |
| Recruiters don't have 2 minutes | "Skip the drive", the archive below, and the trip meter to jump |
| Text unreadable over a busy 3D world | Cards are DOM on a solid panel; the scene darkens behind them during dwell |
| Camera framings take forever to tune | All framing in `journey.ts`, and a `?debug` panel to tune live and copy values out |
| Copying the reference by accident | No code, models or textures from it; different subject, structure and art direction |

---

## 9. Decisions (answered 2026-11-25)

1. **Concept:** yes. Leave the house, go to school, board a rocket, fly to the Moon. The execution and animation are the priority.
2. **HTML archive below the journey:** kept, with "Skip the drive" in the top bar.
3. **Rover:** CadQuery, as planned. A box rover stands in during Phases 0 to 2.
4. **Outside assets:** allowed, from the open-source and public-domain sources in section 4. Not from the KameHouse repo.
5. **Sound:** in scope for the art pass, muted until the visitor turns it on. Sources must be CC0 (for example freesound.org's CC0 filter) or generated in code with the Web Audio API.
6. **Dependencies:** any are fine; each is pinned and noted here when added.

Still open, to settle during Phase 0:
- The exact stop list between campus and the launch pad (garage and Mars yard as separate stops, or merged into one "rover team" stop to keep the scroll short).
- Whether the title stop shows the full lede or just the headline, with the lede on the first stop.
