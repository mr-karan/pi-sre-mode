# Building an overlay

An overlay is a private Pi package that adds your org's templates, skills, prompts, connector checks, and defaults on top of `pi-sre-mode`. The public package stays generic; your overlay makes it specific.

## What an overlay can add

- **Incident templates** — org-specific investigation types (e.g. "API latency", "Payment gateway timeout")
- **Connector checks** — verify internal CLIs and auth (e.g. your metrics CLI, log viewer, scheduler access)
- **Default skills** — auto-load org topology or runbook skills during investigations
- **Prompt preamble** — inject org context into every investigation prompt
- **Timezone hints** — tell Pi which timezone logs vs metrics use
- **Report path** — override where `/report` writes output (e.g. `rca/{{date}}-{{slug}}.md`)
- **Skills and prompts** — ship as standard Pi skills/prompts alongside the overlay

## Minimal structure

```
my-overlay/
├── package.json
├── extensions/
│   └── my-overlay.ts    # registers overlay config
├── prompts/             # org-specific prompt templates
└── skills/              # org-specific skills
```

`package.json`:

```json
{
  "name": "my-overlay",
  "type": "module",
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"]
  }
}
```

## Registration

The overlay extension emits `incident-mode:register-overlay` on session start. The public package picks it up and merges it.

```ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { IncidentOverlay } from "pi-sre-mode/overlay-types";

export default function myOverlay(pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    const overlay: IncidentOverlay = {
      id: "my-overlay",
      priority: 100,
      timezoneHint: "Logs are in local time, metrics are UTC.",
      defaultSkills: ["my-topology", "sre-methodology"],
      promptPreamble: "Use org topology and dependency knowledge.",
      reportPathPattern: "rca/{{date}}-{{slug}}.md",
      connectorChecks: [
        {
          id: "my-cli",
          label: "My CLI",
          command: "my-cli --version",
          timeoutSeconds: 5,
        },
      ],
      templates: [
        {
          id: "api-latency",
          label: "API Latency",
          description: "Investigate latency in the public API",
          icon: "🐌",
          defaultSince: "2h",
          defaultSkills: ["my-topology"],
          prompt: "Check latency, errors, dependencies, and recent changes.",
        },
      ],
    };

    pi.events.emit("incident-mode:register-overlay", overlay);
  });
}
```

## Zero-code overlays

If you only need extra skills and prompts (no custom templates or connector checks), you don't need an extension at all. Just ship a package with `skills/` and `prompts/` directories and Pi will discover them.

## Precedence

When multiple overlays register, higher `priority` values win for matching template/check IDs:

1. Public package defaults (lowest)
2. User/global overlay
3. Project-local overlay (highest)

Templates and checks are merged by stable `id`. Additive where possible — overlays add to the template list, and only override existing IDs when they match.

## Tips

- Keep the public package generic. Put all org topology, auth assumptions, and internal workflows in the overlay.
- Use stable IDs for templates and connector checks so upgrades don't break things.
- Fail fast when required env/auth is missing — don't search the machine for credentials.
- Prefer plain markdown output guidance over UI-specific formatting.

## Example

See [`examples/local-overlay/`](../examples/local-overlay/) for a working minimal overlay.
