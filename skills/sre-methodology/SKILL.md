---
name: sre-methodology
description: Generic SRE investigation methodology for latency, errors, crashes, capacity issues, and dependency failures. Use for production incident investigation when you need a disciplined troubleshooting loop.
allowed-tools: Read Bash Grep
---

# SRE Methodology

Use this skill to investigate incidents systematically.

## Core loop

1. **Observe** — what is the symptom right now?
2. **Hypothesize** — what could explain it?
3. **Test** — run one command that distinguishes hypotheses
4. **Evaluate** — what did that command prove or eliminate?

Avoid command carpet-bombing. Every command should have a reason.

## First principles

- Prefer evidence over speculation.
- Build a timeline before claiming causation.
- Check what changed recently: deploys, config, traffic, dependencies.
- Compare against baseline when possible.
- The loudest symptom is often downstream of the real cause.

## Four golden signals

Always think about:
- latency
- traffic
- errors
- saturation

Use them together, not in isolation.

## Incident structure

When writing findings, use this shape:

```markdown
## Summary
- concise operator-facing summary

## Timeline
- event order with timestamps and timezones when relevant

## Findings
- evidence-backed statements only

## Root cause hypothesis
- current best explanation + confidence

## Actions
- mitigation
- prevention
- detection
```

## Read-only posture

This skill is for investigation, not remediation.
Prefer inspection commands and avoid mutations unless the user explicitly changes the operating mode.
