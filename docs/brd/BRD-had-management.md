---
status: draft
last-updated: 2026-03-13
owner: juhaszj
type: brd
project: had-management
chain-stage: 1
---

# Business Requirements Document — HAD Management Rewrite

## 1. Executive Summary

HAD CRM is an internal customer relationship management system used by HAD IT Services to track B2B contacts, sales deals, and interaction activities across a six-stage pipeline. The existing system (React SPA + SQLite + Express) has served as a working prototype but suffers from critical gaps: no authentication, no tests, hardcoded currency, free-text foreign keys, missing MCP tool coverage, and no stage transition history.

This document defines the business requirements for a full rewrite on a modern stack (Next.js App Router, Supabase PostgreSQL, Drizzle ORM, Microsoft Entra ID auth). The rewrite is not a feature expansion — it is a clean rebuild of the same functional scope with corrected architecture, real authentication, and the elimination of all identified technical debt.

The system's primary operator is an AI agent (Claude Code) via MCP tools; the web UI serves as a human oversight and visualization layer.

## 2. Problem Statement

The legacy HAD CRM cannot be maintained or extended safely due to the following business-impacting issues:

1. **No authentication or authorization** — Any HTTP client can read and modify all CRM data. This is unacceptable for a system holding customer contact information and deal values.
2. **AI agent cannot operate fully** — The MCP tools (the primary interface) lack 7 deal fields, meaning the AI agent cannot set descriptions, owners, next steps, or project dates. This defeats the "MCP-first" design philosophy.
3. **No audit trail for pipeline changes** — Stage transitions are not logged. When a deal moves from "qualified" to "won", there is no record of when it happened or who did it. This makes pipeline analysis unreliable.
4. **Single currency (HUF)** — The business handles deals in EUR and USD as well. All values are hardcoded to HUF with no conversion capability.
5. **Data integrity gaps** — KAM and deal owner are free-text fields with no referential integrity to actual users. There is no users table.
6. **Zero test coverage** — No automated tests exist. Any change carries regression risk.
7. **Type duplication** — Entity types are defined separately in frontend and backend with no shared source of truth, leading to drift.

## 3. Stakeholders

| Stakeholder | Role | Interest | Impact |
|-------------|------|----------|--------|
| Sales team (2-5 people) | Primary human users | Need reliable pipeline view, accurate reporting, multi-currency support | High — daily users |
| AI Agent (Claude Code) | Primary operator | Needs full MCP tool coverage for all entity fields | High — most CRM operations go through MCP |
| IT Admin (juhaszj) | System owner, developer | Needs maintainable codebase, real auth, testable architecture | High — sole maintainer |
| External automations (n8n, Power Automate) | Integration consumers | Need stable REST API for email intake and workflows | Medium — deprioritized for MVP |

## 4. Business Objectives (SMART)

| # | Objective | Metric | Target | Timeframe |
|---|-----------|--------|--------|-----------|
| BO-1 | Secure all CRM data access | Authentication coverage | 100% of endpoints require valid M365 session | By MVP launch |
| BO-2 | Enable AI agent as full primary operator | MCP tool field coverage | 100% of entity fields accessible via MCP tools | By MVP launch |
| BO-3 | Track all pipeline state changes | Stage transition logging | 100% of stage changes recorded with timestamp + actor | By MVP launch |
| BO-4 | Support multi-currency deals | Currency options available | HUF, EUR, USD selectable per deal; exchange rates from MNB | By MVP launch |
| BO-5 | Establish referential integrity for users | KAM and owner fields | Both are FK to users table (populated from Entra ID) | By MVP launch |
| BO-6 | Achieve baseline test coverage | Automated test coverage | Critical paths covered by Vitest (entity CRUD, pipeline transitions, auth flow) | By MVP launch |
| BO-7 | Eliminate type duplication | Single source of truth | Drizzle schemas serve as the sole type definition layer | By MVP launch |

## 5. Scope

### 5.1 In Scope (MVP)

| # | Feature Area | Description |
|---|-------------|-------------|
| S-1 | **Authentication** | Microsoft Entra ID via Supabase Auth (Azure provider). Server-side session validation. Replace mock auth entirely. |
| S-2 | **Contacts CRUD** | Create, read, update, archive contacts. KAM as FK to users. Soft delete (archive) only. |
| S-3 | **CSV Contact Import** | Upload CSV (max 100 rows), duplicate detection by email, per-row action selection. Beta status retained. |
| S-4 | **Deals CRUD** | Create, read, update deals. All fields from white paper including project dates. Currency field per deal (HUF/EUR/USD). Owner and next_step_owner as FK to users. |
| S-5 | **Pipeline Management** | Six-stage pipeline (lead → qualified → proposal → negotiation → won/lost). Free movement between stages. All transitions logged with timestamp and actor. Close deal operation with close_reason. |
| S-6 | **Activities** | Create, read, update, delete activities (note, email, call, meeting). Linked to contact and/or deal. Full CRUD replaces legacy append-only behavior. |
| S-7 | **Dashboard** | KPI cards (open deals, pipeline value, won value). Stage breakdown. Recent activities feed. |
| S-8 | **Reports** | Revenue and forecast by year. Quarterly breakdown. Multi-currency aggregation (convert to base currency for totals). Beta status retained. |
| S-9 | **MCP Tools** | Full field coverage for all 16+ tools. All entity fields accessible. Intelligence tools (pipeline summary, search, contact history). |
| S-10 | **Theme** | Dark/light mode toggle. Stored in user preference or localStorage. |
| S-11 | **Hungarian UI** | All user-facing text in Hungarian. Code, API routes, and DB columns in English. |

### 5.2 Out of Scope (Not in MVP)

| # | Item | Rationale |
|---|------|-----------|
| OS-1 | **Email intake webhook** | Deprioritized per stakeholder decision. Can be added post-MVP. |
| OS-2 | **Data migration from legacy SQLite** | Clean slate confirmed. No data migration needed. |
| OS-3 | **Multi-tenancy** | Single-tenant system for one small team. Not needed. |
| OS-4 | **Advanced search (full-text)** | LIKE-based search adequate for ~50 users and small dataset. Revisit if data grows. |
| OS-5 | **Mobile-specific UI** | Internal tool used on desktop. Responsive design is nice-to-have, not a requirement. |
| OS-6 | **API versioning** | Single consumer (internal). Versioning adds complexity without current benefit. |
| OS-7 | **Granular RBAC** | All users are effectively admins in current usage. Simple role model (admin/user) sufficient for MVP. Only admin vs. user distinction needed. |

## 6. Success Metrics

| # | Metric | Measurement Method | Target |
|---|--------|-------------------|--------|
| SM-1 | All endpoints authenticated | Manual audit + integration test | 0 unauthenticated endpoints |
| SM-2 | MCP tool parity with data model | Field coverage matrix | 100% of writable fields exposed in MCP tools |
| SM-3 | Stage transition history completeness | Query stage_history table | 100% of transitions have timestamp + actor |
| SM-4 | Multi-currency functional | Create deal with EUR/USD, verify display and aggregation | Works for HUF, EUR, USD |
| SM-5 | Test suite passes | CI pipeline green | All critical path tests pass |
| SM-6 | User adoption | Sales team uses new system for daily work | Legacy system decommissioned within 2 weeks of launch |
| SM-7 | Zero type drift | Build-time check | Frontend types derived from Drizzle schemas, no manual type files |

## 7. Constraints & Assumptions

### 7.1 Constraints

| # | Constraint | Impact |
|---|-----------|--------|
| C-1 | All users authenticate via Microsoft 365 (Entra ID) | No local user registration; user table populated from Entra directory |
| C-2 | ~50 maximum concurrent users | No need for horizontal scaling, CDN, or edge computing |
| C-3 | Internal tool only | No public-facing pages, no SEO requirements, no GDPR cookie banners |
| C-4 | Sole maintainer (juhaszj) | Architecture must be simple and well-documented; avoid over-engineering |
| C-5 | Supabase PostgreSQL as database | No SQLite, no other database engines |
| C-6 | Next.js App Router as frontend framework | No separate SPA; server components where possible |
| C-7 | Bun as package manager, Node.js as Next.js runtime | Bun for speed, Node.js for Next.js compatibility |
| C-8 | MNB SOAP API for exchange rates | `http://www.mnb.hu/arfolyamok.asmx` — external dependency for currency conversion |

### 7.2 Assumptions

| # | Assumption | Risk if Wrong |
|---|-----------|---------------|
| A-1 | All users have Microsoft 365 accounts | Auth flow will not work for non-M365 users |
| A-2 | HUF is the base/reporting currency | Aggregation logic and reports assume HUF base |
| A-3 | MNB API is reliable and free | If API is down or rate-limited, exchange rates cannot be fetched |
| A-4 | Legacy data is not needed (clean slate) | If historical data is requested later, manual re-entry will be needed |
| A-5 | Sales team size stays under 50 | Architecture decisions (no caching layer, single Supabase instance) are based on this |
| A-6 | [INFERRED] Pipeline stages are fixed and will not change | If stages need to be configurable, schema and validation logic must be redesigned |
| A-7 | [INFERRED] One deal per contact is NOT a constraint (multiple deals per contact allowed) | White paper shows 1:N relationship (contact has many deals) |

## 8. Dependencies

| # | Dependency | Type | Owner | Status |
|---|-----------|------|-------|--------|
| D-1 | Supabase project provisioned | Infrastructure | juhaszj | Not started |
| D-2 | Microsoft Entra ID app registration | Infrastructure | juhaszj | Not started |
| D-3 | Supabase Auth configured with Azure provider | Infrastructure | juhaszj | Not started |
| D-4 | MNB SOAP API accessible from deployment environment | External service | MNB (external) | Available |
| D-5 | Node.js 22 LTS installed on dev machine | Development environment | juhaszj | Not installed |
| D-6 | Vercel project + domain for deployment | Infrastructure | juhaszj | Decided (Vercel) |

## 9. Open Questions (All Resolved)

| # | Question | Resolution | Date |
|---|----------|-----------|------|
| OQ-1 | What is the deployment target? | **Vercel** | 2026-03-13 |
| OQ-2 | Should exchange rates be cached, and for how long? | **Daily — once per day fetch from MNB** | 2026-03-13 |
| OQ-3 | Is there a reporting currency preference? | **Default HUF, but EUR and USD selectable by user** | 2026-03-13 |
| OQ-4 | Should the Vitest scope cover unit tests only, or also integration tests? | **Both unit and integration, introduced gradually (unit first, integration later)** | 2026-03-13 |
| OQ-5 | Are there any compliance requirements for storing customer contact data? | **Minimalist — internal software, but basic compliance must be ensured (no extensive GDPR apparatus needed)** | 2026-03-13 |

---

*Generated by business-analyst agent on 2026-03-13.*
*Updated with OQ resolutions on 2026-03-13.*
*Source: [whitepaper-had-management.md](../whitepaper-had-management.md)*
