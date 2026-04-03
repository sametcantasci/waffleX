<h1 align="center">WaffleX — Adaptive Semantic Analysis for WAF Resilience Testing</h1>

<p align="center">
  Controlled request-variant execution, semantic consistency analysis, and defensive-path drift observation for modern web application defenses.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-Dev_Server-646CFF?style=flat-square" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square" />
  <img alt="Express" src="https://img.shields.io/badge/Express-API-000000?style=flat-square" />
  <img alt="Mode" src="https://img.shields.io/badge/Mode-Research_Prototype-7C3AED?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-84CC16?style=flat-square" />
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Working_Prototype-10B981?style=flat-square" />
  <img alt="Analysis" src="https://img.shields.io/badge/Analysis-Equivalence_Drift_Map-0EA5E9?style=flat-square" />
  <img alt="Metric" src="https://img.shields.io/badge/Metric-Semantic_Consistency_Score-F59E0B?style=flat-square" />
  <img alt="Modules" src="https://img.shields.io/badge/Modules-Assessment_|_Resilience_|_Corpus_Editor-E11D48?style=flat-square" />
</p>

---

## Overview

**WaffleX** is a research prototype for evaluating how **semantically equivalent request variants** are treated across modern web delivery and enforcement paths.

Instead of looking only at whether a single request is accepted or blocked, WaffleX groups equivalent variants into a **payload family** and asks a more useful question:

> Are equivalent requests being handled consistently across the defensive path?

That family-level view is the core differentiator of the project.

WaffleX currently combines:

- a **React / Vite** operator interface
- a **Node.js / Express** execution backend
- adaptive request-variant generation
- a **Live Stream Engine** for per-request visibility
- an **Equivalence Drift Map** for family-level analysis
- a **Semantic Consistency Score**
- a separate **Resilience Testing** workflow
- a filesystem-backed **Payload Corpus Editor**

---

## Core Differentiator

Most WAF testing tools answer:

- Was this payload accepted?
- Was this payload blocked?

WaffleX adds a different layer:

- generate multiple **semantically equivalent** variants from the same base payload
- execute those variants in a controlled sequence
- observe how the defensive path responds to each family member
- summarize the family as a single behavioral unit

This is rendered as the **Equivalence Drift Map**.

That means WaffleX does not only show request outcomes.  
It shows whether the defensive path behaves **consistently** across equivalent variants.

---

## Key Features

### Assessment Module
Interactive workflow for:

- target URL selection
- HTTP method selection
- injection points in URL, headers, cookies, and body
- payload corpus selection
- mutation-depth control
- adaptive mutation mode toggle

### Adaptive Mutation Planner
The current prototype can generate equivalent request families using transformations such as:

- baseline
- URL encoding
- double encoding
- delimiter encoding
- null suffix
- path suffix
- mixed delimiters
- whitespace suffix
- backslash mutation

### Live Stream Engine
Per-request execution visibility including:

- base payload
- mutation strategy
- HTTP status
- detection signal
- differential classification
- latency

### Equivalence Drift Map
WaffleX groups request variants by base payload and summarizes family behavior with:

- accepted outcomes
- enforced outcomes
- anomalous outcomes
- unique outcomes
- family size
- likely interpretation fault
- **Semantic Consistency Score**

### Semantic Consistency Score
A family-level metric estimating how uniformly semantically equivalent variants were handled.

Higher scores indicate more uniform behavior.

Lower scores suggest:

- normalization mismatch
- enforcement drift
- semantic reasoning gaps
- response interpretation differences

### Family-Level Interpretation Labels
The prototype may assign heuristic family labels such as:

- `SEMANTIC_REASONING_GAP`
- `DEEP_INSPECTION_VARIANCE`
- `RESPONSE_INTERPRETATION_DRIFT`
- `UNIFORM_PASS_BEHAVIOR`
- `CONSISTENT_ENFORCEMENT`

### Resilience Testing
Separate workflow for repeated baseline requests to observe:

- enforcement transitions
- rate-limit behavior
- latency drift
- accepted vs enforced ratios

### Payload Corpus Editor
Filesystem-backed editor for reusable request-variant corpora.

---

## How It Works

1. Select a target and define an injection point using `[X]`
2. Load a payload corpus
3. Generate a mutation family from each base payload
4. Execute variants through the backend
5. Collect status, latency, and response metadata
6. Stream individual results to the Live Stream Engine
7. Group variants by base payload
8. Compute family-level summaries
9. Render the result in the **Equivalence Drift Map**

---

## Demo Screenshots

### Assessment Module Overview
![Assessment Module](screenshots/01-assessment-overview.png)

### Equivalence Drift Map Populated
![Equivalence Drift Map](screenshots/02-equivalence-drift-map.png)

### Live Stream Engine with Adaptive Variants
![Live Stream Engine](screenshots/03-live-stream-engine.png)

### Resilience Testing Module
![Resilience Testing](screenshots/04-resilience-testing.png)

### Payload Corpus Editor
![Payload Corpus Editor](screenshots/05-payload-corpus-editor.png)

---

## Quick Start

### Backend

```bash
cd backend
npm install
node server.js
```

Backend health endpoint:

```text
http://localhost:3001/api/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Example Demo Target

For a safe public demo target:

```text
https://httpbin.org/anything?input=[X]
```

This lets WaffleX demonstrate:

- mutation-family execution
- live request/result streaming
- family-level consistency analysis
- Equivalence Drift Map population

without requiring a real protected environment.

---

## Repository Structure

```text
wafflex/
├── backend/            # Node.js / Express backend
├── frontend/           # React / Vite UI
├── docs/               # Architecture notes
├── screenshots/        # README screenshots
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
├── LICENSE
└── .gitignore
```

---

## API Summary

- `GET /api/health` — health check
- `POST /api/check-ip` — resolves egress IP information
- `POST /api/proxy` — relays a controlled request and returns response metadata
- `GET /api/payloads` — lists payload corpus files
- `GET /api/payloads/:filename` — reads a corpus file
- `PUT /api/payloads/:filename` — updates a corpus file

---

## Reviewer Notes

This repository is being provided so reviewers can inspect the current implementation directly.

The current prototype includes:

- working frontend and backend components
- adaptive request-variant execution
- payload-family generation
- live request/result logging
- family-level semantic consistency analysis
- Equivalence Drift Map visualization
- resilience testing workflow
- payload corpus editing

The analysis labels and scoring are heuristic and intended for research and defensive validation, not as definitive attribution.

---

## Current Limitations

This prototype does **not** claim to provide:

- definitive multi-layer attribution
- full semantic understanding of target-side parser behavior
- production-grade autonomous analysis
- comprehensive vendor-specific WAF fingerprinting

Its purpose is to provide a **working research interface** for observing how equivalent variants are handled across the defensive path.

---

## Safety and Intended Use

WaffleX is intended for **authorized environments only**.

Use cases:

- defensive validation
- internal security testing
- lab research
- reproducible inspection-path analysis

Do **not** use this tool against systems without explicit permission.

---

## License

MIT
