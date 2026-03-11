# pi-sre-mode

A Pi-native incident investigation package for Pi, with support for private overlays.

## What this is

`pi-sre-mode` aims to distill the best parts of the llmduck idea into a Pi package:

- guided incident workflow inside Pi
- reusable SRE skills and prompts
- read-only safety guardrails
- connector / environment preflight checks
- support for private organization overlays without forking the public package

This repo started docs-first and now includes the initial working scaffold:

- `extensions/incident-mode.ts` — main public extension
- `src/` — overlay types, state, checks, report helpers, template catalog
- `skills/` — generic SRE skills
- `prompts/` — generic incident prompt templates
- `examples/local-overlay/` — sample overlay package for local testing

## Documentation map

- `docs/README.md` — doc index
- `docs/000-overview.md` — project thesis, goals, and non-goals
- `docs/001-product-shape.md` — what the public package should feel like
- `docs/002-overlay-model.md` — how private overlays layer on top
- `docs/003-public-package-architecture.md` — public package structure and runtime behavior
- `docs/004-private-overlay-architecture.md` — private overlay package model
- `docs/005-mvp.md` — initial build scope
- `docs/006-build-plan.md` — phased implementation plan
- `docs/007-installation.md` — installation patterns for global public package + project overlay
- `docs/008-ecosystem-notes.md` — notes from the Pi package ecosystem
- `docs/009-release-checklist.md` — first public release checklist

## Installation

### Recommended real usage

Install the public package globally in `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    "npm:@your-scope/pi-sre-mode"
  ]
}
```

Install a private overlay project-locally in `.pi/settings.json`:

```json
{
  "packages": [
    "git:git@github.com:your-org/pi-sre-overlay-zerodha.git"
  ]
}
```

### Local development

```json
{
  "packages": [
    "/path/to/pi-sre-mode",
    "/path/to/pi-sre-overlay-zerodha"
  ]
}
```

More detailed installation examples are in `docs/007-installation.md`.

## Status

Initial scaffold implemented.

## Smoke test

A local smoke test is included at:

- `examples/smoke-test/smoke-test.mjs`

Example:

```bash
cd /path/to/pi-sre-mode

# Public package only
bun run smoke-test -- --public-only

# Public package + overlay
bun run smoke-test -- --overlay /path/to/private-overlay
```

Current commands in the public extension:
- `/incident`
- `/incident-reset`
- `/check-connectors`
- `/report`

Current features:
- persisted incident-mode session state
- prompt injection via `before_agent_start`
- read-only blocking for `write` / `edit` and unsafe bash patterns
- connector preflight checks
- markdown report generation
- overlay registration via `incident-mode:register-overlay`
- RPC-based smoke test for package + overlay integration
