---
order: 8
title: Soccer Intelligence Lab
status: IN PROGRESS
stack: NEXT.JS / REACT / TYPESCRIPT / SYNTHETIC EVENTS
summary: A Next.js and TypeScript prototype that turns synthetic football events into match state, probability estimates, evidence-backed insights, and recaps.
contribution: Built the event-source pipeline, synthetic event processing, probability and insight layers, replay experience, and optional Azure Event Hubs adapter.
problem: Football data becomes useful when raw events can be connected to metrics, explanations, and experiences for different audiences.
system: A provider-neutral event source feeds validated events into derived match state, a bounded Poisson outcome model, evidence-linked insights, and audience-specific recaps. Synthetic input works locally; Azure Event Hubs is an optional server-side source using DefaultAzureCredential.
decision: Keep raw events, derived state, model outputs, explanations, and presentation payloads separate; label all current match data synthetic and treat probabilities as an uncalibrated prototype.
next: Validate event handling and model calibration with licensed real match data before presenting probability outputs as predictive.
link: https://github.com/aj0khi/soccer-hackathon-project
linkLabel: VIEW SOURCE + ARCHITECTURE
---
