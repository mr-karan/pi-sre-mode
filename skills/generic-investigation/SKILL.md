---
name: generic-investigation
description: Generic incident investigation playbook for service outages, 5xx spikes, latency regressions, broker issues, and crash loops when no organization-specific skill exists.
allowed-tools: Read Bash Grep
---

# Generic Investigation Playbook

Use this skill when a task is clearly an incident investigation but there is no more specific environment or service skill available.

## Recommended order

### 1. Scope the blast radius
Ask:
- which service is affected?
- since when?
- how broad is the impact?
- what is definitely *not* broken?

### 2. Check recent change surface
Look for:
- deploys
- config changes
- scaling events
- traffic changes
- dependency degradation

### 3. Follow the service path
Trace from edge to dependency:

```text
User -> ingress/load balancer -> service -> queue/db/cache/external dependency
```

Split at the midpoint if the cause is unclear.

### 4. Use the right template focus
- **5xx spike** → error ratio, backend health, deploy timing
- **latency** → p95/p99, queueing, dependency slowdown, saturation
- **OOM/crash loop** → exit codes, restart history, memory growth, limits
- **broker issue** → backlog, pending work, slow consumers, disconnects
- **service down** → health checks, process state, scheduler/orchestrator status
- **deployment regression** → compare before and after deploy
- **resource exhaustion** → utilization relative to limits, not raw percentages alone

## Report writing

When concluding, avoid saying only "service is broken".
State:
- what failed
- evidence that supports it
- likely impact path
- what a human should verify or do next

## Guardrail

If the environment-specific details are unknown, stay generic and state assumptions explicitly.
