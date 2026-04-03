# WaffleX

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
