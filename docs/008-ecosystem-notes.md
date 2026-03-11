# 008 — Ecosystem Notes

This document captures a few observations from the broader Pi ecosystem, especially from:

- `qualisero/awesome-pi-agent`
- `qualisero/rhubarb-pi`
- `nicobailon/pi-subagents`
- other Pi package examples referenced through the awesome list

The goal is not to catalog everything, but to record the patterns that seem useful for `pi-sre-mode`.

---

## Main takeaway

There is already a real Pi package ecosystem forming around:
- small focused extensions
- clear installation stories
- user/project layering
- strong docs and examples

That is a good sign for `pi-sre-mode` because its public/private split matches how people are already packaging Pi add-ons.

---

## Useful ecosystem patterns

### 1. Focused packages beat giant monoliths

Projects in the ecosystem tend to package one clear capability well:
- notifications
- safe git workflows
- subagents
- code intelligence
- theme sync

Implication for `pi-sre-mode`:
- keep the public package focused on incident workflow
- keep private overlays focused on org knowledge
- resist turning the public package into a giant ops platform

### 2. Installation UX matters a lot

Packages that look production-ready usually provide:
- direct `pi install ...` commands
- local development instructions
- uninstall or cleanup guidance
- troubleshooting docs

Implication for `pi-sre-mode`:
- installation docs should exist early
- local path setup and published setup should both be documented
- project-local overlay installation should feel normal, not special-case

### 3. Scope and precedence are first-class concerns

Pi package authors are already thinking carefully about:
- user scope vs project scope
- built-in defaults vs project overrides
- stable discovery locations

Implication for `pi-sre-mode`:
- public package should be installable globally
- private overlay should be installable project-locally
- package order and precedence rules should be documented clearly

### 4. Examples and test harnesses increase trust

Packages that feel serious usually include:
- example configurations
- README walkthroughs
- smoke tests or e2e checks
- clear working demos

Implication for `pi-sre-mode`:
- the smoke test was a good investment
- the sample local overlay is useful, not optional fluff
- we should keep example-driven workflows in the repo

### 5. Runtime extensibility is normal in Pi

The ecosystem shows that it is completely normal for Pi packages to expose:
- commands
- tools
- status line UI
- custom overlays/widgets
- package-local defaults and override rules

Implication for `pi-sre-mode`:
- overlay registration via `pi.events` is idiomatic enough
- a tiny private extension on top of content packages is a reasonable design choice

---

## Relevant references

### `qualisero/awesome-pi-agent`
Useful as a discovery hub and eventual submission target.

Why it matters:
- confirms that Pi add-ons are becoming discoverable as packages
- provides examples of how other maintainers describe and position their packages
- suggests we should eventually prepare this project for public listing

### `qualisero/rhubarb-pi`
Interesting for its modular presentation and documentation structure.

Useful pattern:
- package collections with per-module docs
- explicit install commands
- docs for install, release, troubleshooting

Potential takeaway:
- `pi-sre-mode` may eventually want dedicated docs for release/publishing and troubleshooting, not just architecture docs

### `nicobailon/pi-subagents`
Strong example of a polished Pi package with:
- clear install instructions
- serious README
- scope-aware behavior
- manager UI
- built-in defaults that users can override

Useful pattern:
- combine a strong core experience with user/project override mechanics
- make built-in defaults useful, but not rigid

Potential takeaway:
- `pi-sre-mode` should keep its defaults useful enough to stand alone, while letting overlays add richer behavior cleanly

---

## What this means for `pi-sre-mode`

### Already aligned

- public package + private overlay split
- package-based installation model
- local overlay example
- smoke-test coverage for package interaction
- docs-first architecture and packaging story

### Good next improvements

1. add a dedicated troubleshooting doc
2. add publishing / release notes for the public package
3. add a short "submit to awesome-pi-agent" checklist once public release is ready
4. consider a tiny `docs/RELEASE.md` after first npm publish

---

## Future public-readiness checklist

Before trying to publish or list the package publicly, make sure it has:

- concise README with install instructions
- screenshots or terminal recordings if useful
- stable public package name
- examples that work out of the box
- no private strings in the public repo
- at least one documented overlay pattern
- a clear explanation of why this package exists

That would make it a much stronger candidate for ecosystem discovery lists.
