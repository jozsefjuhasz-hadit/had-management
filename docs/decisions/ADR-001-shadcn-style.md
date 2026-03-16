---
doc-type: ADR
project: had-management
adr-number: 1
title: Use shadcn/ui base-nova style with Neutral base color
status: accepted
date: 2026-03-14
author: juhaszj
---

# ADR-001: shadcn/ui base-nova / Neutral

## Context
shadcn/ui requires a one-time style selection at init.
This choice affects component appearance globally and
cannot be changed without reinitializing.

shadcn v4 dropped the "New York" / "Default" distinction from v3.
The new style system uses "base-nova" as the default style name.

## Decision
base-nova style (v4 equivalent of New York), Neutral base color, CSS variables enabled.

## Alternatives Considered
| Option | Rejected because |
|--------|-----------------|
| Other v4 styles | base-nova is closest to the intended New York look |
| Zinc/Slate color | Less neutral across light/dark mode |

## Consequences
- All shadcn components follow base-nova variant by default
- CSS variables enable easy theme switching
- Review trigger: if brand guidelines require different palette
- shadcn/skills installed — Claude Code reads project config
  from `.claude/skills/shadcn-ui/` on every interaction
