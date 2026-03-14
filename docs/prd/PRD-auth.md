---
status: draft
last-updated: 2026-03-13
owner: juhaszj
doc-type: PRD
project: had-management
feature: Authentication & Authorization
version: 1.0
approved-by: pending
related-docs:
  brd: BRD-had-management.md
  implements: [BO-1, BO-5, S-1]
---

# PRD: Authentication & Authorization (Microsoft Entra ID SSO + RBAC)

## 1. Overview

The HAD Management system requires a real authentication layer to replace the legacy mock login. Every person who accesses the system must be a verified Microsoft 365 user from the company's Entra ID directory. Authentication is handled server-side — no credentials are stored in the application. Authorization distinguishes between an admin role and a standard user role, though both have near-identical access in this release. A users table, populated from the Entra ID directory on first login, becomes the source of truth for user identity across all other modules (KAM fields, deal ownership, stage history attribution).

This feature is a launch blocker. Nothing else in the system is safe to ship without it.

## 2. Problem Statement

The legacy system has no authentication. Any HTTP client that can reach the server can read, create, modify, or delete all CRM data — contacts, deals, and activities — without a credential. Stage transitions carry no actor attribution because there is no concept of "who did this." The AI agent operates anonymously. The sales team's client data is unprotected.

Addresses: BO-1, BO-5, S-1, debt items S-1, S-2, S-3, D-3

## 3. Users & Personas

| Persona | Who they are | Primary goal | Current frustration |
|---------|-------------|-------------|-------------------|
| Juhász János (IT Admin) | Sole developer and system owner | Deploy a system where customer data is protected and all writes are attributable to a named user | Legacy system exposes all data to any HTTP client; no actor is ever logged |
| Kovács Péter (Account Manager) | Daily pipeline user | Access the CRM seamlessly without a separate login each day (SSO experience) | Current mock login is a single button with no security; does not reflect real identity |
| Szabó Ágnes (Sales Rep) | Occasional user of contacts and deals | Log in without needing a separate password; know that her actions are attributed to her | No concept of identity in the system today |

## 4. User Flows

### Flow 1: First-time login

**Trigger:** A user navigates to the application URL for the first time, or their session has expired.

1. The user arrives at the application. The system detects no valid session.
2. The user is presented with a login screen containing a single "Sign in with Microsoft" action.
3. The user clicks. The system redirects them to the Microsoft Entra ID login page (standard Microsoft 365 flow).
4. The user authenticates with their company Microsoft 365 credentials (including MFA if the organization requires it).
5. Microsoft redirects back to the application with a valid identity token.
6. The system validates the token server-side and creates a session.
7. If the user does not yet exist in the application's users table, a new user record is created with their Entra ID identifier, display name, and email.
8. The user lands on the Dashboard.

**Result:** The user is authenticated, their record exists in the users table, and the session persists until it expires or they log out.

**Error states:**
- Microsoft authentication fails (wrong credentials, MFA rejected) → User sees a Microsoft-hosted error page; returns to the application login screen.
- User's Microsoft 365 account is not from the expected tenant → Session is rejected; user sees an "Access denied" message.
- Network error during token validation → User sees a generic "Unable to sign in" message with a retry prompt.

---

### Flow 2: Returning user (session active)

**Trigger:** User navigates to any application URL while a valid server-side session exists.

1. The system validates the session cookie/token server-side on each request.
2. The user is served the requested page without re-authentication.

**Result:** Seamless experience; no re-login required within the session window.

---

### Flow 3: Protected route access without session

**Trigger:** User navigates directly to a protected page URL without a valid session (e.g., bookmarked URL, expired session).

1. The server detects no valid session for any request to a protected route.
2. The user is redirected to the login screen.
3. After successful login (Flow 1), the user is redirected to the originally requested URL.

**Result:** No protected content is served without authentication. The user's intended destination is preserved.

---

### Flow 4: Logout

**Trigger:** User clicks "Sign out" in the application.

1. The server-side session is invalidated.
2. The user is redirected to the login screen.
3. (Optional) The user is also signed out of the Microsoft 365 session for the application.

**Result:** The session is fully terminated. Re-access requires a new authentication.

---

### Flow 5: Admin promotes a user

**Trigger:** The admin needs to elevate a user's role from "user" to "admin."

1. The admin navigates to user management (accessible only to admins).
2. The admin finds the target user in the users list.
3. The admin changes the user's role.
4. The change is saved immediately.

**Result:** The target user's role is updated. On their next action, the new permissions apply.

**Error states:**
- Admin attempts to demote themselves → System prevents it; an error message explains that at least one admin must remain.

---

## 5. Feature Requirements (MoSCoW)

### Must Have — launch blocker

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-AUTH-001 | All application routes and data endpoints require a valid authenticated session. Unauthenticated requests receive a redirect to the login screen (for page routes) or a 401 response (for data endpoints). | **Given** an unauthenticated user navigates to any page URL, **when** the server processes the request, **then** the user is redirected to the login screen with the original URL preserved as a post-login redirect target. **Given** an unauthenticated client calls any data endpoint, **when** the server processes the request, **then** a 401 Unauthorized response is returned with no data in the body. |
| PRD-AUTH-002 | Authentication is implemented using Microsoft Entra ID as the identity provider. No application-managed passwords or local credentials exist. | **Given** a user has a valid company Microsoft 365 account, **when** they click "Sign in with Microsoft" and complete the Microsoft authentication flow, **then** they are granted a valid application session without entering any application-specific credentials. **Given** the mock authentication module from the legacy system, **when** the rewrite is deployed, **then** no mock auth code or endpoint exists anywhere in the codebase. |
| PRD-AUTH-003 | Authentication is validated server-side on every request. The client-side holds a session indicator only; it does not hold authorization logic or secrets. | **Given** a user manually modifies client-side storage (cookies, localStorage) to forge an authenticated state, **when** a protected request is made to the server, **then** the server rejects it with a 401 or redirects to login, and the user does not receive protected data. |
| PRD-AUTH-004 | On first successful login, a user record is created in the users table with the user's Entra ID identifier, display name, email address, and a default role of "user." Subsequent logins for the same user update last_login timestamp but do not create duplicate records. | **Given** a user authenticates via Microsoft Entra ID for the first time, **when** the session is established, **then** exactly one record exists in the users table with their Entra ID sub/oid identifier, and the record contains their display name and email. **Given** the same user authenticates again on a later date, **when** the session is established, **then** no new users table record is created, and their last_login timestamp is updated. |
| PRD-AUTH-005 | Two roles exist: "admin" and "user." The admin role grants access to the user management screen. All other functionality is identical between roles. Only admins can change role assignments. | **Given** a user with role "user" navigates to the user management page, **when** the server renders the request, **then** a 403 Forbidden response or "Access denied" page is returned. **Given** a user with role "admin" navigates to the user management page, **when** the page loads, **then** the full list of users with their roles is displayed and role changes are actionable. |
| PRD-AUTH-006 | The users table record for the authenticated user is available server-side on every authenticated request, so that writes to all entities (contacts, deals, activities, stage transitions) can be attributed to a named user. | **Given** an authenticated user creates a contact, updates a deal, or triggers a stage transition, **when** the system persists the record, **then** the actor field on the created or modified record references the authenticated user's ID from the users table. |

### Should Have — important but not blocking launch

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-AUTH-010 | Session expiry is configurable and defaults to 8 hours of inactivity. Expired sessions redirect to login without data loss (the user's in-progress form state is preserved where technically feasible). | **Given** a session has been inactive for the configured expiry period, **when** the user makes the next request, **then** they are redirected to login; after successful re-authentication, they return to the page they were on. |
| PRD-AUTH-011 | A user list page is available to admins, showing all users, their display names, email, role, and last login date. | **Given** an admin visits the user management page, **when** the page loads, **then** all users who have ever logged in are listed with name, email, role, and last login date. |
| PRD-AUTH-012 | The system prevents the last admin from being demoted, ensuring at least one admin always exists. | **Given** there is exactly one admin user and an admin attempts to change that user's role to "user," **when** the change is submitted, **then** the system rejects it with a message explaining at least one admin must exist. |

### Could Have — nice to have, defer if needed

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-AUTH-020 | After logout, the user is also signed out of the Microsoft 365 application session (full Single Logout). | **Given** a user signs out, **when** they next attempt to access the application, **then** Microsoft requires full re-authentication rather than automatically re-establishing the session. |
| PRD-AUTH-021 | A visible indicator of the logged-in user's name and avatar appears in the application navigation on all authenticated pages. | **Given** a user is authenticated, **when** any page loads, **then** the user's display name (and optionally avatar from Microsoft profile) is visible in the persistent navigation. |

### Will Not Have — explicit scope boundary for this release

| Item | Reason for exclusion |
|------|---------------------|
| Local username/password login | All users are Microsoft 365 account holders. Adding a second credential path increases attack surface and maintenance burden for no benefit. |
| Granular permission per entity type (e.g., "can edit deals but not contacts") | Current usage pattern treats all team members as equivalent; simple admin/user distinction is sufficient. Per BRD OS-7. |
| Self-service user registration | Users are provisioned by authenticating for the first time with a valid company M365 account. No separate registration flow. |
| User deprovisioning / account deletion | Users who leave the company lose M365 access and therefore cannot authenticate. Hard deletion from users table is out of scope; archiving can be a post-MVP addition. |
| Audit log UI for auth events (login/logout history) | Security logging may be added post-MVP. Not required for initial launch. |

## 6. Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| PRD-AUTH-NFR-001 | Security | No authentication secret, token, or credential is stored in client-side code, client-side storage, or environment variables committed to version control. | Manual audit confirms zero secrets in client bundle and zero committed .env files. |
| PRD-AUTH-NFR-002 | Security | All session tokens are transmitted only over HTTPS. | Vercel deployment enforces HTTPS by default; verified in deployment configuration. |
| PRD-AUTH-NFR-003 | Performance | The authentication redirect round-trip (application → Microsoft → application) completes in under 5 seconds on a standard corporate network. | Measured from click to post-login page load in a manual smoke test. |
| PRD-AUTH-NFR-004 | Availability | Authentication depends on Microsoft Entra ID availability. When Microsoft services are unavailable, the application displays a clear "Authentication service unavailable" message rather than a generic error. | Verified by simulating Microsoft endpoint unavailability in test environment. |
| PRD-AUTH-NFR-005 | Accessibility | The login screen meets WCAG 2.1 AA. The "Sign in with Microsoft" button is keyboard navigable and screen-reader labelled. | Evaluated with axe or equivalent automated checker; no critical violations. |
| PRD-AUTH-NFR-006 | Maintainability | Auth implementation uses Supabase Auth Azure provider as the integration layer. No direct MSAL SDK calls in application code. | Code review confirms all auth calls go through the Supabase Auth abstraction layer. |

## 7. Success Metrics

| Metric | Baseline | Target | How measured |
|--------|---------|--------|-------------|
| Unauthenticated endpoint exposure | 100% of endpoints publicly accessible (legacy) | 0 endpoints accessible without valid session | Manual audit of all routes + automated integration test |
| Actor attribution on writes | 0% of writes attributed to a named user (legacy) | 100% of contact, deal, activity, and stage transition writes include actor user ID | Query audit on writes in test environment |
| User adoption via SSO | N/A (mock login) | All sales team members successfully log in via Entra ID SSO within 1 day of launch | Login event count in application logs |
| Auth-related support tickets | N/A | Zero auth failures reported by users in the first 2 weeks post-launch | Incident log |

## 8. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Should the session cookie be HttpOnly and SameSite=Strict, or does Supabase Auth handle cookie configuration automatically? | juhaszj | TSD phase | Open — TSD decision |
| 2 | Which Microsoft tenant should be whitelisted? Single-tenant (company only) or multi-tenant? | juhaszj | Before TSD | Open — confirm with business; single-tenant strongly recommended |

## 9. Out of Scope (explicit)

- Email/password authentication — reason: all users have M365 accounts; second auth path adds unnecessary surface area.
- Granular RBAC beyond admin/user — reason: BRD OS-7; current team is too small to need per-feature permissions.
- Guest or external user accounts — reason: system is internal-only; no external user access path.
- API keys for external automation (n8n, Power Automate) — reason: external integrations are out of scope for this release per BRD OS-1.
- Public-facing pages — reason: system is entirely internal.

## 10. Dependencies

- D-2: Microsoft Entra ID app registration must be completed before auth can be built or tested.
- D-3: Supabase Auth configured with Azure provider.
- D-1: Supabase project provisioned.
- D-6: Vercel project configured (HTTPS is implicit in Vercel deployment).

## 11. Next Steps

- [ ] TSD: Supabase Auth Azure provider configuration — due TBD
- [ ] TSD: Session cookie strategy and expiry configuration — due TBD
- [ ] Infrastructure: Entra ID app registration — owner juhaszj
- [ ] Infrastructure: Supabase Auth Azure provider setup — owner juhaszj
- [ ] PRD review — due TBD
- [ ] PRD approval — due TBD

---

*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-13 | juhaszj | Initial draft |
