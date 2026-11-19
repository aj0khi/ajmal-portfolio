---
order: 6
title: Physical AI BlackBox
status: ACTIVE
stack: PYTHON / CBOR2 / CRYPTOGRAPHY / LOCAL SYSTEMS
summary: A local-first evidence recorder for documenting what a physical AI system was told, commanded, and observed.
problem: Physical AI needs an evidence trail that can be reviewed offline without trusting a remote service or hiding the raw record.
system: A typed evidence core, canonical records, hash chaining, sealing and signature verification, a local owner portal, an investigator workbench, and a lightweight witness ledger.
decision: Use established cryptography and deterministic CBOR libraries instead of implementing cryptographic primitives from scratch.
next: Continue hardening the local owner, investigator, verifier, and release-packet workflows.
group: robotics
year: "2026"
role: Solo project
highlights:
  - "Canonical CBOR records linked by a hash chain, then sealed and signed."
  - "Separate owner portal, investigator workbench, and witness ledger."
  - "Established cryptography libraries only; no home-made primitives."
---
