# Getting started

## Install

Install the public package globally so it's available in every Pi session:

```bash
pi install npm:pi-sre-mode
```

If your org has a private overlay, install it in the specific project:

```bash
cd your-repo
pi install -l git:git@github.com:your-org/pi-sre-overlay.git
```

## Verify your environment

Before investigating anything, check that your local tools and auth are working:

```
/check-connectors
```

This runs lightweight shell commands (like `aws sts get-caller-identity` or `nomad version`) and shows pass/fail for each. A failed check doesn't always mean a missing CLI — it could be expired credentials or a missing env var.

## Start an incident

```
/incident
```

Pi will ask you to:
1. Pick a template (5xx spike, high latency, OOM, service down, etc.)
2. Name the affected service
3. Set a time window (e.g. "2h", "since 14:30")
4. Optionally add notes

That context is injected into every subsequent prompt, so Pi knows what you're investigating without you repeating it.

## Investigate

Now just talk to Pi normally. The incident context shapes its responses:

```
What's the p99 latency trend for payments-api?
Are there any correlated error rate changes?
Check the last 3 deploys and compare metrics before/after each.
```

Pi uses the built-in SRE methodology skill to stay disciplined: observe, hypothesize, test, evaluate. It builds a timeline before jumping to conclusions.

## Generate a report

When you've found enough:

```
/report
```

This produces a markdown report with summary, timeline, findings, root cause hypothesis, and recommended actions. The default output path is `reports/<date>-<slug>.md` — an overlay can change this.

## Bypass guardrails

Incident mode is read-only by default. If you need to run a destructive command (restart a service, edit a config), temporarily disable guardrails:

```
/sudo
```

Re-enable them when you're done:

```
/sudo-off
```

`/sudo` only affects `pi-sre-mode`'s own guardrails. Other extensions' permissions are unaffected.

## Reset

To clear incident context and go back to normal Pi usage:

```
/incident-reset
```

## When to use `/incident` vs plain Pi

**Plain Pi** — quick, one-off questions. Checking a metric, reading some logs, asking what a symptom means.

**`/incident`** — sustained investigation. You want context that carries across turns, structured templates, read-only guardrails, and a report at the end.
