---
name: demo-topology
description: Example topology and dependency hints for testing overlay-loaded skills with pi-sre-mode.
allowed-tools: Read Bash Grep
---

# Demo Topology

This is a sample overlay skill used only for local testing.

## Example topology

```text
users -> edge -> api -> queue -> worker -> database
```

## Guidance

- If the API is slow but the worker is healthy, focus on the queue and database path.
- If the queue backlog grows first, downstream consumers may be the bottleneck.
- Use this skill only as a demonstration of overlay-loaded skills.
