---
doc-type: TSD
project: had-management
feature: Authentication & Authorization
version: 1.0
status: approved
date: 2026-03-16
author: tech-lead
approved-by: juhaszj
related-docs:
  prd: PRD-auth.md
  implements: [PRD-AUTH-001, PRD-AUTH-002, PRD-AUTH-003, PRD-AUTH-004, PRD-AUTH-005, PRD-AUTH-006, PRD-AUTH-010, PRD-AUTH-011, PRD-AUTH-012, PRD-AUTH-020, PRD-AUTH-021]
---

# TSD: Authentication & Authorization

## 1. Overview

Implements Microsoft Entra ID SSO authentication via the Supabase Auth Azure provider. Replaces the legacy mock auth entirely. All routes are protected by Next.js middleware. A `users` table is the identity source of truth for all modules. RBAC is binary: admin or user.

Implements: PRD-AUTH-001 through PRD-AUTH-012, PRD-AUTH-020, PRD-AUTH-021.

Key decisions: see ADR-1 (Supabase Auth Azure provider), ADR-2 (single-tenant), ADR-3 (AI agent user record).

## 2. Tech Stack

| Layer | Technology | Version | Justification / ADR |
|-------|-----------|---------|---------------------|
| Auth provider | Supabase Auth (Azure OAuth) | Latest Supabase SDK | ADR-1: sole auth layer; no direct MSAL calls |
| Identity provider | Microsoft Entra ID | Azure AD v2 endpoints | PRD-AUTH-002 |
| Session transport | Supabase Auth session cookie (HttpOnly, Secure, SameSite=Lax) | — | Supabase sets by default; server-side only |
| Route protection | Next.js Middleware (`middleware.ts`) | Next.js 15 | Server-side session check on every request |
| Session validation | `@supabase/ssr` package `createServerClient` | Latest | Server Components and API routes |
| ORM | Drizzle ORM | Latest | Stack standard; schema source of truth |

## 3. Data Model

### Entity: users

**Purpose:** Application identity layer. Every human who authenticates via Entra ID gets exactly one record. The AI agent has one reserved record (ADR-3). Foreign key target for all actor attribution fields across the system.

```
Fields:
  id:              uuid          — PRIMARY KEY, default gen_random_uuid()
  entra_id:        text          — UNIQUE, NULLABLE — Microsoft Entra OID/sub claim; null only for the AI agent record
  email:           text          — NOT NULL, UNIQUE — from Entra ID token; non-routable placeholder for agent record
  display_name:    text          — NOT NULL — from Entra ID token profile
  role:            text          — NOT NULL, DEFAULT 'user' — enum: 'admin' | 'user'
  is_agent:        boolean       — NOT NULL, DEFAULT false — true only for the HAD Agent record (ADR-3)
  last_login:      timestamptz   — NULLABLE — updated on every successful OAuth callback
  created_at:      timestamptz   — NOT NULL, DEFAULT now()

Primary key: id
Indexes:
  entra_id — reason: OAuth callback lookup by Entra OID (unique, frequent)
  email    — reason: CSV import KAM matching (ADR-7), user picker search
Relations:
  referenced by contacts.kam_user_id
  referenced by contacts.referred_by_user_id
  referenced by deals.owner_id
  referenced by deals.next_step_owner_id
  referenced by stage_history.actor_user_id
  referenced by activities.created_by_user_id
  referenced by activities.edited_by_user_id
```

**Access rules:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| read (own record) | user, admin | authenticated; own `id` only for non-admin |
| read (all users) | admin | role = admin |
| read (user picker list) | user, admin | authenticated; returns `id`, `display_name`, `email` only; excludes `is_agent = true` records from human pickers |
| write (role field) | admin | role = admin; cannot demote self if last admin (PRD-AUTH-012) |
| write (last_login) | system | OAuth callback only — not a user-facing operation |
| delete | none | no delete operation; deprovisioning via Entra ID access revocation only |

## 4. API / Operations

### Operation: GET /auth/callback (Supabase OAuth callback)
- **Trigger:** Microsoft redirects back to the application after successful Entra ID authentication
- **Input:** `code` query param (OAuth authorization code); `state` param (PKCE / CSRF)
- **Validation:** Supabase Auth SDK validates the code exchange server-side; verifies state param matches session
- **Authorization:** Not applicable — this is the auth establishment endpoint
- **Business logic:**
  1. Call `supabase.auth.exchangeCodeForSession(code)` — obtains access token and user identity
  2. Verify `iss` claim matches the expected single tenant ID (ADR-2); reject with 401 if mismatch
  3. Extract `oid` (Entra OID), `email`, `name` from the identity token
  4. Upsert `users` table: `ON CONFLICT (entra_id) DO UPDATE SET last_login = now()`; if new record, `role = 'user'`
  5. Redirect to the originally requested URL (stored in `state` / cookie before redirect) or `/` as fallback
- **Output:** HTTP 302 redirect
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Wrong tenant | `iss` claim does not match expected tenant | 302 redirect to `/login?error=unauthorized_tenant` |
  | Code exchange failure | Supabase Auth rejects the code | 302 redirect to `/login?error=auth_failed` |
  | Network failure | Supabase Auth service unavailable | 302 redirect to `/login?error=service_unavailable` |

### Operation: POST /auth/signout
- **Trigger:** User clicks "Sign out"
- **Input:** None (authenticated session cookie)
- **Validation:** Valid session must exist
- **Authorization:** Must be authenticated
- **Business logic:**
  1. Call `supabase.auth.signOut()` — invalidates the server-side session
  2. Clear the session cookie
  3. Optionally redirect to Microsoft logout endpoint for full single logout (PRD-AUTH-020, Could Have)
  4. Redirect to `/login`
- **Output:** HTTP 302 redirect to `/login`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | No session | signOut called without valid session | 302 redirect to `/login` (idempotent) |

### Operation: Next.js Middleware — route protection
- **Trigger:** Every HTTP request to the application
- **Input:** Request URL + session cookie
- **Validation:** Session cookie presence and validity via `supabase.auth.getUser()`
- **Authorization:** Authenticated session required for all routes except `/login`, `/auth/callback`, `/auth/error`
- **Business logic:**
  1. For public routes (`/login`, `/auth/*`): pass through
  2. For all other routes: call `supabase.auth.getUser()` — validates JWT signature server-side
  3. If no valid session: redirect to `/login?redirect=[original-url]`
  4. For admin-only routes (`/admin/*`): additionally check `users.role = 'admin'`; return 403 if not admin
  5. Attach `userId` to request context for downstream use
- **Output:** Next response (pass-through or redirect)
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | No session (page route) | Unauthenticated request to protected page | 302 redirect to `/login?redirect=[url]` |
  | No session (API route) | Unauthenticated request to `/api/*` | 401 JSON: `{"error": "Unauthorized"}` |
  | Insufficient role (page) | User without admin role accesses `/admin/*` | 403 page: "Access denied" |
  | Insufficient role (API) | User without admin role calls admin API | 403 JSON: `{"error": "Forbidden"}` |

### Operation: PATCH /api/users/[id]/role
- **Trigger:** Admin changes a user's role from the user management page
- **Input:** `{ role: "admin" | "user" }`
- **Validation:** `role` must be one of the two valid values; target user `id` must exist
- **Authorization:** Caller must have `role = admin`
- **Business logic:**
  1. Verify caller is admin
  2. If `role = 'user'` and target is the caller themselves: count admins — reject if only 1 admin exists (PRD-AUTH-012)
  3. Update `users.role` for the target user
  4. Return updated user record
- **Output:** `200 { id, email, display_name, role, last_login }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Last admin demote | Only 1 admin exists and caller demotes themselves | 422 `{"error": "LAST_ADMIN", "message": "At least one admin must remain"}` |
  | User not found | Target user ID does not exist | 404 `{"error": "NOT_FOUND"}` |
  | Unauthorized | Caller is not admin | 403 `{"error": "Forbidden"}` |

### Operation: GET /api/users
- **Trigger:** Admin views user management page
- **Input:** None
- **Validation:** None
- **Authorization:** Caller must have `role = admin`
- **Business logic:**
  1. Query all users where `is_agent = false`, ordered by `display_name`
  2. Return list with fields: `id`, `display_name`, `email`, `role`, `last_login`, `created_at`
- **Output:** `200 { users: [...] }`

### Operation: GET /api/users/picker
- **Trigger:** Any form that renders a user picker (KAM, owner, next step owner, referred by)
- **Input:** Optional `search` query string
- **Validation:** None
- **Authorization:** Any authenticated user
- **Business logic:**
  1. Query users where `is_agent = false`, optionally filtered by `display_name ILIKE '%search%'` or `email ILIKE '%search%'`
  2. Return minimal projection: `id`, `display_name`, `email`
- **Output:** `200 { users: [{ id, display_name, email }] }`

## 5. Auth & Permissions Matrix

| Role | Operation | Allowed | Condition |
|------|-----------|---------|-----------|
| unauthenticated | any page route | No | Redirected to /login |
| unauthenticated | any API route | No | 401 Unauthorized |
| user | all non-admin pages | Yes | Valid session |
| user | /admin/* pages | No | 403 Access denied |
| user | change own role | No | 403 |
| user | change other user role | No | 403 |
| admin | all pages including /admin/* | Yes | Valid session + role=admin |
| admin | change any user role | Yes | Cannot demote self if last admin |
| admin | view all users | Yes | Always |
| system | OAuth callback, session upsert | Yes | Internal — not user-initiated |

## 6. Non-Functional Implementation

| Requirement | Implementation approach | Verification method |
|-------------|------------------------|-------------------|
| PRD-AUTH-NFR-001 Security: no secrets in client | All auth logic in Server Components and API routes; no auth state in client bundle; secrets in Vercel environment variables only | Manual audit of client bundle; grep for env var names in client code |
| PRD-AUTH-NFR-002 HTTPS only | Vercel enforces HTTPS; session cookies have `Secure` flag set by Supabase Auth | Verify cookie flags in browser DevTools; Vercel deployment config review |
| PRD-AUTH-NFR-003 Redirect roundtrip < 5s | Microsoft-hosted login page performance; not application-controlled. Application-side: auth callback and DB upsert target < 500ms | Measure callback handler DB upsert time in staging |
| PRD-AUTH-NFR-004 MS unavailability messaging | Catch `supabase.auth.signInWithOAuth` errors; render `/auth/error` page with "Authentication service unavailable" | Simulate by pointing to invalid OAuth endpoint in local test |
| PRD-AUTH-NFR-005 Accessibility | Login page: single "Sign in with Microsoft" button with `aria-label`; keyboard focusable | Run axe against `/login`; zero critical violations |
| PRD-AUTH-NFR-006 Supabase Auth only | Code review confirms zero MSAL imports | `grep -r 'msal' src/` returns no results |
| Session expiry (PRD-AUTH-010) | Configure Supabase Auth `JWT expiry` to 8 hours; `supabase.auth.getUser()` validates expiry on every middleware check | Test: create session, wait for expiry, verify redirect to login |

## 7. Testing Strategy

| Type | Tool | Scope | What is tested |
|------|------|-------|----------------|
| Unit | Vitest | `lib/auth/` | Session validation helper, last-admin guard logic, tenant ID verification |
| Integration | Vitest + Supabase test client | API routes `/api/users`, `/api/users/[id]/role` | Role change with last-admin guard; user picker query; 401 on unauthenticated |
| E2E | Playwright | Flow 1 (first login), Flow 3 (protected route redirect), Flow 4 (logout), Flow 5 (admin role change) | PRD-AUTH-001 acceptance: unauthenticated redirect; PRD-AUTH-004: first-login user creation; PRD-AUTH-005: admin-only access; PRD-AUTH-012: last-admin guard |

Mapping to PRD acceptance criteria:
- PRD-AUTH-001 → E2E: navigate to `/contacts` without session → assert redirect to `/login?redirect=/contacts`
- PRD-AUTH-001 → Integration: `GET /api/contacts` without session → assert 401
- PRD-AUTH-004 → E2E (mocked OAuth): first login → assert 1 user record in DB with correct fields
- PRD-AUTH-005 → E2E: user role navigates to `/admin/users` → assert 403

## 8. Migration / Deployment Notes

- Breaking changes: yes — replaces mock auth entirely; no client-side auth state survives
- Migration script required: yes — `scripts/seed-agent-user.ts` creates the HAD Agent user record (ADR-3) with a fixed UUID stored in `AGENT_USER_ID` environment variable
- Tested on staging: no — pending environment provisioning
- Rollback plan: no graceful rollback; this is a full auth replacement. Rollback = revert to previous deployment
- Feature flag required: no — auth is always on; cannot be partially enabled

**Deployment prerequisites (must complete before any auth test):**
1. Supabase project provisioned (BRD D-1)
2. Microsoft Entra ID app registration created (BRD D-2) — single-tenant (ADR-2)
3. Supabase Auth Azure provider configured with tenant ID, client ID, client secret (BRD D-3)
4. `AGENT_USER_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set in Vercel environment

## 9. Open Technical Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Confirm the exact Entra ID tenant ID to use in single-tenant configuration (ADR-2) | juhaszj | Before implementation |
| 2 | Verify Supabase Auth session cookie SameSite setting — `Lax` is expected default but must be confirmed in Supabase project settings | juhaszj | Before E2E testing |
| 3 | Confirm whether Vercel Pro plan is required for the deployment (needed for Vercel Cron in Reports, not Auth, but needed before final deployment checklist) | juhaszj | Before deployment |

## 10. ADRs Triggered

- [x] ADR-1: Supabase Auth Azure provider — written
- [x] ADR-2: Single-tenant Entra ID — written
- [x] ADR-3: AI agent users table record — written

## 11. Next Steps

- [ ] TSD review — awaiting human approval
- [ ] Azure app registration — owner: juhaszj
- [ ] Supabase Auth Azure provider configuration — owner: juhaszj
- [ ] Seed script implementation — owner: developer
- [ ] Implementation begins — after TSD approval

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
