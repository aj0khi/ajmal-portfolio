---
order: 6
title: Physical AI BlackBox
status: ACTIVE
stack: PYTHON / CBOR2 / CRYPTOGRAPHY / LOCAL SYSTEMS
summary: A secure, local-first evidence stack for recording what a physical AI system was told, commanded, and observed.
problem: Physical AI needs an evidence trail that can be reviewed offline without trusting a remote service or hiding the raw record.
system: A typed evidence core, canonical records, hash chaining, sealing and signature verification, a local owner portal, an investigator workbench, and a lightweight witness ledger.
decision: Use established cryptography and deterministic CBOR libraries instead of implementing cryptographic primitives from scratch.
next: Continue hardening the local owner, investigator, verifier, and release-packet workflows.
---
