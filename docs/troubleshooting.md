# Troubleshooting

## Commands don't show up

Check that the package is listed in the right settings file:
- **Global:** `~/.pi/agent/settings.json`
- **Project:** `.pi/settings.json`

Then restart Pi, or run `/reload` if already in a session.

## Overlay templates missing from `/incident`

- Is the overlay package listed in the project's `.pi/settings.json`?
- Is the public package also installed (globally or in the same file)?
- If both are in the same settings file, list the public package first.

## Connector check failed

A failed check doesn't necessarily mean the CLI is missing. Common causes:

- **Credentials expired** — re-authenticate (e.g. `aws sso login`)
- **Env var missing** — check whatever env vars the overlay's connector checks expect
- **Server unreachable** — VPN down, firewall, wrong base URL
- **Permission denied** — you have the CLI but not the access

The check output usually tells you which it is.

## PromQL / metrics not configured

If `/check-connectors` shows:
```
✗ PromQL base URL
✗ PromQL auth
```

The metrics CLI exists but the current shell isn't configured for it. Set the required env vars and try again. Pi won't search your filesystem for credentials — it tells you what's missing and moves on.

## Nomad CLI works but access fails

```
✓ Nomad CLI
✗ Nomad access
```

The binary is installed but your shell session doesn't have working server access. Check `NOMAD_ADDR` and auth.

## `/sudo` doesn't affect other extensions

`/sudo` only disables `pi-sre-mode`'s own read-only guardrails. If another extension blocks something, that's independent.

## Reports going to an unexpected path

The default is `reports/{{date}}-{{slug}}.md`. If an overlay is active, it may override this to something like `rca/{{date}}-{{slug}}.md`. Check whether an overlay is installed in the current project.
