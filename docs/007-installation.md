# 007 — Installation

This document shows the recommended ways to install `pi-sre-mode` in real Pi setups.

## Recommended model

### Global: public package
Install the public package globally so incident workflow commands are available everywhere.

### Project-local: private overlay
Install the organization-specific overlay only in the repos where it should apply.

This keeps the public workflow broadly available while limiting private operational behavior to the correct projects.

---

## Option A — Real usage after publishing

### Global `~/.pi/agent/settings.json`

```json
{
  "packages": [
    "npm:pi-sre-mode"
  ]
}
```

### Project `.pi/settings.json`

```json
{
  "packages": [
    "git:git@github.com:your-org/pi-sre-overlay-zerodha.git"
  ]
}
```

Notes:
- Pi merges project settings with global settings.
- The project overlay does not need to repeat the public package if the public package is already installed globally.
- If both packages are installed in the same settings file, list the public package first and the overlay second.

---

## Option B — Local development using repository paths

### Global `~/.pi/agent/settings.json`

```json
{
  "packages": [
    "/path/to/pi-sre-mode"
  ]
}
```

### Project `.pi/settings.json`

```json
{
  "packages": [
    "/path/to/pi-sre-overlay-zerodha"
  ]
}
```

This is the recommended setup while developing locally.

---

## Option C — Single project-local settings file for testing

If you want everything isolated to one repo during development, place both packages in that repo’s `.pi/settings.json`:

```json
{
  "packages": [
    "/path/to/pi-sre-mode",
    "/path/to/pi-sre-overlay-zerodha"
  ]
}
```

Recommended ordering in the same file:
1. public package
2. private overlay

Even though the overlay package re-emits its registration on `before_agent_start`, the public-first ordering is still the clearest and least surprising setup.

---

## Install via CLI

Equivalent commands:

### Global public package

```bash
pi install /path/to/pi-sre-mode
```

### Project-local private overlay

Run this inside the target repo:

```bash
pi install -l /path/to/pi-sre-overlay-zerodha
```

After publishing, these become:

```bash
pi install npm:pi-sre-mode
pi install -l git:git@github.com:your-org/pi-sre-overlay-zerodha.git
```

---

## Verify installation

After starting Pi in the target repo, verify:

- `/incident`
- `/check-connectors`
- `/report`
- overlay-specific prompts such as `/zerodha-investigate`
- overlay-specific skills such as `/skill:incident-orchestrator`

You should also see Zerodha-specific templates in the `/incident` flow when the overlay is active.

---

## Troubleshooting

### Commands do not appear
- Check package paths in the relevant `settings.json`
- Restart Pi after changing settings
- Use `/reload` if the package is already discovered in the current session

### Overlay templates do not appear
- Confirm the overlay package is loaded in the current repo scope
- Confirm the public package is also installed
- If using one settings file, list the public package before the overlay

### Connector checks fail immediately
- Verify required CLIs are installed or available in `PATH`
- For local development, set:
  - `PROMQLCLI_BIN`
  - `LOGCHEF_BIN`
- Ensure AWS / Nomad / log tooling auth is available in the current shell environment
