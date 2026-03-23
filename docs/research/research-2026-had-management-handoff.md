---
status: approved
last-updated: 2026-03-16
owner: juhaszj
type: ux-research
subtype: handoff
project: had-management
audience: product-manager
source-documents:
  - docs/whitepaper-had-management.md
  - docs/brd/BRD-had-management.md
  - docs/research/research-2026-had-management-personas.md
  - docs/research/research-2026-had-management-journey-maps.md
---

# UX Research Handoff — HAD Management Rewrite
## For: Product Manager · 2026-03-13

> This document bridges UX research findings to product decisions.
> It is the PM's reference for ensuring the PRD addresses real human needs, not just business requirements.
> Evidence policy: `[ASSUMED]` vs `[DATA-BASED]` throughout.

---

## 1. Key Findings (Prioritized)

### Finding 1 — The web UI is effectively read-only: human users cannot complete their most critical workflows [CRITICAL]

**Evidence:** [DATA-BASED]
- Deal Detail page has no editing capability (debt-backlog F-6)
- No activity creation from the UI exists anywhere (debt-backlog F-7)
- Activity timeline is fetched but never rendered on Deal Detail (debt-backlog F-3)

**Human impact:** The senior account manager cannot log a call, update a deal, or see deal history without leaving the UI and using developer tools. The UI is a dashboard, not a working tool.

**BRD mapping:** S-4 (Deals CRUD), S-6 (Activities full CRUD), S-5 (Pipeline Management)

**PRD must address:** All deal fields must be editable from the Deal Detail page. Activity creation must be available directly on Deal Detail. Activity timeline must be rendered in reverse chronological order.

---

### Finding 2 — The primary operator (AI agent) cannot fully execute its instructions [CRITICAL]

**Evidence:** [DATA-BASED]
- 7 deal fields (description, owner, next_step_owner, next_step_due, project_start_expected, project_start_actual, project_end) are absent from MCP create_deal and update_deal tools (debt-backlog F-1, whitepaper §"What Was Broken" #2)
- The gap is silent — no error is returned when fields cannot be set

**Human impact:** János (system owner) cannot trust that an AI instruction was fully executed. He must verify and manually correct via the REST API after every compound agent operation.

**BRD mapping:** BO-2, SM-2, S-9

**PRD must address:** 100% field parity between MCP tools and the data model. Every writable field must be settable by the AI agent. Tool schema must be kept in sync with the database schema through automated means if possible.

---

### Finding 3 — No audit trail makes pipeline analysis unreliable and trust in the system low [HIGH]

**Evidence:** [DATA-BASED]
- Stage transitions overwrite the stage field with no record of when or who changed it (debt-backlog D-6, BRD §2 #3)
- Activities are append-only in legacy, but not rendered — so even the partial record that exists is invisible

**Human impact:** Péter keeps a personal Excel backup because he cannot rely on the CRM's pipeline history. Ágnes does not understand why a deal is in a given stage. János cannot audit AI agent operations. [ASSUMED — compensating behavior inferred; structural gap DATA-BASED]

**BRD mapping:** BO-3, SM-3, S-5

**PRD must address:** Stage transition history table (actor, from_stage, to_stage, timestamp, source: human vs. agent). Stage history visible on Deal Detail page.

---

### Finding 4 — Data quality degrades at the point of entry due to free-text owner and KAM fields [HIGH]

**Evidence:** [DATA-BASED]
- KAM and deal owner are free text with no validation (debt-backlog D-1, D-2, D-3)
- No users table exists in the legacy system

**Human impact:** Filtering deals by owner returns inconsistent results. "Péter" and "Kovacs Peter" and "Kovács Péter" are three different owners. Junior users don't know whose name to enter. [ASSUMED — canonical consequence of free-text FK fields]

**BRD mapping:** BO-5, S-4

**PRD must address:** KAM and owner must be proper foreign keys to the users table (populated from Microsoft Entra ID). Both fields must use a user picker component in all forms and edit interfaces.

---

### Finding 5 — Multi-currency gap creates invisible inaccuracy in pipeline reporting [HIGH]

**Evidence:** [DATA-BASED]
- All deal values are hardcoded HUF; no currency field exists (debt-backlog D-4, whitepaper rewrite note)
- The business operates deals in EUR and USD (BRD §2 #4)

**Human impact:** Pipeline value KPIs are incorrect whenever EUR or USD deals exist. Péter and management see a pipeline value that does not reflect reality. Workaround is personal Excel. [ASSUMED — compensating behavior; gap DATA-BASED]

**BRD mapping:** BO-4, SM-4, S-4, S-8

**PRD must address:** Per-deal currency field (HUF/EUR/USD). MNB daily exchange rate fetch. Pipeline value aggregation must convert to HUF (or user-selected base currency per BRD OQ-3). Reports must handle multi-currency aggregation.

---

## 2. Personas Summary Table

| Persona | Role | Primary Journey | Top Pain Point | Success Condition |
|---------|------|----------------|---------------|------------------|
| Kovács Péter | Senior Account Manager | Post-call deal update + activity log | UI is read-only; cannot log activity | Activity log on deal page; editable deal detail |
| Szabó Ágnes | Sales Representative | New lead onboarding (contact + deal + stage move) | Stages have no guidance; forms have free-text FK fields | User picker for owner/KAM; stage descriptions |
| Juhász János | IT Admin / Sole Maintainer | AI agent operation verification | Agent cannot set 7 fields; no audit trail visible in UI | Full MCP parity; stage history + activity timeline in UI |

---

## 3. Journey Friction Hotspots

Ranked by combined severity and persona breadth:

| Rank | Friction | Journey(s) Affected | Severity | BRD Items |
|------|---------|-------------------|---------|-----------|
| 1 | Deal Detail page is entirely read-only | J1, J2, J3 | Critical | S-4, S-6 |
| 2 | No activity creation UI | J1, J2 | Critical | S-6 |
| 3 | Activity timeline missing from Deal Detail | J1, J3 | High | S-6, S-7 |
| 4 | MCP tools missing 7 deal fields | J3 | Critical | S-9, BO-2 |
| 5 | No stage transition history | J2, J3 | High | S-5, BO-3 |
| 6 | KAM and owner are free-text fields | J2, J3 | High | BO-5, S-4 |
| 7 | Pipeline stages have no contextual guidance | J2 | Medium | S-5 |
| 8 | No multi-currency support in forms or reports | J1, J2 | High | BO-4, S-8 |

---

## 4. What the PRD Must Address (Mapped to BRD IDs)

| PRD Requirement | BRD ID | UX Finding | Persona(s) |
|----------------|--------|-----------|-----------|
| Deal Detail page: full inline edit mode or Edit button revealing editable form | S-4 | Finding 1, Friction 1 | Péter, Ágnes, János |
| Activity creation directly from Deal Detail (and Contact Detail) | S-6 | Finding 1, Friction 2 | Péter, Ágnes |
| Activity timeline on Deal Detail (reverse chronological, with type + timestamp + author) | S-6 | Finding 1, Friction 3 | Péter, János |
| 100% MCP tool field coverage for all entity fields | S-9, BO-2 | Finding 2, Friction 4 | János |
| Stage transition history table — logged on every transition (actor, from, to, timestamp) | S-5, BO-3 | Finding 3, Friction 5 | Ágnes, János |
| Stage history panel visible on Deal Detail | S-5 | Finding 3 | János |
| KAM and owner as user pickers (FK to users table from Entra ID) | S-2, S-4, BO-5 | Finding 4, Friction 6 | Ágnes, János |
| Stage descriptions in create form dropdown and deal detail | S-5 | Friction 7 | Ágnes |
| Per-deal currency selector (HUF/EUR/USD) in create and edit forms | S-4, BO-4 | Finding 5, Friction 8 | Péter, Ágnes |
| MNB exchange rate conversion in pipeline value KPIs and reports | S-8, BO-4 | Finding 5 | Péter |
| Real M365 auth with actor attribution on all writes | S-1, BO-1 | Finding 3 (implied) | János |

---

## 5. What Is Out of Scope for This Research

The following items are outside the UX research boundary for this cycle:

| Out of Scope | Rationale |
|-------------|-----------|
| Email intake webhook UX | Out of MVP scope per BRD OS-1 |
| Mobile/responsive UI patterns | Out of MVP scope per BRD OS-5 |
| Granular RBAC flows | Out of MVP scope per BRD OS-7; only admin/user distinction needed |
| Data migration experience | Clean slate confirmed; no migration UX needed per BRD OS-2 |
| Full-text / advanced search UX | Out of MVP scope per BRD OS-4 |
| External API consumer (n8n, Power Automate) UX | Integration out of MVP per BRD OS-1 and §3 Medium impact |
| AI agent conversation UX | MCP tool coverage is in scope; conversational AI design is not |

---

## 6. Assumption Register

Full risk and validation path for every major assumption in this research.

| # | Assumption | Personas Affected | Risk Level | Validation Path |
|---|-----------|-----------------|-----------|----------------|
| A-UX-1 | Sales team has 2-5 members [DATA-BASED: BRD §3] | All | Low — document-confirmed | No validation needed |
| A-UX-2 | Péter is the primary daily user of the pipeline view | Péter | Medium | Interview or observation with 1-2 actual sales team members |
| A-UX-3 | Péter keeps personal Excel for multi-currency compensation | Péter | Medium | Confirm in user interview; high probability given known gap |
| A-UX-4 | Ágnes (or equivalent junior user) exists on the team | Ágnes | Medium | Confirm team composition; if team is homogeneous senior, Ágnes persona merges with Péter |
| A-UX-5 | Junior users are confused by stage meanings | Ágnes | High | Can be validated with a 10-minute usability test on create deal flow |
| A-UX-6 | Post-call activity logging is a high-frequency action | Péter, Ágnes | High | Universal sales behavior — low validation priority |
| A-UX-7 | Users do not use MCP tools directly (only János does) | Péter, Ágnes | High | Structural — MCP is developer/agent interface by design |
| A-UX-8 | Deal Detail is the primary single-entity view | All | High — consistent with whitepaper navigation model | Verify in usability session |
| A-UX-9 | Stage transition history is needed for pipeline analysis | Péter, János | High | Ask Péter: "How do you currently know when a deal's stage changed?" |
| A-UX-10 | No confirmation feedback after contact/deal creation | Ágnes | Medium | Quick UI review of legacy system; carries over to rewrite if not explicitly designed |

### Highest-risk assumptions for the PRD

If **A-UX-4** is wrong (no junior users exist), the Ágnes persona collapses and the "learnability" requirements (stage descriptions, form guidance) become lower priority.

If **A-UX-2** is wrong (Péter is not actually a daily user), pipeline UX priorities should be recalibrated toward the actual daily user profile.

**Recommendation:** Before PRD is finalized, conduct one 30-minute discovery conversation with at least one member of the sales team to validate A-UX-2 through A-UX-5.

---

## 7. Research Limitations

This research cycle was performed entirely from document analysis (whitepaper + BRD). The following were not available:

- User interviews
- Observational sessions (screen recordings, contextual inquiry)
- Usability testing of the legacy system
- Analytics data (click paths, time-on-task, drop-off rates)
- Survey or questionnaire data

All behavioral and emotional attributes in the personas and journey maps are inferred from domain knowledge and the document record. They represent high-probability hypotheses, not confirmed findings.

**Confidence level for critical path decisions:** Medium-high for structural issues (read-only UI, missing activity creation, no audit trail) — these are factual gaps confirmed in the documents. Medium for behavioral and prioritization claims — these should be validated before the PRD locks feature prioritization.

---

*Generated by ux-researcher agent on 2026-03-13.*
*Downstream agent: product-manager (PRD authoring).*
*Source: whitepaper-had-management.md + BRD-had-management.md + research personas + research journey maps.*
