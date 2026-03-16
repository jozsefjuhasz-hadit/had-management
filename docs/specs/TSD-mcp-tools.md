---
doc-type: TSD
project: had-management
feature: MCP Tools — Full AI Agent Coverage
version: 1.0
status: draft
date: 2026-03-14
author: tech-lead
approved-by: pending
related-docs:
  prd: PRD-mcp-tools.md
  implements: [PRD-MCP-001, PRD-MCP-002, PRD-MCP-003, PRD-MCP-004, PRD-MCP-005, PRD-MCP-006, PRD-MCP-007, PRD-MCP-008, PRD-MCP-009, PRD-MCP-010, PRD-MCP-011, PRD-MCP-012, PRD-MCP-020, PRD-MCP-021, PRD-MCP-022, PRD-MCP-023]
---

# TSD: MCP Tools — Full AI Agent Coverage

## 1. Overview

Implements the local stdio MCP server process that exposes all CRM operations to the AI agent. Each MCP tool translates to an authenticated HTTP request against the Vercel-hosted Next.js API. Tool schemas are derived from Drizzle schema types to prevent manual duplication. Full field parity: all 15 deal fields, all contact fields, complete activity CRUD, pipeline summary, and cross-entity search.

Implements: PRD-MCP-001 through PRD-MCP-023.

Key decisions: ADR-3 (AI agent identity), ADR-5 (stdio transport only), ADR-8 (update_deal with stage logs transition).

## 2. Tech Stack

| Layer | Technology | Version | Justification / ADR |
|-------|-----------|---------|---------------------|
| MCP server | `@modelcontextprotocol/sdk` | Latest | Official MCP SDK |
| Transport | stdio | — | ADR-5: local process only; no HTTP transport |
| HTTP client (tool → API) | Native `fetch` | — | Stack standard; no axios |
| Schema validation | Zod (shared with API layer) | Latest | PRD-MCP-NFR-003: tool schemas derived from shared Zod schemas |
| Agent authentication | Long-lived API token in local `.env` | — | Corresponds to HAD Agent user record (ADR-3) |
| Configuration | `claude_desktop_config.json` or equivalent MCP host config | — | Standard MCP host integration |

## 3. Data Model

No new data model entities. The MCP server itself is stateless. All persistence goes through the Vercel-hosted API layer, which owns all schemas (defined in TSD-auth, TSD-contacts, TSD-deals, TSD-reports).

The MCP server holds one environment variable: `MCP_API_TOKEN` — a long-lived JWT or Supabase service token scoped to the HAD Agent user's ID. This token must be set in the local `.env` file.

## 4. API / Operations

All MCP tools follow this pattern:
- MCP tool receives parameters
- Validates with shared Zod schema (same schema used by the API route)
- Makes authenticated HTTP request: `fetch(BASE_URL + endpoint, { headers: { Authorization: 'Bearer ' + MCP_API_TOKEN } })`
- Returns the API response as the tool result
- On HTTP error: returns structured error `{ error_code: string, message: string }`

**Base URL:** `process.env.MCP_BASE_URL` (e.g., `https://had-management.vercel.app`)

---

### Tool: create_deal
- **PRD:** PRD-MCP-001
- **HTTP call:** `POST /api/deals`
- **Required params:** `title: string`, `contact_id: uuid`
- **Optional params:** `stage: StageEnum`, `value: number`, `currency: CurrencyEnum`, `owner_id: uuid`, `expected_close: date`, `description: string`, `notes: string`, `next_step_owner_id: uuid`, `next_step_due: date`, `project_start_expected: date`, `project_start_actual: date`, `project_end: date`
- **Returns:** Full deal record including new `id` and initial `stage_history` entry
- **Error states:**
  | Error code | Condition |
  |------------|-----------|
  | VALIDATION_ERROR | Required field missing or invalid format |
  | INVALID_REFERENCE | `contact_id` or FK fields reference non-existent records |

---

### Tool: update_deal
- **PRD:** PRD-MCP-002
- **HTTP call:** `PATCH /api/deals/[deal_id]`
- **Required params:** `deal_id: uuid`
- **Optional params:** All deal fields (partial update; only provided fields are updated). If `stage` is provided and differs from current, a `stage_history` entry is created (ADR-8).
- **Returns:** Updated deal record
- **Error states:** VALIDATION_ERROR, INVALID_REFERENCE, NOT_FOUND

---

### Tool: create_contact
- **PRD:** PRD-MCP-003
- **HTTP call:** `POST /api/contacts`
- **Required params:** `name: string`
- **Optional params:** `email: string`, `phone: string`, `company: string`, `title: string`, `source: SourceEnum`, `kam_user_id: uuid`, `connection_user_id: uuid` (maps to `referred_by_user_id`), `notes: string`, `is_primary: boolean`
- **Returns:** Full contact record
- **Error states:** VALIDATION_ERROR, INVALID_REFERENCE, DUPLICATE_EMAIL (warning only — tool returns the duplicate notice and the existing contact ID; caller decides how to proceed)

---

### Tool: update_contact
- **PRD:** PRD-MCP-004
- **HTTP call:** `PATCH /api/contacts/[contact_id]`
- **Required params:** `contact_id: uuid`
- **Optional params:** All contact fields except name becoming optional (partial update)
- **Returns:** Updated contact record
- **Error states:** VALIDATION_ERROR, INVALID_REFERENCE, NOT_FOUND

---

### Tool: add_activity
- **PRD:** PRD-MCP-005
- **HTTP call:** `POST /api/activities`
- **Required params:** `type: ActivityTypeEnum`, `content: string`; at least one of `contact_id` or `deal_id`
- **Optional params:** `contact_id: uuid`, `deal_id: uuid`
- **Note:** `created_by_user_id` is NOT an input parameter — it is set server-side to the HAD Agent user ID from the session token
- **Returns:** Created activity record
- **Error states:**
  | Error code | Condition |
  |------------|-----------|
  | MISSING_LINK | Neither `contact_id` nor `deal_id` provided |
  | VALIDATION_ERROR | Empty content, invalid type |

---

### Tool: update_deal_stage
- **PRD:** PRD-MCP-006
- **HTTP call:** `PATCH /api/deals/[deal_id]` with `{ stage: target_stage }` (ADR-8: same endpoint as update_deal)
- **Required params:** `deal_id: uuid`, `stage: StageEnum`
- **Returns:** Updated deal record + the new `stage_history` entry
- **Error states:** VALIDATION_ERROR, NOT_FOUND

---

### Tool: close_deal
- **PRD:** PRD-MCP-007
- **HTTP call:** `POST /api/deals/[deal_id]/close`
- **Required params:** `deal_id: uuid`, `outcome: 'won' | 'lost'`, `close_reason: string`
- **Returns:** Updated deal record
- **Error states:** VALIDATION_ERROR (missing outcome or reason), NOT_FOUND

---

### Tool: get_pipeline_summary
- **PRD:** PRD-MCP-008
- **HTTP call:** `GET /api/dashboard/kpis`
- **Required params:** None
- **Returns:** `{ open_deal_count, pipeline_value_huf, won_value_huf, rates_stale, rates_last_updated, recent_activities[5] }`
- **Note:** Pipeline value equals what the Dashboard KPI card shows (same API endpoint)

---

### Tool: search_crm
- **PRD:** PRD-MCP-009
- **HTTP call:** `GET /api/search?q=[query]`
- **Required params:** `query: string` (min 2 characters)
- **Returns:** `{ contacts: [...], deals: [...], activities: [...] }` — each entity with `id` and display name; ILIKE search across searchable fields
- **API route (new):** `GET /api/search` — queries contacts (name, company, email), deals (title, description, notes), activities (content) with `ILIKE '%query%'`; returns top 10 per entity type

---

### Tool: get_contact_history
- **PRD:** PRD-MCP-010
- **HTTP call:** `GET /api/contacts/[contact_id]?include=full`
- **Required params:** `contact_id: uuid`
- **Returns:** Contact record + all linked activities (reverse chrono) + all linked deals with current stage

---

### Tool: update_activity (Should Have)
- **PRD:** PRD-MCP-020
- **HTTP call:** `PATCH /api/activities/[activity_id]`
- **Required params:** `activity_id: uuid`
- **Optional params:** `type: ActivityTypeEnum`, `content: string`
- **Returns:** Updated activity with `edited_at` timestamp

---

### Tool: delete_activity (Should Have)
- **PRD:** PRD-MCP-021
- **HTTP call:** `DELETE /api/activities/[activity_id]`
- **Required params:** `activity_id: uuid`
- **Returns:** `{ deleted: true, activity_id }`

---

### Tool: list_contacts (Should Have)
- **PRD:** PRD-MCP-022
- **HTTP call:** `GET /api/contacts?limit=[limit]&offset=[offset]&search=[query]`
- **Required params:** None
- **Optional params:** `limit: number (default 20, max 100)`, `offset: number (default 0)`, `search: string`
- **Returns:** `{ contacts: [...], total: N }`

---

### Tool: list_deals (Should Have)
- **PRD:** PRD-MCP-022
- **HTTP call:** `GET /api/deals?limit=[limit]&offset=[offset]&search=[query]&stage=[stage]`
- **Required params:** None
- **Optional params:** `limit: number`, `offset: number`, `search: string`, `stage: StageEnum`
- **Returns:** `{ deals: [...], total: N }`

---

### Tool: get_deal (Should Have)
- **PRD:** PRD-MCP-023
- **HTTP call:** `GET /api/deals/[deal_id]`
- **Required params:** `deal_id: uuid`
- **Returns:** Full deal record + `stage_history: [...]` (chronological) + `activities: [...]` (reverse chrono)

---

### Tool: archive_contact (Could Have)
- **PRD:** PRD-MCP-030
- **HTTP call:** `POST /api/contacts/[contact_id]/archive`
- **Required params:** `contact_id: uuid`, `confirmed: boolean`
- **Returns:** Updated contact record or `{ requires_confirmation: true, active_deal_count: N }`

---

### Tool: get_exchange_rates (Could Have)
- **PRD:** PRD-MCP-031
- **HTTP call:** `GET /api/exchange-rates`
- **Required params:** None
- **Returns:** `{ EUR_HUF: rate, USD_HUF: rate, fetched_at, stale: bool }`

## 5. Auth & Permissions Matrix

| Role | Operation | Allowed | Condition |
|------|-----------|---------|-----------|
| unauthenticated MCP client | any tool | No | API returns 401; tool propagates error |
| authenticated MCP client (HAD Agent token) | all read/write tools | Yes | Valid `MCP_API_TOKEN` in Authorization header |
| authenticated MCP client | user management | No | Not exposed as MCP tools (PRD-MCP Will Not Have) |
| authenticated MCP client | system config | No | Not exposed as MCP tools |

**Authentication flow:**
1. MCP server starts with `MCP_API_TOKEN` from environment
2. Every tool call includes `Authorization: Bearer ${MCP_API_TOKEN}` header
3. The API route middleware validates this token, resolves it to the HAD Agent user record (ADR-3)
4. Actor attribution uses the HAD Agent user ID; `source = 'agent'` is set on stage transitions

## 6. Non-Functional Implementation

| Requirement | Implementation approach | Verification method |
|-------------|------------------------|-------------------|
| PRD-MCP-NFR-001 100% deal field coverage | Zod schema for `create_deal` and `update_deal` derived from Drizzle deals schema; field coverage matrix maintained as a comment in the schema file | Coverage matrix audit: count parameters in tool definition vs. fields in deals table |
| PRD-MCP-NFR-002 No silent failure for unknown fields | Zod `strict()` mode on tool input schemas — unknown keys return a VALIDATION_ERROR, not a silent omission | Test: call `create_deal` with `unknown_field: "test"`; verify 422 error returned |
| PRD-MCP-NFR-003 Schema derived from Drizzle | Shared Zod schemas in `src/lib/schemas/` imported by both API routes and MCP tool definitions; no manual duplication | Code review: grep confirms tool schemas import from shared schema module |
| PRD-MCP-NFR-004 < 500ms per single-entity operation | Each tool = 1 HTTP request to Vercel; single DB operation per route; composite indexes support fast lookups | Time 10 consecutive `get_deal` calls in staging; assert P95 < 500ms |
| PRD-MCP-NFR-005 Same auth as web UI | `MCP_API_TOKEN` is validated by the same middleware as browser sessions; no bypass | Security test: invalid token → all tools return 401 |

## 7. Testing Strategy

| Type | Tool | Scope | What is tested |
|------|------|-------|----------------|
| Unit | Vitest | Tool schema validation (Zod), error mapping from HTTP response to MCP error format | Unknown field → VALIDATION_ERROR; missing required → VALIDATION_ERROR with field name |
| Integration | Vitest + running MCP server | `create_deal` (all 15 fields), `update_deal` (partial + with stage), `add_activity` (with and without contact/deal), `close_deal`, `get_pipeline_summary` | PRD-MCP-001: all 15 fields set; PRD-MCP-005: MISSING_LINK error; PRD-MCP-006: stage history logged; PRD-MCP-011: unauthenticated call rejected |
| E2E | Playwright (or manual) | Flow 1 (agent creates complete deal), Flow 2 (agent updates fields + stage) | Verify all fields in DB after agent operation; verify stage_history entry with source=agent |

PRD acceptance criteria mapping:
- PRD-MCP-001 → Integration: `create_deal` with all 15 fields → query DB → all 15 values present
- PRD-MCP-005 → Integration: `add_activity` with no contact/deal → assert MISSING_LINK error
- PRD-MCP-011 → Integration: call any tool with no token → assert 401

## 8. Migration / Deployment Notes

- Breaking changes: no — new stdio server; does not affect web UI
- Migration script required: no
- Deployment steps:
  1. Build MCP server: `bun build src/mcp/server.ts --outdir dist/mcp`
  2. Set `MCP_API_TOKEN` in developer's local `.env`
  3. Set `MCP_BASE_URL` to Vercel deployment URL in local `.env`
  4. Configure `claude_desktop_config.json` (or equivalent) to start the MCP server process
- Tested on staging: no — pending
- Rollback plan: revert MCP server binary; web UI unaffected
- Feature flag required: no

**Local `.env` additions required:**
```
MCP_API_TOKEN=<token-corresponding-to-had-agent-user-id>
MCP_BASE_URL=https://had-management.vercel.app
```

## 9. Open Technical Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | How is `MCP_API_TOKEN` generated? Recommend: Supabase service role JWT scoped to HAD Agent user, generated by the admin at deployment time via a one-time setup script. | juhaszj | Before implementation |
| 2 | Should the MCP server binary be included in the repo (committed) or built on demand? Recommend: build on demand (`bun build`); do not commit binary to repo. | tech-lead | Resolved: build on demand |
| 3 | `search_crm`: should archived contacts and closed deals be included in search results? Recommend: exclude archived contacts; include won/lost deals (they're valuable for historical lookup). | juhaszj | Before implementation |

## 10. ADRs Triggered

- [x] ADR-3: AI agent users table record
- [x] ADR-5: MCP stdio transport only
- [x] ADR-8: update_deal stage parameter logs transition

## 11. Next Steps

- [ ] TSD review — awaiting human approval
- [ ] ADR-5 approval — awaiting human review
- [ ] Generate MCP_API_TOKEN via deployment setup script — owner: juhaszj
- [ ] Implementation begins — after TSD approval and ADR approvals

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
