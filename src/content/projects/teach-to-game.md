---
order: 7
title: Teach to Game
status: IN PROGRESS
stack: PYTHON / REINFORCEMENT LEARNING / PLAYWRIGHT / LOCAL LAB
summary: A local reinforcement-learning lab where an agent learns games from explicit goals, target scores, and user-provided reward signals.
problem: Training setups need an honest objective and reward signal instead of guessing what success means from a game screen.
system: Self-contained Snake and runner practice games, a local server, configurable goals, target scores, and optional browser or desktop adapters.
decision: Keep training local and require a user-provided adapter for real games so the agent cannot silently learn the wrong reward function.
next: Expand the adapter boundary for user-owned browser or desktop games while keeping anti-cheat and online-game scope out.
---
