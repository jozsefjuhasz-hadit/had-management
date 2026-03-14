---
status: active
last-updated: 2026-03-13
owner: juhaszj
type: legacy-whitepaper
source-snapshot: C:/claude/archive/claude-projects-backup-2026-03-12/had-crm
---

# HAD CRM -- Legacy White Paper

## Purpose

HAD CRM is an internal customer relationship management system built for HAD IT Services. It tracks contacts, sales deals (called "ugyletek" in Hungarian UI), and interaction activities across a six-stage sales pipeline. The system is designed with an "MCP-first, human-in-the-loop" philosophy: an AI agent (Claude Code) is the primary operator via MCP tools, a web UI provides human oversight and visualization, and a REST API enables external automation.

The system serves a small sales team managing B2B IT services deals denominated in HUF.

---

## Users and Roles

| Role | Interface | What they do |
|------|-----------|-------------|
| AI Agent (Claude Code) | MCP (stdio, 16 tools) | Primary operator: creates/updates contacts, moves deals through pipeline, logs activities, queries pipeline status |
| Sales / Account Manager | Web UI (React SPA) | Reviews pipeline, views contact and deal details, creates contacts and deals via forms, monitors reports |
| Admin | Web UI | Same as sales manager; mock auth grants admin role to all users |
| Automation (n8n, Power Automate) | REST API | Email intake webhook creates contacts and lead deals automatically |

**Auth model (as-built):** Mock authentication via localStorage. A single hardcoded user ("HAD Admin", admin@had-it.hu, role: admin) is injected on login. No real authentication, no authorization checks on any endpoint. An upgrade path to Microsoft 365 SSO (MSAL) was designed but never implemented.

---

## Core Entities

### Contact

A person the company has a business relationship with.

| Attribute | Description | Constraints |
|-----------|-------------|-------------|
| Name | Full name | Required |
| Email | Email address | Optional, used for duplicate detection in CSV import |
| Phone | Phone number | Optional |
| Company | Company name | Optional, free text |
| Title | Job title / position | Optional |
| Source | How the contact was acquired | One of: email, referral, linkedin, other (default: other) |
| Notes | Free-text notes | Optional |
| KAM | Key Account Manager responsible for this contact | Free text (name of internal colleague). **Rewrite note: should be FK to users table.** |
| Is Primary | Whether this is the primary contact at their company | Boolean flag (0/1) |
| Archived | Soft-delete flag | Boolean flag; "deleted" contacts are archived, not removed |
| Last Interaction At | Derived: timestamp of most recent activity linked to this contact | Computed at query time via subquery |

### Deal (Ugylet)

A sales opportunity linked to exactly one contact.

| Attribute | Description | Constraints |
|-----------|-------------|-------------|
| Title | Deal name | Required |
| Contact | The associated contact | Required, FK to Contact |
| Stage | Pipeline position | One of: lead, qualified, proposal, negotiation, won, lost (default: lead) |
| Value | Expected monetary value | Number, default 0. Currency: HUF hardcoded. **Rewrite note: add multi-currency support (HUF, EUR, USD).** |
| Expected Close | Expected closing date | Optional, YYYY-MM-DD |
| Description | Short context / summary | Optional |
| Notes | Internal notes | Optional |
| Close Reason | Why the deal was won or lost | Set when deal is closed; **boundary with notes field was blurry -- rewrite can merge or simplify** |
| Owner | Person responsible for this deal | Free text. **Rewrite note: should be FK to users table.** No automatic link to contact's KAM. |
| Next Step Owner | Who is responsible for the next action | Free text |
| Next Step Due | Deadline for next action | Optional, YYYY-MM-DD |
| Project Start (Expected) | When the project is expected to begin | Optional, YYYY-MM-DD |
| Project Start (Actual) | When the project actually began | Optional, YYYY-MM-DD |
| Project End | When the project ended or is expected to end | Optional, YYYY-MM-DD. **Was missing from create forms and MCP tools -- confirmed as a gap.** |
| Last Interaction At | Derived: most recent activity linked to this deal | Computed at query time |

### Activity

A timestamped record of an interaction (note, email, call, or meeting) linked to a contact and/or deal.

| Attribute | Description | Constraints |
|-----------|-------------|-------------|
| Type | Kind of activity | One of: note, email, call, meeting (default: note) |
| Contact | Associated contact | Optional FK |
| Deal | Associated deal | Optional FK |
| Content | Description / body of the activity | Required |
| Created At | When the activity was recorded | Auto-set |

**Note:** Activities are append-only. There is no update or delete operation for activities in any interface layer.

---

## Sales Pipeline

The pipeline has six stages in fixed order:

```
lead --> qualified --> proposal --> negotiation --> won
                                                --> lost
```

Stage transitions:
- Forward movement: any stage to any later stage via `update_deal_stage`
- Backward movement: technically allowed (no constraint preventing it)
- Closing: dedicated `close_deal` operation sets stage to won/lost and records close_reason
- No stage transition validation exists (a deal can jump from lead to won)
- No stage transition history is recorded

---

## Features and User Flows

### 1. Dashboard

Shows three KPI cards (open deals count, pipeline value, won value), a stage breakdown with progress bars, and the five most recent activities. Clicking an activity navigates to the related deal or contact.

### 2. Contacts List

Full-width table with 9 columns: name, title, email, phone, company, source, notes, last interaction, KAM. Supports:
- Free-text search across all visible fields
- Filter by company (dropdown, dynamic from data)
- Filter by source (dropdown, fixed options)
- Sortable columns: name, company, last interaction
- Click row to navigate to contact detail
- "New contact" button opens create modal

### 3. Contact Detail

Shows contact info card with avatar, all fields, and three metric cards (active deals, open pipeline value, won value). Below: list of all deals for this contact with stage badge, value, and expected close date. Each deal links to deal detail.

### 4. Contact Create Modal

Form fields: name (required), title, email, phone, company, source (dropdown), KAM, notes. Validates name is non-empty. Posts to REST API.

### 5. CSV Contact Import (Beta)

Three-step modal: (1) upload CSV file (max 100 rows), (2) preview with duplicate detection by email, per-row action selection (insert/overwrite/skip/fix), bulk actions for duplicates, (3) result summary. Backend processes import in a transaction.

### 6. Deals List

Full-width table with 12 columns: title, description, stage (colored badge with tooltip), company/contact, owner, next step owner, next step due, notes, value (HUF), project start, project end, last interaction. Supports:
- Free-text search
- Filter by stage (dropdown)
- Sortable columns: title, value, last interaction
- "New deal" button opens create modal

### 7. Deal Detail

Shows deal info card (value, expected close, linked contact, last interaction, description, notes), next step card (owner + due date), project dates card, close reason card. Activities are fetched but not rendered in a timeline (the activity list UI was not built on this page).

### 8. Deal Create Modal

Form fields: title (required), contact (required, dropdown populated from contacts), stage, value (HUF), owner, expected close, description, notes. **Missing: project_start_expected, project_start_actual, project_end.**

### 9. Reports (Beta)

Revenue and forecast report by year. Three KPI cards (actual revenue, forecast, total), bar chart (quarterly actual vs. forecast via Recharts), quarterly table, and all-time stage breakdown table. Year selector populated from available data.

### 10. Login

Single-button mock login. Disabled M365 SSO button with "hamarosan" (coming soon) label.

### 11. Theme Toggle

Dark/light theme stored in localStorage. CSS variables switch via class on document root.

---

## Business Rules

1. **Soft delete only**: Contacts are never physically deleted; they are archived (archived=1). Archived contacts are excluded from list queries.
2. **Deal requires contact**: Every deal must be linked to exactly one contact. The contact cannot be changed after creation.
3. **Pipeline value**: Calculated as sum of `value` for deals in stages lead, qualified, proposal, negotiation (excludes won and lost).
4. **Won value**: Sum of `value` for deals in stage `won`.
5. **Currency**: All values are in HUF. **Rewrite: expand to HUF + EUR + USD.**
6. **Email intake webhook**: Incoming email creates or finds a contact (by email match), creates a lead deal, and logs an email activity. Body truncated to 500 chars in deal notes, 1000 chars in activity content. **Rewrite: deprioritized, not needed for MVP.**
7. **Duplicate detection (CSV import)**: Duplicates detected by exact email match (case-insensitive) against existing contacts.
8. **Import limit**: Maximum 100 rows per import batch.
9. **Activity feed limit**: Dashboard shows top 5 recent activities. API enforces max 20.
10. **Locale**: UI text is in Hungarian. Code identifiers, DB column names, and API routes are in English.
11. **KAM and deal owner**: Independent fields with no automatic relationship. Both are free-text in legacy; both should be FK to users table in rewrite.

---

## Auth and Permissions

**As-built:** No real authentication or authorization.

- Login: writes a hardcoded JSON object to localStorage
- Auth check: `isAuthenticated()` returns true if localStorage key exists
- Protected routes: React Router wrapper checks `isAuthenticated()` and redirects to /login
- Backend: No auth middleware. All REST endpoints are publicly accessible. All MCP tools are publicly accessible.
- Roles: User object has `role: "admin" | "user"` but the role is never checked anywhere
- Planned upgrade: swap `mockAuth.ts` for `msalAuth.ts` (MSAL / Microsoft 365 SSO)

**Rewrite requirement:** Implement real authentication (M365 SSO or equivalent) and role-based access control.

---

## Integrations

| Integration | Protocol | Status | Notes |
|-------------|----------|--------|-------|
| Claude Code (AI agent) | MCP over stdio | Working (16 tools) | Primary interface; all CRM operations available |
| n8n / Power Automate | REST webhook | Stubbed | POST /api/webhook/email -- functional but deprioritized for rewrite |
| Microsoft 365 SSO | MSAL | Not implemented | Login page has disabled button; swap file designed but not built |

### MCP Tools (16 total)

**Contacts (5):** list_contacts, get_contact, create_contact, update_contact, delete_contact
**Deals (6):** list_deals, get_deal, create_deal, update_deal, update_deal_stage, close_deal
**Activities (2):** list_activities, add_activity
**Intelligence (3):** get_pipeline_summary, search_crm, get_contact_history

Notable gap: MCP tools for deal creation/update do not expose all fields that the REST API and data model support (e.g., description, owner, next_step_owner, next_step_due, project dates). This was tracked in the roadmap as item #8.

---

## What Was Broken

This section is an honest assessment of issues found in the codebase, not a judgment of past decisions.

### Functional gaps

1. **Deal detail page missing activity timeline**: Activities are fetched from API but never rendered on the DealDetail page. The ContactDetail page does not render individual activities either (only the deal list).
2. **MCP tool field coverage**: 7 deal fields added during development (description, owner, next_step_owner, next_step_due, project_start_expected, project_start_actual, project_end) were never added to MCP tools. The AI agent -- supposedly the primary operator -- cannot set these fields.
3. **Deal create forms missing project fields**: project_start_expected, project_start_actual, project_end not in DealCreateModal or MCP create_deal.
4. **No stage transition validation**: A deal can jump from any stage to any other, including backwards. No history of transitions is kept.
5. **Feature status document out of sync**: Reports and CSV import are implemented but marked as "Planned" in feature-status.md.
6. **Search is basic LIKE matching**: search_crm uses SQL LIKE with no tokenization, ranking, or full-text search. Adequate for small datasets, will not scale.

### Architectural issues

7. **No authentication on backend**: Any HTTP client can call any endpoint. MCP server has no auth either (relies on stdio transport being local).
8. **Type duplication**: Contact, Deal, Activity interfaces are defined separately in backend/src/core/*.ts and frontend/src/types.ts with no shared source of truth.
9. **Schema migrations are try/catch ALTER TABLE**: Works for small projects but will break if columns need to be renamed or constraints changed.
10. **No tests**: Zero test files exist in the entire codebase.
11. **Hardcoded HUF currency**: No currency field on deals; formatting assumes HUF everywhere.
12. **Free-text KAM and owner fields**: No users table, no validation, no referential integrity.

### Documentation debt

13. **CLAUDE.md contains mixed Hungarian/English**: The document chain section and terminology table are in Hungarian, while the rest is English.
14. **Roadmap and feature-status diverge**: Some items marked planned in one, done in another.
15. **No API versioning**: REST endpoints have no version prefix.

---

## Inferred Items Register

Items marked [INFERRED] were deduced from code patterns, naming, or context rather than explicit documentation or human confirmation.

| # | Item | Confidence | Basis |
|---|------|-----------|-------|
| I-1 | The system is intended for a single small sales team (2-5 people) | High | Single-tenant SQLite, no multi-tenancy, no team/org model |
| I-2 | "Kontakt" in Hungarian UI is a deliberate terminological choice | High | Documented in CLAUDE.md terminology table |
| I-3 | Activities are meant to be append-only (no edit/delete) | Medium | No update/delete endpoints or UI exist, but no explicit documentation of this as a rule |
| I-4 | The pipeline stages are fixed and ordered (lead < qualified < proposal < negotiation < won/lost) | High | ORDER BY CASE in pipeline.ts, stage tooltips in Deals.tsx confirm intended progression |
| I-5 | Reports page was built but considered beta/unfinished | Confirmed | Human confirmed beta status |
| I-6 | CSV import was built but considered beta/unfinished | Confirmed | Human confirmed beta status |
| I-7 | Webhook email intake is not needed for rewrite MVP | Confirmed | Human confirmed deprioritized |

---

## Open Questions

1. **Users table design**: Will be populated from Microsoft Entra ID (via Supabase Auth Azure provider) — no manual management needed. [RESOLVED]
2. **Multi-currency implementation**: Per-deal currency field (HUF/EUR/USD). Exchange rates from MNB SOAP API (`http://www.mnb.hu/arfolyamok.asmx`). [RESOLVED]
3. **Activity editability**: Activities are editable and deletable in the rewrite (not append-only). [RESOLVED]
4. **Stage transition rules**: Free movement (any stage to any other, including backwards). All transitions must be logged with timestamp and actor (stage transition history table required). [RESOLVED]
5. **Data migration**: Clean slate — existing crm.db data will NOT be migrated. Migration begins after Supabase integration is complete. [RESOLVED]

---

## Handoff Notes for Documentation Chain

This white paper is the starting input for the project-director agent to build the full documentation chain for the had-management rewrite.

### Recommended next steps

1. **Create `had-management/docs/specs/data-model.md`** -- new data model incorporating users table, currency field on deals, proper FKs for KAM and owner
2. **Create `had-management/docs/specs/feature-status.md`** -- fresh feature list based on this white paper's feature inventory, with correct statuses
3. **Create `had-management/docs/specs/roadmap.md`** -- prioritized backlog for the rewrite
4. **Create PRDs** for each major feature area:
   - PRD-auth-msal.md (M365 SSO + RBAC)
   - PRD-contacts-core.md (contacts CRUD + import)
   - PRD-deals-core.md (deals CRUD + pipeline)
   - PRD-reports.md (revenue reports, multi-currency)
   - PRD-mcp-tools.md (full MCP tool coverage)
5. **Address debt items** from `docs/debt-backlog.md`

### Technology decisions (confirmed from workspace stack.md)

- **Database**: Supabase PostgreSQL — SQLite dropped
- **ORM**: Drizzle ORM — all schemas and queries here
- **Auth**: Microsoft Entra ID via Supabase Auth (Azure provider) — server-side
- **Shared types**: Drizzle schemas are the single source of truth — no separate shared package needed
- **Frontend**: Next.js App Router + Tailwind v4 + shadcn/ui (replaces React SPA + Vite)
- **Test framework**: Vitest [OPEN — confirm scope]

### Files in this delivery

| File | Location | Purpose |
|------|----------|---------|
| White paper (vault) | `C:/claude/obsidian-vault/99-ai-logs/archives/had-crm-whitepaper.md` | Obsidian archive copy (legacy name preserved) |
| White paper (project) | `C:/claude/had-workspace/had-management/docs/whitepaper-had-management.md` | Working copy in project repo |
| Debt backlog | `C:/claude/had-workspace/had-management/docs/debt-backlog.md` | All debt items from legacy system |

---

*Generated by legacy-archaeologist agent on 2026-03-13.*
*Source snapshot: C:/claude/archive/claude-projects-backup-2026-03-12/had-crm*
