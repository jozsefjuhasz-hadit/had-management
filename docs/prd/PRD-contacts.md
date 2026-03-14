---
status: draft
last-updated: 2026-03-13
owner: juhaszj
doc-type: PRD
project: had-management
feature: Contacts — CRUD + CSV Import (Beta)
version: 1.0
approved-by: pending
related-docs:
  brd: BRD-had-management.md
  implements: [S-2, S-3, BO-5]
---

# PRD: Contacts — CRUD + CSV Import (Beta)

## 1. Overview

The Contacts module is the foundational data layer of the CRM. It manages the people and organizations the sales team works with. Every deal must be linked to a contact, so contacts are created before or alongside deals. In the rewrite, the module gains real referential integrity for the KAM field (replacing a free-text field with a user picker backed by the users table), soft-delete support, full inline editing from the contact detail page, and an activity timeline. CSV import is retained from the legacy system but remains in beta with clear user expectations set about its limitations.

## 2. Problem Statement

The legacy Contacts module has two structural problems. First, the KAM (Key Account Manager) field is free text — users type a colleague's name, but no validation ensures it matches a real user. This causes silent data quality degradation: filtering by KAM produces inconsistent results when the same person's name has been entered in multiple spellings. Second, the contact detail page has no activity timeline, meaning users cannot see the history of interactions with a contact without navigating away from the page.

For junior users (Szabó Ágnes persona), the create form's ambiguous field labels slow down onboarding and lead to skipped or incorrectly filled fields.

Addresses: S-2, S-3, BO-5, debt items D-1, D-3, UX-4, UX-6, UX-10, F-4

## 3. Users & Personas

| Persona | Who they are | Primary goal | Current frustration |
|---------|-------------|-------------|-------------------|
| Szabó Ágnes (Sales Rep) | Junior-to-mid sales representative | Create a contact quickly after meeting a new lead, without needing to ask what to put in each field | KAM field is free text with no guidance; she does not know if it means her own name or her manager's; no confirmation after creation |
| Kovács Péter (Account Manager) | Senior account manager with 10-20 active deals | See all interactions with a contact on one page; filter contacts by his own KAM assignment reliably | No activity timeline on contact detail; KAM filter breaks because of free-text spelling variations |
| Juhász János (IT Admin) | System owner driving the rewrite | Ensure KAM and "Connection" fields have referential integrity to the users table | Both fields are free text with no validation or referential link |

## 4. User Flows

### Flow 1: Create a new contact

**Trigger:** Szabó Ágnes meets a new business contact and wants to record them in the system.

1. Ágnes navigates to the Contacts list.
2. She clicks the "New Contact" action.
3. A create form appears with the following fields: name (required), title, email, phone, company, source (dropdown), KAM (user picker), Connection (user picker), notes.
4. The form clearly marks required vs. optional fields.
5. She fills in name and any other fields she knows.
6. For the KAM field, she selects from a dropdown of active users. Her own name appears as the default if she is the responsible account manager.
7. She submits the form.
8. The system validates: name is non-empty, email format is valid if provided.
9. On success, the contact detail page opens with a visible confirmation that the contact was created.
10. On validation failure, the form remains open with field-level error messages.

**Result:** A new contact record exists with a proper KAM reference. Ágnes sees clear confirmation.

**Error states:**
- Name is empty → Form highlights the field and shows "Name is required."
- Email format is invalid → Field is highlighted: "Enter a valid email address."
- Duplicate email detected (same as an existing non-archived contact) → Warning is shown: "A contact with this email already exists." User can proceed or cancel.

---

### Flow 2: View and edit a contact

**Trigger:** Péter opens an existing contact to review their details and update the KAM assignment.

1. Péter searches for or browses to the contact in the Contacts list.
2. He clicks the contact row to open the Contact Detail page.
3. The page shows: contact info fields, metric cards (active deals count, open pipeline value, won value), a list of linked deals, and an activity timeline in reverse chronological order.
4. Péter clicks "Edit" (or activates inline editing on a field).
5. Fields become editable. KAM shows a user picker populated from the users table.
6. He updates the KAM assignment and saves.
7. The page refreshes with updated values. A success indication is shown.

**Result:** Contact is updated. KAM is now a proper user reference.

**Error states:**
- Save fails due to a network error → Error message shown; values remain in edit state so no input is lost.

---

### Flow 3: Archive a contact

**Trigger:** A contact is no longer relevant; the team wants to remove them from active views without permanent deletion.

1. Péter opens the contact detail page.
2. He activates the "Archive" action (behind a confirmation step).
3. The system marks the contact as archived.
4. The contact no longer appears in the Contacts list or in deal contact pickers.
5. Linked deals remain intact but are visually flagged as belonging to an archived contact.

**Result:** Contact is soft-deleted; data is preserved but removed from active views.

**Error states:**
- Archiving a contact with active (non-won, non-lost) deals → User is warned: "This contact has X active deals. Archiving will not affect those deals." User must confirm.

---

### Flow 4: CSV import (beta)

**Trigger:** Ágnes has a spreadsheet of new contacts from a trade show and wants to bulk-import them.

1. She navigates to the Contacts list and clicks "Import CSV (Beta)".
2. A banner explains what "Beta" means: this feature may have edge cases; review the import summary carefully before confirming.
3. Step 1 — Upload: She selects a CSV file. The system validates the file is CSV format and does not exceed 100 rows.
4. Step 2 — Preview: The system shows a table of parsed rows. Duplicate contacts (matched by email, case-insensitive) are flagged with their current record shown side-by-side. For each duplicate she selects: Insert as new / Overwrite existing / Skip. A "Skip all duplicates" bulk action is available.
5. Step 3 — Confirm: She reviews a summary (X new records, Y overwrites, Z skipped) and clicks "Import."
6. The system processes the batch. Each row is processed and any per-row errors are reported.
7. Step 4 — Result: A summary shows how many succeeded, failed, and were skipped. Failed rows are listed with the reason.

**Result:** Contacts are imported. Ágnes has a clear record of what happened to each row.

**Error states:**
- File is not CSV → Error before preview: "Only CSV files are accepted."
- File exceeds 100 rows → Error before preview: "Import is limited to 100 rows. Your file has X rows."
- A row fails to insert (e.g., missing name) → That row is skipped and listed in the result as failed with reason; other rows proceed.

---

## 5. Feature Requirements (MoSCoW)

### Must Have — launch blocker

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-CON-001 | The Contacts list displays all active (non-archived) contacts with the following columns: name, title, company, email, source, KAM (display name), last interaction date. The list supports free-text search, filter by company, filter by source, and sorting by name, company, and last interaction. | **Given** the contacts list is loaded, **when** a user enters a search term, **then** only contacts matching the term in any visible field are shown. **Given** contacts exist with different sources, **when** the user filters by "referral," **then** only contacts with source "referral" are shown. |
| PRD-CON-002 | A contact create form collects: name (required), title, email, phone, company, source (from fixed list: email, referral, linkedin, other), KAM (user picker from users table), Connection (user picker from users table), notes. On submission, required field violations and invalid email format are shown as field-level errors. | **Given** a user submits the create form with an empty name field, **when** the form is validated, **then** the name field is highlighted and an error message "Name is required" is shown; the form is not submitted. **Given** a user submits the form with a valid name, **when** the record is saved, **then** the user lands on the new contact's detail page with a success confirmation visible. |
| PRD-CON-003 | The KAM field on both the create form and the edit form is a user picker — a dropdown or searchable selector populated from the application's users table. Free text is not accepted for this field. | **Given** a user opens the contact create or edit form, **when** the KAM field is displayed, **then** the field shows a selectable list of active application users; the user cannot type an arbitrary string into this field. |
| PRD-CON-004 | The Contact Detail page displays all contact fields, metric cards (active deals count, open pipeline value in HUF, won value in HUF), a list of linked deals, and an activity timeline in reverse chronological order (type, content, timestamp, author). | **Given** a contact has 3 linked activities, **when** the Contact Detail page loads, **then** all 3 activities appear in the timeline section in reverse chronological order, each showing the activity type, content, timestamp, and the name of the user who created it. |
| PRD-CON-005 | All contact fields are editable from the Contact Detail page. The user can edit fields and save without navigating away. | **Given** a user opens Contact Detail and activates edit mode, **when** they modify a field and save, **then** the updated value is persisted and the success state is shown; the user remains on the Contact Detail page. |
| PRD-CON-006 | Contacts support soft deletion (archive only). Archived contacts do not appear in the Contacts list, contact pickers, or search results. Linked deals are not deleted when a contact is archived. | **Given** a contact is archived, **when** any user views the Contacts list or a deal's contact picker, **then** the archived contact does not appear. **Given** a contact with linked deals is archived, **when** the linked deals are viewed, **then** they remain intact and accessible. |

### Should Have — important but not blocking launch

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-CON-010 | An activity can be created directly from the Contact Detail page without navigating to a separate page. The activity creation form is accessible from a prominent action on the Contact Detail page. | **Given** a user is on the Contact Detail page, **when** they click "Log Activity," **then** an activity creation form appears (inline or as a modal) pre-linked to the current contact; submitting the form adds the activity to the timeline without a full page reload. |
| PRD-CON-011 | The "Connection" field (UI label: "Referred by") on the contact create and edit forms is a user picker from the users table, identical in behavior to the KAM user picker (PRD-CON-003). It records which internal user referred or introduced this contact. | **Given** a user opens the contact create or edit form, **when** the "Referred by" field is displayed, **then** the field shows a selectable list of active application users. |
| PRD-CON-012 | The Contacts list supports an archived contacts toggle. When enabled, archived contacts are shown in the list with a visual "Archived" indicator; they cannot be edited but can be unarchived. | **Given** a user activates the "Show archived" toggle, **when** the list refreshes, **then** archived contacts appear with a distinct visual treatment; an "Unarchive" action is available on each archived contact row. |

### Could Have — nice to have, defer if needed

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-CON-020 | When creating a new deal from the Contact Detail page, the contact field is pre-filled with the current contact. | **Given** a user clicks "New Deal" from a Contact Detail page, **when** the deal create form opens, **then** the contact field is pre-populated and cannot be changed. |
| PRD-CON-021 | The "Is Primary" flag on a contact is displayed and editable from the Contact Detail page, indicating whether this is the primary contact at their company. | **Given** a user edits a contact, **when** they toggle the Is Primary flag, **then** the change is saved and the flag is visible on the Contact Detail page. |

### Will Not Have — explicit scope boundary for this release

| Item | Reason for exclusion |
|------|---------------------|
| Hard deletion of contacts | Business rule: soft delete only. Customer data is preserved for historical deal records. Permanent deletion can be a post-MVP admin function. |
| Contact merge (combine duplicate records) | Useful but complex; deferred to post-MVP. The CSV import duplicate detection mitigates the creation of new duplicates. |
| Company as a separate entity (Account object) | The system stores company as a free-text field on the contact. A full Account hierarchy is out of scope per BRD. |
| Custom contact fields | Not needed for the current team size and use case. |
| CSV export of contacts | Not included in the BRD scope. Contacts are readable via the UI and MCP tools. |
| Full-text search (ranked, tokenized) | BRD OS-4: LIKE-based search is adequate for the dataset size. |

## 6. Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| PRD-CON-NFR-001 | Performance | The Contacts list with up to 500 records loads in under 2 seconds. | Measured by page load time in a test environment seeded with 500 contacts. |
| PRD-CON-NFR-002 | Data integrity | The KAM field enforces a foreign key constraint to the users table at the database level. An invalid user ID cannot be saved. | Verified by attempting to insert a contact with a non-existent user ID; the database rejects it with a constraint violation. |
| PRD-CON-NFR-003 | Accessibility | All form fields have accessible labels. Error messages are linked to their fields via ARIA attributes. WCAG 2.1 AA. | No critical violations in automated accessibility audit (axe or equivalent). |
| PRD-CON-NFR-004 | Usability | Required vs. optional fields are visually distinguished in all contact forms. | All required fields display a visual marker; user testing (or inspection) confirms no ambiguity. |

## 7. Success Metrics

| Metric | Baseline | Target | How measured |
|--------|---------|--------|-------------|
| KAM field data consistency | Unknown number of spelling variants per person (legacy) | Zero non-user-table entries in the KAM field | Count of NULL or non-FK KAM values in database |
| Contact detail page completeness | Activity timeline not rendered (legacy) | 100% of linked activities visible on Contact Detail | Manual verification with seeded data |
| Contact creation error rate | Not measured (legacy) | < 5% of create form submissions result in user-facing errors in the first month | Application error log |
| CSV import success rate | Not measured (legacy) | > 90% of valid rows successfully imported in beta test runs | Import result summary log |

## 8. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Should "Connection" be renamed to a more descriptive Hungarian UI label? The whitepaper uses "Connection" but the target audience may find it ambiguous. | juhaszj | Before TSD | **RESOLVED 2026-03-13**: UI label = "Referred by" (DB column: `referred_by_user_id`). Semantics: which internal user referred this contact. |
| 2 | Should the duplicate detection in CSV import also check phone number, or is email-only sufficient? | juhaszj | Before TSD | Open — default to email-only per legacy behavior |
| 3 | What is the correct behavior when importing a contact via CSV and the KAM column contains a name string (not a user ID)? | juhaszj | TSD phase | Open — TSD decision; likely: skip KAM on import if no match found, log warning |

## 9. Out of Scope (explicit)

- Hard (permanent) deletion of contacts — reason: soft delete is the only permitted deletion mechanism; historical data integrity.
- Contact ownership transfer in bulk — reason: individual editing sufficient for team size.
- External contact sync (Outlook contacts, LinkedIn) — reason: BRD explicitly excludes email/calendar sync.
- Advanced search (full-text, ranked) — reason: BRD OS-4.
- Custom fields — reason: current team has no identified need.

## 10. Dependencies

- PRD-AUTH: Users table must exist and be populated before KAM and Connection user pickers are functional.
- PRD-AUTH-004: User records must be present for the picker to return results.

## 11. Next Steps

- [ ] Clarify "Connection" field naming in Hungarian UI — owner juhaszj — before TSD
- [ ] TSD: KAM and Connection FK schema definition — due TBD
- [ ] TSD: CSV import pipeline design — due TBD
- [ ] PRD review — due TBD
- [ ] PRD approval — due TBD

---

*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-13 | juhaszj | Initial draft |
