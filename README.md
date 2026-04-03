# WaffleX

<<<<<<< HEAD
**Adaptive semantic analysis for WAF resilience testing**

WaffleX is a research prototype for analyzing normalization gaps, parser inconsistencies, and enforcement drift across modern web delivery stacks. The current implementation includes a React-based operator interface and a lightweight Node.js backend for sending controlled request variants, collecting response metadata, and managing test corpora.

## Current status

This repository contains the current prototype used for evaluation and demonstration. It is not positioned as a production tool. The present codebase is intended to support:

- authorized security assessments
- defensive validation of WAF and reverse-proxy behavior
- parser-drift analysis in controlled environments
- reproducible testing of response handling and enforcement transitions

## Repository structure

```text
backend/   Express API for request relay, IP checks, and payload corpus management
frontend/  React/Vite user interface for assessment execution and result review
docs/      Architecture and project notes
```

## Implemented prototype features

- **Assessment module** for sending request variants through target paths
- **Resilience testing module** for observing rate-limiting and enforcement transitions
- **Payload corpus editor** for managing reusable test files
- **Response logging** for HTTP status, timing, and execution progress
- **Optional node-side proxy routing** for controlled validation via an intercepting proxy

## Safety and intended use

WaffleX is intended for **authorized environments only**. It should be used for defensive validation, internal testing, research, and lab work. The prototype sends controlled request variants and captures response behavior to help operators understand how layered defenses interpret traffic.

## Quick start

### Backend

```bash
cd backend
npm install
npm start
```

The backend listens on `http://localhost:3001` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the default Vite development port and expects the backend at `http://localhost:3001`.

## API summary

- `GET /api/health` — health check
- `POST /api/check-ip` — resolves egress IP information, optionally through a proxy
- `POST /api/proxy` — relays a single controlled request and returns status and latency
- `GET /api/payloads` — lists payload corpus files
- `GET /api/payloads/:filename` — reads a corpus file
- `PUT /api/payloads/:filename` — updates a corpus file

## Reviewer notes

This repository is being provided so reviewers can inspect the current implementation directly. The code is an active prototype and may continue to evolve, but the current structure is sufficient to review the interface, relay workflow, and corpus-management design.

## License

MIT
=======
**Adaptive Semantic Analysis for WAF Resilience Testing**

> WaffleX is currently an active research and development project.  
> Public code, documentation, and release artifacts are not yet available.

## Overview

WaffleX is a planned web defense validation framework focused on identifying normalization gaps, parser inconsistencies, and layered inspection blind spots across modern application delivery stacks.

Rather than depending on static payload lists, the project is intended to analyze how semantically equivalent requests are interpreted differently by components such as CDNs, reverse proxies, WAFs, frameworks, and origin applications. The goal is to help defenders measure where security assumptions break down and where mature web defenses may still have visibility gaps.

WaffleX is being designed for authorized security testing, defensive validation, and controlled research.

## Project Status

**Status:** Pre-release / In development

This repository is currently being prepared for future publication. At this stage, the project may include:

- evolving research notes
- design concepts
- architecture planning
- controlled testing ideas
- future implementation milestones

A public implementation is planned after the research and tooling are in a form suitable for release.

## Problem Statement

Modern web defense stacks often consist of multiple layers that do not interpret requests in exactly the same way. A single input may be:

- transformed by an edge service
- normalized by a reverse proxy
- inspected by a WAF under one parsing model
- processed by an application framework under another

These differences can create false confidence in enforcement, inconsistent inspection coverage, and difficult-to-debug security blind spots.

WaffleX is being developed to make those differences more measurable, explainable, and reproducible.

## Planned Goals

The project is intended to support the following defensive use cases:

- identify parser drift between layers
- detect normalization mismatches
- validate WAF rule robustness
- surface false negatives and false positives
- help defenders reproduce blind spots safely
- generate evidence useful for remediation and hardening

## Planned Capabilities

The following capabilities are part of the current design direction and may evolve as development progresses.

### Context-Aware Mutation Engine
A mechanism for generating semantically equivalent request variants through controlled transformations such as encoding changes, delimiter variation, and syntax-preserving structural changes.

### Differential Parsing Analysis
A comparison layer intended to highlight how the same request is interpreted differently by delivery and inspection components across the request path.

### Enforcement Attribution
A feedback model designed to correlate status codes, response differences, timing changes, and related signals to better understand where inspection occurred and where coverage was lost.

### Profile-Based Validation
A future profiling system for evaluating common cloud and on-premise deployment patterns in a structured and repeatable way.

### Remediation-Focused Reporting
Reporting intended to support AppSec, WAF engineering, and defensive validation workflows by emphasizing reproducibility and hardening guidance.

## Intended Audience

WaffleX is being designed for:

- application security teams
- WAF and detection engineers
- internal red teams operating with explicit authorization
- defensive researchers
- security architects validating layered web defenses

## Intended Use

This project is intended for:

- authorized security assessments
- controlled lab validation
- defensive engineering
- research into request interpretation and layered enforcement behavior

It is not intended to support unauthorized access, real-world abuse, or stealth-focused offensive operations.

## Repository Scope

This repository currently serves as a placeholder for the project’s future public release. Over time, it may include:

- implementation code
- technical documentation
- architecture notes
- sample configurations
- screenshots or report examples
- usage guidance
- release information

## Roadmap

Planned future milestones may include:

- initial architecture publication
- proof-of-concept implementation
- lab-safe testing mode
- reporting and visualization components
- documentation for authorized use cases
- example deployment and validation workflows

## Release Plan

A public release is planned once the project reaches a stage suitable for responsible publication. Timing, feature scope, and licensing are still under evaluation.

## Responsible Use

Any future release of WaffleX will be intended for authorized environments only. Users will be expected to ensure they have explicit permission to test any target systems and to comply with all applicable laws, policies, and scope restrictions.

## Contribution Status

Contributions are not open at this time while the project is still being defined. Once the repository is ready for external collaboration, contribution guidelines will be added.

## Contact

**Samet Can Tasci**

For conference, research, or collaboration inquiries, contact details will be added here at the time of public release.

## Notes

This repository is intentionally minimal at this stage. It exists to establish the project identity and provide a public landing point while development is still in progress.
>>>>>>> 11570dd0c986c7254f76760a7734077a34f045a1
