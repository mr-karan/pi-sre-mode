# 003 — Public Package Architecture

## Proposed repo structure

```text
pi-sre-mode/
  package.json
  README.md
  docs/
  extensions/
    incident-mode.ts
  skills/
    sre-methodology/
      SKILL.md
    generic-investigation/
      SKILL.md
  prompts/
    incident-5xx.md
    incident-latency.md
    incident-oom.md
    incident-broker.md
    incident-service-down.md
    incident-deploy-regression.md
    incident-resource-exhaustion.md
    write-rca.md
  themes/
    mission-control.json
  src/
    overlay-types.ts
    template-catalog.ts
    connector-checks.ts
    report.ts
    state.ts
```

## Extension responsibilities

The public extension should own only the workflow shell.

### 1. Incident state

Store lightweight session state such as:
- current mode enabled/disabled
- selected template
- selected service
- selected time window
- chosen notes/context
- active overlay defaults

State should be persisted in Pi session entries so it survives reloads and branches correctly.

### 2. Prompt composition

On `before_agent_start`, the extension should assemble the effective instructions from:

- public base investigator prompt
- selected incident template prompt
- overlay prompt preamble(s)
- chosen service and time window
- optional incident notes
- relevant enabled skills

The output is a normal Pi system-prompt augmentation, not a custom runtime.

### 3. Safety interception

On `tool_call`, the extension should block clearly unsafe commands.

Examples to block in v1:
- `rm`, `mv`, `chmod`, `chown`, `tee >`
- `sudo`
- destructive `aws` mutations
- destructive `nomad` mutations
- restart / kill commands over `ssh`

The package should prefer a denylist-based first pass, with the option to evolve toward a more structured policy later.

### 4. Connector checks

The package should support simple shell-based checks such as:
- binary exists
- auth works
- endpoint reachable

These checks should be data-driven, not hardcoded into the command handler.

### 5. Operator UX

Use Pi UI primitives first:
- `/incident` wizard via `select` and `input`
- footer status via `setStatus`
- optional compact widget via `setWidget`

## Prompt composition model

### Inputs
- current incident state
- public template catalog
- registered overlays
- available skills already discoverable by Pi

### Composition order

1. public baseline investigator instructions
2. public selected template prompt
3. overlay prompt preamble(s)
4. incident metadata block
5. normal Pi skill exposure

### Incident metadata block

The extension should inject a compact block such as:

```md
## Incident Context
- Template: high-latency
- Service: kite-api
- Since: 2h
- Notes: market-open impact suspected
```

## Template catalog

The public package should ship a stable catalog with IDs, labels, and short prompts.

Initial generic templates:
- `5xx-spike`
- `high-latency`
- `oom-crash`
- `broker-issues`
- `service-down`
- `deployment-regression`
- `resource-exhaustion`
- `custom`

Templates should be content-first and easy for overlays to override or extend.

## Connector checks model

A connector check is deliberately small and pragmatic:

```ts
interface ConnectorCheck {
  id: string;
  label: string;
  command: string;
  timeoutSeconds?: number;
}
```

The public package may ship generic checks for things like:
- `aws`
- `ssh`
- `curl`

Private overlays can add environment-specific checks like:
- `promqlcli`
- `logchef`
- `nomad`

## Report generation

A report helper should assemble markdown from:
- incident state
- selected template
- session notes / evidence entries
- user-supplied final summary if needed

v1 can keep this simple:
- create a markdown file in the current repo
- or inject report text into the editor

## Theme

A theme is optional, but a public `mission-control` style theme could help the package feel distinct without being required for the workflow.

## What stays out of the public package

- organization-specific service names
- private CLI paths
- report destinations tied to a company repo
- org-specific timezone assumptions
- internal topology diagrams
