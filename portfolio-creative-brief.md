# Aj's Portfolio — Creative Direction & Build Brief

**Purpose of this document:** this is a design and content spec, meant to be handed directly to an AI coding tool (Copilot) or read by a human developer before any code is written. It is not marketing copy — it's the reasoning, the structure, and the real content, so implementation doesn't have to guess.

---

## 0. Instructions for whoever builds this (Copilot included)

1. **Inspect before you build.** If a project/repo already exists, look at what's there first. Preserve anything usable — don't blow away existing structure just to start clean.
2. **Do not invent content.** Every fact in this brief is real, sourced from Aj directly. Anywhere content is marked `[PLACEHOLDER — needs Aj]`, leave it as an obvious placeholder rather than filling it with a fabricated job, stat, or accomplishment.
3. **Restraint over spectacle.** This brief calls for two or three deliberate signature moments, not constant motion. If you're tempted to add an effect "because it looks cool," check it against Section 7 first.
4. **Ship v1 lean.** Section 8 marks what's essential for launch vs. what can come later. Don't block launch on the ambitious stuff.

---

## 1. The Creative Direction

### The concept: **Build Log**

The site is framed as an engineer's working log, not a marketing page. It reads like someone documenting real systems as they're built — decisions, what broke, what's next — rather than a resume dressed up in CSS.

**Why this, specifically, for Aj:** there's a real throughline in his background that most portfolios would bury — he's spent years working with *physical systems that have to keep running*: HVAC compressors and thermostats at HVAC Express, pumps and nozzles at Chinook Clean, and now actuators and joints on a ROS2-controlled surgical arm at WayBionic. That's not a coincidence to hide — it's the most interesting thing about him. A talent scout reading "runs two real service businesses and builds robotics control systems as a CS student" pays attention in a way "made a to-do app" never will. The Build Log concept exists to make that throughline visible without stating it outright.

It also solves the "still a student" problem honestly: a log format *expects* things to be in progress, revised, half-finished. Calling something "IN PROGRESS" in a build log reads as normal practice, not as a weakness — which is exactly the trajectory framing that fits where Aj actually is.

**What this is explicitly not:** no dark-mode-default hacker aesthetic, no glowing gradients, no glassmorphism, no hero text that says "Building the future," no typewriter effect, no stock 3D robot render. If it looks like it came out of a portfolio generator, it's wrong.

### Concepts considered and rejected

| Concept | What it would look like | Why not this |
|---|---|---|
| Mission Control / robotics HUD | Dark control-panel theme, live telemetry-style readouts | Reads as a costume — "hacker dashboard" is itself an overused portfolio trope, and it oversells projects that are honestly mid-build |
| Documentary / cinematic scroll | Full-bleed video and photo moments, voiceover-style copy | Needs real footage/photography Aj likely doesn't have yet; risks looking staged rather than earned |
| Product spec sheet ("Aj, the product") | Treats Aj like a datasheet — dimensions, specs, "installation instructions" | Cute once, then grating; undercuts seriousness with robotics-industry recruiters who want signal, not a gimmick |
| **Build Log (chosen)** | Editorial-technical hybrid, project entries as log entries, one signature diagram | Matches real material he has today, buildable cleanly without heavy dependencies, scales as new projects land, fits the "early career, honest trajectory" framing |

---

## 2. Narrative structure (not Hero → About → Skills → Projects → Contact)

The visitor experience unfolds in this order:

1. **Signal** (first 10 seconds) — states who Aj is and gives one line of proof, not a greeting
2. **What I Build** — the projects, as log entries, ranked by relevance not chronology
3. **How I Think** — one real annotated engineering decision, shown, not summarized
4. **What I've Actually Done** — HVAC Express, Chinook Clean, WayBionic, presented as real roles
5. **Where I'm Headed** — the robotics roadmap and the explicit ambition, stated plainly
6. **Get in Touch** — resume, contact, links

This order intentionally leads with *evidence* before biography — a recruiter should see what he builds before they read his life story.

---

## 3. Visual language

### Typography — the core device
Two typefaces carry two different "voices," and the contrast between them is the whole visual system:

- **Narrative voice (the human layer):** a warm, editorial serif with real character — recommend **Fraunces** (free, Google Fonts, variable weight/optical size). Used for section intros, the About/origin narrative, and any first-person writing.
- **Technical voice (the engineering layer):** a clean monospace — recommend **IBM Plex Mono** or **JetBrains Mono** (both free, Google Fonts). Used for anything that's data: stack tags, status labels, joint names, code, dates, metrics.

Every project entry should visibly switch between the two — prose in the serif, specs and status in the monospace. That switch *is* the design language; it doesn't need any other decoration.

### Color
Keep it to three: a warm off-white "paper" background, a near-black "ink" text color, and **one** utility accent — a safety-orange or safety-yellow, the kind used on real equipment service tags. Use the accent only for status labels and active states, never decoratively. This isn't an arbitrary trend color — it's a direct, honest reference to the equipment-tag world Aj actually works in at HVAC Express.

### Grid, texture, motion
- Generous margins, asymmetric column widths — avoid the centered-card-grid look entirely.
- A barely-visible graph-paper texture (3–5% opacity) in the background nods to a field notebook without being cute about it.
- Scroll reveals should feel like advancing through a log, not a generic fade-up — content can shift by section, not uniformly.
- Hover states on project titles reveal their status tag and stack in the monospace voice — a small, consistent piece of "layered depth" that rewards a closer look without demanding one.

### The signature moment
One real interactive centerpiece: a simple SVG line diagram of the WayBionic arm's joints (`base_yaw`, `shoulder`, `elbow`, `wrist_roll`), hoverable, with each joint revealing its real status. This is the single place where "the interface demonstrates the engineering" — built in plain SVG and light JS, no 3D library needed. Keep everything else visually quiet so this moment stands out.

---

## 4. Content, section by section (real facts only)

### Signal
> Studying computer science at the University of Calgary. Building systems that move — from HVAC compressors to a ROS2-controlled surgical arm.

(One line, no "Hi, I'm Aj, a developer.")

### What I Build — project log entries

Each entry uses: **Status** → **Problem** → **System** → **Decisions** → **What's next**. Status is one of `ACTIVE` / `IN PROGRESS` / `SHIPPED`.

**1. WayBionic — ROS2 Ground Station** · `ACTIVE`
- Problem: give a remote operator real visibility and control over a surgical robotic arm without touching real hardware carelessly.
- System: ROS2 Jazzy ground station, RViz-based Engineering Monitor, a motion-test panel (RUN/HOME/STOP) publishing commands to a simulated joint-state driver.
- Real decisions worth showing: choosing to keep the movement test simulated/RViz-only rather than wiring direct hardware control before it's ready; not treating CAD-exported joint names and limits as final until the team confirms actual actuated joints and units.
- What's next: integrating the real `full-arm-smaller` arm model once the complete asset package (URDF + mesh/STL) arrives, replacing the placeholder cylinder model.

**2. Personal Robotics Roadmap** · `IN PROGRESS`
- Problem: build real robotics skill in sequence, without needing to buy hardware up front.
- System: starting with Hugging Face LeRobot in MuJoCo simulation (imitation learning), then NVIDIA Isaac Lab for RL-based locomotion, then ROS2 Nav2/SLAM.
- Decision worth showing: swapping the physical LeRobot SO-101 kit for its simulated MuJoCo environment specifically to keep the project free while still learning the same skills.
- What's next: SmolVLA fine-tuning as a stretch goal.

**3. HVAC Express** · `SHIPPED`
- Problem: a family-run Calgary HVAC company needed a real web presence and someone to own its technical infrastructure.
- System: the company site and infrastructure at calgaryhvacexpress.ca, built and maintained on WordPress.
- Aj's role: owns the technical side (site, infrastructure) and does direct sales — a rare pairing of build-it and sell-it.

**4. Chinook Clean** · `ACTIVE`
- A power-washing business Aj owns and runs. Worth a compact entry rather than a full case study — the point it makes is entrepreneurship and ownership, not engineering depth.

*(Optional 5th entry if there's room: the CS20/CS30 Rover Project — a Java program using the Phidgets SDK and TCP/IP — a good early example of hardware-adjacent systems work, if Aj wants a fourth technical entry.)*

**Do not include:** the "sneaky" GitHub-commit-automation tool. A tool built specifically to artificially inflate commit history reads badly to any technical recruiter who figures out what it does — it costs more credibility than it could ever add.

### How I Think
One real annotated decision, shown directly rather than described. The WayBionic call to keep hardware control simulated-only until it's genuinely ready is a good candidate — it's a real, specific, low-drama engineering judgment call that says more about how Aj thinks than a paragraph of adjectives would.

### What I've Actually Done (Experience)
- **HVAC Express** — technical lead (site + infrastructure) and direct sales, family-run Calgary heating and cooling company.
- **Chinook Clean** — owner, power washing business.
- **WayBionic Robotics** — UCalgary club, ROS2 ground station for a remote-teleoperated surgical arm.

### Where I'm Headed
State it plainly, once: aiming toward a top-tier robotics company (Boston Dynamics-tier), currently searching for robotics-related internships across Canada and the US, working through the personal robotics roadmap above in parallel with a Computer Science degree (expected graduation April 2030, transferred from Mount Royal University).

**Certifications:** Cisco Introduction to Cybersecurity, Google Introduction to Generative AI, Google Introduction to Large Language Models (all issued July 2026).

### Skills (grouped, not a badge wall)
- **Languages:** Java, Python, JavaScript / Node.js
- **Robotics & systems:** ROS2, RViz, URDF, MuJoCo, NVIDIA Isaac Lab, SLAM / Nav2
- **Web:** WordPress, Node.js, PHP/HTML
- **Certifications:** listed above

### Get in Touch
Resume PDF `[PLACEHOLDER — needs current resume file from Aj]`, email, GitHub, LinkedIn. Keep this section fast to scan — recruiters skimming for contact info shouldn't have to hunt.

---

## 5. Technical implementation spec

- **Stack:** static HTML/CSS/vanilla JS (or a very light framework like Astro if preferred) — no heavy frontend framework, no 3D library. The signature diagram is plain SVG with CSS/light JS interactivity.
- **Structure:** componentize by section (`signal`, `projects`, `how-i-think`, `experience`, `roadmap`, `contact`); one project-entry template reused for every log entry.
- **Motion:** `IntersectionObserver`-driven reveals, respecting `prefers-reduced-motion`.
- **Accessibility:** semantic HTML throughout, real alt text on the diagram, keyboard-navigable joint hover states, sufficient contrast on the paper/ink palette.
- **SEO basics:** proper meta tags, Open Graph tags, sitemap.xml.
- **Fonts:** Fraunces + IBM Plex Mono (or JetBrains Mono) — both free via Google Fonts, no licensing issue.
- **Contact form:** since this is a static site, handle the form with one small PHP endpoint (Hostinger supports PHP natively) rather than adding a third-party form service.
- **Hosting/deploy:** push to a GitHub repo, connect it in Hostinger's hPanel under Advanced → Git (OAuth-based, no SSH setup needed) — this requires a Premium or Business Hostinger plan. Once connected, every push to `main` triggers an automatic redeploy.

---

## 6. Asset checklist — what's actually needed from Aj before this can be finished

- A current resume PDF
- A short screen recording or GIF of the RViz visualization (even rough, it's more convincing than any description)
- Confirmation of the real joint names/limits for the signature diagram, or an explicit "simulated, pending confirmation" label if not yet finalized
- Optional: any photos from HVAC Express or Chinook Clean work, if he wants a visual anchor for those entries

---

## 7. Critical notes (the creative-director pushback)

- **Cut sound entirely.** There's no genuine case for it here — it adds risk for no real payoff on a portfolio site.
- **Concentrate the craft.** Put the real effort into the joint diagram and the "How I Think" decision excerpt. Everywhere else should be visually quiet by comparison — trying to make every section equally elaborate will dilute the two moments that actually matter, especially building solo with Copilot on a deadline.
- **Keep status tags honest.** "IN PROGRESS" is a feature of this concept, not a flaw to hide — don't let anyone talk this into overselling a half-built project as finished.
- **Don't add the fourth Rover project entry just to fill space.** Three strong entries beat four uneven ones.

---

## 8. What's essential for v1 vs. what can wait

**Ship first:** Signal, What I Build (WayBionic + Roadmap + HVAC Express, at minimum), Experience, Get in Touch, and the signature joint diagram.

**Can follow in v1.1:** the "How I Think" decision excerpt, the Chinook Clean entry, the Rover project entry, any refinement to hover-state depth. None of these should block getting a working, honest version live before internship application deadlines.
