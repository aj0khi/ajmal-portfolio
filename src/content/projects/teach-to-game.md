---
order: 7
title: Teach to Game
status: IN PROGRESS
stack: PYTHON / REINFORCEMENT LEARNING / PLAYWRIGHT / LOCAL LAB
summary: A local reinforcement-learning lab with explicit game objectives, editable reward signals, and a Python PPO runner evaluated against a seeded random baseline.
contribution: Shaped the target-aware Snake learning flow and live product dashboard; the portfolio also contains a separate in-browser tabular Q-learning teaching demo.
problem: Training setups need an honest objective and reward signal instead of guessing what success means from a game screen.
system: The repository uses Gymnasium and Stable-Baselines3 PPO for a numeric runner, logs episode reward and length to CSV, saves a checkpoint, and supports deterministic evaluation against a seeded random baseline. The browser demo is a separate 9x9 tabular Q-learning model that runs only in the current page.
decision: Make objectives, rewards, and adapter controls explicit; keep training local and require user-provided game mappings so an agent cannot silently optimize the wrong signal.
next: Retain and review reproducible training logs before publishing results or learning curves; keep third-party game adapters user-owned and outside online or anti-cheat games.
link: https://github.com/aj0khi/teach-to-game
linkLabel: VIEW SOURCE + TESTS
---
