---
doc-type: ADR
project: had-management
adr-number: 8
title: update_deal accepts a stage parameter and logs a transition — identical behavior to update_deal_stage
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-mcp-tools.md
  - PRD-mcp-tools.md
superseded-by: ~
---

# ADR-8: update_deal accepts a stage parameter and logs a transition — identical behavior to update_deal_stage

## Status
`proposed`

## Context

PRD-MCP-002 includes `stage` in the `update_deal` tool's parameter list. PRD-MCP-006 defines a dedicated `update_deal_stage` tool. PRD Open Question 2 asks whether `update_deal` with a `stage` parameter triggers a stage history entry, or whether stage changes must always go through `update_deal_stage`.

The recommended resolution in the PRD is: "both tools log transitions; `update_deal` with `stage` field is equivalent to `update_deal_stage`."

Having two different code paths for stage changes — one that logs, one that doesn't — would be a data integrity risk: if a developer or agent uses `update_deal` with a stage and it silently skips the history log, the audit trail is broken (violating PRD-DEAL-NFR-005).

## Decision

`update_deal` will accept an optional `stage` parameter. When `stage` is provided in an `update_deal` call, the server-side handler:
1. Reads the current stage from the database before updating
2. If the new stage differs from the current stage, inserts a `stage_history` record (from_stage = current, to_stage = new, actor = calling session user, source = inferred from session type)
3. Updates the deal record

`update_deal_stage` is a thin wrapper that calls the same underlying business logic. It exists as a separate tool for semantic clarity when the agent intends to change only the stage (not other fields), but it is not the only valid path for stage transitions.

The stage history insert and the deal update execute in a single database transaction. If either fails, both are rolled back.

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| stage parameter in update_deal is read-only / ignored | Prevents confusion about which tool owns stage transitions | `update_deal` schema would lie about accepting `stage`; agent would get no error but stage wouldn't change; the exact silent failure problem this PRD is solving | Rejected — replicates the legacy silent failure pattern |
| stage parameter in update_deal updates stage WITHOUT logging | Simple implementation; stage changes fast | Audit trail broken for any update_deal+stage call; violates PRD-DEAL-NFR-005 | Rejected — data integrity violation |
| **Both tools log transitions; update_deal with stage = equivalent to update_deal_stage** | Consistent behavior regardless of which tool is called; no audit trail gaps; both tools are useful | Slight implementation complexity: stage transition logic must be extracted into a shared service function | **Chosen** — eliminates the possibility of unlogged stage changes; consistent contract |

## Consequences

**Positive:**
- Stage transition logging is guaranteed regardless of which MCP tool is used
- No "gotcha" for the AI agent: any path that changes a stage produces a history entry
- A single `stageTransition()` service function is the single source of truth for the business logic

**Negative / Trade-offs:**
- The shared service function must be tested independently and called consistently from both tools
- The server must fetch the current stage before updating to determine whether a history entry is needed — one extra DB read per `update_deal` call with a `stage` parameter

**Risks:**
- If the shared service function is bypassed (e.g., a direct DB update in a migration script), the stage history will be incomplete; this must be documented as a constraint

## Review Trigger

- If the MCP tool surface expands and additional entry points for stage changes are added (e.g., a bulk stage update tool)

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
