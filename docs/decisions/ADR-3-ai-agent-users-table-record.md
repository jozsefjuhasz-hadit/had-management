---
doc-type: ADR
project: had-management
adr-number: 3
title: AI agent gets a dedicated record in the users table for activity attribution
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-auth.md
  - TSD-deals.md
  - TSD-mcp-tools.md
  - PRD-mcp-tools.md
superseded-by: ~
---

# ADR-3: AI agent gets a dedicated record in the users table for activity attribution

## Status
`proposed`

## Context

Every stage transition and activity record requires a non-null `actor_user_id` foreign key to the `users` table (PRD-DEAL-004, PRD-MCP-011, PRD-DEAL-NFR-005). The AI agent (Claude Code via MCP tools) performs a significant share of all writes.

PRD-MCP Open Question 3 was explicitly resolved: "Dedicated AI agent user record in the users table, distinct from human users. All OAuth users come from Entra ID; the AI agent record is created manually by the admin." (PD-1 resolution.)

Three patterns were possible: null actor for agent writes, attribute to the admin user, or create a stable "HAD Agent" service account record. Only the third satisfies the auditability requirements without polluting the admin user's activity history.

## Decision

We will create a single reserved record in the `users` table for the AI agent:
- `id`: a fixed, well-known UUID (generated once, stored in environment configuration)
- `display_name`: "HAD Agent"
- `email`: a non-routable placeholder (e.g., `agent@had-internal`)
- `entra_id`: null (this record is not linked to any Entra ID identity)
- `role`: "user"
- `is_agent`: `true` (boolean flag to distinguish from human users)

This record is created by the administrator at initial deployment via a seeding script. It is never created by the OAuth flow. MCP tool calls use this fixed `user_id` for all actor attribution.

Human users are always provisioned via OAuth (Entra ID first-login flow). The agent record is the only exception to the OAuth-provisioned user rule.

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| Null actor for agent writes | Simple; no special record needed | Violates PRD-DEAL-NFR-005 (non-null actor required); breaks auditability for all agent transitions | Rejected — violates hard requirement |
| Attribute agent writes to admin user (juhaszj) | No extra record needed | Pollutes admin's activity history; misrepresents who performed the action; breaks audit clarity when János and the agent both operate | Rejected — misleading audit trail |
| **Dedicated "HAD Agent" users table record** | Clear attribution; satisfies FK constraint; distinguishable from human users via `is_agent` flag; stable ID across sessions | Admin must manually seed this record at deployment; slightly special-cases the users table | **Chosen** — resolves PD-1; satisfies all auditability requirements; minimal complexity |

## Consequences

**Positive:**
- Every stage transition and activity write has a non-null, attributable actor
- The `is_agent` flag allows the UI to display "HAD Agent" (not "HAD Agent (User)") in stage history
- The agent's fixed ID is stable across redeployments and database resets

**Negative / Trade-offs:**
- A deployment seeding script is required; if skipped, MCP tools will fail with FK violations on all write operations
- The `entra_id` column is null for this record, requiring the users table constraint to be nullable (rather than `NOT NULL`)

**Risks:**
- If the seeding script is not run or the fixed UUID is changed after deployment, all existing stage history entries will have a dangling FK
- The "HAD Agent" record could be accidentally used in the KAM or Owner user pickers in the UI; the `is_agent` flag should filter it out of human-facing user pickers

## Review Trigger

- If the AI agent is replaced or supplemented by a different system that requires its own identity
- If multiple agent identities are needed (e.g., different agents for different workflows)

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
