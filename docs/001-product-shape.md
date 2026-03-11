# 001 — Product Shape

## One-line definition

A Pi package that turns incident prompts, skills, and runbooks into a guided investigative workflow.

## User experience

The package should feel like a lightweight incident mode layered on top of normal Pi usage.

### Main flow

1. User enters `/incident`
2. Pi asks for:
   - investigation template
   - service name
   - time window
   - optional context / notes
3. Package stores incident context in session state
4. On the next prompt, `before_agent_start` injects the composed incident instructions
5. Pi investigates using the relevant skills and normal tools
6. User can branch, steer, capture evidence, and generate a report

## What belongs in the public package

### Extension behavior

- `/incident`
- `/check-connectors`
- `/report`
- `/incident-reset`
- optional `/evidence` and `/hypothesis`
- read-only `tool_call` blocking
- status line / widget updates
- prompt composition logic
- overlay registration and merging

### Public content

- generic SRE methodology skill(s)
- generic incident templates
- generic RCA/report prompts
- optional theme

## What should *not* live in the public package

- company names
- private topology
- internal CLI auth assumptions
- private runbooks
- private report destinations
- environment-specific service templates

## Primary commands

### `/incident`
Starts or updates incident context.

Expected fields:
- template ID
- service
- since
- optional notes

### `/check-connectors`
Runs lightweight environment checks and shows whether required CLIs/auth are available.

### `/report`
Generates a markdown incident report using the current session context.

### `/incident-reset`
Clears incident-mode state from the session.

### Optional helpers
- `/evidence` — capture a structured note from the current investigation state
- `/hypothesis` — label the current branch / checkpoint in the session tree

## Extension responsibilities

The extension is not the intelligence layer. It is the orchestration layer.

It should:

- collect inputs
- compose prompts
- manage light session state
- protect against unsafe commands
- provide ergonomic operator UX

It should not attempt to encode all domain knowledge in code.

## Pi-native advantages

### Session tree as investigation tree

Pi’s branching model can be used directly for investigations:

- branch on alternate hypotheses
- label checkpoints
- compare theories
- resume later without inventing a new persistence layer

### Skills as the main knowledge substrate

The package should lean on Pi skills for:

- investigation methods
- topology context
- tool recipes
- service-specific workflows

### UI should stay lightweight

Use existing Pi UI surfaces first:

- `ctx.ui.select()`
- `ctx.ui.input()`
- `ctx.ui.confirm()`
- `ctx.ui.setStatus()`
- `ctx.ui.setWidget()`

A custom `ctx.ui.custom()` dashboard can come later if needed.

## Out of scope for v1

- remote execution routing
- connector-specific typed tools
- web UI
- server-backed investigation state
- Slack / chat integrations
- automated remediation
