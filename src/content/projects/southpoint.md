---
order: 10
title: SouthPoint — Lunar Landing Site Navigator
status: PROTOTYPE
stack: REACT / VITE / TYPESCRIPT / FASTAPI / SKYFIELD / REACT THREE FIBER
summary: A NASA Space Apps prototype for comparing lunar south-pole landing scenarios by modelled sunlight, Earth visibility, and slope.
contribution: Contributor on the team repository, with 13 commits to the shared codebase.
problem: Landing-site trade-offs between sunlight, line of sight to Earth, and terrain are hard to see for mission teams and the public alike.
system: A React and TypeScript front end with a 2D map, sky dome, sun slider, 3D surface, and side-by-side compare, served by one FastAPI backend that computes Sun and Earth geometry with Skyfield and JPL DE421 and reads LOLA elevation data when installed.
decision: Label every score, shadow, and window as exploratory screening rather than landing guidance, and fall back to clearly marked synthetic terrain when the elevation model is absent.
next: Outputs remain a scenario-comparison prototype; nothing is validated for real mission planning.
link: https://github.com/aj0khi/nasa-space-apps
linkLabel: VIEW TEAM REPOSITORY
group: software
year: "2026"
role: Contributor, hackathon team
highlights:
  - "Ephemeris service: Sun and Earth altitude and azimuth from Skyfield with JPL DE421."
  - "Terrain service: LOLA DEM elevation, cross-sections, and illumination maps."
  - "Heuristic screening score combining sunlight, Earth visibility, and slope."
  - "Compare two or three site and date combinations side by side."
---
