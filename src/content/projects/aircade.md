---
order: 9
title: AIRCADE — Motion-Controlled Arcade
status: PROTOTYPE
stack: VITE / JAVASCRIPT / CANVAS / THREE.JS / SWIFT / COREMOTION / WEBSOCKET
summary: A five-game browser arcade exploring keyboard, local two-player, and experimental AirPods motion controls.
contribution: Contributed the browser motion-input path, control mapping, and bowling integration in a collaborative hackathon build.
problem: Revisit classic arcade play with more embodied controls while keeping the games playable from a keyboard.
system: Five browser game modules include Pong, Snake, Breakout, Bowling, and Tanks. A Swift CoreMotion sender, sample normalizer, and local WebSocket relay are present, but the team judging notes say live end-to-end motion play was not yet validated.
decision: Keep keyboard play as the reliable fallback and label AirPods motion experimental until the sender, transport, and per-game mappings are tested together on hardware.
next: Validate pairing, permissions, calibration, relay connectivity, and each claimed motion/game mapping; publish only combinations verified in a live run.
link: https://github.com/aj0khi/aircade-mru-hacks
linkLabel: VIEW TEAM REPOSITORY
group: software
year: "2026"
role: Motion-input contributor, hackathon team
highlights:
  - "Five browser games: Pong, Snake, Breakout, Bowling, Tanks."
  - "Swift CoreMotion sender and sample normaliser."
  - "Local WebSocket relay between phone, AirPods, and browser."
team: Built at MRUHacks with Mudassar Alvi, Tung Le, Mia Ahamed, and Pranav Kumar.
lesson: "The idea was to use the motion sensors already inside AirPods like a Wii Remote. The hard part was not the games but the path from a head-worn sensor to a browser: pairing, permissions, calibration, and a relay. That is why keyboard play stays the reliable fallback."
---
