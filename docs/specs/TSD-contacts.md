---
doc-type: TSD
project: had-management
feature: Contacts — CRUD + CSV Import (Beta)
version: 1.0
status: draft
date: 2026-03-14
author: tech-lead
approved-by: pending
related-docs:
  prd: PRD-contacts.md
  implements: [PRD-CON-001, PRD-CON-002, PRD-CON-003, PRD-CON-004, PRD-CON-005, PRD-CON-006, PRD-CON-010, PRD-CON-011, PRD-CON-012]
---

# TSD: Contacts — CRUD + CSV Import (Beta)

## 1. Overview

Implements the Contacts module with referential integrity for KAM and "Referred by" (connection) fields as foreign keys to the `users` table, soft-delete (archive) support, an inline-editable detail page, an activity timeline, and a multi-step CSV import in beta. This document answers HOW; the WHAT is in PRD-contacts.md.

Implements: PRD-CON-001 through PRD-CON-012.

Key decisions: ADR-3 (agent user for attribution), ADR-6 (any user may edit activities), ADR-7 (CSV KAM matching strategy).

## 2. Tech Stack

| Layer | Technology | Version | Justification / ADR |
|-------|-----------|---------|---------------------|
| Frontend | Next.js App Router, React, TypeScript | Next.js 15 | Stack standard |
| UI components | shadcn/ui (wrapped, not modified) | Latest | Stack standard |
| Forms | React Hook Form + Zod | Latest | Stack standard; server-side validation also uses Zod schemas |
| Data fetching | Next.js Server Actions + fetch | — | Server-side mutations; avoid client/server type drift |
| ORM | Drizzle ORM | Latest | Stack standard; schema is source of truth for TypeScript types |
| CSV parsing | `papaparse` | Latest | Widely used, zero-dependency CSV parser; browser and server compatible |
| Validation | Zod | Latest | Input validation for all API routes and Server Actions |

## 3. Data Model

### Entity: contacts

**Purpose:** Represents a person or organization the sales team works with. Every deal must be linked to a contact.

```
Fields:
  id:                   uuid        — PRIMARY KEY, default gen_random_uuid()
  name:                 text        — NOT NULL — required at creation
  title:                text        — NULLABLE
  email:                text        — NULLABLE — format validated if provided
  phone:                text        — NULLABLE
  company:              text        — NULLABLE — free-text (no Account entity)
  source:               text        — NULLABLE — enum: 'email' | 'referral' | 'linkedin' | 'other'
  kam_user_id:          uuid        — NULLABLE — FK → users.id; NULL means unassigned
  referred_by_user_id:  uuid        — NULLABLE — FK → users.id; UI label: "Referred by" (PD-2 resolution)
  notes:                text        — NULLABLE
  is_primary:           boolean     — NOT NULL, DEFAULT false
  is_archived:          boolean     — NOT NULL, DEFAULT false — soft delete flag
  archived_at:          timestamptz — NULLABLE — set when archived
  created_by_user_id:   uuid        — NOT NULL — FK → users.id — set on creation
  created_at:           timestamptz — NOT NULL, DEFAULT now()
  updated_at:           timestamptz — NOT NULL, DEFAULT now() — updated on every write

Primary key: id
Indexes:
  name        — reason: search by name (ILIKE); contact list ordering
  company     — reason: filter by company
  source      — reason: filter by source
  kam_user_id — reason: filter contacts by KAM assignment
  is_archived — reason: all list queries filter on this column
  email       — reason: duplicate detection in CSV import (UNIQUE partial index: WHERE is_archived = false)

Relations:
  kam_user_id          → users.id (many-to-one; nullable)
  referred_by_user_id  → users.id (many-to-one; nullable)
  created_by_user_id   → users.id (many-to-one; required)
  referenced by deals.contact_id
  referenced by activities.contact_id
```

**Access rules:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| read (active) | user, admin | authenticated; `is_archived = false` by default |
| read (archived) | user, admin | authenticated; requires explicit `?archived=true` query param |
| create | user, admin | authenticated; `created_by_user_id` set server-side from session |
| update | user, admin | authenticated; no ownership restriction |
| archive (soft delete) | user, admin | authenticated; `is_archived = true`; requires confirmation if active deals exist |
| unarchive | user, admin | authenticated |
| hard delete | none | not permitted in this release |

## 4. API / Operations

### Operation: GET /api/contacts
- **Trigger:** Contacts list page load; user picker (with `?picker=true`)
- **Input:** `search?: string`, `company?: string`, `source?: string`, `sortBy?: string`, `order?: 'asc'|'desc'`, `archived?: boolean`, `page?: number`, `limit?: number`
- **Validation:** `source` must be one of the enum values if provided; `sortBy` must be in allowlist; `limit` max 100
- **Authorization:** Authenticated
- **Business logic:**
  1. Build Drizzle query with `where(is_archived = archived ?? false)`
  2. Apply search: `AND (name ILIKE '%search%' OR company ILIKE '%search%' OR email ILIKE '%search%')`
  3. Apply company and source filters
  4. Apply sort and pagination
  5. For `?picker=true`: return only `id`, `display_name` (`name`), excludes archived
- **Output:** `200 { contacts: [...], total: N, page: N }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Unauthenticated | No valid session | 401 |
  | Invalid sort field | `sortBy` not in allowlist | 422 |

### Operation: POST /api/contacts
- **Trigger:** Contact create form submission
- **Input:** `{ name, title?, email?, phone?, company?, source?, kam_user_id?, referred_by_user_id?, notes?, is_primary? }`
- **Validation (Zod schema):**
  - `name`: non-empty string
  - `email`: valid email format if provided
  - `source`: enum value if provided
  - `kam_user_id`, `referred_by_user_id`: valid UUID format if provided; must exist in `users` table (FK checked at DB level)
- **Authorization:** Authenticated
- **Business logic:**
  1. Validate input with Zod schema; return 422 on failure with field-level errors
  2. Check for duplicate email (case-insensitive) among non-archived contacts; if found return 409 with `{ error: "DUPLICATE_EMAIL", existing_contact_id }` — caller decides to proceed or cancel
  3. Insert contact; set `created_by_user_id` from session user ID
  4. Return the created contact
- **Output:** `201 { contact: {...} }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Missing name | `name` is empty | 422 `{ field: "name", message: "Name is required" }` |
  | Invalid email | email format invalid | 422 `{ field: "email", message: "Enter a valid email address" }` |
  | Duplicate email | email exists on active contact | 409 `{ error: "DUPLICATE_EMAIL", existing_contact_id: "uuid" }` |
  | Invalid FK | `kam_user_id` does not exist in users | 422 `{ field: "kam_user_id", message: "Selected user does not exist" }` |

### Operation: GET /api/contacts/[id]
- **Trigger:** Contact Detail page load
- **Input:** `id` path param (UUID)
- **Validation:** `id` must be a valid UUID
- **Authorization:** Authenticated
- **Business logic:**
  1. Fetch contact by ID; include related: `kam_user` (display_name), `referred_by_user` (display_name), `created_by_user` (display_name)
  2. Fetch linked deals: active deal count, sum of pipeline value (open stages), sum of won value
  3. Fetch activities linked to this contact, reverse chronological, limit 50
  4. Return composite response
- **Output:** `200 { contact, metrics: { active_deal_count, pipeline_value_huf, won_value_huf }, deals: [...], activities: [...] }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Not found | Contact ID does not exist | 404 |
  | Unauthenticated | No session | 401 |

### Operation: PATCH /api/contacts/[id]
- **Trigger:** Contact detail inline edit save
- **Input:** Partial `{ name?, title?, email?, phone?, company?, source?, kam_user_id?, referred_by_user_id?, notes?, is_primary? }`
- **Validation:** Same as POST; name cannot be set to empty if provided
- **Authorization:** Authenticated
- **Business logic:**
  1. Validate partial input
  2. Update only provided fields; set `updated_at = now()`
  3. Return updated contact
- **Output:** `200 { contact: {...} }`
- **Error states:** Same field-level errors as POST

### Operation: POST /api/contacts/[id]/archive
- **Trigger:** User confirms archive action
- **Input:** None
- **Validation:** Contact must exist and not already be archived
- **Authorization:** Authenticated
- **Business logic:**
  1. Check for active deals linked to this contact (stages not won/lost); if found, return 200 with `{ requires_confirmation: true, active_deal_count: N }` — UI shows warning; user must re-submit with `{ confirmed: true }`
  2. On confirmed: set `is_archived = true`, `archived_at = now()`
  3. Return updated contact
- **Output:** `200 { contact: {...} }` or `200 { requires_confirmation: true, active_deal_count: N }`

### Operation: POST /api/contacts/[id]/unarchive
- **Trigger:** User activates unarchive from archived contacts list
- **Input:** None
- **Authorization:** Authenticated
- **Business logic:** Set `is_archived = false`, `archived_at = null`
- **Output:** `200 { contact: {...} }`

### Operation: POST /api/contacts/import/csv
- **Trigger:** CSV import Step 3 (Confirm)
- **Input:** Array of row objects with resolved actions: `[{ row_data: {...}, action: 'insert' | 'overwrite' | 'skip', existing_contact_id?: uuid }]`
- **Validation:** Each row: `name` required; `email` valid format if provided; max 100 rows total
- **Authorization:** Authenticated
- **Business logic:**
  1. Process rows in order; for each row:
     - `skip`: no-op
     - `insert`: call contact create logic (same as POST /api/contacts, skip duplicate check since duplicates were resolved in preview)
     - `overwrite`: call PATCH /api/contacts/[id] with row data
     - For KAM field: apply ADR-7 matching logic (email first, then display_name); if no match: `kam_user_id = null`, add warning to row result
  2. Collect per-row results: `success | failed | skipped`
  3. Return summary
- **Output:** `200 { succeeded: N, failed: N, skipped: N, rows: [{ row_index, status, error?, kam_warning? }] }`

### Operation: POST /api/contacts/import/preview
- **Trigger:** CSV import Step 2 (Preview)
- **Input:** `{ csv_content: string }` — raw CSV content
- **Validation:** Valid CSV; max 100 data rows; file size limit 500KB
- **Authorization:** Authenticated
- **Business logic:**
  1. Parse CSV with papaparse; extract headers and rows
  2. For each row with a non-empty email: check against non-archived contacts (case-insensitive); mark as duplicate with `existing_contact_id` if found
  3. Return parsed rows with duplicate flags; do not write to DB
- **Output:** `200 { rows: [{ fields: {...}, is_duplicate: bool, existing_contact_id?: uuid }], total: N, duplicate_count: N }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Not CSV | File MIME type or content not parseable as CSV | 422 `{ error: "INVALID_FORMAT" }` |
  | Too many rows | More than 100 data rows | 422 `{ error: "TOO_MANY_ROWS", row_count: N }` |

## 5. Auth & Permissions Matrix

| Role | Operation | Allowed | Condition |
|------|-----------|---------|-----------|
| unauthenticated | any | No | 401 |
| user | list, read, create, update | Yes | Authenticated |
| user | archive, unarchive | Yes | Authenticated |
| user | CSV import | Yes | Authenticated |
| user | hard delete | No | Not permitted for anyone |
| admin | all user operations | Yes | Plus user management |

## 6. Non-Functional Implementation

| Requirement | Implementation approach | Verification method |
|-------------|------------------------|-------------------|
| PRD-CON-NFR-001 List < 2s with 500 records | Indexes on `is_archived`, `name`, `company`; pagination default limit 50; no N+1 queries (Drizzle join for KAM user display name) | Load test with 500 seeded contacts; measure TTFB |
| PRD-CON-NFR-002 KAM FK constraint | Drizzle schema: `references: () => users.id`; DB-level FK enforced | Test: attempt insert with non-existent `kam_user_id`; expect DB error caught and returned as 422 |
| PRD-CON-NFR-003 Accessibility | All form fields use shadcn/ui Input with `<label>` or `htmlFor`; errors use `aria-describedby` linking error message ID | Run axe on contact create/edit forms |
| PRD-CON-NFR-004 Required vs optional visual | Required fields marked with `*` and aria-required="true"; visual asterisk in label | Visual inspection + axe audit |

## 7. Testing Strategy

| Type | Tool | Scope | What is tested |
|------|------|-------|----------------|
| Unit | Vitest | CSV KAM matching logic, duplicate detection, archive guard | ADR-7 matching: email match, name match, no match, multiple match; last-active-deal guard |
| Integration | Vitest + Supabase test client | All API routes | PRD-CON-001: list with search/filter; PRD-CON-002: create validation; PRD-CON-003: KAM FK enforcement; PRD-CON-006: archive + deal preservation |
| E2E | Playwright | Flow 1 (create), Flow 2 (edit), Flow 3 (archive), Flow 4 (CSV import) | Full contact lifecycle; CSV import preview + confirm |

PRD acceptance criteria mapping:
- PRD-CON-001 search → Integration: `GET /api/contacts?search=test` returns only matching contacts
- PRD-CON-002 required field → E2E: submit form with empty name → field error visible
- PRD-CON-003 KAM user picker → E2E: KAM field shows dropdown, not free text input
- PRD-CON-004 activity timeline → E2E: seed 3 activities; contact detail shows all 3 in reverse chrono order
- PRD-CON-006 archive/unarchive → Integration: archive contact; verify absent from list; verify linked deals still accessible

## 8. Migration / Deployment Notes

- Breaking changes: yes — KAM field changes from free-text to FK; clean slate (BRD OS-2, no data migration)
- Migration script required: no — fresh schema only (Drizzle `drizzle-kit push` on new Supabase project)
- Tested on staging: no — pending
- Rollback plan: revert deployment
- Feature flag required: no

## 9. Open Technical Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | CSV import: should the `referred_by` column also use email/name matching (ADR-7 pattern), or is it always null on import? | juhaszj | Before implementation |
| 2 | Should the duplicate email constraint be a UNIQUE partial index (`WHERE is_archived = false`) or enforced only in application logic? Recommend: DB partial index for data integrity. | tech-lead | Before implementation (resolved: DB partial index) |

## 10. ADRs Triggered

- [x] ADR-7: CSV import KAM matching strategy — written
- [x] ADR-6: Activity edit permissions — written (affects activities on contact detail)

## 11. Next Steps

- [ ] TSD review — awaiting human approval
- [ ] ADR-7 approval — awaiting human review
- [ ] Implementation begins — after TSD approval

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
