# WaffleX Architecture Notes

## Overview

WaffleX is structured as a two-part prototype:

1. **Frontend** — an operator-facing React interface for configuring request variants, running sequences, and reviewing response behavior.
2. **Backend** — a small Express API that relays authorized requests, measures status and latency, resolves egress IP information, and manages payload corpus files.

## Assessment flow

1. Operator selects a target URL and request method.
2. A payload corpus file is loaded from the backend.
3. Request variants are injected into configured URL, header, cookie, or body locations.
4. The backend relays each request and returns response metadata.
5. The frontend visualizes status transitions, timing, and sequence progress.

## Current design goals

- show parser and enforcement behavior clearly
- keep the assessment workflow reproducible
- support controlled routing through an intercepting proxy
- allow quick iteration on request corpora

## Current limitations

- prototype-only error handling
- no persistence layer beyond flat files
- no production authentication model
- localhost-oriented default configuration
