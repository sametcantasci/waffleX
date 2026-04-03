# WaffleX Architecture

## Overview

WaffleX is a research prototype for controlled request-variant execution and family-level semantic consistency analysis.

The platform is composed of two primary components:

- **Frontend**: React/Vite operator interface
- **Backend**: Node.js/Express request execution and corpus-management API

The system is designed to help operators observe how equivalent input variants are treated across a defensive path.

---

## High-Level Flow

1. Operator selects a target and injection point
2. Payload corpus is loaded from the backend
3. WaffleX generates a mutation family for each base payload
4. Variants are executed in sequence
5. Response metadata is collected
6. Individual events are shown in the Live Stream Engine
7. Events are grouped by base payload
8. Family-level summaries are computed
9. Results are rendered in the **Equivalence Drift Map**

---

## Frontend Components

### Assessment Module
Main workflow for controlled analysis.

Supports:

- target URL selection
- HTTP method selection
- URL/header/cookie/body injection points
- payload corpus selection
- mutation-depth selection
- adaptive mutation mode toggle

### LogConsole
Real-time event console showing:

- timestamp
- base payload
- mutation strategy
- status
- detection signal
- differential label
- latency

### SemanticConsistencyPanel
Family-level analysis panel rendered as the **Equivalence Drift Map**.

Displays:

- base payload family
- accepted / enforced / anomalous counts
- unique outcome count
- family size
- Semantic Consistency Score
- likely interpretation fault
- explanatory notes

### Resilience Testing
Separate module for repeated baseline request execution to observe:

- enforcement transitions
- rate-limit behavior
- latency drift
- run summary

### Payload Corpus Editor
Local payload corpus management interface backed by filesystem-based backend endpoints.

---

## Backend Responsibilities

The backend provides:

- request relay / execution
- payload corpus listing and editing
- health endpoint
- optional egress IP inspection flow
- response metadata extraction

Typical backend-returned metadata includes:

- HTTP status
- latency
- response size / length
- heuristic response signals

---

## Mutation Family Generation

WaffleX groups semantically equivalent request variants into mutation families.

The current prototype includes transformations such as:

- baseline
- URL encoded
- double encoded
- delimiter encoded
- null suffix
- path suffix
- mixed delimiters
- whitespace suffix
- backslash mutation

These transformations are used to test whether the defensive path treats equivalent requests consistently.

---

## Family-Level Analysis

After execution, events are grouped by base payload.

For each family, WaffleX computes:

- **Accepted** count
- **Enforced** count
- **Anomalous** count
- **Unique Outcomes**
- **Family Size**
- **Semantic Consistency Score**

### Semantic Consistency Score
The current prototype estimates family-level consistency by measuring how dominant the most common outcome class is within the mutation family.

High scores indicate more uniform handling.

Lower scores may indicate interpretation drift or inconsistent enforcement behavior.

---

## Interpretation Labels

The prototype may assign family-level labels such as:

- `SEMANTIC_REASONING_GAP`
- `DEEP_INSPECTION_VARIANCE`
- `RESPONSE_INTERPRETATION_DRIFT`
- `UNIFORM_PASS_BEHAVIOR`
- `CONSISTENT_ENFORCEMENT`

These are heuristic labels intended to help frame investigation and defensive analysis.

They should not be interpreted as definitive attribution.

---

## Design Intent

WaffleX is not intended to be a production bypass platform.

Its architectural intent is to provide:

- controlled execution
- reproducible variation
- observable response behavior
- family-level consistency analysis
- a visual interface for defensive research and validation

---

## Current Limitations

The current prototype does **not** attempt to provide:

- definitive multi-layer attribution
- full semantic understanding of target-side parser behavior
- production-grade autonomous analysis
- comprehensive WAF-vendor fingerprinting

Instead, it provides a practical, demo-ready framework for observing and summarizing request-handling consistency across equivalent variants.

---

## Summary

The distinguishing architectural element in the current WaffleX prototype is the transition from single-request observation to payload-family analysis.

Rather than asking only whether an individual variant was blocked, WaffleX asks whether a family of equivalent variants was handled consistently.

That shift is what powers the **Equivalence Drift Map** and the **Semantic Consistency Score**.
