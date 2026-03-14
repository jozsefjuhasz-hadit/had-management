---
status: active
last-updated: 2026-03-13
owner: juhaszj
type: debt-backlog
source: had-crm legacy whitepaper
---

# HAD CRM -- Debt Backlog

> All technical, documentation, design, and process debt identified during legacy code review.
> This list is descriptive (what exists), not prescriptive (what to do about it).
> Items are grouped by category and tagged with severity.

Severity: **CRITICAL** = blocks production use | **HIGH** = significant risk or limitation | **MEDIUM** = quality issue | **LOW** = minor inconvenience

---

## Security Debt

| # | Item | Severity | Location | Notes |
|---|------|----------|----------|-------|
| S-1 | No authentication on backend | CRITICAL | backend/src/index.ts | All REST endpoints and MCP tools are publicly accessible. No auth middleware exists. |
| S-2 | Mock login stores hardcoded user in localStorage | CRITICAL | frontend/src/auth/mockAuth.ts | Anyone can "log in" by clicking a button. No credentials, no validation. |
| S-3 | Roles defined but never enforced | HIGH | frontend/src/auth/mockAuth.ts | User.role is "admin" or "user" but no code checks it anywhere. |
| S-4 | No CORS restriction in production | MEDIUM | backend/src/index.ts | `cors()` called with no options -- allows all origins. |
| S-5 | No rate limiting despite dependency installed | MEDIUM | backend/package.json | express-rate-limit is NOT in package.json despite README claiming it is. |

---

## Data Model Debt

| # | Item | Severity | Location | Notes |
|---|------|----------|----------|-------|
| D-1 | KAM field is free text, not FK | HIGH | backend/src/db/schema.ts | Should reference a users table. No validation that the name corresponds to a real person. |
| D-2 | Deal owner field is free text, not FK | HIGH | backend/src/db/schema.ts | Same issue as D-1. |
| D-3 | No users table | HIGH | backend/src/db/schema.ts | Prerequisite for D-1, D-2, and real auth. |
| D-4 | Hardcoded HUF currency | HIGH | Multiple files | No currency field on deals. All formatting, MCP tool descriptions, and reports assume HUF. |
| D-5 | Schema migration via try/catch ALTER | MEDIUM | backend/src/db/schema.ts:50-66 | Each migration is a bare ALTER TABLE wrapped in try/catch. Cannot rename columns, add constraints, or roll back. |
| D-6 | No stage transition history | MEDIUM | backend/src/core/deals.ts | Stage changes overwrite the stage field with no audit trail. |
| D-7 | close_reason and notes boundary unclear | LOW | backend/src/core/deals.ts | Both fields store free text about a deal. close_reason is only set on close, but functionally similar to notes. |

---

## Feature Completeness Debt

| # | Item | Severity | Location | Notes |
|---|------|----------|----------|-------|
| F-1 | MCP tools missing 7 deal fields | HIGH | backend/src/mcp/tools/deal-tools.ts | description, owner, next_step_owner, next_step_due, project_start_expected, project_start_actual, project_end are not exposed in create_deal or update_deal MCP tools. The AI agent (primary user) cannot set these fields. |
| F-2 | DealCreateModal missing project fields | MEDIUM | frontend/src/components/DealCreateModal.tsx | project_start_expected, project_start_actual, project_end not in the create form. |
| F-3 | DealDetail page missing activity timeline | MEDIUM | frontend/src/pages/DealDetail.tsx | Activities are fetched via API but the response data is not rendered. |
| F-4 | ContactDetail page missing activity timeline | MEDIUM | frontend/src/pages/ContactDetail.tsx | Activities are fetched (via history endpoint) but only deals are rendered. |
| F-5 | No stage transition validation | MEDIUM | backend/src/core/deals.ts | Deals can jump from any stage to any other (e.g., lead directly to won). No guardrails. |
| F-6 | No inline editing on detail pages | LOW | frontend/src/pages/ | Contact and deal detail pages are read-only. Editing requires MCP or direct API calls. |
| F-7 | No activity creation from UI | LOW | frontend/ | There is no UI to add activities. Only the MCP tool and direct API calls support it. |

---

## Code Quality Debt

| # | Item | Severity | Location | Notes |
|---|------|----------|----------|-------|
| C-1 | Zero tests | HIGH | Entire codebase | No unit tests, no integration tests, no E2E tests. |
| C-2 | Type duplication between backend and frontend | MEDIUM | backend/src/core/*.ts + frontend/src/types.ts | Same interfaces defined in two places with no mechanism to keep them in sync. |
| C-3 | Inline SVG icons throughout components | LOW | frontend/src/components/Sidebar.tsx, pages/*.tsx | Icons are hardcoded SVG markup instead of using an icon library or component. |
| C-4 | Inline styles mixed with Tailwind classes | LOW | frontend/src/pages/*.tsx, components/*.tsx | CSS variables accessed via `style={{}}` alongside Tailwind utility classes. Inconsistent approach. |
| C-5 | validateQuery middleware defined but never used | LOW | backend/src/middleware/validate.ts:16 | Only validateBody is imported anywhere. |

---

## Documentation Debt

| # | Item | Severity | Location | Notes |
|---|------|----------|----------|-------|
| DOC-1 | feature-status.md out of sync with code | HIGH | docs/specs/feature-status.md | Reports module and CSV import are implemented but marked as "Planned". |
| DOC-2 | Roadmap and feature-status diverge | MEDIUM | docs/specs/roadmap.md vs feature-status.md | Items have different statuses across documents. |
| DOC-3 | CLAUDE.md mixed Hungarian/English | MEDIUM | CLAUDE.md:34-57 | Document chain section, terminology table, and agent workflow section are in Hungarian. |
| DOC-4 | README claims express-rate-limit is installed | LOW | README.md:84 | package.json does not list express-rate-limit as a dependency. |
| DOC-5 | No API versioning documented or implemented | LOW | README.md, api-catalog.md | Endpoints are /api/* with no version prefix. Not a problem yet, but will be when the rewrite ships alongside legacy. |
| DOC-6 | MCP catalog missing new fields | MEDIUM | docs/specs/mcp-catalog.md | mcp-catalog.md does not document the 7 deal fields that were added to the data model but never exposed in tools. |

---

## Process Debt

| # | Item | Severity | Location | Notes |
|---|------|----------|----------|-------|
| P-1 | Spec-first workflow not consistently followed | MEDIUM | docs/, tasks/ | The documented workflow (update spec -> create PRD -> code) was bypassed for Reports and CSV import. Code was written without updating feature-status. |
| P-2 | No CI/CD pipeline | MEDIUM | Project root | No GitHub Actions, no automated testing, no deployment automation. |
| P-3 | Node.js path hardcoded to OneDrive | LOW | CLAUDE.md, README.md | The Node.js path includes a user-specific OneDrive directory with spaces and special characters. |

---

## UX Debt

> Items identified during UX research cycle (2026-03-13). These represent gaps where the human experience is broken independent of the underlying architectural issues.

| # | Item | Severity | Location | Notes |
|---|------|----------|----------|-------|
| UX-1 | Deal Detail page is entirely read-only | CRITICAL | frontend/src/pages/DealDetail.tsx | Human users cannot edit any deal field, update notes, or change the stage from the deal page. All edits require MCP or direct API. Blocks core sales workflow. |
| UX-2 | No activity creation UI anywhere in the web interface | CRITICAL | frontend/ (entire) | No form, button, or modal exists for a human user to log a call, note, or meeting. Only MCP and REST API support activity creation. |
| UX-3 | Activity timeline not rendered on Deal Detail | HIGH | frontend/src/pages/DealDetail.tsx | Data is fetched from the API but the component does not render it. Users cannot see deal history inline. |
| UX-4 | Activity timeline not rendered on Contact Detail | HIGH | frontend/src/pages/ContactDetail.tsx | Same issue as UX-3: activities fetched, not displayed. Deal list shown; individual activity log not. |
| UX-5 | Pipeline stages have no contextual guidance in UI | MEDIUM | frontend/src/components/DealCreateModal.tsx, DealDetail | Stage dropdown has no descriptions, tooltips, or onboarding text. New users cannot self-learn the pipeline model. |
| UX-6 | KAM and owner fields show no validation feedback | MEDIUM | frontend/src/components/ (create modals) | Free-text fields with no dropdown, autocomplete, or format hint. Silent data quality degradation from first use. |
| UX-7 | Deal create modal missing project date fields | MEDIUM | frontend/src/components/DealCreateModal.tsx | project_start_expected, project_start_actual, project_end absent from create form. Users cannot enter these at creation time. |
| UX-8 | No currency indicator on deal value field | MEDIUM | frontend/src/components/DealCreateModal.tsx, DealDetail | Users enter a number with no indication that HUF is assumed. EUR/USD deals are silently misrepresented. |
| UX-9 | Dashboard "recent activities" feed is not interactive for logging | LOW | frontend/src/pages/Dashboard.tsx | Feed shows 5 activities as links to deals/contacts, but provides no quick-capture "log something now" entry point for users returning from a call. |
| UX-10 | No success/error feedback documented for create operations | LOW | frontend/src/components/ | Whitepaper does not document confirmation states after contact or deal creation. May leave users uncertain whether their action succeeded. |

---

## Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 2 | 1 | 2 | 0 | 5 |
| Data Model | 0 | 4 | 2 | 1 | 7 |
| Feature Completeness | 0 | 1 | 4 | 2 | 7 |
| Code Quality | 0 | 1 | 1 | 3 | 5 |
| Documentation | 0 | 1 | 3 | 2 | 6 |
| Process | 0 | 0 | 2 | 1 | 3 |
| UX | 2 | 2 | 4 | 2 | 10 |
| **Total** | **4** | **10** | **18** | **12** | **43** |

**Top 5 items to address in rewrite (by impact):**

1. **S-1 + S-2**: Real authentication (M365 SSO) -- blocks any production use
2. **D-1 + D-2 + D-3**: Users table with proper FKs for KAM and deal owner
3. **D-4**: Multi-currency support (HUF + EUR + USD)
4. **F-1 + UX-1 + UX-2**: Full MCP tool field coverage AND editable Deal Detail with activity creation -- the AI agent and human users are both blocked
5. **C-1**: Test infrastructure from day one

---

## Product Debt — Identified During PRD Authoring (2026-03-13)

> Items flagged by the product-manager agent while writing PRDs. These are gaps, ambiguities, or risks
> that were not captured in the legacy debt scan but have implications for the rewrite design.

| # | Item | Severity | Source PRD | Notes |
|---|------|----------|-----------|-------|
| PD-1 | No dedicated "AI Agent" user record defined | HIGH | PRD-MCP-011, PRD-MCP | Stage history requires an actor user ID for every transition, including agent-initiated ones. The AI agent needs a known, stable user record in the users table (e.g., "HAD Agent" with a fixed ID) so all agent operations are attributable. This is not addressed in the BRD or whitepaper. Without this, agent-sourced transitions either have a null actor or are attributed to János's personal account. |
| PD-2 | "Connection" field on Contact has no definition in any source document | MEDIUM | PRD-CON-003, PRD-CON-011 | The whitepaper and BRD reference a "Connection" field on Contact (implied from user picker requirements in the handoff document). The field's business purpose, uniqueness constraint, and Hungarian UI label are undefined. This needs a product decision before TSD: Is "Connection" the same as a "referred by" field? Is it a secondary KAM? |
| PD-3 | MNB SOAP API accessibility from Vercel not verified | HIGH | PRD-REP-002 | The MNB SOAP endpoint (`http://www.mnb.hu/arfolyamok.asmx`) uses plain HTTP, not HTTPS. Vercel serverless functions may block or restrict outbound HTTP calls. This is a deployment risk that must be resolved before the Reports TSD is written. If the endpoint is inaccessible, an alternative (HTTPS proxy, scheduled cron job) must be designed. |
| PD-4 | Historical exchange rates: no decision on rate-at-creation vs. current-rate | MEDIUM | PRD-REP | When displaying a deal created in 2024 at EUR value, should the HUF equivalent use today's rate or the rate from 2024? The PRD defaults to current rate for simplicity, but this produces different HUF totals over time for the same deal. This is acceptable for MVP but must be documented as a known limitation in the beta notice. Post-MVP: consider storing the rate at time of deal creation. |
| PD-5 | Activity edit permissions not decided | MEDIUM | PRD-DEAL-009, PRD-MCP-020 | The PRD leaves open whether activity editing is restricted to the original author or permitted to any authenticated user. If the AI agent creates an activity and János (the admin) needs to correct it, author-only restrictions would block that correction. Recommendation: any authenticated user can edit any activity in MVP; refine in post-MVP if needed. |
| PD-6 | CSV import: KAM column mapping undefined | MEDIUM | PRD-CON — Open Question 3 | The CSV import beta accepts a KAM field, but the legacy format stored free-text names. The rewrite requires a user ID (FK). The import pipeline has no defined behavior for unmapped or unrecognized KAM values. Options: skip KAM on import (safest), attempt name-match to users table (fragile), or require CSV to use email address for matching. Decision needed before TSD. |
| PD-7 | Session expiry behavior on in-progress forms | LOW | PRD-AUTH-010 | The auth PRD notes session expiry may interrupt in-progress forms. Preserving form state across a session expiry and re-authentication is technically non-trivial. The Should Have requirement acknowledges this; if it is too complex, the fallback (lose form state, redirect to login) is acceptable for MVP given the small team and internal tool nature. |
| PD-8 | Single admin guard creates a dependency risk | LOW | PRD-AUTH-012 | If the sole admin (juhaszj) is unavailable and their account loses M365 access, no one can promote another user to admin. This is an operational risk, not a product gap — but it should be documented in the deployment runbook. Recommendation: provision a second admin account at launch. |

---

*Generated by legacy-archaeologist agent on 2026-03-13.*
*Source snapshot: C:/claude/archive/claude-projects-backup-2026-03-12/had-crm*
*UX Debt section appended by ux-researcher agent on 2026-03-13.*
*Product Debt section appended by product-manager agent on 2026-03-13.*
