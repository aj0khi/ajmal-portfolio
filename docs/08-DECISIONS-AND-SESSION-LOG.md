# Decisions and Session Log

## 2026-11-18 — Discovery and first corrections

- **Repository:** `main` at `4371e59`; changes remain local and unpushed.
- **Scope searched:** the current portfolio checkout and bounded name searches in the standard `~/projects`, `~/dev`, and `~/code` roots. No related project repository paths were returned; no broader folders were scanned.
- **Phase 0 findings:**
  - The build generates `/` and `/404.html`; there is no `/explore/` route. The README's Aero Explorer walkthrough was stale, and a local request to `/explore/` returned 404.
  - Project-card links ignored `linkLabel`, so the HVAC Express live-site link was presented as `OPEN SOURCE`.
  - WayBionic's local UI includes a scripted stale/future-state sample lab and a lazy-loaded browser-only 3D simulation. Neither connects to ROS or sends hardware commands.
  - The BlackBox browser demo hashed changing DOM text, displayed truncated hashes, and labeled a mutation without verifying against a stable baseline. Its interface did not clearly explain the limits of the illustration.
  - The two existing mock RViz captures were JPEG bytes under `.png` names and exposed a machine-local path in their title bars. The working copies were cropped to remove that title bar and re-encoded as PNG; the remote version has not been changed.
  - No `docs/` directory existed in the checkout. This log and `asset-register.csv` record sanitized repository-relative references only.
- **Implemented locally:**
  - Project-card links now use authored labels; recruiter actions expose the existing GitHub and LinkedIn destinations alongside resume, email, and the tour.
  - WayBionic's mock/simulation boundary is explicit in the project window.
  - The BlackBox interaction now hashes fixed event records, verifies later edits against an in-memory baseline, reports the first mismatching event, and describes its security limitations.
  - DOM containers use `replaceChildren()`, and the window animation stagger uses `sibling-index()` with the prior `:nth-child()` timings as a fallback.
  - README route claims now reflect the generated routes.
- **Baseline:** Node `v22.23.3`, npm `10.9.9`; dependencies were already installed, so `npm ci` was not run. `npm run check` passed with 0 errors, 0 warnings, and 0 hints. `npm run build` passed and emitted the existing >500 kB chunk advisory.
- **Browser QA:** Firefox was installed for interactive testing. The integrated browser verified BlackBox baseline/mutation/restoration states, the WayBionic evidence boundary and image loads, stale/future diagnostics, recruiter links, command palette, calendar, calculator, and 320/390 px layouts without document-level horizontal overflow.
- **Evidence/permissions still needed:** WayBionic team approval for public screenshots/video; current resume approval/freshness; retained training runs before publishing performance claims; hardware validation before claiming Aircade motion controls work end-to-end.
- **Next task:** continue case-study improvements only where local source or permission-cleared evidence supports the claims; retain local-only changes until explicitly approved for publication.

## 2026-11-18 — Keyboard and terminal follow-up

- **Issue found:** with both Calculator and Terminal open, the document-level calculator key handler intercepted Enter regardless of focus. The terminal form also lacked a submit button, so Enter could not trigger its command handler through native implicit form submission.
- **Fix:** calculator keyboard controls now run only when the event target is inside the Calculator window. The terminal has an accessible, visible `RUN` submit button and supports Enter-to-submit while preserving the existing command handler.
- **Verification:** in the integrated browser, with both windows open, Calculator keyboard input `1 + 2 Enter` displayed `3`; Terminal `help` submitted with Enter, `about` submitted with the `RUN` button, and the input cleared after submission. `npm run check` passed with 0 errors, warnings, or hints; `npm run build` passed with the existing >500 kB chunk advisory; `git diff --check` passed.
- **Dev-server note:** browser navigation produced an existing Vite `Outdated Optimize Dep` 504 for the Three.js development dependency. It did not prevent the tested form interactions or successful production build.
- **Deployment:** all changes remain local; nothing was pushed or deployed.

## 2026-11-18 — Project case-study expansion

- **Content source:** the eight existing Markdown project records already contain problem, system, decision, and next-step fields. The portfolio now exposes those fields in a native, keyboard-operable case-study disclosure on every project card, showing in-progress systems as **CURRENT DESIGN** rather than implying completion.
- **Link and claim cleanup:** the Rover card now uses the source link already present in its project window. The BlackBox card summary describes it as a local-first evidence recorder without asserting that the ongoing project is already secure.
- **Implementation:** shared case-study markup lives in `src/pages/index.astro`; styling lives in `src/styles/global.css`; Rover and BlackBox card metadata are in `src/content/projects/autonomous-rover.md` and `src/content/projects/physical-ai-blackbox.md`.
- **Verification:** generated HTML contains eight case-study disclosures and the Rover source link. Browser QA confirmed a project disclosure opens with Enter, definitions remain within the card at 390/320 px (with subpixel rounding only), and those widths have no document-level horizontal overflow. `npm run check`, `npm run build`, and `git diff --check` passed; the build retains its existing >500 kB chunk advisory.
- **Evidence boundary:** no new project metrics, completion claims, team artifacts, or training results were added. Source repositories, permission-cleared media, and current resume approval remain open evidence tasks.
- **Next build increment:** strengthen project-specific engineering narratives only when corroborated by authorized source code or approved records; make the existing status/architecture fields more precise where needed.

## 2026-11-18 — Source-backed project detail

- **Teach to Game:** checked the public repository README, `learner/runner_training.py`, and its training test. The project record now describes the Gymnasium/Stable-Baselines3 PPO runner, CSV episode logs, deterministic evaluation, and seeded random baseline; the test's target is not presented as a measured result.
- **Snake demo boundary:** the portfolio's 9×9, 72-state tabular Q-learning widget is explicitly distinguished from the repository's Python PPO runner. Its disclosure documents the three relative actions, update settings, reward components, 80-step cap, and that the displayed mean is from the final 10 training episodes—not held-out evaluation—and is not persisted.
- **Soccer Intelligence:** checked the public repository's event pipeline, state aggregation, bounded Poisson-style estimate, evidence-linked insights, tests, and optional Event Hubs adapter. The project record marks input as synthetic and estimates as uncalibrated; no real-match accuracy claim is made.
- **WayBionic:** refined the project record to describe the five-joint RViz digital twin, simulation-default drive path, and monitoring-only mock/live diagnostics panel. It separates commanded/estimated motion from measured physical feedback.
- **Aircade:** added the ninth project using the public team repository and its source/pitch materials. The record describes the five browser games and the Swift CoreMotion/WebSocket components as prototype scope; end-to-end motion control remains explicitly unvalidated and keyboard play remains the reliable fallback.
- **Implementation:** added the `PROTOTYPE` status and updated archive counts; aligned the Teach to Game and Soccer project windows with their evidence limits; documented content provenance and boundaries in README. Existing card contribution summaries remain visible alongside the expanded case-study details. No external project code or media was copied.
- **Validation:** `npm run check` passed with 0 errors, warnings, or hints; `npm run build` passed with the existing >500 kB chunk advisory; `git diff --check` passed. Generated HTML assertions confirmed nine project cards/disclosures and current counts. Playwright browser checks verified keyboard operation of the Aircade and Snake disclosures, Aircade/Soccer/Teach to Game evidence boundaries, no document overflow at 390 px, and zero page errors.
- **Release:** portfolio changes were pushed to `origin/main` as `8bbfa07`, followed by this release note. Hostinger initially served the October 28 build, then updated to a November 18 build. A live HTML check confirmed the nine-item archive, Aircade prototype scope, Snake method disclosure, and Soccer model caveat. The repository has no GitHub Actions workflows or GitHub Pages deployment configured; the observed redeploy was handled by the external Hostinger connection.

## 2026-11-18 — Workcell redesign and content fill

- **Direction:** the main route moved from the retro AjmalOS desktop to a scrolling "Workcell" page: a robot work cell at night, safety-tape yellow for status, and telemetry cyan for live data. The classic desktop is preserved unchanged at `/os/`.
- **Signature moment:** a procedural Three.js arm in the hero tracks the pointer with closed-form IK and a live `/joint_states` readout. It is labelled as a demo arm, not the WayBionic robot.
- **New interactive panels:** a rover obstacle-avoidance re-creation (labelled as not the original Java), a Poisson outcome explorer (labelled as the model family, uncalibrated), and a GitHub activity panel that loads live data and falls back to a dated snapshot. The existing stale-state, hash-chain, Snake, and HVAC demos were re-skinned in place; Snake now reads its palette from CSS custom properties, so `/os` keeps its original look.
- **Content added (sources):** resume bullets for HVAC Express (token CSS migration, multi-domain hosting, credential remediation, SEO); coursework projects from the resume; certifications from the creative brief; SouthPoint (NASA Space Apps) and Proofly (Hack the Change) from their public READMEs, with commit counts from the GitHub contributors API (13 of 81 and 32 of 52 respectively). No metrics, outcomes, or hardware claims were added.
- **Service worker:** pages now load network-first (cache `ajmal-workcell-v4`), so returning visitors get the new build instead of a cached old page.
- **Verification:** `npm run check` reports 0 errors, warnings, or hints; `npm run build` passes. Playwright with Chromium (SwiftShader WebGL) at 375, 768, and 1440 px showed no page errors and no horizontal overflow. Reduced motion leaves all content visible, the keyboard order starts with the skip link, the Ctrl+K terminal runs commands, and `/os/` returns 200.

## 2026-11-18 — The Collection (museum redesign)

- **Direction:** the main route became a scroll-driven museum walk. A Three.js hall sits behind HTML placards; each room's picture lights, curtains, and sculpture motion wake as the visitor arrives. The palette was revised to red and black (crimson damask, ebonised wood, gilt frames) at the owner's request.
- **New evidence used:** the WayBionic old-arm URDF and STL meshes from the team's public, MIT-licensed repository; screenshots captured from local runs of Soccer Lab, SouthPoint, Aircade, Proofly, and Teach to Game, plus the live HVAC Express site; the owner's Schulich Space Rover Team Controls commits (a Damiao CAN motor integration study) for a new exhibit; and the owner's LinkedIn profile and posts. From those: the diagnostics CLI story and its 11 regression tests, the Elections Alberta and TEDxIsmaili roles, the AWS certification, hackathon teammates and events, and the plasma-blade preprint's findings.
- **Interactive exhibits:** URDF joint sliders, a hash-chain tamper control, a sun-angle slider, and a hold-to-spray wash. Kiosks hold the stale-data lab, an arm-bus planner checked against the rover study, the hash-chain demo, the Snake lab, the rover sim, the Poisson explorer, a live Ed25519 sign-and-tamper demo, and the HVAC calculator.
- **Date conflicts left for the owner:** HVAC Express start (resume Mar 2024, LinkedIn Mar 2023), UCalgary graduation (resume 2029, LinkedIn Apr 2030), and MRU Learning Peer dates (resume Feb–May 2026, LinkedIn Oct 2025–Apr 2026). The site follows the resume until these are reconciled.

## 2026-11-25 — One room per scroll, and a pocket guide for phones

- **Problems found:** rooms were 190–200vh tall and the camera only moved in the first 45% of each, so a visitor had to scroll far before a room settled. Between rooms the camera turned to look nine metres down the hall, which is where the room after next hangs, so going from room 1 to 2 briefly showed room 3. Phones ran the full Three.js hall (shadows, per-frame curtain geometry, a >500 kB chunk).
- **Navigation:** every room is one screen and a mandatory snap stop (`scroll-snap-stop: always`). Wheel, trackpad and arrow keys step exactly one room once their direction is clear, swallowing trackpad inertia; touch keeps native snapping. The archive below the hall is one large snap area, so it scrolls freely.
- **Sweep:** the hall no longer flies between rooms. It freezes the current frame, cuts to the next room off-screen and slides in over it, alternating direction (odd rooms from the right, even from the left; walking back reverses). Placard text rises in reading order and title words climb out of masks. Reduced motion cuts with no sweep or reveal.
- **Phones:** portrait or narrow screens and no-WebGL browsers get the pocket guide: photographs of the live hall captured by `scripts/capture-plates.mjs`, the same sweep in CSS, and no Three.js download. Desktop uses the photographs as a loading poster.
- **Placards:** each fits on one screen; problem, system, decision, screenshots and skills moved to a dossier drawer per room. Added an outlined room numeral, a gilt progress thread, film grain, and an entrance scroll cue.
- **Verification:** `npm run check` 0 errors, warnings or hints; `npm run build` passes (Three.js stays a separate chunk loaded only on wide landscape screens). Playwright (Chromium, SwiftShader) at 1440×900, 768×1024 and iPhone 13 showed no page errors and no horizontal overflow, and confirmed one wheel tick per room, entry from and return to the archive, keyboard steps, mid-sweep composition, and that phones request no Three.js.

