# 002 — Overlay Model

## Goal

Allow one **public Pi package** to be published openly, while private organizations layer their own content and defaults on top without forking it.

## Layering model

### Layer 1 — Public package
Provides:
- incident workflow extension
- generic SRE skills
- generic incident templates
- generic reporting prompts
- generic connector check framework

### Layer 2 — Private overlay package
Provides:
- private skills
- private prompts
- private templates
- optional private extension for overlay registration
- private defaults such as timezone hints, report paths, and connector checks

## Preferred installation model

### Public package installed globally

```json
{
  "packages": [
    "npm:@your-scope/pi-sre-mode"
  ]
}
```

### Private overlay installed project-locally

```json
{
  "packages": [
    "npm:@your-scope/pi-sre-mode",
    "git:git@github.com:your-org/pi-sre-overlay.git"
  ]
}
```

This keeps the public workflow available everywhere, but only enables organization-specific behavior in the relevant repos.

## Two overlay modes

### Mode A — Zero-code overlay
The private package ships only:
- `skills/`
- `prompts/`
- maybe `themes/`

This should work without any private extension code.

### Mode B — Enhanced overlay
The private package additionally ships a tiny extension that registers:
- private templates in the `/incident` wizard
- private connector checks
- default skills
- report path patterns
- timezone or topology hints

## Public extension contract

The public extension should define a small overlay contract and merge overlays by stable IDs.

### Proposed shape

```ts
export interface IncidentTemplate {
  id: string;
  label: string;
  description: string;
  icon?: string;
  prompt: string;
  defaultSince?: string;
  defaultSkills?: string[];
}

export interface ConnectorCheck {
  id: string;
  label: string;
  command: string;
  timeoutSeconds?: number;
}

export interface IncidentOverlay {
  id: string;
  priority?: number;
  templates?: IncidentTemplate[];
  connectorChecks?: ConnectorCheck[];
  defaultSkills?: string[];
  promptPreamble?: string;
  reportPathPattern?: string;
  timezoneHint?: string;
}
```

## Overlay registration mechanism

Recommended mechanism: use `pi.events`.

### Public extension
- listens for `incident-mode:register-overlay`
- stores overlays by `id`
- sorts by `priority`
- merges templates/checks/defaults by stable IDs

### Private extension
- emits `incident-mode:register-overlay`
- may do so on `session_start`

## Merge precedence

Recommended precedence:

1. project-local overlay package
2. user/global overlay package
3. public defaults

Rules:
- merge by stable IDs
- later / higher-priority overlays can override matching IDs
- additive where possible
- keep merge behavior explicit and documented

## Why not depend on AGENTS.md as the main overlay mechanism

AGENTS files are still useful, but package portability is better when the reusable knowledge ships as:
- skills
- prompt templates
- optional extension code

Rule of thumb:
- **portable package content** → skills/prompts
- **repo-local context** → AGENTS.md

## Private overlay example

A private overlay can register things like:
- `timezoneHint: "IST (UTC+5:30); logs in IST, metrics in UTC"`
- connector checks for `promqlcli`, `logchef`, `nomad`, `aws`
- private template `kite-api-latency`
- report path pattern such as `private/org/rca/{{date}}-{{slug}}.md`

## Non-goals

- pluginizing every behavior in v1
- building a complex runtime package API before the core workflow exists
- coupling private overlay loading to one specific company layout
