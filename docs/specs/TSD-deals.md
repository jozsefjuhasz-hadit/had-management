---
doc-type: TSD
project: had-management
feature: Deals — CRUD + Pipeline + Stage History
version: 1.0
status: draft
date: 2026-03-14
author: tech-lead
approved-by: pending
related-docs:
  prd: PRD-deals.md
  implements: [PRD-DEAL-001, PRD-DEAL-002, PRD-DEAL-003, PRD-DEAL-004, PRD-DEAL-005, PRD-DEAL-006, PRD-DEAL-007, PRD-DEAL-008, PRD-DEAL-009, PRD-DEAL-010, PRD-DEAL-011, PRD-DEAL-012, PRD-DEAL-013, PRD-DEAL-014]
---

# TSD: Deals — CRUD + Pipeline + Stage History

## 1. Overview

Implements the Deals module: fully editable deal detail page, complete field coverage (all 15 fields including the 7 previously missing), per-deal currency (HUF/EUR/USD), stage transition history with actor attribution, full activity CRUD linked to deals and/or contacts, and the Close Deal operation. All stage transitions — including those from MCP tools — are recorded immutably in `stage_history`.

Implements: PRD-DEAL-001 through PRD-DEAL-014.

Key decisions: ADR-3 (agent user for stage history attribution), ADR-6 (any user may edit activities), ADR-8 (update_deal stage parameter logs transitions), ADR-9 (current exchange rate only).

## 2. Tech Stack

| Layer | Technology | Version | Justification / ADR |
|-------|-----------|---------|---------------------|
| Frontend | Next.js App Router, React, TypeScript | Next.js 15 | Stack standard |
| UI components | shadcn/ui | Latest | Stack standard |
| Forms | React Hook Form + Zod | Latest | Stack standard |
| ORM | Drizzle ORM | Latest | Schema source of truth; immutable stage_history enforced at schema layer |
| Validation | Zod | Latest | Server-side validation on all routes |
| Currency conversion | Inline query against `exchange_rates` table | — | No external call at query time; rate pre-cached (ADR-9) |

## 3. Data Model

### Entity: deals

**Purpose:** A sales opportunity. Tracks the full lifecycle from lead to won/lost with all field coverage required for the AI agent and human users.

```
Fields:
  id:                      uuid        — PRIMARY KEY, default gen_random_uuid()
  title:                   text        — NOT NULL
  contact_id:              uuid        — NOT NULL — FK → contacts.id
  stage:                   text        — NOT NULL, DEFAULT 'lead' — enum: 'lead'|'qualified'|'proposal'|'negotiation'|'won'|'lost'
  value:                   numeric(15,2) — NULLABLE
  currency:                text        — NOT NULL, DEFAULT 'HUF' — enum: 'HUF'|'EUR'|'USD'
  owner_id:                uuid        — NULLABLE — FK → users.id
  expected_close:          date        — NULLABLE
  description:             text        — NULLABLE
  notes:                   text        — NULLABLE
  next_step_owner_id:      uuid        — NULLABLE — FK → users.id
  next_step_due:           date        — NULLABLE
  project_start_expected:  date        — NULLABLE
  project_start_actual:    date        — NULLABLE
  project_end:             date        — NULLABLE
  close_reason:            text        — NULLABLE — only meaningful when stage = won | lost
  created_by_user_id:      uuid        — NOT NULL — FK → users.id
  created_at:              timestamptz — NOT NULL, DEFAULT now()
  updated_at:              timestamptz — NOT NULL, DEFAULT now()

Primary key: id
Indexes:
  contact_id      — reason: list all deals for a contact (contact detail page)
  stage           — reason: filter by stage; pipeline aggregation
  owner_id        — reason: filter by owner
  expected_close  — reason: sort by close date
  next_step_due   — reason: sort by next step due (PRD-DEAL-012)
  (stage, value, currency) — composite — reason: pipeline value aggregation queries

Relations:
  contact_id          → contacts.id (many-to-one; required)
  owner_id            → users.id (many-to-one; nullable)
  next_step_owner_id  → users.id (many-to-one; nullable)
  created_by_user_id  → users.id (many-to-one; required)
  referenced by stage_history.deal_id
  referenced by activities.deal_id
```

**Access rules:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| read | user, admin | authenticated |
| create | user, admin | authenticated; `created_by_user_id` set server-side |
| update (all fields) | user, admin | authenticated; no ownership restriction |
| close (set stage won/lost) | user, admin | authenticated; requires `close_reason` |
| hard delete | none | not permitted |

---

### Entity: stage_history

**Purpose:** Immutable audit log of every stage transition. Records who changed the stage, from what, to what, and whether it was a human or the AI agent. Never updated or deleted after insert.

```
Fields:
  id:             uuid        — PRIMARY KEY, default gen_random_uuid()
  deal_id:        uuid        — NOT NULL — FK → deals.id ON DELETE CASCADE
  actor_user_id:  uuid        — NOT NULL — FK → users.id — never null; AI agent uses ADR-3 record
  from_stage:     text        — NULLABLE — null for the initial creation transition
  to_stage:       text        — NOT NULL
  source:         text        — NOT NULL — enum: 'human' | 'agent' — indicates origin of transition
  created_at:     timestamptz — NOT NULL, DEFAULT now()

Primary key: id
Indexes:
  deal_id     — reason: fetch all history for a deal (deal detail page)
  created_at  — reason: chronological ordering

Relations:
  deal_id       → deals.id
  actor_user_id → users.id
```

**Access rules:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| read | user, admin | authenticated |
| insert | system only | triggered by deal create, stage update, close operations — never a direct API endpoint |
| update | none | immutable — PRD-DEAL-NFR-003 |
| delete | none | immutable — PRD-DEAL-NFR-003 |

**Source determination:** If the request originates from an authenticated web session (Supabase Auth JWT from browser), `source = 'human'`. If the request originates from an API call authenticated with the agent's token (HAD Agent `user_id`), `source = 'agent'`. The server checks `session.user.id === AGENT_USER_ID` to distinguish.

---

### Entity: activities

**Purpose:** Records of interactions — calls, emails, notes, meetings — linked to a contact and/or deal.

```
Fields:
  id:                  uuid        — PRIMARY KEY, default gen_random_uuid()
  type:                text        — NOT NULL — enum: 'note'|'email'|'call'|'meeting'
  content:             text        — NOT NULL
  contact_id:          uuid        — NULLABLE — FK → contacts.id
  deal_id:             uuid        — NULLABLE — FK → deals.id
  created_by_user_id:  uuid        — NOT NULL — FK → users.id
  edited_by_user_id:   uuid        — NULLABLE — FK → users.id — set on edit (ADR-6)
  created_at:          timestamptz — NOT NULL, DEFAULT now()
  edited_at:           timestamptz — NULLABLE — set when activity is edited

Constraint: CHECK (contact_id IS NOT NULL OR deal_id IS NOT NULL) — at least one must be set

Primary key: id
Indexes:
  deal_id              — reason: activity timeline on deal detail (most frequent query)
  contact_id           — reason: activity timeline on contact detail
  (deal_id, created_at DESC)     — composite — reason: timeline pagination
  (contact_id, created_at DESC)  — composite — reason: timeline pagination

Relations:
  contact_id          → contacts.id (nullable)
  deal_id             → deals.id (nullable)
  created_by_user_id  → users.id
  edited_by_user_id   → users.id (nullable)
```

**Access rules:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| read | user, admin | authenticated |
| create | user, admin | authenticated; `created_by_user_id` set server-side |
| update (type, content) | user, admin | authenticated; any user may edit any activity (ADR-6); `edited_by` and `edited_at` set server-side |
| delete | user, admin | authenticated; requires confirmation (client-side) — no server-side restriction |

## 4. API / Operations

### Operation: POST /api/deals
- **Trigger:** Deal create form submission
- **Input:** `{ title, contact_id, stage?, value?, currency?, owner_id?, expected_close?, description?, notes?, next_step_owner_id?, next_step_due?, project_start_expected?, project_start_actual?, project_end? }`
- **Validation (Zod):**
  - `title`: non-empty string
  - `contact_id`: valid UUID; must exist in contacts (not archived)
  - `stage`: enum value if provided, default 'lead'
  - `currency`: enum value if provided, default 'HUF'
  - `value`: positive number if provided
  - `owner_id`, `next_step_owner_id`: valid UUID; must exist in users and `is_agent = false` (validate active human users per PRD-MCP-004 open question — active user validation)
  - Date fields: ISO 8601 format
- **Authorization:** Authenticated
- **Business logic (single transaction):**
  1. Validate input
  2. Insert deal record; `created_by_user_id` from session
  3. Insert initial `stage_history` record: `from_stage = null`, `to_stage = stage`, `actor_user_id` from session, `source` inferred from session type
  4. Return created deal
- **Output:** `201 { deal: {...}, stage_history: [initial_entry] }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Missing title | empty string | 422 `{ field: "title", message: "Deal title is required" }` |
  | Missing contact | no contact_id | 422 `{ field: "contact_id", message: "A contact must be linked" }` |
  | Archived contact | contact_id refers to archived contact | 422 `{ field: "contact_id", message: "Selected contact is archived" }` |
  | Invalid FK | owner_id not in users | 422 `{ field: "owner_id", message: "Selected user does not exist" }` |

### Operation: PATCH /api/deals/[id]
- **Trigger:** Deal detail edit save; MCP `update_deal`
- **Input:** Partial deal fields (any subset of all deal fields except id, created_at, created_by_user_id)
- **Validation:** Same field-level rules as POST; title cannot be set to empty
- **Authorization:** Authenticated
- **Business logic (single transaction — ADR-8):**
  1. Validate partial input
  2. If `stage` is in the update payload AND differs from current DB value:
     - Insert `stage_history` record: `from_stage = current_stage`, `to_stage = new_stage`, `actor_user_id` from session, `source` inferred
  3. Update deal record; `updated_at = now()`
  4. Return updated deal
- **Output:** `200 { deal: {...} }`
- **Error states:** Same as POST plus `404` if deal not found

### Operation: POST /api/deals/[id]/close
- **Trigger:** Close Deal action
- **Input:** `{ outcome: "won" | "lost", close_reason: string }`
- **Validation:** `outcome` required; `close_reason` non-empty
- **Authorization:** Authenticated
- **Business logic (transaction):**
  1. Validate input
  2. Update deal: `stage = outcome`, `close_reason = close_reason`, `updated_at = now()`
  3. Insert `stage_history`: `from_stage = current_stage`, `to_stage = outcome`, actor from session
  4. Return updated deal
- **Output:** `200 { deal: {...} }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Missing outcome | `outcome` not provided | 422 `{ field: "outcome", message: "Select Won or Lost" }` |
  | Missing reason | `close_reason` empty | 422 `{ field: "close_reason", message: "Close reason is required" }` |

### Operation: GET /api/deals/[id]
- **Trigger:** Deal Detail page load; MCP `get_deal`
- **Input:** `id` path param
- **Authorization:** Authenticated
- **Business logic:**
  1. Fetch deal with related: `contact` (name), `owner` (display_name), `next_step_owner` (display_name), `created_by_user` (display_name)
  2. Fetch `stage_history` for this deal, chronological, join `actor_user` display_name
  3. Fetch `activities` for this deal, reverse chronological, join author display_name; limit 50 per page
  4. Return composite
- **Output:** `200 { deal, stage_history: [...], activities: [...], activities_total: N }`

### Operation: GET /api/deals
- **Trigger:** Deals list page
- **Input:** `search?, stage?, sortBy?, order?, page?, limit?`
- **Authorization:** Authenticated
- **Business logic:** Filter/sort/paginate deals; include owner display_name; do not include stage_history or activities in list response
- **Output:** `200 { deals: [...], total: N }`

### Operation: POST /api/activities
- **Trigger:** "Log Activity" from Deal Detail or Contact Detail
- **Input:** `{ type, content, deal_id?, contact_id? }`
- **Validation:**
  - `type`: enum value
  - `content`: non-empty
  - At least one of `deal_id` or `contact_id` must be provided
- **Authorization:** Authenticated
- **Business logic:** Insert activity; `created_by_user_id` from session
- **Output:** `201 { activity: {...} }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Empty content | `content` empty | 422 `{ field: "content", message: "Activity content is required" }` |
  | No link | neither `deal_id` nor `contact_id` | 422 `{ error: "MISSING_LINK", message: "At least one of contact_id or deal_id is required" }` |

### Operation: PATCH /api/activities/[id]
- **Trigger:** Edit activity action
- **Input:** `{ type?, content? }`
- **Validation:** `content` non-empty if provided
- **Authorization:** Authenticated (any user — ADR-6)
- **Business logic:** Update `type` and/or `content`; set `edited_at = now()`, `edited_by_user_id` from session
- **Output:** `200 { activity: {...} }`

### Operation: DELETE /api/activities/[id]
- **Trigger:** Delete activity confirmed
- **Input:** None
- **Authorization:** Authenticated (any user — ADR-6)
- **Business logic:** Hard delete the activity record
- **Output:** `204 No Content`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Not found | Activity ID does not exist | 404 |

## 5. Auth & Permissions Matrix

| Role | Operation | Allowed | Condition |
|------|-----------|---------|-----------|
| unauthenticated | any | No | 401 |
| user | list, read deals | Yes | Authenticated |
| user | create, update deals | Yes | Authenticated |
| user | close deal | Yes | Authenticated |
| user | read stage_history | Yes | Authenticated (read-only) |
| user | insert stage_history directly | No | System-only operation |
| user | create, read, update, delete activities | Yes | ADR-6: no author restriction |
| admin | all user operations | Yes | |

## 6. Non-Functional Implementation

| Requirement | Implementation approach | Verification method |
|-------------|------------------------|-------------------|
| PRD-DEAL-NFR-001 Detail page < 2s with 50 activities | Separate paginated activity fetch (limit 50); composite indexes on (deal_id, created_at DESC); no N+1 (Drizzle joins) | Load test: seed deal with 50 activities; measure page load |
| PRD-DEAL-NFR-002 FK constraints for owner/next_step_owner | Drizzle schema FK references; DB-level constraint | Test: insert deal with non-existent owner_id; expect 422 |
| PRD-DEAL-NFR-003 stage_history immutability | No UPDATE or DELETE endpoint for stage_history; Drizzle schema has no update method defined for this table; code review enforces | Code review: grep for UPDATE/DELETE on stage_history; integration test attempts direct update and expects 405 |
| PRD-DEAL-NFR-004 Accessibility | shadcn/ui form components; stage picker keyboard navigable | axe audit on deal create/edit form |
| PRD-DEAL-NFR-005 100% stage transitions logged | Integration test: create deal + 3 stage changes via UI; verify stage_history has 4 entries (including initial) | Vitest integration test |

## 7. Testing Strategy

| Type | Tool | Scope | What is tested |
|------|------|-------|----------------|
| Unit | Vitest | Stage transition service function, source detection (human vs. agent), currency conversion | `stageTransition()` service: logs correctly for human and agent sessions; immutability contract |
| Integration | Vitest + Supabase test client | All deal and activity API routes | PRD-DEAL-001: all 15 fields creatable; PRD-DEAL-004: stage history on create + update; PRD-DEAL-009: activity CRUD; PRD-DEAL-010: close deal |
| E2E | Playwright | Flow 1 (create), Flow 2 (edit + activity), Flow 3 (close), Flow 4 (stage history), Flow 5 (activity edit) | Full deal lifecycle; stage history visible; activity timeline renders |

PRD acceptance criteria mapping:
- PRD-DEAL-001 → Integration: create deal with all 15 fields; verify all stored
- PRD-DEAL-004 → Integration: create deal → assert stage_history entry (from=null, to=lead, actor=user)
- PRD-DEAL-004 → Integration: update stage → assert stage_history entry (from=lead, to=qualified, actor=user)
- PRD-DEAL-005 → E2E: seed 3 stage transitions; deal detail shows all 3
- PRD-DEAL-009 → E2E: edit activity → `edited_at` visible; delete with confirmation prompt
- PRD-DEAL-010 → Integration: close with outcome=won, close_reason → verify stage=won, close_reason stored

## 8. Migration / Deployment Notes

- Breaking changes: yes — new tables (stage_history), new fields on deals (currency, plus 7 previously missing); clean slate (BRD OS-2)
- Migration script required: no — fresh schema (Drizzle kit push)
- Tested on staging: no — pending
- Rollback plan: revert deployment
- Feature flag required: no

## 9. Open Technical Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Activity pagination: initial load is 50 per page (PRD-DEAL-NFR-001). Should "load more" be infinite scroll or a paginator? Recommend: "Load more" button (simplest). | juhaszj | Before implementation |
| 2 | Stage history: should the deal detail page show ALL history entries, or paginate? Recommend: all (typically < 10 entries per deal). | tech-lead | Resolved: show all, no pagination |

## 10. ADRs Triggered

- [x] ADR-3: AI agent user record (stage history actor)
- [x] ADR-6: Activity edit by any authenticated user
- [x] ADR-8: update_deal with stage parameter logs transition

## 11. Next Steps

- [ ] TSD review — awaiting human approval
- [ ] ADR-6, ADR-8 approval — awaiting human review
- [ ] Implementation begins — after TSD approval

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
