# 004 — Private Overlay Architecture

## Purpose

A private overlay package adapts `pi-sre-mode` to a specific organization without modifying or forking the public package.

Its primary payload should be **content**, not code.

## Recommended private package structure

```text
pi-sre-overlay-org/
  package.json
  README.md
  skills/
    org-topology/
      SKILL.md
    incident-orchestrator/
      SKILL.md
    prometheus-metrics/
      SKILL.md
    nomad-jobs/
      SKILL.md
    logchef/
      SKILL.md
    aws/
      SKILL.md
    ssh-prod/
      SKILL.md
    rca/
      SKILL.md
  prompts/
    investigate-org.md
    write-rca-org.md
    service-templates/
      api-latency.md
      broker-investigation.md
  extensions/
    org-overlay.ts   # optional, should stay small
```

## Private content priorities

### Most valuable assets

1. organization topology / dependency map
2. tool usage instructions and auth assumptions
3. service-specific runbooks
4. incident methodology tuned to the environment
5. RCA and report conventions

### What should remain markdown-first

- tool recipes
- runbooks
- correlation rules
- service-specific failure patterns
- timezone / environment hints
- reporting structure

## Optional private extension

The private extension should stay minimal.

Its job is to register overlay metadata, for example:
- extra templates for the `/incident` wizard
- connector checks for internal CLIs
- report path defaults
- timezone hints
- default skill sets

It should not reimplement the public workflow.

## Proposed private extension example

```ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    pi.events.emit("incident-mode:register-overlay", {
      id: "org",
      priority: 100,
      timezoneHint: "IST (UTC+5:30); logs in IST, metrics in UTC",
      reportPathPattern: "private/org/rca/{{date}}-{{slug}}.md",
      defaultSkills: ["incident-orchestrator", "sre-methodology"],
      connectorChecks: [
        { id: "promqlcli", label: "Prometheus", command: "promqlcli --lines jobs | head", timeoutSeconds: 10 },
        { id: "logchef", label: "Logchef", command: "logchef help", timeoutSeconds: 10 }
      ],
      templates: [
        {
          id: "api-latency-org",
          label: "API Latency",
          description: "Investigate API latency with org-specific dependencies",
          icon: "🐌",
          defaultSince: "2h",
          defaultSkills: ["incident-orchestrator", "prometheus-metrics", "logchef", "nomad-jobs"],
          prompt: "Investigate API latency. Follow the org dependency chain and correlate metrics, logs, and scheduler state."
        }
      ]
    });
  });
}
```

## Migration guidance from existing llmduck-style repos

A private repo that already contains incident content can usually migrate as follows:

### Migrate directly
- `skills/**` → private Pi package `skills/**`
- `prompts/**` → private Pi package `prompts/**`
- runbook fragments → references from skills or prompts

### Keep repo-local if needed
- `AGENTS.md` in active working repos
- local operational notes tied to one mono-repo
- ephemeral drafts

### Do not port
- server / frontend / API concerns
- investigation database lifecycle
- remote agent runtime machinery

## Public/private boundary rules

### Public package must not know
- company names
- private service names
- private auth flows
- private file paths
- private topology assumptions

### Private overlay may define
- timezone hints
- report path patterns
- connector commands
- private template IDs
- preferred skill sets
- environment-specific wording

## Installation recommendation

For best ergonomics:
- install the public package globally
- install the private overlay project-locally in the org repo

This keeps the public workflow always available while limiting organization-specific behavior to the right workspace.
