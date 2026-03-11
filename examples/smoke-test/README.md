# Smoke test

This example exercises `pi-sre-mode` through Pi RPC mode, either by itself or together with an overlay package.

## What it verifies

- the public package loads from a local path via `.pi/settings.json`
- optional overlay package loading works from a second local path
- commands are discoverable through `get_commands`
- `/incident` works through extension UI requests
- `/check-connectors` runs
- `/report` writes a report file and pushes markdown into the editor

## Usage

```bash
cd /path/to/pi-sre-mode

# Public package only
bun run examples/smoke-test/smoke-test.mjs --public-only

# Public package + overlay
bun run examples/smoke-test/smoke-test.mjs --overlay /path/to/private-overlay
```

Optional environment variables:

- `PI_BIN` — override the `pi` binary path
- `PROMQLCLI_BIN` — override the promqlcli binary used during checks
- `LOGCHEF_BIN` — override the logchef binary used during checks
- `KEEP_SMOKE_TMP=1` — keep the temporary smoke-test workspace for inspection

## Notes

- The script creates a temporary isolated `HOME` so your normal Pi config does not interfere.
- It uses a temporary workspace with `.pi/settings.json` pointing at the local package paths.
- For lightweight local testing, the script defaults `PROMQLCLI_BIN` and `LOGCHEF_BIN` to `echo` if you do not provide overrides.
