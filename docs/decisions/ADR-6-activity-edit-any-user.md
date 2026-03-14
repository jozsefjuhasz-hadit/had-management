---
doc-type: ADR
project: had-management
adr-number: 6
title: Any authenticated user may edit or delete any activity (not author-only)
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-deals.md
  - PRD-deals.md
superseded-by: ~
---

# ADR-6: Any authenticated user may edit or delete any activity (not author-only)

## Status
`proposed`

## Context

PRD-DEAL-009 requires activity CRUD with edit capability. PRD Open Question 2 asks whether edit is restricted to the original author or any authenticated user. PD-5 in the debt backlog recommends "any authenticated user can edit any activity in MVP; refine in post-MVP if needed."

The key constraint: the AI agent (HAD Agent user) creates activities on behalf of human users. If edit is author-only and the agent created an activity with a mistake, the only human who could correct it would be "HAD Agent" — which has no human login. This would require a direct database fix by the admin.

Team size is 2–5 people; privacy concerns about activity visibility are explicitly excluded ("All activities are visible to all authenticated users" — PRD-DEAL Will Not Have section).

## Decision

Any authenticated user may edit or delete any activity. There is no author-only restriction. The `created_by_user_id` field remains on the record for display and audit purposes (showing who originally created it), but does not gate the edit/delete operation.

When an activity is edited, an `edited_at` timestamp and `edited_by_user_id` are recorded on the activity record, maintaining an audit trail of who last modified it.

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| Author-only edit | Cleaner ownership model; prevents accidental overwrites | Agent-created activities cannot be corrected by human users without a direct DB fix; overly restrictive for a 2-5 person team | Rejected — creates an unworkable situation for agent-created content |
| Author + admin edit | Balanced; admin can always correct | Adds role-based logic to activity edit path; admin role must be checked on every edit operation; admin becomes a bottleneck | Rejected — unnecessary complexity for team size; PD-5 explicitly deferred this |
| **Any authenticated user** | Simplest; works for agent-created content; team-sized trust model; matches "all activities visible to all" design | No author protection; any user can overwrite any activity | **Chosen** — matches team size and trust model; resolves agent-created content correction problem |

## Consequences

**Positive:**
- Agent-created activities can be corrected by the admin without database access
- Edit permission check is simple: `isAuthenticated`
- Consistent with the existing "all activities are visible to all" design

**Negative / Trade-offs:**
- Any user can overwrite another user's activity notes; accidental overwrites are possible
- The audit trail (who edited last) is visible but the original content is not preserved (no full edit history)

**Risks:**
- If team grows and members want activity privacy, this decision will need revisiting (review trigger below)
- The edited_by field could become confusing if multiple users edit the same activity in sequence

## Review Trigger

- If team size exceeds 10 people and activity ownership disputes arise
- If a use case for private or confidential activity notes is identified
- If an audit requirement emerges that demands full edit history (not just last-edited-by)

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
