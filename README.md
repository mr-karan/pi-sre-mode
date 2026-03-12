# pi-sre-mode

An incident investigation mode for [Pi](https://github.com/mariozechner/pi-coding-agent). Open a terminal, start an incident, investigate with real tools, write a report — all without leaving Pi.

## Why

During an incident you're juggling metrics dashboards, log viewers, SSH sessions, and a dozen browser tabs. `pi-sre-mode` puts the investigation loop inside Pi so you can query metrics, grep logs, check service health, and build a timeline in one place.

It ships read-only guardrails by default so you don't accidentally `rm` or `systemctl restart` something mid-investigation.

## What you get

- **`/incident`** — set up investigation context: pick a template (5xx spike, high latency, OOM, etc.), name the service, set a time window. That context follows every subsequent prompt automatically.
- **`/check-connectors`** — preflight check that your CLIs, auth, and environment are ready before you start digging.
- **`/report`** — turn the investigation into a markdown report.
- **`/sudo`** / **`/sudo-off`** — bypass or re-enable the read-only guardrails when you need to.
- **Built-in investigation skills** — SRE methodology and a generic investigation playbook that guide Pi's reasoning.
- **7 incident templates** — 5xx spike, high latency, OOM/crash loop, broker issues, service down, deploy regression, resource exhaustion, plus a blank "custom" template.

## Quick start

Install globally:

```bash
pi install npm:pi-sre-mode
```

Or add to `~/.pi/agent/settings.json`:

```json
{
  "packages": ["npm:pi-sre-mode"]
}
```

Then in Pi:

```
/check-connectors          # verify your environment
/incident                  # set up context — pick a template, name the service
investigate elevated p99 for payments-api, start with the timeline
/report                    # generate a markdown report
```

## You don't always need `/incident`

Use plain Pi for quick questions:

- "check p99 latency for payments-api over the last 2h"
- "compare error rates before and after the last deploy"
- "summarize the Nomad allocation restarts today"

Use `/incident` when you want persistent context, a structured template, guardrails, and a report at the end.

## Private overlays

The public package is generic on purpose. Your team's topology, runbooks, and internal tooling live in a **private overlay** — a separate Pi package that layers org-specific templates, skills, prompts, connector checks, and report paths on top.

Install an overlay per-project:

```bash
pi install -l git:git@github.com:your-org/pi-sre-overlay.git
```

See the [overlay guide](./docs/overlay-guide.md) for how to build one.

## Read-only by default

During an active incident, `pi-sre-mode` blocks:

- file writes and edits
- `rm`, `mv`, `sudo`, `kill`, `chmod`, `chown`
- `systemctl restart/stop`, `nomad job run/stop`
- mutating AWS CLI commands (create, delete, terminate, etc.)
- shell trampolines (`bash -c`, `eval`, subshells)

Use `/sudo` to temporarily disable these guardrails. `/sudo-off` re-enables them.

## Commands

| Command | Purpose |
|---|---|
| `/incident` | Start or update investigation context |
| `/incident-reset` | Clear incident context |
| `/check-connectors` | Run environment preflight checks |
| `/report` | Generate a markdown investigation report |
| `/sudo` | Bypass read-only guardrails |
| `/sudo-off` | Re-enable read-only guardrails |

## How it works

`pi-sre-mode` is built entirely on Pi's extension API — no external server, no separate UI, no agent framework. Everything runs inside your Pi session.

- **Prompt injection** — when incident mode is active, `before_agent_start` automatically prepends the incident context (template, service, time window, guardrails) to every prompt. Pi investigates with full awareness of what you're looking at.
- **Tool interception** — `tool_call` hooks inspect every command before execution and block dangerous ones. This is how read-only guardrails work without a custom sandbox.
- **Session state** — incident context is persisted in Pi's session entries, so it survives reloads, branches, and forks. Navigate the session tree and your incident follows.
- **Interactive UI** — `/incident` uses Pi's built-in `select`, `input`, and `confirm` primitives for the setup wizard. Status line and widget show the active incident at a glance.
- **Inter-extension events** — overlays register themselves by emitting events that the public package listens for. No tight coupling, no imports between packages.
- **Skills and prompts** — shipped as standard Pi skills/prompts in the package manifest. Pi discovers them automatically.

This means the extension is thin orchestration. The real value is in the skills, prompts, and templates — content that's easy to write and easy to override.

## Docs

- [Getting started](./docs/getting-started.md)
- [Building an overlay](./docs/overlay-guide.md)
- [Installation patterns](./docs/installation.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Examples

- [`examples/local-overlay/`](./examples/local-overlay/) — minimal overlay for testing
- [`examples/smoke-test/`](./examples/smoke-test/) — automated smoke test via Pi RPC

## Local development

```json
{
  "packages": [
    "/path/to/pi-sre-mode",
    "/path/to/your-overlay"
  ]
}
```

```bash
# public package only
bun run smoke-test -- --public-only

# with an overlay
bun run smoke-test -- --overlay /path/to/private-overlay
```
