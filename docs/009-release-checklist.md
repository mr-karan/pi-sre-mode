# 009 — Release Checklist

This document is a practical checklist for the first public release of `pi-sre-mode`.

## Release goal

Publish the **public** package as a reusable Pi package while keeping organization-specific content in separate private overlays.

---

## 1. Packaging decisions

Before publishing, confirm:

- final npm package name
- version to publish
- license choice
- repository URL
- homepage / issue tracker URLs
- supported Pi version range for `peerDependencies`

The public package should stay generic and publishable.
The Zerodha overlay should remain private and distributed separately.

---

## 2. Public package hygiene

Verify the public package contains only public assets:

- `extensions/`
- `skills/`
- `prompts/`
- `src/`
- `README.md`
- optional docs/examples if we decide to ship them

Verify it does **not** contain:

- private runbooks
- organization-specific prompts
- credentials or auth examples
- hardcoded local workstation paths

---

## 3. Documentation checklist

Confirm the README clearly explains:

- what `pi-sre-mode` is
- how public and private overlays relate
- how to install the public package globally
- how to install a private overlay project-locally
- how to run the smoke test

Confirm docs exist for:

- architecture and overlay model
- installation patterns
- smoke-test usage
- ecosystem / public-readiness notes

---

## 4. Validation checklist

Run these from the public repo:

```bash
bun run typecheck
npm pack --dry-run
bun run smoke-test -- --public-only
bun run smoke-test -- --overlay /path/to/private-overlay
```

Run these from the private overlay repo:

```bash
bun run typecheck
npm pack --dry-run
```

Also check for accidental local-path leaks before publishing:

```bash
rg -n '/home/|/Users/' README.md docs examples extensions prompts skills src package.json
```

---

## 5. First publish checklist

Before `npm publish`, update `package.json` with final metadata if still missing:

- `license`
- `repository`
- `homepage`
- `bugs`
- refined `peerDependencies` range

Then:

1. ensure `main` is clean
2. create the release commit
3. tag the version
4. publish the public package
5. verify install using a clean test environment

Example sequence:

```bash
git status
bun run typecheck
npm pack --dry-run
git tag v0.1.0
npm publish --access public
```

---

## 6. Post-publish verification

In a clean environment, verify:

- `pi install npm:<published-name>` works
- public commands appear:
  - `/incident`
  - `/incident-reset`
  - `/check-connectors`
  - `/report`
- the public-only smoke test still passes
- a project-local private overlay still layers correctly on top

---

## 7. Ecosystem follow-up

After the public release is stable, consider:

- adding a short changelog
- adding a release / publishing doc
- submitting the project to `awesome-pi-agent`
- adding screenshots or terminal recordings for discoverability

---

## 8. Private overlay reminder

The private overlay is intentionally separate.

Keep private org-specific content in:
- private git repos
- private package registries
- project-local Pi settings

Do **not** move Zerodha investigation knowledge into the public package just to simplify installation.
