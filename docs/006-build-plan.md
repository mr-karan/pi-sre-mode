# 006 — Build Plan

## Milestone 0 — Docs-first repository

Goal:
- create the repo
- capture architecture, layering, and MVP shape in `docs/`

Success criteria:
- design direction is stable enough to start implementation
- public/private boundary is clearly documented

## Milestone 1 — Public package skeleton

Create:
- `package.json`
- `extensions/incident-mode.ts`
- `skills/` with at least one generic methodology skill
- `prompts/` with initial generic templates
- `src/` helper modules for state, templates, overlays, and checks

Success criteria:
- package loads in Pi
- commands register successfully

## Milestone 2 — Incident state and prompt injection

Implement:
- persisted incident state
- `/incident`
- `before_agent_start` prompt composition
- status line updates

Success criteria:
- incident context survives turns and reloads
- prompt injection is visible and predictable

## Milestone 3 — Connector checks and guardrails

Implement:
- `/check-connectors`
- shell-based check runner
- denylist-based read-only blocking in `tool_call`

Success criteria:
- connector checks run and display results
- clearly unsafe commands are blocked

## Milestone 4 — Report flow

Implement:
- `/report`
- report markdown generation
- optional file output or editor insertion

Success criteria:
- user can produce a structured investigation report from the current session

## Milestone 5 — Overlay support

Implement:
- overlay registration contract
- overlay merge logic
- sample local overlay for testing

Success criteria:
- private package can add templates and checks without touching public code

## Suggested implementation order inside the repo

1. `src/overlay-types.ts`
2. `src/template-catalog.ts`
3. `src/state.ts`
4. `extensions/incident-mode.ts`
5. `src/connector-checks.ts`
6. `src/report.ts`
7. generic `skills/` and `prompts/`

## Testing strategy

### Manual
- load extension with `pi -e`
- test `/incident`
- test `/check-connectors`
- verify state persists across `/reload`
- verify blocked commands are rejected

### Overlay testing
- create a tiny local private overlay package
- verify it can:
  - add a template
  - add a connector check
  - provide default skills

## First implementation target

The first build should prove this loop:

1. install package
2. run `/incident`
3. ask Pi to investigate a service issue
4. see incident context injected automatically
5. run `/check-connectors`
6. generate `/report`

If that loop feels good, the project is on the right track.

## Future expansion after MVP

Potential next steps:
- richer evidence capture
- hypothesis checkpoint helpers
- custom incident HUD via `ctx.ui.custom()`
- overlay-provided report destinations
- packaging examples for public and private install flows
