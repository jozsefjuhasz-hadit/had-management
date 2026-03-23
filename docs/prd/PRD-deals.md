---
status: approved
last-updated: 2026-03-16
owner: juhaszj
doc-type: PRD
project: had-management
feature: Deals — CRUD + Pipeline + Stage History
version: 1.0
approved-by: juhaszj
related-docs:
  brd: BRD-had-management.md
  implements: [S-4, S-5, S-6, BO-3, BO-4, BO-5]
---

# PRD: Deals — CRUD + Pipeline + Stage History Log

## 1. Overview

The Deals module is the core of the CRM pipeline. It tracks sales opportunities from initial lead through negotiation to a won or lost outcome. In the rewrite, the module addresses every major structural deficiency identified in the legacy system: the deal detail page becomes fully editable, all missing fields are added to the create and edit forms, stage transitions are logged with actor attribution, an activity timeline is rendered inline, owner and next_step_owner become proper user references, and per-deal currency is introduced. Activities are full CRUD — created, edited, and deleted — in contrast to the legacy append-only behavior.

This module directly serves all three personas and resolves the highest-severity friction points identified across all three journey maps.

## 2. Problem Statement

The legacy Deals module has four interconnected failures. The deal detail page is entirely read-only — no field can be edited from the UI. Seven deal fields exist in the database but are absent from the create form and MCP tools. Stage transitions are not logged, making pipeline analysis unreliable. And all deal values are assumed to be HUF with no currency field, making multi-currency deals invisible to reporting.

These are not minor usability issues — they break the primary daily workflows for every user persona. Péter cannot update a deal after a call. Ágnes cannot edit a deal she just created. János cannot verify what the AI agent set. The rewrite must make the deal detail page the central working interface it was always intended to be.

Addresses: S-4, S-5, S-6, BO-3, BO-4, BO-5, debt items UX-1, UX-2, UX-3, UX-5, UX-7, UX-8, F-1, F-2, F-3, F-5, F-6, F-7, D-2, D-4, D-6, D-7

## 3. Users & Personas

| Persona | Who they are | Primary goal | Current frustration |
|---------|-------------|-------------|-------------------|
| Kovács Péter (Account Manager) | Senior account manager; reviews pipeline daily | After each client call: update the deal, log the interaction, check the next step | Deal Detail page is read-only; no activity creation from UI; no stage history visible; currency values are ambiguous |
| Szabó Ágnes (Sales Rep) | Junior-to-mid sales rep managing earlier-stage deals | Create deals cleanly, move them through stages, understand what each stage means | Forms missing project date fields; stages have no guidance; cannot edit a deal after creation; notes vs. close_reason ambiguity |
| Juhász János (IT Admin) | System owner and AI agent operator | Verify that the AI agent executed all intended field changes; confirm stage transitions are attributed | 7 deal fields not accessible via MCP; no stage history; activity timeline not rendered; deal detail read-only means manual API correction for every agent gap |

## 4. User Flows

### Flow 1: Create a new deal

**Trigger:** Ágnes meets a potential client and wants to create an opportunity in the pipeline.

1. Ágnes navigates to the Deals list.
2. She clicks "New Deal."
3. A create form appears with all deal fields: title (required), contact (required, searchable picker from contacts), stage (dropdown with description tooltip per stage), value (number), currency (HUF/EUR/USD selector, default HUF), owner (user picker), expected close (date), description, notes, next step owner (user picker), next step due (date), project start expected (date), project start actual (date), project end (date).
4. She fills in title and contact at minimum; sets stage to "lead" (default).
5. She submits the form.
6. The system creates the deal with the initial stage transition logged (actor = Ágnes, from = none, to = lead).
7. She lands on the Deal Detail page with a confirmation.

**Result:** A complete deal record is created. All fields are available at creation time. Stage transition log is initialized.

**Error states:**
- Title is empty → Field-level error: "Deal title is required."
- Contact is not selected → Field-level error: "A contact must be linked."

---

### Flow 2: Update a deal and log a post-call activity

**Trigger:** Péter finishes a client call and needs to update the deal and log the interaction.

1. Péter opens the Deal Detail page (via search or deals list).
2. The page shows all deal fields, the activity timeline (reverse chronological), the stage history panel, and the next step card — all visible without any interaction.
3. Péter clicks "Edit" to enter edit mode. All fields become editable.
4. He updates the stage from "proposal" to "negotiation" via the stage selector. He updates the next step owner and next step due date.
5. He saves the deal. The stage transition is recorded in the stage history (actor = Péter, from = proposal, to = negotiation, timestamp = now).
6. He clicks "Log Activity" on the Deal Detail page.
7. The activity form appears: type (note/email/call/meeting), content (required), pre-linked to the current deal and/or a contact.
8. He submits. The activity appears at the top of the activity timeline on the same page.

**Result:** Deal is updated, stage transition is logged with Péter as actor, activity is visible in the timeline. Péter never left the Deal Detail page.

**Error states:**
- Save fails due to network error → Error message shown; edit state preserved so no input is lost.
- Activity content is empty → Field-level error: "Activity content is required."

---

### Flow 3: Close a deal (won or lost)

**Trigger:** Péter closes a deal after a final negotiation outcome.

1. Péter opens the Deal Detail page.
2. He activates the "Close Deal" action.
3. A close form appears with: outcome selector (Won / Lost) and a reason/notes field.
4. He selects the outcome and enters a reason.
5. He confirms the close.
6. The system sets the stage to "won" or "lost," records the close_reason, and logs the stage transition (actor = Péter).
7. The deal detail page updates to show the closed status prominently.

**Result:** Deal is closed, stage is logged, close reason is recorded. The deal disappears from the active pipeline value but appears in won/lost reports.

**Error states:**
- Close attempted with no outcome selected → Validation error: "Select Won or Lost."

---

### Flow 4: View stage history

**Trigger:** János wants to verify when and by whom the AI agent moved a deal to a new stage.

1. János opens the Deal Detail page.
2. In the Stage History section, he sees a chronological list of all stage transitions: actor (user display name or "AI Agent"), from_stage, to_stage, timestamp.
3. He can identify exactly when the stage changed and whether it was a human or the AI agent.

**Result:** Full audit trail visible in the UI without any additional navigation.

---

### Flow 5: Edit or delete an activity

**Trigger:** Ágnes logged a call note on the wrong deal and needs to correct it.

1. Ágnes opens the Deal Detail page for the deal where she incorrectly logged the activity.
2. In the activity timeline, she clicks "Edit" on the activity.
3. The activity form opens pre-populated with current values. She corrects the linked deal (or other fields).
4. She saves. The activity is updated. An edit timestamp is recorded.
5. Alternatively, she can delete the activity after a confirmation step.

**Result:** Activity is corrected. The edit history is preserved (edit timestamp visible).

**Error states:**
- Delete confirmation dismissed → No change; activity remains.

---

## 5. Feature Requirements (MoSCoW)

### Must Have — launch blocker

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-DEAL-001 | The deal create form includes all deal fields: title, contact, stage, value, currency, owner, expected close, description, notes, next step owner, next step due, project start expected, project start actual, project end. All fields except title and contact are optional. | **Given** a user opens the deal create form, **when** the form renders, **then** all 15 fields listed are present and interactive. **Given** a user submits the form with only title and contact filled, **when** the deal is saved, **then** a complete deal record is created with defaults for all other fields. |
| PRD-DEAL-002 | The Deal Detail page is fully editable. All deal fields can be modified and saved from the detail page without navigating to a separate edit page. | **Given** a user opens a Deal Detail page and activates edit mode, **when** they modify any field and save, **then** the updated value is persisted, a success indication is shown, and the user remains on the Deal Detail page. **Given** a user saves a deal with an empty title, **when** the save is attempted, **then** a field-level error is shown and the deal is not saved. |
| PRD-DEAL-003 | The Owner field and the Next Step Owner field on both the create and edit forms are user pickers, populated from the users table. Free text is not accepted. | **Given** a user interacts with the Owner or Next Step Owner field on a deal form, **when** the field is displayed, **then** it shows a selectable list of active application users. **Given** a user selects a valid user from the picker, **when** the deal is saved, **then** the owner_id stored is a valid foreign key to the users table. |
| PRD-DEAL-004 | Every stage transition — including the initial creation stage — is recorded in a stage history table with: deal ID, actor user ID, from_stage (null for first entry), to_stage, timestamp, and source (human or agent). | **Given** a deal is created with stage "lead," **when** the record is saved, **then** a stage history entry exists with from_stage = null, to_stage = lead, and the creating user's ID as actor. **Given** a user changes a deal's stage from "proposal" to "negotiation," **when** the change is saved, **then** a stage history entry exists with from_stage = proposal, to_stage = negotiation, the user's ID as actor, and timestamp within 1 second of the save. |
| PRD-DEAL-005 | The Deal Detail page displays the stage history as a visible panel or timeline, showing for each transition: actor display name, from stage, to stage, timestamp. | **Given** a deal has 3 stage transitions in its history, **when** the Deal Detail page loads, **then** all 3 transitions are visible in the stage history section with actor, from, to, and timestamp shown. |
| PRD-DEAL-006 | Each deal has a currency field (HUF, EUR, or USD). The currency is selectable at creation and editable thereafter. The currency is displayed alongside the value everywhere the deal value is shown (list, detail page, pipeline KPIs). | **Given** a user creates a deal with value 1000 and currency EUR, **when** the deal appears in the Deals list or Detail page, **then** the value is displayed as "1 000 EUR" (or equivalent formatted string showing the currency). **Given** the pipeline KPI aggregation is run, **when** deals in multiple currencies exist, **then** each deal's value is converted to HUF using the most recent MNB exchange rate before summing. |
| PRD-DEAL-007 | Activities can be created directly from the Deal Detail page. The create form is accessible from a prominent action on the page and pre-links the new activity to the current deal. | **Given** a user is on the Deal Detail page and clicks "Log Activity," **when** the activity form opens, **then** the deal field is pre-linked to the current deal. **Given** a user submits an activity from the Deal Detail page, **when** the activity is saved, **then** it appears at the top of the activity timeline on the same page without a full page reload. |
| PRD-DEAL-008 | The Deal Detail page renders the activity timeline — all activities linked to the deal — in reverse chronological order, showing type, content summary, author display name, and timestamp. | **Given** a deal has 5 linked activities, **when** the Deal Detail page loads, **then** all 5 activities are visible in the timeline in reverse chronological order, each showing type, content, author name, and timestamp. |
| PRD-DEAL-009 | Activities support full CRUD: create, read, update, delete. Edit is available on any activity the current user created. Delete requires confirmation. An edit timestamp is recorded when an activity is modified. | **Given** a user edits an activity they created, **when** the edit is saved, **then** the updated content is persisted and an "edited at" timestamp is visible on the activity. **Given** a user attempts to delete an activity, **when** they click delete, **then** a confirmation prompt appears before the activity is removed. |
| PRD-DEAL-010 | The pipeline has exactly six stages in fixed order: lead, qualified, proposal, negotiation, won, lost. Stage transitions are free (any stage to any other, in any direction). The Close Deal operation sets stage to won or lost and requires a close_reason. | **Given** a user selects any stage from the stage picker on a deal, **when** the change is saved, **then** the stage is updated regardless of the current stage (no transition guard). **Given** a user activates Close Deal, **when** they select Won or Lost and provide a reason, **then** the deal's stage is set to won or lost and the close_reason is saved. |

### Should Have — important but not blocking launch

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-DEAL-011 | Stage descriptions (tooltips or inline labels) are shown wherever a stage is selected or displayed, explaining what each stage means in the company's sales process. | **Given** a user opens the stage dropdown in the deal create or edit form, **when** they hover or focus on a stage option, **then** a short description of that stage is shown. |
| PRD-DEAL-012 | The Deals list supports filtering by stage, free-text search, and sorting by title, value, last interaction, and next step due date. | **Given** a user filters the deals list by stage "qualified," **when** the list refreshes, **then** only deals in stage "qualified" are shown. |
| PRD-DEAL-013 | Activities can be created from the Contact Detail page as well, pre-linked to that contact. | **Given** a user is on the Contact Detail page and clicks "Log Activity," **when** the activity form opens, **then** the contact field is pre-linked to the current contact. |
| PRD-DEAL-014 | The "Close Reason" field label and purpose is unambiguous in the UI. It is separate from the general Notes field and is only surfaced during the Close Deal operation, not as an always-visible free-text field. | **Given** a user opens a deal detail in non-closed state, **when** the page renders, **then** the Close Reason field is not editable (or not visible). **Given** a user initiates Close Deal, **when** the close form appears, **then** the Close Reason field is clearly labeled and required. |

### Could Have — nice to have, defer if needed

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-DEAL-020 | The Deal Detail page shows the HUF equivalent of the deal value (for EUR and USD deals) alongside the original currency value, using the most recent MNB rate. | **Given** a deal has value 1000 EUR, **when** the Deal Detail page loads, **then** the displayed value includes both "1 000 EUR" and its HUF equivalent (e.g., "≈ 395 000 HUF"). |
| PRD-DEAL-021 | The Activity type icons (note, email, call, meeting) are visually distinct in the activity timeline to allow quick scanning. | **Given** the activity timeline renders, **when** activities of different types are shown, **then** each type has a distinct visual treatment (icon or color). |
| PRD-DEAL-022 | A deal can be duplicated — creating a new deal pre-filled with the same field values (except stage, which resets to lead, and dates, which are cleared). | **Given** a user activates "Duplicate Deal," **when** the action completes, **then** a new deal is created with the same title (prefixed "Copy of"), contact, and non-date fields, with stage set to lead. |

### Will Not Have — explicit scope boundary for this release

| Item | Reason for exclusion |
|------|---------------------|
| Configurable pipeline stages | Pipeline stages are fixed (lead, qualified, proposal, negotiation, won, lost). Per BRD assumption A-6. Stage configurability requires schema and validation redesign. |
| Multiple contacts per deal | Each deal is linked to exactly one contact. Multi-contact deals are a post-MVP consideration. |
| Deal templates | Not a current use case. Deferred. |
| Email/calendar integration on deals | BRD explicitly excludes email and calendar sync from this release. |
| Activity visibility permissions (private activities) | All activities are visible to all authenticated users. No per-activity privacy controls. |
| Bulk deal edit | Not a current use case for a team of 2-5. |

## 6. Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| PRD-DEAL-NFR-001 | Performance | The Deal Detail page with up to 50 activities loads in under 2 seconds. | Measured by page load time in a test environment seeded with 50 activities on a single deal. |
| PRD-DEAL-NFR-002 | Data integrity | Owner and Next Step Owner fields enforce foreign key constraints to the users table at the database level. | Verified by attempting to insert a deal with a non-existent user ID; the database rejects it. |
| PRD-DEAL-NFR-003 | Data integrity | Stage history records are immutable after creation. No update or delete operation exists for stage history entries. | Code review and API audit confirm no update/delete endpoint exists for stage_history table. |
| PRD-DEAL-NFR-004 | Accessibility | All deal forms meet WCAG 2.1 AA. Stage picker is keyboard navigable with accessible labels. | No critical violations in automated accessibility audit. |
| PRD-DEAL-NFR-005 | Auditability | 100% of stage transitions — including those executed by the AI agent via MCP tools — are recorded in the stage history table with a non-null actor and timestamp. | Integration test: execute stage transitions via both the UI and MCP tool; verify stage_history table has entries for both. |

## 7. Success Metrics

| Metric | Baseline | Target | How measured |
|--------|---------|--------|-------------|
| Stage transition history completeness | 0% of transitions recorded (legacy) | 100% of transitions recorded with actor and timestamp | Query on stage_history table: count(transitions without actor) = 0 |
| Deal fields accessible from UI | ~50% of fields editable from UI (create form, read-only detail) | 100% of deal fields editable from the Deal Detail page | Manual review of all 15 deal fields against edit form |
| Post-call activity logging time | Estimated >5 minutes (requires API/MCP bypass) | Under 30 seconds from Deal Detail page | Time-on-task in smoke test |
| Multi-currency deals in pipeline | 0 (HUF only) | Pipeline KPI correctly converts and aggregates HUF, EUR, USD deals | Test with seeded EUR + USD deals; verify KPI sum matches manual calculation |

## 8. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Can activities be linked to both a contact AND a deal simultaneously, or is it one-or-the-other? (Legacy whitepaper says "contact and/or deal".) | juhaszj | TSD phase | Open — preserve legacy OR behavior |
| 2 | Should activity edit be restricted to the original author only, or can any authenticated user edit any activity? | juhaszj | Before TSD | Resolved by ADR-6 — any user may edit any activity. |
| 3 | What is the maximum number of activities per deal for pagination? Legacy caps at 20 from the API; is this still appropriate? | juhaszj | TSD phase | Open — suggest 50 per page |
| 4 | How should "source: human vs. agent" be determined for stage history entries when the MCP tool is called by the AI agent? | juhaszj | TSD phase | Open — TSD decision; likely: detect from session context (MCP session vs. user session) |

## 9. Out of Scope (explicit)

- Configurable pipeline stages — reason: fixed six-stage pipeline per BRD A-6.
- Multiple contacts per deal — reason: 1 deal : 1 contact is the defined data model.
- Email or calendar sync on activities — reason: BRD explicitly excludes this release.
- Stage transition guards (e.g., "cannot skip stages") — reason: business explicitly confirmed free movement between stages; transition logging fulfills the audit need without restricting movement.
- Activity commenting or threading — reason: single-level activity records are sufficient.

## 10. Dependencies

- PRD-AUTH: Users table must be populated for Owner, Next Step Owner, and stage history actor fields to function.
- PRD-REPORTS: Multi-currency aggregation logic (MNB exchange rate) is shared between pipeline KPIs and the Reports module.

## 11. Next Steps

- [x] Resolve activity edit permissions question (author-only vs. all users) — resolved by ADR-6
- [ ] TSD: Stage history table schema — due TBD
- [ ] TSD: Activity CRUD API design — due TBD
- [ ] TSD: Currency conversion integration point between Deals and Reports — due TBD
- [ ] PRD review — due TBD
- [ ] PRD approval — due TBD

---

*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-13 | juhaszj | Initial draft |
