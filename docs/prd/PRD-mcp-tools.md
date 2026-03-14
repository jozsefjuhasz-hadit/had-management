---
status: draft
last-updated: 2026-03-13
owner: juhaszj
doc-type: PRD
project: had-management
feature: MCP Tools — Full Agent Coverage
version: 1.0
approved-by: pending
related-docs:
  brd: BRD-had-management.md
  implements: [S-9, BO-2, SM-2]
---

# PRD: MCP Tools — Full AI Agent Coverage

## 1. Overview

The AI agent (Claude Code) is the primary operator of the HAD CRM — it creates contacts, manages deals, logs activities, and queries pipeline status. The web UI is the human oversight layer. For this architecture to function, every writable field and every meaningful read operation in the data model must be accessible through MCP tools. In the legacy system, 7 deal fields were never added to the MCP tool definitions, silently blocking the AI agent from executing complete instructions. The rewrite must achieve 100% field parity: if a field can be written through the web UI, it must be writable through an MCP tool.

This is not a nice-to-have. If the AI agent cannot set a field, the system's design philosophy breaks down. János (the system owner) must then manually correct every incomplete agent operation via the REST API, which defeats the purpose of building an MCP-first system.

## 2. Problem Statement

The legacy MCP tool set has two categories of gaps. First, 7 deal fields exist in the database and REST API but are absent from `create_deal` and `update_deal` tool schemas: description, owner, next_step_owner, next_step_due, project_start_expected, project_start_actual, and project_end. The agent attempts to set these fields, receives no error, and the fields are silently not set. Second, there is no mechanism to verify which fields the agent successfully set, because the Deal Detail page in the legacy UI doesn't surface the full picture (read-only, no stage history, no activity timeline).

The rewrite addresses both problems: 100% field parity in MCP tools, plus the web UI changes in PRD-DEALS that make verification possible.

Addresses: BO-2, SM-2, S-9, debt items F-1, DOC-6

## 3. Users & Personas

| Persona | Who they are | Primary goal | Current frustration |
|---------|-------------|-------------|-------------------|
| Juhász János (IT Admin) | System owner; the only person who configures and calls MCP tools | Instruct the AI agent to fully operate the CRM — creating and updating all entity fields — without needing to follow up with manual corrections | 7 deal fields are unreachable via MCP; the agent's partial execution produces no error signal; manual REST API corrections are required after every compound agent operation |
| AI Agent (Claude Code) | Primary operator of all CRM data writes | Execute create/update/read/delete operations for all CRM entities with full field coverage | Cannot set description, owner, next_step_owner, next_step_due, project_start_expected, project_start_actual, or project_end via any tool |

## 4. User Flows

### Flow 1: AI agent creates a complete deal via MCP

**Trigger:** János instructs the AI agent: "Create a new deal for contact ID 42, title 'Cloud Infrastructure Proposal', stage qualified, value 2500000, currency EUR, owner user ID 3, next step owner user ID 3, next step due 2026-04-15, description 'Three-year managed cloud contract'."

1. The agent calls `create_deal` with all provided fields in the tool parameters.
2. The tool validates required fields (title, contact_id).
3. The tool creates the deal record with all provided fields set.
4. The initial stage transition is recorded (from = null, to = qualified, actor = agent session user, source = agent).
5. The tool returns the created deal record including its new ID and all field values as confirmation.
6. The agent confirms to János: "Deal created. ID: 77. All fields set as instructed."
7. János opens the Deal Detail page in the web UI and verifies all fields are populated correctly.

**Result:** A complete deal is created in a single tool call. No manual corrections needed.

---

### Flow 2: AI agent updates deal fields and moves stage

**Trigger:** János instructs the agent: "Update deal 77: set owner to user ID 5, set next_step_due to 2026-04-30, move stage to negotiation."

1. The agent calls `update_deal` with the changed field values (owner, next_step_due).
2. The tool updates the deal record.
3. The agent calls `update_deal_stage` with stage = negotiation.
4. The tool updates the stage and records a stage transition (actor = agent session, from = qualified, to = negotiation, source = agent).
5. Both tools return confirmation of the updated state.
6. János verifies in the UI: deal shows updated fields, stage history shows the transition.

**Result:** All field updates are applied. Stage history is attributed to the agent.

---

### Flow 3: AI agent queries pipeline summary

**Trigger:** János asks the agent: "What is the current pipeline status? How many deals are in each stage and what is the total pipeline value?"

1. The agent calls `get_pipeline_summary`.
2. The tool returns: deal counts per stage, total pipeline value in HUF (with currency conversions applied), recent activity summary.
3. The agent presents the summary to János.

**Result:** János gets an accurate pipeline overview in natural language without opening the web UI.

---

### Flow 4: AI agent searches across CRM entities

**Trigger:** János asks the agent: "Find anything in the CRM related to 'TechCorp Budapest'."

1. The agent calls `search_crm` with query = "TechCorp Budapest".
2. The tool returns matching contacts, deals, and activities that contain the search string.
3. The agent presents the results grouped by entity type.

**Result:** Cross-entity search from a single tool call.

---

## 5. Feature Requirements (MoSCoW)

### Must Have — launch blocker

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-MCP-001 | The `create_deal` tool exposes every writable deal field: title, contact_id, stage, value, currency, owner_id, expected_close, description, notes, next_step_owner_id, next_step_due, project_start_expected, project_start_actual, project_end. Required fields (title, contact_id) are documented as required in the tool schema; all others are optional. | **Given** the agent calls `create_deal` with all 15 fields populated, **when** the tool executes, **then** the resulting deal record has all 15 fields set to the provided values. **Given** the agent calls `create_deal` with only title and contact_id, **when** the tool executes, **then** the deal is created successfully with defaults for all other fields. |
| PRD-MCP-002 | The `update_deal` tool exposes every editable deal field: title, stage, value, currency, owner_id, expected_close, description, notes, next_step_owner_id, next_step_due, project_start_expected, project_start_actual, project_end. All fields are optional (partial updates supported). When stage is changed via `update_deal`, the stage transition is logged with actor attribution. | **Given** the agent calls `update_deal` with only the `owner_id` field, **when** the tool executes, **then** only the owner is updated; all other fields are unchanged. **Given** the agent calls `update_deal` with a new stage value, **when** the tool executes, **then** a stage history entry is created with the agent as actor, from_stage = previous stage, to_stage = new stage. |
| PRD-MCP-003 | The `create_contact` tool exposes every writable contact field: name, email, phone, company, title, source, kam_user_id, connection_user_id, notes, is_primary. | **Given** the agent calls `create_contact` with all fields, **when** the tool executes, **then** the resulting contact record has all fields set, and kam_user_id is stored as a valid FK to the users table. |
| PRD-MCP-004 | The `update_contact` tool exposes every editable contact field (same as create except name becomes optional). Partial updates are supported. | **Given** the agent calls `update_contact` with only the `company` field, **when** the tool executes, **then** only the company field is updated; all other fields are unchanged. |
| PRD-MCP-005 | The `add_activity` tool exposes all activity fields: type (note, email, call, meeting), content, contact_id (optional), deal_id (optional). At least one of contact_id or deal_id must be provided. The created_by field is set server-side from the authenticated session — it is not an input parameter. | **Given** the agent calls `add_activity` with type = call, content = "Discussed pricing", and deal_id = 77, **when** the tool executes, **then** an activity record is created and appears in the activity timeline on Deal 77's detail page. **Given** the agent calls `add_activity` with neither contact_id nor deal_id, **when** the tool executes, **then** a validation error is returned: "At least one of contact_id or deal_id is required." |
| PRD-MCP-006 | The `update_deal_stage` tool accepts a deal_id and a target stage. It updates the deal's stage and records a stage transition with actor = calling session and source = agent. It returns the updated deal and the new stage history entry. | **Given** the agent calls `update_deal_stage` for deal 77 with stage = won, **when** the tool executes, **then** deal 77's stage is won, and a stage history entry exists with from_stage = previous stage, to_stage = won, actor = agent session user, source = agent. |
| PRD-MCP-007 | The `close_deal` tool accepts deal_id, outcome (won or lost), and close_reason. It updates the stage, sets the close_reason, and records a stage transition. | **Given** the agent calls `close_deal` with deal_id = 77, outcome = lost, close_reason = "Budget cut", **when** the tool executes, **then** deal 77 has stage = lost, close_reason = "Budget cut", and a stage transition entry with the agent as actor. |
| PRD-MCP-008 | The `get_pipeline_summary` tool returns: deal counts per stage, total pipeline value in HUF (multi-currency converted using current MNB rates), total won value in HUF, and the most recent 5 activity summaries. | **Given** the agent calls `get_pipeline_summary`, **when** the tool executes, **then** the returned pipeline value equals the sum of converted HUF values for all active-stage deals, matching the value shown in the Dashboard KPI card. |
| PRD-MCP-009 | The `search_crm` tool accepts a query string and returns matching contacts, deals, and activities. Results are grouped by entity type with entity IDs and display names. | **Given** the agent calls `search_crm` with query = "TechCorp," **when** the tool executes, **then** all contacts, deals, and activities containing "TechCorp" in any searchable field are returned. |
| PRD-MCP-010 | The `get_contact_history` tool accepts a contact_id and returns all activities linked to that contact in reverse chronological order, plus all deals linked to that contact with their current stage. | **Given** the agent calls `get_contact_history` for contact_id = 42, **when** the tool executes, **then** all activities linked to contact 42 are returned (most recent first), and all deals linked to contact 42 are listed with current stage. |
| PRD-MCP-011 | All MCP tool calls are authenticated. The tool execution context carries the authenticated user identity (from the MCP session), which is used for actor attribution in stage transitions, activity creation, and audit logs. Unauthenticated MCP tool calls are rejected. | **Given** an unauthenticated MCP client calls any tool, **when** the tool attempts to execute, **then** an authentication error is returned and no data is modified. **Given** an authenticated MCP session calls `update_deal_stage`, **when** the stage transition is recorded, **then** the actor field in the stage history entry references the authenticated user's ID. |
| PRD-MCP-012 | MCP tool schemas are the definitive, documented contract for all agent interactions. The tool descriptions accurately document every parameter, including data types, constraints, and whether the field is required or optional. | **Given** a developer reads the MCP tool schema for `create_deal`, **when** they review all parameter definitions, **then** every deal field in the database schema has a corresponding parameter entry with type, description, and optionality documented. |

### Should Have — important but not blocking launch

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-MCP-020 | The `update_activity` tool allows updating the type and content of an existing activity. It records an edit timestamp on the activity. | **Given** the agent calls `update_activity` with activity_id = 15 and new content, **when** the tool executes, **then** the activity's content is updated and `edited_at` is set to the current timestamp. |
| PRD-MCP-021 | The `delete_activity` tool removes an activity by ID. It returns a confirmation of deletion. | **Given** the agent calls `delete_activity` with activity_id = 15, **when** the tool executes, **then** the activity is deleted and no longer appears in any timeline or list. |
| PRD-MCP-022 | The `list_contacts` and `list_deals` tools support pagination parameters (offset, limit) and a search query parameter. | **Given** the agent calls `list_deals` with limit = 10 and offset = 20, **when** the tool executes, **then** deals 21-30 (in default sort order) are returned. |
| PRD-MCP-023 | The `get_deal` tool returns all deal fields including the stage history array (all transitions in chronological order) and the activity list (all activities in reverse chronological order). | **Given** the agent calls `get_deal` for deal_id = 77, **when** the tool executes, **then** the response includes the deal record, an array of stage history entries, and an array of linked activities. |

### Could Have — nice to have, defer if needed

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-MCP-030 | An `archive_contact` tool allows the agent to soft-delete a contact by ID. | **Given** the agent calls `archive_contact` for contact_id = 42, **when** the tool executes, **then** the contact's archived flag is set and it no longer appears in list queries. |
| PRD-MCP-031 | A `get_exchange_rates` tool returns the currently cached EUR/HUF and USD/HUF rates with the last-updated timestamp. | **Given** the agent calls `get_exchange_rates`, **when** the tool executes, **then** the current EUR/HUF rate, USD/HUF rate, and last_updated timestamp are returned. |
| PRD-MCP-032 | MCP tools return structured error objects with a machine-readable error code and a human-readable message when a validation error occurs (e.g., missing required field, invalid FK reference). | **Given** the agent calls `create_deal` with a contact_id that does not exist, **when** the tool executes, **then** the response contains error code "INVALID_REFERENCE" and message "contact_id 999 does not exist." |

### Will Not Have — explicit scope boundary for this release

| Item | Reason for exclusion |
|------|---------------------|
| MCP tools for user management (create/delete users) | Users are provisioned exclusively through Microsoft Entra ID authentication. No user management via MCP. |
| MCP tools for system configuration (exchange rate override, stage definitions) | System configuration is an admin UI function, not an agent function. |
| MCP tools for report generation | Reports are a web UI feature; the agent can query pipeline summary via `get_pipeline_summary` which provides the same data. |
| MCP tools over HTTP transport | MCP operates over stdio transport for local AI agent use. No HTTP-based MCP endpoint in this release. |
| Public MCP endpoint accessible to external systems | MCP is a local developer/AI interface only. External automation uses the REST API (out of scope for this release). |

## 6. Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| PRD-MCP-NFR-001 | Completeness | 100% of writable deal fields are exposed in both `create_deal` and `update_deal` tool schemas. | Field coverage matrix: all 15 deal fields mapped against tool parameter list; zero gaps. |
| PRD-MCP-NFR-002 | Reliability | An MCP tool that attempts to set a field that does not exist in the schema returns a clear error message, not silent failure. | Test: call `create_deal` with an unknown field; verify the response is an error, not a silent omission. |
| PRD-MCP-NFR-003 | Schema sync | The MCP tool schemas are derived from or validated against the Drizzle schema definitions. Manual duplication of field definitions between tools and schema is not permitted. | Code review confirms tool parameter definitions reference shared type definitions from the Drizzle schema layer. |
| PRD-MCP-NFR-004 | Performance | Each MCP tool call completes in under 500ms for single-entity operations (create, read, update) under normal load. | Measured by tool execution time in a test environment with a seeded database. |
| PRD-MCP-NFR-005 | Security | All MCP tool execution is authorized via the same session authentication as the web UI. No separate MCP-specific authentication token or bypass. | Security test: attempt tool call with expired or invalid session; verify rejection. |

## 7. Success Metrics

| Metric | Baseline | Target | How measured |
|--------|---------|--------|-------------|
| Deal field coverage in MCP tools | 8 of 15 writable deal fields exposed (legacy) | 15 of 15 writable deal fields exposed | Field coverage matrix audit at launch |
| Manual API corrections after agent operations | Frequent (estimate: every compound operation) | Zero manual corrections needed for standard CRUD operations | János self-reported in a 2-week post-launch review |
| MCP tool call error rate | Not measured (legacy) | < 1% of tool calls return an unexpected error | Error log monitoring in first 4 weeks post-launch |
| Tool schema documentation completeness | Incomplete (7 fields missing from documentation per DOC-6) | 100% of parameters documented with type, description, and optionality | Manual audit of tool schema definitions |

## 8. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Should MCP tools return the full updated entity record on every write operation (create/update), or just the entity ID for efficiency? | juhaszj | TSD phase | Open — recommend full entity return for agent usability |
| 2 | Should `update_deal` accept a `stage` parameter directly (implicitly triggering a stage transition log), or should stage changes always go through `update_deal_stage`? | juhaszj | Before TSD | Open — recommend: both tools log transitions; `update_deal` with `stage` field is equivalent to `update_deal_stage` |
| 3 | How is the MCP session user identified for actor attribution? Is it the same session as the web UI (Supabase session), or a separate service account for the AI agent? | juhaszj | Before TSD | **RESOLVED 2026-03-13**: Dedicated AI agent user record in the users table, distinct from human users. All OAuth users come from Entra ID; the AI agent record is created manually by the admin. |
| 4 | Should MCP tools validate that `owner_id` and `next_step_owner_id` are active (non-archived) users, or accept any valid user ID? | juhaszj | TSD phase | Open — recommend: validate active users only |

## 9. Out of Scope (explicit)

- MCP over HTTP transport — reason: stdio transport is the defined integration mode; HTTP MCP would require a public or network-accessible endpoint which is explicitly out of scope.
- External automation via MCP — reason: n8n and Power Automate integration is excluded from this release (BRD OS-1).
- MCP tools for admin operations (user management, configuration) — reason: admin functions are UI-only in this release.
- Conversational AI UX design — reason: the PRD covers tool coverage only; how the AI agent reasons about and presents CRM data is the AI agent's domain, not the CRM product's.
- Versioned MCP tool schemas — reason: single consumer (internal); versioning adds complexity without benefit at this stage.

## 10. Dependencies

- PRD-AUTH: Authentication layer must be in place before MCP tool authentication can be implemented (PRD-MCP-011).
- PRD-DEALS: Stage history table and full deal field schema must be implemented before MCP tools for deals can expose all fields.
- PRD-CONTACTS: Users table with KAM FK must exist before `create_contact` and `update_contact` can accept `kam_user_id`.
- PRD-REPORTS: Exchange rate infrastructure must be available for `get_pipeline_summary` to return accurate multi-currency totals.

## 11. Next Steps

- [x] ~~Resolve MCP session identity question~~ — RESOLVED: dedicated AI agent users table record
- [ ] Decide `update_deal` vs `update_deal_stage` behavior for stage changes — owner juhaszj — before TSD
- [ ] TSD: MCP tool schema design — all 16+ tools — due TBD
- [ ] TSD: Schema sync mechanism (tool parameters derived from Drizzle schema) — due TBD
- [ ] PRD review — due TBD
- [ ] PRD approval — due TBD

---

*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-13 | juhaszj | Initial draft |
