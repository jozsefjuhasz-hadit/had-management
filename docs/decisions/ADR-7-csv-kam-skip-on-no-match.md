---
doc-type: ADR
project: had-management
adr-number: 7
title: CSV import skips KAM field when no matching user is found; logs a warning per row
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-contacts.md
  - PRD-contacts.md
superseded-by: ~
---

# ADR-7: CSV import skips KAM field when no matching user is found; logs a warning per row

## Status
`proposed`

## Context

The CSV import (beta) feature accepts a KAM column. In the legacy system, KAM was a free-text string. In the rewrite, KAM is a foreign key to the `users` table (`kam_user_id`). A CSV file from legacy or from an external source will contain name strings, not user IDs.

PRD-CON Open Question 3 asks for a TSD decision. PD-6 identifies three options: skip KAM on import (safest), attempt name-match to users table (fragile), or require the CSV to use email address for matching.

The CSV import is in beta with a cap of 100 rows. The user base is a 2-5 person sales team importing trade show contact lists. KAM assignment can always be done manually after import from the contact detail page.

## Decision

During CSV import, if a row contains a KAM column value (any string), the system attempts to match it against `users.email` (case-insensitive) first, then `users.display_name` (case-insensitive, exact match). If a unique match is found, `kam_user_id` is set. If no match or multiple matches are found, `kam_user_id` is left null for that row. A per-row warning is added to the import result: "KAM '[value]' not matched to a user — KAM set to unassigned."

The import does not fail or skip the row due to an unmatched KAM. The contact is created without a KAM assignment.

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| Skip KAM entirely on all imports (always null) | Simplest implementation; no name-matching logic | Users lose any KAM context from their CSV; must manually set KAM for every imported contact | Rejected — wastes available mapping data when names match |
| Require email address in CSV for KAM matching | Reliable, unambiguous matching | Existing CSV files from legacy or external sources use name strings; would require users to reformat every import file | Rejected — places burden on user; breaks beta usability |
| **Match on email then display_name; skip on no match** | Best-effort matching preserves KAM data where possible; no row failure for unmatched KAM; clear per-row warning | Name-matching is still fragile (multiple users with similar names); requires case-insensitive comparison logic | **Chosen** — best-effort is better than no-effort; skip-on-fail is safe; warning is explicit |

## Consequences

**Positive:**
- Contacts are never blocked from import due to a KAM mismatch
- Users who include their email addresses in the KAM column get automatic matching
- Import result clearly shows which rows had unmatched KAMs

**Negative / Trade-offs:**
- Name-match is fragile: "Péter Kovács" vs "Kovács Péter" will not match
- If two users have the same display name, the match is skipped (both → null) to avoid incorrect assignment
- The matching logic adds test surface area

**Risks:**
- A user may not notice the per-row warning and assume KAM was set when it was not; this is mitigated by the import summary count showing "X rows with KAM warnings"

## Review Trigger

- If the CSV import is promoted from beta to stable and KAM assignment accuracy becomes a quality concern
- If the team standardizes on an email-based KAM column convention in their CSV exports

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
