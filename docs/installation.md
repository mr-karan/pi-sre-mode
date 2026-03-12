# Installation

## Recommended setup

Install the **public package globally** so incident commands are available everywhere. Install your **private overlay per-project** so org-specific behavior only applies where it should.

### Global — public package

```bash
pi install npm:pi-sre-mode
```

Or edit `~/.pi/agent/settings.json`:

```json
{
  "packages": ["npm:pi-sre-mode"]
}
```

### Per-project — private overlay

```bash
cd your-repo
pi install -l git:git@github.com:your-org/pi-sre-overlay.git
```

Or edit `.pi/settings.json` in the repo:

```json
{
  "packages": ["git:git@github.com:your-org/pi-sre-overlay.git"]
}
```

The overlay doesn't need to repeat the public package if it's already installed globally. Pi merges project settings with global settings.

If both are in the same file, list the public package first:

```json
{
  "packages": [
    "npm:pi-sre-mode",
    "git:git@github.com:your-org/pi-sre-overlay.git"
  ]
}
```

## Local development

Use local paths instead of npm/git references:

```json
{
  "packages": [
    "/path/to/pi-sre-mode",
    "/path/to/your-overlay"
  ]
}
```

Or via CLI:

```bash
pi install /path/to/pi-sre-mode
pi install -l /path/to/your-overlay
```

## Verify

After starting Pi in the target repo, check that everything loaded:

```
/check-connectors       # should run checks from both public + overlay
/incident               # should show overlay templates alongside defaults
/report                 # should be available
```

## Troubleshooting

See [troubleshooting.md](./troubleshooting.md).
