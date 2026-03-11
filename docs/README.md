# Documentation Index

This repository is being designed as a **public Pi package** for incident investigation, with support for **private organization overlays**.

## Docs

1. [`000-overview.md`](./000-overview.md)
   - core idea
   - goals / non-goals
   - why this should be Pi-native

2. [`001-product-shape.md`](./001-product-shape.md)
   - user experience
   - public package responsibilities
   - key commands and workflows

3. [`002-overlay-model.md`](./002-overlay-model.md)
   - public/private split
   - overlay precedence
   - zero-code vs enhanced overlays

4. [`003-public-package-architecture.md`](./003-public-package-architecture.md)
   - proposed repo structure
   - extension behavior
   - prompt composition and safety model

5. [`004-private-overlay-architecture.md`](./004-private-overlay-architecture.md)
   - private package structure
   - how Zerodha-like overlays should plug in
   - migration guidance from existing llmduck content

6. [`005-mvp.md`](./005-mvp.md)
   - first implementation target
   - acceptance criteria
   - what to defer

7. [`006-build-plan.md`](./006-build-plan.md)
   - phased build sequence
   - milestones
   - implementation order

8. [`007-installation.md`](./007-installation.md)
   - real installation patterns for `~/.pi/agent/settings.json` and project `.pi/settings.json`
   - local development path setup
   - install and verification examples

9. [`008-ecosystem-notes.md`](./008-ecosystem-notes.md)
   - notes from the broader Pi ecosystem
   - relevant packaging and documentation patterns
   - future public-readiness considerations

10. [`009-release-checklist.md`](./009-release-checklist.md)
   - practical first-release checklist
   - validation and publish sequence
   - public/private release boundary reminders
