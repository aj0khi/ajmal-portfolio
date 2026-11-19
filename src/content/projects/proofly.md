---
order: 11
title: Proofly — Community Work as Skill Evidence
status: PROTOTYPE
stack: NODE.JS / EXPRESS / SQLITE / WEB CRYPTO ED25519 / INDEXEDDB / AUTH0 / STRIPE IDENTITY / AWS BEDROCK / GROQ
summary: A Hack the Change prototype that turns community work into signed, verifiable evidence of job-relevant skills.
contribution: Largest single contributor on a three-person team, with 32 of 52 commits.
problem: Volunteer and community work builds real skills, but employers have no trustworthy way to see them.
system: A Node and Express app with a student dashboard, example projects, a community vouch form, simulated coordinator review, Ed25519-signed credentials, and a separate employer lens.
decision: Keep the demo fictional and account-free, keep secrets in host environment variables, and treat the identity and organisation verification flows as not production-ready.
next: Harden identity verification and persistent credential storage before collecting any real personal information.
link: https://github.com/aj0khi/hack-the-change
linkLabel: VIEW SOURCE
group: software
year: "2026"
role: Lead contributor, three-person hackathon team
highlights:
  - "Signed credentials using Ed25519 through the Web Crypto API."
  - "Trusted-issuer allowlist for credential verification."
  - "Employer Lens: paste a job description and see which skills have real quotes behind them, using Groq and AWS Bedrock with live Calgary postings from Adzuna."
  - "Auth0 sign-in, Stripe Identity in test mode, and a public Badgr badge lookup."
  - "Deployed on Hostinger."
team: Built at Code the Change YYC's Hack the Change 2026 with Farhad Alizada and Attash Yusofi.
lesson: "Hostinger loads the entry file differently from our local setup, so the deployed app broke. We split app creation from startup and added a test for it. The bigger lesson was about honesty: a signature proves a testimonial wasn't tampered with, not that it's true, and the demo says so."
---
