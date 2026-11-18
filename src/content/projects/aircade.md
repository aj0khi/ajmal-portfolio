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
---
