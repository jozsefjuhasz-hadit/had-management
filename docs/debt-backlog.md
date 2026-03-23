---
status: active
last-updated: 2026-03-16
owner: juhaszj
type: debt-backlog
source: had-crm legacy whitepaper + PRD/TSD authoring cycles
---

# HAD CRM -- Debt Backlog

> All technical, documentation, design, and process debt identified during legacy code review, PRD authoring, and TSD authoring.
> Items are grouped by category, assigned DEBT-NNN IDs, and tracked through the full lifecycle.
> Managed by the debt-manager agent. Last reviewed: 2026-03-16.

## ID Mapping (legacy → DEBT-NNN)

> For traceability — legacy IDs referenced in TSDs, PRDs, and whitepaper remain valid via this table.

| Legacy ID | DEBT ID | Legacy ID | DEBT ID | Legacy ID | DEBT ID |
|-----------|---------|-----------|---------|-----------|---------|
| S-1 | DEBT-001 | F-5 | DEBT-017 | PD-1 | DEBT-044 |
| S-2 | DEBT-002 | F-6 | DEBT-018 | PD-2 | DEBT-045 |
| S-3 | DEBT-003 | F-7 | DEBT-019 | PD-3 | DEBT-046 |
| S-4 | DEBT-004 | C-1 | DEBT-020 | PD-4 | DEBT-047 |
| S-5 | DEBT-005 | C-2 | DEBT-021 | PD-5 | DEBT-048 |
| D-1 | DEBT-006 | C-3 | DEBT-022 | PD-6 | DEBT-049 |
| D-2 | DEBT-007 | C-4 | DEBT-023 | PD-7 | DEBT-050 |
| D-3 | DEBT-008 | C-5 | DEBT-024 | PD-8 | DEBT-051 |
| D-4 | DEBT-009 | DOC-1 | DEBT-025 | TD-1 | DEBT-052 |
| D-5 | DEBT-010 | DOC-2 | DEBT-026 | TD-2 | DEBT-053 |
| D-6 | DEBT-011 | DOC-3 | DEBT-027 | TD-3 | DEBT-054 |
| D-7 | DEBT-012 | DOC-4 | DEBT-028 | TD-4 | DEBT-055 |
| F-1 | DEBT-013 | DOC-5 | DEBT-029 | TD-5 | DEBT-056 |
| F-2 | DEBT-014 | DOC-6 | DEBT-030 | TD-6 | DEBT-057 |
| F-3 | DEBT-015 | P-1 | DEBT-031 | TD-7 | DEBT-058 |
| F-4 | DEBT-016 | P-2 | DEBT-032 | TD-8 | DEBT-059 |
| | | P-3 | DEBT-033 | | |
| | | UX-1 | DEBT-034 | | |
| | | UX-2 | DEBT-035 | | |
| | | UX-3 | DEBT-036 | | |
| | | UX-4 | DEBT-037 | | |
| | | UX-5 | DEBT-038 | | |
| | | UX-6 | DEBT-039 | | |
| | | UX-7 | DEBT-040 | | |
| | | UX-8 | DEBT-041 | | |
| | | UX-9 | DEBT-042 | | |
| | | UX-10 | DEBT-043 | | |

---

## Security Debt

### DEBT-001 — No authentication on backend (S-1)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/index.ts (legacy)
- **Description:** All REST endpoints and MCP tools are publicly accessible. No auth middleware exists in the legacy codebase.
- **Business impact:** Any network-adjacent actor can read, modify, or delete all CRM data. Blocks any production use.
- **Estimated effort:** XL
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-auth implements Supabase Auth with Microsoft Entra ID SSO. Next.js middleware protects all routes. Legacy Express backend is replaced entirely.

### DEBT-002 — Mock login stores hardcoded user in localStorage (S-2)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/auth/mockAuth.ts (legacy)
- **Description:** Anyone can "log in" by clicking a button. No credentials, no validation.
- **Business impact:** Zero access control. Combined with DEBT-001, any user has full admin access.
- **Estimated effort:** XL
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-auth replaces mock auth entirely with Supabase Auth Azure provider. No client-side auth state.

### DEBT-003 — Roles defined but never enforced (S-3)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/auth/mockAuth.ts (legacy)
- **Description:** User.role is "admin" or "user" but no code checks it anywhere.
- **Business impact:** Role-based access control is cosmetic. All users have equal access regardless of assigned role.
- **Estimated effort:** M
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-auth implements binary RBAC (admin/user) enforced in Next.js middleware. Admin routes protected at /admin/*. Role change API with last-admin guard.

### DEBT-004 — No CORS restriction in production (S-4)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/index.ts (legacy)
- **Description:** `cors()` called with no options — allows all origins.
- **Business impact:** Cross-origin attacks possible against authenticated sessions (if auth existed).
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Next.js API routes on Vercel use same-origin by default. No Express CORS middleware needed.

### DEBT-005 — No rate limiting despite dependency claimed (S-5)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/package.json (legacy)
- **Description:** express-rate-limit is NOT in package.json despite README claiming it is.
- **Business impact:** API endpoints vulnerable to brute-force and denial-of-service attacks.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Express is replaced by Next.js on Vercel, which provides infrastructure-level DDoS protection. Application-level rate limiting can be added post-MVP if needed.

---

## Data Model Debt

### DEBT-006 — KAM field is free text, not FK (D-1)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/db/schema.ts (legacy)
- **Description:** KAM field should reference a users table. No validation that the name corresponds to a real person.
- **Business impact:** Data quality degrades from first use. Reports by KAM are unreliable. Orphaned assignments when people leave.
- **Estimated effort:** L
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-contacts defines `kam_user_id: uuid FK → users.id`. User picker dropdown replaces free-text input.

### DEBT-007 — Deal owner field is free text, not FK (D-2)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/db/schema.ts (legacy)
- **Description:** Same issue as DEBT-006 for deal owner.
- **Business impact:** Deal ownership tracking is unreliable. Cannot generate accurate per-owner pipeline reports.
- **Estimated effort:** L
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals defines `owner_id: uuid FK → users.id` and `next_step_owner_id: uuid FK → users.id`.

### DEBT-008 — No users table (D-3)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/db/schema.ts (legacy)
- **Description:** Prerequisite for DEBT-006, DEBT-007, and real auth. No users table exists.
- **Business impact:** Blocks authentication, role-based access, and all FK-based attribution.
- **Estimated effort:** L
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-auth defines the `users` table with uuid PK, entra_id, email, display_name, role, is_agent, last_login, created_at. All FKs reference this table.

### DEBT-009 — Hardcoded HUF currency (D-4)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** Multiple files (legacy)
- **Description:** No currency field on deals. All formatting, MCP tool descriptions, and reports assume HUF.
- **Business impact:** EUR and USD deals are silently misrepresented. Pipeline totals mix currencies. Business decisions based on incorrect data.
- **Estimated effort:** L
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals adds `currency: text NOT NULL DEFAULT 'HUF'` (enum: HUF/EUR/USD). TSD-reports implements MNB SOAP exchange rate sync and multi-currency aggregation.

### DEBT-010 — Schema migration via try/catch ALTER (D-5)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/db/schema.ts:50-66 (legacy)
- **Description:** Each migration is a bare ALTER TABLE wrapped in try/catch. Cannot rename columns, add constraints, or roll back.
- **Business impact:** Schema changes are fragile. Failed migrations leave the database in an unknown state.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Drizzle ORM is the schema source of truth with `drizzle-kit push`. SQLite is replaced by Supabase PostgreSQL. Clean slate (BRD OS-2).

### DEBT-011 — No stage transition history (D-6)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/core/deals.ts (legacy)
- **Description:** Stage changes overwrite the stage field with no audit trail.
- **Business impact:** Cannot analyze sales velocity, identify bottlenecks, or audit who changed what and when.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals defines `stage_history` table with immutable entries. Every stage transition (human or agent) is logged with actor, source, from/to, and timestamp.

### DEBT-012 — close_reason and notes boundary unclear (D-7)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/core/deals.ts (legacy)
- **Description:** Both fields store free text about a deal. close_reason is only set on close, but functionally similar to notes.
- **Business impact:** Minor — data model confusion for new developers.
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals clarifies: `close_reason` is only meaningful when stage = won/lost and is required by the Close Deal operation. `notes` is a general-purpose field. Separate purposes are now explicit.

---

## Feature Completeness Debt

### DEBT-013 — MCP tools missing 7 deal fields (F-1)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/mcp/tools/deal-tools.ts (legacy)
- **Description:** description, owner, next_step_owner, next_step_due, project_start_expected, project_start_actual, project_end are not exposed in create_deal or update_deal MCP tools.
- **Business impact:** The AI agent (primary user) cannot set 7 of 15 deal fields. Deals created by agent are incomplete.
- **Estimated effort:** L
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-mcp-tools defines create_deal and update_deal with all 15 fields. Zod schemas derived from Drizzle schema ensure 100% field parity (PRD-MCP-NFR-001).

### DEBT-014 — DealCreateModal missing project fields (F-2)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/components/DealCreateModal.tsx (legacy)
- **Description:** project_start_expected, project_start_actual, project_end not in the create form.
- **Business impact:** Users cannot enter project dates at deal creation time.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals POST /api/deals accepts all date fields. New React form (React Hook Form + Zod) will include all fields.

### DEBT-015 — DealDetail page missing activity timeline (F-3)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/pages/DealDetail.tsx (legacy)
- **Description:** Activities are fetched via API but the response data is not rendered.
- **Business impact:** Users cannot see deal interaction history. Context is lost between touchpoints.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals GET /api/deals/[id] returns activities (reverse chrono, limit 50). Deal detail page renders activity timeline.

### DEBT-016 — ContactDetail page missing activity timeline (F-4)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/pages/ContactDetail.tsx (legacy)
- **Description:** Activities are fetched (via history endpoint) but only deals are rendered.
- **Business impact:** Users cannot see contact interaction history.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-contacts GET /api/contacts/[id] returns linked activities (reverse chrono, limit 50). Contact detail page renders activity timeline.

### DEBT-017 — No stage transition validation (F-5)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/core/deals.ts (legacy)
- **Description:** Deals can jump from any stage to any other (e.g., lead directly to won). No guardrails.
- **Business impact:** Pipeline metrics are unreliable if stages can be skipped. Sales process discipline is not enforced.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals implements Close Deal as a dedicated operation requiring close_reason. Stage transitions are logged in stage_history. Note: strict sequential stage enforcement was not specified in PRDs — the current approach allows flexibility with auditability. This is a conscious trade-off.

### DEBT-018 — No inline editing on detail pages (F-6)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/pages/ (legacy)
- **Description:** Contact and deal detail pages are read-only. Editing requires MCP or direct API calls.
- **Business impact:** Human users cannot edit records through the web UI. Blocks core workflow.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-contacts defines inline-editable contact detail. TSD-deals defines fully editable deal detail page with PATCH endpoints.

### DEBT-019 — No activity creation from UI (F-7)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/ (legacy)
- **Description:** There is no UI to add activities. Only the MCP tool and direct API calls support it.
- **Business impact:** Human users cannot log calls, emails, meetings, or notes through the web interface.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals defines POST /api/activities and "Log Activity" UI on Deal Detail and Contact Detail pages. Full activity CRUD.

---

## Code Quality Debt

### DEBT-020 — Zero tests
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** Entire codebase (legacy)
- **Description:** No unit tests, no integration tests, no E2E tests in the legacy codebase.
- **Business impact:** Every change carries regression risk. Refactoring is unsafe. No confidence in deployments.
- **Estimated effort:** XL
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** All TSDs mandate testing (Vitest unit/integration, Playwright E2E). Tests must be written alongside implementation — this is a first-sprint deliverable.

### DEBT-021 — Type duplication between backend and frontend (C-2)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/core/*.ts + frontend/src/types.ts (legacy)
- **Description:** Same interfaces defined in two places with no mechanism to keep them in sync.
- **Business impact:** Type drift causes runtime errors when API contract changes.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Next.js App Router uses a single codebase — shared Zod schemas in `src/lib/schemas/` serve both API routes and client components. Drizzle ORM is the schema source of truth.

### DEBT-022 — Inline SVG icons throughout components (C-3)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/components/Sidebar.tsx, pages/*.tsx (legacy)
- **Description:** Icons are hardcoded SVG markup instead of using an icon library or component.
- **Business impact:** Minor — increases component noise and makes icon changes tedious.
- **Estimated effort:** S
- **Priority:** 🟢 Low
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. shadcn/ui (stack standard) uses lucide-react icons. No inline SVGs.

### DEBT-023 — Inline styles mixed with Tailwind classes (C-4)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/pages/*.tsx, components/*.tsx (legacy)
- **Description:** CSS variables accessed via `style={{}}` alongside Tailwind utility classes. Inconsistent approach.
- **Business impact:** Minor — inconsistent styling makes UI changes unpredictable.
- **Estimated effort:** S
- **Priority:** 🟢 Low
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. shadcn/ui + Tailwind CSS is the stack standard. CSS variables used only via Tailwind theme configuration.

### DEBT-024 — validateQuery middleware defined but never used (C-5)
- **Category:** tech
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** backend/src/middleware/validate.ts:16 (legacy)
- **Description:** Only validateBody is imported anywhere. Dead code.
- **Business impact:** None — dead code in a codebase being replaced.
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Express middleware is replaced entirely by Zod validation in Next.js API routes. Legacy code is not carried forward.

---

## Documentation Debt

### DEBT-025 — feature-status.md out of sync with code (DOC-1)
- **Category:** doc
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** docs/specs/feature-status.md (legacy)
- **Description:** Reports module and CSV import are implemented but marked as "Planned".
- **Business impact:** Developers and stakeholders get wrong picture of project completeness.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Legacy feature-status.md is superseded by the new PRD/TSD document chain. Feature status is tracked in PRDs and TSDs with explicit `status` frontmatter.

### DEBT-026 — Roadmap and feature-status diverge (DOC-2)
- **Category:** doc
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** docs/specs/roadmap.md vs feature-status.md (legacy)
- **Description:** Items have different statuses across documents.
- **Business impact:** Planning confusion — multiple sources of truth.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Single document chain (BRD → PRD → TSD) replaces fragmented status tracking.

### DEBT-027 — CLAUDE.md mixed Hungarian/English (DOC-3)
- **Category:** doc
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** CLAUDE.md:34-57
- **Description:** Document chain section, terminology table, and agent workflow section are in Hungarian.
- **Business impact:** Mixed-language documentation reduces readability for non-Hungarian contributors or tools.
- **Estimated effort:** S
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Should be cleaned up during rewrite setup. Low effort, low risk.

### DEBT-028 — README claims express-rate-limit is installed (DOC-4)
- **Category:** doc
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** README.md:84 (legacy)
- **Description:** package.json does not list express-rate-limit as a dependency.
- **Business impact:** Misleading documentation about security posture.
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Legacy README is replaced. New README will reflect the actual Next.js + Supabase stack.

### DEBT-029 — No API versioning documented or implemented (DOC-5)
- **Category:** doc
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** README.md, api-catalog.md (legacy)
- **Description:** Endpoints are /api/* with no version prefix.
- **Business impact:** Minimal for MVP (single consumer). Could cause issues if legacy and rewrite run in parallel.
- **Estimated effort:** S
- **Priority:** 🟢 Low
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Clean slate deployment (BRD OS-2) — legacy and rewrite will not run simultaneously. API versioning can be added post-MVP if needed.

### DEBT-030 — MCP catalog missing new fields (DOC-6)
- **Category:** doc
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** docs/specs/mcp-catalog.md (legacy)
- **Description:** mcp-catalog.md does not document the 7 deal fields that were added to the data model but never exposed in tools.
- **Business impact:** AI agent developers do not know which fields are available.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-mcp-tools comprehensively documents all MCP tool schemas with full field coverage. Legacy mcp-catalog.md is superseded.

---

## Process Debt

### DEBT-031 — Spec-first workflow not consistently followed (P-1)
- **Category:** process
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** docs/, tasks/
- **Description:** The documented workflow (update spec → create PRD → code) was bypassed for Reports and CSV import. Code was written without updating feature-status.
- **Business impact:** Spec drift accumulates. New developers cannot trust documentation.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** The rewrite follows the full document chain (BRD → PRD → TSD → implementation). This item tracks the ongoing process discipline, not a one-time fix.

### DEBT-032 — No CI/CD pipeline (P-2)
- **Category:** process
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** Project root
- **Description:** No GitHub Actions, no automated testing, no deployment automation.
- **Business impact:** Manual deployments are error-prone. No automated quality gates. Tests (once written) are not enforced.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Vercel provides deployment automation. GitHub Actions needed for test automation and linting. Should be set up in the first sprint of implementation.

### DEBT-033 — Node.js path hardcoded to OneDrive (P-3)
- **Category:** process
- **Found by:** legacy-archaeologist
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** CLAUDE.md, README.md (legacy)
- **Description:** The Node.js path includes a user-specific OneDrive directory with spaces and special characters.
- **Business impact:** Build tooling breaks when paths contain spaces. Already mitigated by workspace move to C:/claude/had-workspace/.
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** Addressed by rewrite architecture. Workspace is at C:/claude/had-workspace/ (outside OneDrive). Node.js installed at C:/Program Files/nodejs/. No OneDrive path dependencies.

---

## UX Debt

### DEBT-034 — Deal Detail page is entirely read-only (UX-1)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/pages/DealDetail.tsx (legacy)
- **Description:** Human users cannot edit any deal field, update notes, or change the stage from the deal page. All edits require MCP or direct API.
- **Business impact:** Blocks core sales workflow for human users. Forces reliance on AI agent for all deal updates.
- **Estimated effort:** L
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals defines fully editable deal detail page with PATCH /api/deals/[id]. React Hook Form + Zod for all fields.

### DEBT-035 — No activity creation UI anywhere in the web interface (UX-2)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/ (entire legacy)
- **Description:** No form, button, or modal exists for a human user to log a call, note, or meeting.
- **Business impact:** Human users cannot record interactions. Activity data is incomplete — only agent-created activities exist.
- **Estimated effort:** M
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals defines POST /api/activities and "Log Activity" UI on Deal Detail and Contact Detail pages. Full activity CRUD (create, read, update, delete).

### DEBT-036 — Activity timeline not rendered on Deal Detail (UX-3)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/pages/DealDetail.tsx (legacy)
- **Description:** Data is fetched from the API but the component does not render it. Users cannot see deal history inline.
- **Business impact:** Context about deal interactions is hidden. Users must check multiple places for history.
- **Estimated effort:** M
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals includes activity timeline in deal detail page. GET /api/deals/[id] returns activities (reverse chrono, paginated).

### DEBT-037 — Activity timeline not rendered on Contact Detail (UX-4)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/pages/ContactDetail.tsx (legacy)
- **Description:** Same issue as DEBT-036: activities fetched, not displayed.
- **Business impact:** Contact interaction history is invisible in the UI.
- **Estimated effort:** M
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-contacts includes activity timeline in contact detail page. GET /api/contacts/[id] returns linked activities.

### DEBT-038 — Pipeline stages have no contextual guidance in UI (UX-5)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/components/DealCreateModal.tsx, DealDetail (legacy)
- **Description:** Stage dropdown has no descriptions, tooltips, or onboarding text. New users cannot self-learn the pipeline model.
- **Business impact:** Users may assign incorrect stages, degrading pipeline accuracy.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** TSDs do not explicitly specify stage tooltips or descriptions. This is a UI polish item that should be included during implementation.

### DEBT-039 — KAM and owner fields show no validation feedback (UX-6)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/components/ (create modals, legacy)
- **Description:** Free-text fields with no dropdown, autocomplete, or format hint. Silent data quality degradation from first use.
- **Business impact:** Mistyped KAM/owner names create orphaned references. Reports are inaccurate.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-auth defines GET /api/users/picker endpoint. TSD-contacts and TSD-deals use user picker dropdowns for KAM, owner, and referred_by fields. No free-text entry.

### DEBT-040 — Deal create modal missing project date fields (UX-7)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/components/DealCreateModal.tsx (legacy)
- **Description:** project_start_expected, project_start_actual, project_end absent from create form.
- **Business impact:** Users must use MCP or API to set project dates. Information captured late or never.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals POST /api/deals accepts all date fields including project dates. New create form includes all fields.

### DEBT-041 — No currency indicator on deal value field (UX-8)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/components/DealCreateModal.tsx, DealDetail (legacy)
- **Description:** Users enter a number with no indication that HUF is assumed. EUR/USD deals are silently misrepresented.
- **Business impact:** Multi-currency deals recorded with wrong currency. Financial reporting is unreliable.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals adds `currency` field (HUF/EUR/USD) with default HUF. Currency selector visible on create and detail forms.

### DEBT-042 — Dashboard "recent activities" feed is not interactive (UX-9)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/pages/Dashboard.tsx (legacy)
- **Description:** Feed shows 5 activities as links to deals/contacts, but provides no quick-capture "log something now" entry point.
- **Business impact:** Minor — users returning from a call must navigate to the deal/contact page to log activity. Extra clicks.
- **Estimated effort:** S
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** backlog
- **Note:** TSDs do not include a dashboard quick-capture feature. Could be a post-MVP enhancement.

### DEBT-043 — No success/error feedback documented for create operations (UX-10)
- **Category:** design
- **Found by:** ux-researcher
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** frontend/src/components/ (legacy)
- **Description:** Whitepaper does not document confirmation states after contact or deal creation.
- **Business impact:** Users may be uncertain whether their action succeeded. Could lead to duplicate entries.
- **Estimated effort:** S
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** TSDs define error states for all API endpoints (422, 409, etc.). UI toast/confirmation feedback should be implemented during development. Standard shadcn/ui toast component.

---

## Product Debt — Identified During PRD Authoring (2026-03-13)

### DEBT-044 — No dedicated "AI Agent" user record defined (PD-1)
- **Category:** tech
- **Found by:** product-manager
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** BRD, whitepaper (gap)
- **Description:** Stage history requires an actor user ID for every transition, including agent-initiated ones. The AI agent needs a known, stable user record in the users table.
- **Business impact:** Without this, agent-sourced transitions either have a null actor or are attributed to the admin's personal account. Audit trail is broken.
- **Estimated effort:** S
- **Priority:** 🔴 High
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-auth ADR-3 defines the HAD Agent user record with `is_agent = true`, seeded by `scripts/seed-agent-user.ts`. Referenced in TSD-deals, TSD-mcp-tools.

### DEBT-045 — "Connection" field on Contact has no definition (PD-2)
- **Category:** doc
- **Found by:** product-manager
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** PRD-CON-003, PRD-CON-011
- **Description:** The whitepaper and BRD reference a "Connection" field on Contact. Its business purpose, uniqueness constraint, and Hungarian UI label are undefined.
- **Business impact:** Ambiguous field definition leads to inconsistent data capture.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-contacts resolves PD-2: field is `referred_by_user_id: uuid FK → users.id`. UI label: "Referred by". MCP tool param: `connection_user_id` (maps to referred_by_user_id).

### DEBT-046 — MNB SOAP API accessibility from Vercel not verified (PD-3)
- **Category:** tech
- **Found by:** product-manager
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** PRD-REP-002
- **Description:** The MNB SOAP endpoint uses plain HTTP, not HTTPS. Vercel serverless functions may block or restrict outbound HTTP calls.
- **Business impact:** If blocked, exchange rate sync fails. Multi-currency reports show stale or no data. Core reporting feature is broken.
- **Estimated effort:** S
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** TSD-reports (ADR-4) documents this risk and requires an infrastructure spike before deployment. Must be verified before launch.

### DEBT-047 — Historical exchange rates: no decision on rate-at-creation vs. current-rate (PD-4)
- **Category:** tech
- **Found by:** product-manager
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** PRD-REP
- **Description:** When displaying a deal created in 2024 at EUR value, should the HUF equivalent use today's rate or the rate from 2024?
- **Business impact:** Historical revenue figures change daily with the exchange rate. Acceptable for MVP but confusing for long-term analysis.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-reports ADR-9 decides: current rate only for MVP. Documented as known beta limitation. Post-MVP: add `rate_at_creation` fields. Also tracked as DEBT-054 (TD-3).

### DEBT-048 — Activity edit permissions not decided (PD-5)
- **Category:** process
- **Found by:** product-manager
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** PRD-DEAL-009, PRD-MCP-020
- **Description:** Whether activity editing is restricted to the original author or permitted to any authenticated user.
- **Business impact:** If author-only, admin cannot correct agent-created activities. If any-user, no ownership protection.
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-deals ADR-6: any authenticated user can edit any activity in MVP. `edited_by_user_id` and `edited_at` provide audit trail.

### DEBT-049 — CSV import: KAM column mapping undefined (PD-6)
- **Category:** tech
- **Found by:** product-manager
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** PRD-CON — Open Question 3
- **Description:** Legacy CSV format stored free-text KAM names. Rewrite requires user ID (FK). Import pipeline has no defined behavior for unmapped values.
- **Business impact:** CSV import silently drops KAM assignments or creates data quality issues.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** resolved
- **Proposed sprint:** N/A
- **Resolution:** TSD-contacts ADR-7 defines matching strategy: email first, then display_name, null if no match with per-row warning.

### DEBT-050 — Session expiry behavior on in-progress forms (PD-7)
- **Category:** design
- **Found by:** product-manager
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** PRD-AUTH-010
- **Description:** Session expiry may interrupt in-progress forms. Preserving form state across re-authentication is technically non-trivial.
- **Business impact:** Users lose form data mid-entry. Frustrating but tolerable for small internal team.
- **Estimated effort:** M
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** backlog
- **Note:** PRD-AUTH-010 acknowledges this. Fallback (lose form state, redirect to login) is acceptable for MVP. Post-MVP enhancement.

### DEBT-051 — Single admin guard creates a dependency risk (PD-8)
- **Category:** process
- **Found by:** product-manager
- **Date found:** 2026-03-13
- **Project:** had-management
- **Location:** PRD-AUTH-012
- **Description:** If the sole admin (juhaszj) is unavailable and their account loses M365 access, no one can promote another user to admin.
- **Business impact:** Operational risk — system admin lockout scenario.
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** TSD-auth implements last-admin guard. Operational mitigation: provision a second admin account at launch. Document in deployment runbook.

---

## Technical Debt — Identified During TSD Authoring (2026-03-14)

### DEBT-052 — Vercel HTTP outbound connectivity to MNB SOAP unverified (TD-1)
- **Category:** tech
- **Found by:** tech-lead
- **Date found:** 2026-03-14
- **Project:** had-management
- **Location:** TSD-reports (ADR-4)
- **Description:** `http://www.mnb.hu/arfolyamok.asmx` uses plain HTTP. Vercel may block non-HTTPS outbound calls.
- **Business impact:** Exchange rate sync may fail in production. Multi-currency reporting blocked.
- **Estimated effort:** S
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Same underlying issue as DEBT-046. Infrastructure spike required before launch. If blocked, a Cloudflare Worker HTTPS proxy is the fallback.

### DEBT-053 — HAD Agent seed script is a hard deployment prerequisite (TD-2)
- **Category:** tech
- **Found by:** tech-lead
- **Date found:** 2026-03-14
- **Project:** had-management
- **Location:** TSD-auth, TSD-deals, TSD-mcp-tools (ADR-3)
- **Description:** `scripts/seed-agent-user.ts` must run at initial deployment. If skipped, all MCP write operations fail with FK violations.
- **Business impact:** Deployment failure. AI agent completely non-functional until seed runs.
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Must be included in deployment runbook and CI/CD initialization. First-run mandatory step.

### DEBT-054 — Exchange rate HUF drift in historical reports (TD-3)
- **Category:** tech
- **Found by:** tech-lead
- **Date found:** 2026-03-14
- **Project:** had-management
- **Location:** TSD-reports (ADR-9)
- **Description:** All historical EUR/USD deal values use the current rate, not the rate at time of deal creation. The "2024 actual revenue" figure changes daily.
- **Business impact:** Historical financial reports are not stable. Acceptable for beta but confusing for long-term analysis.
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** backlog
- **Note:** Documented as known beta limitation (ADR-9). Post-MVP: add `rate_at_creation` fields to deals table. Related to DEBT-047.

### DEBT-055 — MCP_API_TOKEN long-lived token is a security risk if leaked (TD-4)
- **Category:** tech
- **Found by:** tech-lead
- **Date found:** 2026-03-14
- **Project:** had-management
- **Location:** TSD-mcp-tools (ADR-5)
- **Description:** The MCP server authenticates using a long-lived bearer token stored in the local `.env`. If leaked, it provides full CRM write access as the AI agent.
- **Business impact:** Full CRM compromise if token is exposed in version control, logs, or shared configurations.
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** `.env` must be in `.gitignore`. Token rotation procedure must be documented in deployment runbook. Post-MVP: consider short-lived tokens.

### DEBT-056 — Stage history entries from direct DB migrations will have null actor (TD-5)
- **Category:** tech
- **Found by:** tech-lead
- **Date found:** 2026-03-14
- **Project:** had-management
- **Location:** TSD-deals (ADR-8)
- **Description:** The shared `stageTransition()` service function is the only correct path for stage changes. Any direct DB UPDATE to the `stage` field bypasses stage history logging.
- **Business impact:** Manual database corrections create audit gaps. Stage history becomes incomplete.
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Document constraint in schema file and deployment runbook. Consider a DB trigger as a safety net post-MVP.

### DEBT-057 — CSV import referred_by column strategy undefined (TD-6)
- **Category:** tech
- **Found by:** tech-lead
- **Date found:** 2026-03-14
- **Project:** had-management
- **Location:** TSD-contacts (ADR-7)
- **Description:** Should `referred_by` column in CSV import also use email/name matching? Currently undefined.
- **Business impact:** `referred_by` will be silently null on all CSV imports if not resolved before implementation.
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Open question in TSD-contacts. Recommend: apply ADR-7 matching pattern to referred_by as well. Decision needed before implementation.

### DEBT-058 — Activity pagination UX decision deferred (TD-7)
- **Category:** design
- **Found by:** tech-lead
- **Date found:** 2026-03-14
- **Project:** had-management
- **Location:** TSD-deals
- **Description:** Whether "load more" activities on Deal Detail is infinite scroll or paginator is not specified.
- **Business impact:** UI rework if decision changes after implementation.
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** TSD-deals recommends "Load more" button. Confirm before implementation.

### DEBT-059 — search_crm archived/closed entity inclusion undefined (TD-8)
- **Category:** tech
- **Found by:** tech-lead
- **Date found:** 2026-03-14
- **Project:** had-management
- **Location:** TSD-mcp-tools
- **Description:** Whether archived contacts and won/lost deals appear in `search_crm` results is unresolved.
- **Business impact:** Search results may include stale data or miss valuable historical records depending on the default.
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** TSD-mcp-tools recommends: exclude archived contacts, include won/lost deals. Pending confirmation.

---

## Design Debt (brand-guardian audit — 2026-03-16)

### DEBT-060 — BG-001 Shadow classes on Dashboard cards
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/dashboard/DashboardPage.tsx:100,119,161,208
- **Description:** 4 Card components use `shadow-sm` class. Violates flat design rule (BG-001). No shadow classes permitted.
- **Business impact:** Brand inconsistency — shadows break the flat design language. Dashboard is the most-visited surface.
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch-fixable with DEBT-061–064. Remove `shadow-sm` from all Card components in one pass.

### DEBT-061 — BG-001 Shadow classes on ContactsPage card
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/contacts/ContactsPage.tsx:369
- **Description:** Card component uses `shadow-sm` class. Violates flat design rule (BG-001).
- **Business impact:** Brand inconsistency — shadows break the flat design language
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch-fixable with DEBT-060, 062–064.

### DEBT-062 — BG-001 Shadow classes on ContactDetailPage cards
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/contacts/ContactDetailPage.tsx:84,94,106,124,179,216
- **Description:** 6 Card components use `shadow-sm` class. Violates flat design rule (BG-001).
- **Business impact:** Brand inconsistency — shadows break the flat design language
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch-fixable with DEBT-060–061, 063–064.

### DEBT-063 — BG-001 Shadow classes on DealsPage cards
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/deals/DealsPage.tsx:398,407,416,459
- **Description:** 4 Card components use `shadow-sm` class. Violates flat design rule (BG-001).
- **Business impact:** Brand inconsistency — shadows break the flat design language
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch-fixable with DEBT-060–062, 064.

### DEBT-064 — BG-001 Shadow classes on DealDetailPage cards
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/deals/DealDetailPage.tsx:425,523,586,615
- **Description:** 4 Card components use `shadow-sm` class. Violates flat design rule (BG-001).
- **Business impact:** Brand inconsistency — shadows break the flat design language
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch-fixable with DEBT-060–063.

### DEBT-065 — BG-001 Custom shadow in sidebar active state
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/layout/app-sidebar.tsx:52
- **Description:** Active nav item uses `shadow-[inset_3px_0_0_var(--sidebar-primary)]` for left indicator. While creative, shadows are prohibited. Replace with `border-l-3 border-sidebar-primary`.
- **Business impact:** Shadow usage in shared layout component sets bad precedent
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Deliberate design choice, not accidental. Fix when addressing shadow batch.

### DEBT-066 — BG-002 Raw hex in ContactDetailPage avatar gradient
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/contacts/ContactDetailPage.tsx:65
- **Description:** Avatar uses raw hex `to-[#0e9fa6]` instead of a design token. Bypasses theme system.
- **Business impact:** Color will not respond to theme changes; breaks token system. Theme switching is a core feature.
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Fix together with DEBT-067. Requires an avatar token or reuse of existing brand color token.

### DEBT-067 — BG-002 Raw hex in sidebar avatar gradient
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/layout/app-sidebar.tsx:66
- **Description:** Avatar uses raw hex `to-[#0e9fa6]` instead of a design token. Bypasses theme system.
- **Business impact:** Color will not respond to theme changes; breaks token system. Theme switching is a core feature.
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Fix together with DEBT-066.

### DEBT-068 — BG-003 Gradient usage without SKILL policy
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/contacts/ContactDetailPage.tsx:65, components/layout/app-sidebar.tsx:66
- **Description:** Two components use `bg-gradient-to-br` but SKILL has no gradient policy. Need to either legitimize as an allowed avatar pattern or replace with flat background.
- **Business impact:** Ambiguity — developers don't know if gradients are allowed. Blocks consistent guidance.
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Policy decision needed: allow gradients for avatars only, or ban entirely. Resolve together with DEBT-075.

### DEBT-069 — BG-009 Radius value drift (SKILL vs globals.css)
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** globals.css:71 vs SKILL.md
- **Description:** SKILL defines `--radius: 0.375rem` but globals.css implements `--radius: 0.75rem`. All derived radii (rounded-sm through rounded-4xl) are 2x larger than documented.
- **Business impact:** Spec-implementation mismatch. Every radius in the UI is 2x the documented value. Must decide which is correct and align.
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Decision needed: update SKILL to match implementation (0.75rem) or update globals.css to match SKILL (0.375rem). Likely SKILL is outdated.

### DEBT-070 — BG-009 Popover dark mode value drift
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** globals.css:107 vs SKILL.md
- **Description:** SKILL defines dark `--popover: #142733` but globals.css implements `--popover: #1a303e`. Popover surfaces in dark mode differ from spec.
- **Business impact:** Dark mode popover appearance diverges from documented design
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Resolve together with DEBT-069 in a single SKILL-vs-CSS alignment pass.

### DEBT-071 — SKILL gap: chart tokens undocumented
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** SKILL.md (missing section)
- **Description:** globals.css defines `--chart-1` through `--chart-5` for both light and dark modes but SKILL.md does not document them.
- **Business impact:** Undocumented tokens — designers and developers have no reference for chart colors
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch with DEBT-072–074 as a single SKILL.md documentation update.

### DEBT-072 — SKILL gap: sidebar tokens undocumented
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** SKILL.md (missing section)
- **Description:** globals.css defines 8 sidebar tokens (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.) using oklch values. SKILL.md does not document them.
- **Business impact:** Undocumented tokens — sidebar styling has no design reference
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch with DEBT-071, 073–074.

### DEBT-073 — SKILL gap: stage badge tokens undocumented
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** SKILL.md (missing section)
- **Description:** globals.css defines 12 stage badge tokens (`--stage-lead-bg/fg` through `--stage-lost-bg/fg`) using oklch. SKILL.md does not document them.
- **Business impact:** Undocumented tokens — stage badge colors have no design reference
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch with DEBT-071–072, 074.

### DEBT-074 — SKILL gap: oklch color space undocumented
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** SKILL.md (missing policy)
- **Description:** globals.css uses oklch color space for 20 tokens (sidebar + stage). SKILL only documents hex values. No color space policy exists.
- **Business impact:** Developers don't know when to use oklch vs hex. Inconsistency risk grows with each new token.
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Batch with DEBT-071–073. Add color space policy section to SKILL.md.

### DEBT-075 — SKILL gap: gradient policy missing
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** SKILL.md (missing policy)
- **Description:** SKILL mentions flat design and no shadows but has no explicit gradient policy. Two components already use gradients.
- **Business impact:** Ambiguity — deviation risk grows without explicit guidance
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Resolve together with DEBT-068. Single policy decision.

### DEBT-076 — SKILL gap: semantic colors not implemented as CSS variables
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** globals.css (missing tokens)
- **Description:** SKILL documents semantic colors (success: #10b981/#34d399, warning: #f59e0b/#fbbf24, info: #10B3BA) but these are not defined as CSS custom properties in globals.css. Only destructive is implemented.
- **Business impact:** Developers forced to use raw hex for success/warning/info states, creating more token-bypass debt (like DEBT-066/067). Multiplier effect.
- **Estimated effort:** XS
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Priority upgraded from Medium to High — missing tokens actively generate more design debt. Implement before UI development begins.

### DEBT-077 — SKILL gap: semantic color contrast ratios undocumented
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** SKILL.md (incomplete accessibility section)
- **Description:** Accessibility section documents contrast for primary and dark colors but not for semantic colors (success, warning, error fg/bg pairs).
- **Business impact:** Accessibility gap — WCAG compliance unknown for semantic colors. Could fail accessibility audit.
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Resolve when implementing DEBT-076 semantic tokens. Calculate and document contrast ratios.

### DEBT-078 — SKILL gap: --shadow-opacity token undocumented
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** SKILL.md (missing from flat design section)
- **Description:** globals.css defines `--shadow-opacity: 0` in both modes. SKILL's flat design section doesn't mention this token.
- **Business impact:** Minor — completeness gap in documentation
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** backlog
- **Note:** Include in SKILL.md documentation batch (DEBT-071–074).

### DEBT-079 — No design specs directory
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** docs/design/ (missing)
- **Description:** No `docs/design/` directory exists. No *-spec.md or handoff-*.md files found. Components were implemented without formal design specifications.
- **Business impact:** No audit trail for design decisions; future changes lack reference
- **Estimated effort:** S
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** 2026-Q2
- **Note:** Create directory structure and initial component specs as part of design system maturation.

### DEBT-080 — Dialog backdrop-filter review needed
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** components/ui/dialog.tsx:34
- **Description:** Dialog overlay uses `supports-backdrop-filter:backdrop-blur-xs`. This is a standard shadcn/ui pattern but technically applies a visual effect (blur) which may conflict with the flat design principle.
- **Business impact:** Low — standard library pattern, worth a conscious decision but not urgent
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** backlog
- **Note:** Standard shadcn/ui pattern. Recommend: accept as-is, document exception in SKILL.md flat design section.

### DEBT-081 — SKILL copies need sync mechanism
- **Category:** design
- **Found by:** brand-guardian
- **Date found:** 2026-03-16
- **Project:** had-management
- **Location:** .claude/skills/had-design-system/SKILL.md, C:/claude/_shared/skills/had-design-system/SKILL.md
- **Description:** Two identical copies of SKILL.md exist (workspace and _shared). Currently in sync, but no automated sync mechanism exists. Risk of drift over time.
- **Business impact:** Low now — but one manual edit to either copy creates silent divergence
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** backlog
- **Note:** Consider symlink or build-time copy script. Low urgency since files are currently identical.

---

## Summary

| Category | Resolved | Accepted | Unreviewed | Total |
|----------|----------|----------|------------|-------|
| Security (tech) | 5 | 0 | 0 | 5 |
| Data Model (tech) | 7 | 0 | 0 | 7 |
| Feature Completeness (tech) | 7 | 0 | 0 | 7 |
| Code Quality (tech) | 4 | 1 | 0 | 5 |
| Documentation (doc) | 5 | 1 | 0 | 6 |
| Process | 1 | 2 | 0 | 3 |
| UX / Design | 7 | 3 | 0 | 10 |
| Product Debt (mixed) | 5 | 3 | 0 | 8 |
| Technical Debt — TSD (tech) | 0 | 8 | 0 | 8 |
| Design (brand-guardian) | 0 | 22 | 0 | 22 |
| **Total** | **41** | **40** | **0** | **81** |

### By Priority (accepted items only — 40 items, 39 actionable)

| Priority | Count | Items |
|----------|-------|-------|
| 🔴 High | 12 | DEBT-020, DEBT-046, DEBT-052, DEBT-053, DEBT-060, DEBT-061, DEBT-062, DEBT-063, DEBT-064, DEBT-066, DEBT-067, DEBT-069, DEBT-076 |
| 🟡 Medium | 16 | DEBT-031, DEBT-032, DEBT-038, DEBT-054, DEBT-055, DEBT-056, DEBT-065, DEBT-068, DEBT-070, DEBT-071, DEBT-072, DEBT-073, DEBT-074, DEBT-075, DEBT-077, DEBT-079 |
| 🟢 Low | 12 | DEBT-027, DEBT-042, DEBT-043, DEBT-050, DEBT-051, DEBT-057, DEBT-058, DEBT-059, DEBT-078, DEBT-080, DEBT-081 |

> Note: DEBT-046 and DEBT-052 are the same underlying issue (MNB HTTP connectivity) reported by different agents. Tracked as one actionable item — effectively 39 distinct issues.

---

*Originally generated by legacy-archaeologist agent on 2026-03-13.*
*UX Debt section appended by ux-researcher agent on 2026-03-13.*
*Product Debt section appended by product-manager agent on 2026-03-13.*
*Technical Debt section appended by tech-lead agent on 2026-03-14.*
*Converted to DEBT-NNN format and reviewed by debt-manager agent on 2026-03-16.*
*Design debt DEBT-060 through DEBT-081 appended by brand-guardian agent on 2026-03-16.*
*Design debt intake (DEBT-060–081) reviewed and accepted by debt-manager agent on 2026-03-16. DEBT-076 priority upgraded Medium→High.*
*Impeccable-inspired design system improvements (DEBT-082–086) added on 2026-03-16. Source: pbakaus/impeccable via NotebookLM.*

---

## Impeccable-inspired Design System Improvements

> Sourced from [pbakaus/impeccable](https://github.com/pbakaus/impeccable) analysis. These items extend the HAD design system with industry best practices currently missing from our SKILL.md and brand-guardian rules.

### DEBT-082 — Motion design policy missing from SKILL.md
- **Category:** design
- **Found by:** project-director (impeccable analysis)
- **Date found:** 2026-03-16
- **Project:** had-management (cross-workspace)
- **Location:** .claude/skills/had-design-system/SKILL.md
- **Description:** No motion/animation policy exists. Current code uses ad-hoc `transition-[background-color] duration-150` but no easing curves, animation staggering, or reduced-motion rules are defined. Impeccable covers this as a full domain (easing curves, stagger timing, prefers-reduced-motion).
- **Business impact:** Inconsistent animations across components; no accessibility compliance for motion-sensitive users
- **Estimated effort:** S
- **Priority:** 🔴 High
- **Status:** accepted
- **Proposed sprint:** backlog

### DEBT-083 — Anti-pattern: no card nesting rule (BG-010)
- **Category:** design
- **Found by:** project-director (impeccable analysis)
- **Date found:** 2026-03-16
- **Project:** had-management (cross-workspace)
- **Location:** .claude/agents/brand-guardian.md — BG rules table
- **Description:** No brand-guardian rule prevents nesting Card components inside other Cards. Impeccable explicitly flags this as an anti-pattern ("do not nest cards inside of other cards"). Add BG-010 rule to brand-guardian.
- **Business impact:** Visual clutter, inconsistent depth hierarchy in flat design
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** backlog

### DEBT-084 — Anti-pattern: no bounce/elastic easing rule (BG-011)
- **Category:** design
- **Found by:** project-director (impeccable analysis)
- **Date found:** 2026-03-16
- **Project:** had-management (cross-workspace)
- **Location:** .claude/agents/brand-guardian.md — BG rules table
- **Description:** No brand-guardian rule detects bounce or elastic easing in animations. Impeccable flags these as dated. Add BG-011 rule scanning for `bounce`, `elastic`, `spring` easing patterns.
- **Business impact:** Dated animation feel undermines professional B2B brand
- **Estimated effort:** XS
- **Priority:** 🟢 Low
- **Status:** accepted
- **Proposed sprint:** backlog

### DEBT-085 — Anti-pattern: no gray-on-colored-background rule (BG-012)
- **Category:** design
- **Found by:** project-director (impeccable analysis)
- **Date found:** 2026-03-16
- **Project:** had-management (cross-workspace)
- **Location:** .claude/agents/brand-guardian.md — BG rules table
- **Description:** No brand-guardian rule checks for gray text on colored backgrounds. Impeccable flags this as a contrast/readability anti-pattern. Add BG-012 rule.
- **Business impact:** Poor readability, potential WCAG contrast failures
- **Estimated effort:** XS
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** backlog

### DEBT-086 — UX writing guide (Hungarian) missing
- **Category:** documentation
- **Found by:** project-director (impeccable analysis)
- **Date found:** 2026-03-16
- **Project:** had-management (cross-workspace)
- **Location:** .claude/skills/had-design-system/
- **Description:** No UX writing conventions exist for Hungarian UI text. Button labels, error messages, empty states, and confirmation dialogs are written ad-hoc in mock data. Impeccable covers UX writing as a full domain. Create a Hungarian UX writing reference file for the design system skill.
- **Business impact:** Inconsistent tone and wording across UI; translation-quality issues if team grows
- **Estimated effort:** M
- **Priority:** 🟡 Medium
- **Status:** accepted
- **Proposed sprint:** backlog
