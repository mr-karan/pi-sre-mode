# 000 — Overview

## Thesis

`pi-sre-mode` is a **Pi-native incident investigation package**.

It is not a clone of llmduck-the-app. It does not need a server, web UI, agent RPC layer, or investigation database. Instead, it turns Pi itself into the operator surface by combining:

- a small orchestration extension
- reusable skills
- prompt templates
- optional themes
- optional private overlays

The design goal is to keep the code layer thin and let the real value live in the content layer: skills, prompts, topology knowledge, runbooks, and reporting patterns.

## Core idea

The public package provides the workflow framework:

- `/incident` setup flow
- read-only safety guardrails
- connector / environment checks
- incident status line and lightweight HUD
- prompt composition from templates + context + skills
- report generation helpers

Private organizations add overlay packages that contribute:

- organization-specific skills
- private prompt templates
- service topology
- runbooks
- report / RCA conventions
- optional small extension for richer defaults

## Why Pi-native

Pi already gives us most of the runtime surface we need:

- skills and prompt templates
- extensions and commands
- event hooks like `before_agent_start` and `tool_call`
- session trees and labels
- interactive terminal UI

That means the package can focus on the incident workflow instead of rebuilding a platform around it.

## Goals

1. **Guide investigations inside Pi**
   - make it easy to start structured incident work from a terminal session

2. **Keep the runtime simple**
   - no server or API dependency for the core package

3. **Support public release with private overlays**
   - one public package, many private org packs

4. **Keep the value in content**
   - skills, prompts, runbooks, and investigation patterns should remain easy to author

5. **Stay safe by default**
   - read-only posture, explicit blocking of destructive commands

## Non-goals

- rebuilding llmduck server / agent / frontend architecture
- replacing Pi’s built-in session model
- creating a universal typed connector runtime on day one
- embedding company-specific knowledge in the public package
- solving remediation / deployment automation in v1

## Design principles

- **Public package = framework + generic content**
- **Private overlay = knowledge + defaults**
- **Skills are the product**
- **Extension code should stay thin**
- **Read-only by default**
- **Stable IDs for templates and overlays**
- **No private strings in the public repo**
