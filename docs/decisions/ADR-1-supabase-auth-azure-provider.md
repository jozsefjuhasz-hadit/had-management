---
doc-type: ADR
project: had-management
adr-number: 1
title: Use Supabase Auth Azure provider as the sole authentication integration layer
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-auth.md
  - PRD-auth.md
superseded-by: ~
---

# ADR-1: Use Supabase Auth Azure provider as the sole authentication integration layer

## Status
`proposed`

## Context

The system requires Microsoft Entra ID (Azure AD) as the identity provider for all users (PRD-AUTH-002, PRD-AUTH-NFR-006). The stack already mandates Supabase for database and auth (BRD C-5). Two integration patterns exist: integrate directly with Microsoft's MSAL SDK, or use the Supabase Auth Azure provider as an abstraction layer above MSAL.

The constraint from PRD-AUTH-NFR-006 explicitly states: "No direct MSAL SDK calls in application code." This was already a product decision, not a technical choice left open. The TSD must define exactly what "Supabase Auth Azure provider" means architecturally.

Constraints:
- Sole maintainer (juhaszj) — minimal surface area required
- Supabase PostgreSQL is already the database; shared auth state reduces integration complexity
- All OAuth tokens and session state must be server-side only (PRD-AUTH-003)

## Decision

We will use the Supabase Auth built-in Azure OAuth provider exclusively. Application code calls only Supabase Auth SDK methods (`supabase.auth.signInWithOAuth`, `supabase.auth.getSession`, `supabase.auth.signOut`). No MSAL, no direct Azure AD endpoint calls, no JWT parsing in application code.

The Supabase Auth session cookie is the single session artifact. Server-side auth checks call `supabase.auth.getUser()` on every protected request via Next.js middleware.

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| Direct MSAL SDK integration | Full control over token lifecycle, no Supabase dependency for auth | Requires manual session management, MSAL library maintenance, complex token refresh logic; PRD explicitly forbids this | Rejected — PRD-AUTH-NFR-006 explicitly excludes this; complexity exceeds team capacity |
| NextAuth.js with Azure provider | Popular, well-documented, framework-native | Adds a third auth abstraction layer on top of Supabase; creates session duplication (NextAuth session + Supabase session); foreign to the Supabase ecosystem | Rejected — session duplication, added complexity for single maintainer |
| **Supabase Auth Azure provider** | Single auth API surface, sessions stored in Supabase, integrates natively with Supabase RLS; minimal custom code | Supabase Auth is an intermediary — if Supabase changes OAuth behavior, it affects the app indirectly | **Chosen** — matches PRD constraint, minimal surface area, cohesive with the rest of the stack |

## Consequences

**Positive:**
- Auth state and user sessions are stored in Supabase alongside application data
- No separate session store required
- Supabase Row Level Security (RLS) can use the same auth context
- Single SDK surface for all auth operations

**Negative / Trade-offs:**
- Session cookie configuration is partially controlled by Supabase Auth internals; limited direct control over cookie attributes (mitigated: Supabase sets HttpOnly, Secure by default)
- Supabase Auth must be correctly provisioned with the Azure app registration before any auth flow can be tested

**Risks:**
- If Supabase changes its Azure OAuth provider behavior in a major release, the auth flow may break without application code changes
- Supabase Auth session expiry defaults may not align with the 8-hour inactivity target in PRD-AUTH-010; requires explicit configuration via `auth.session.expiryMargin` in Supabase project settings

## Review Trigger

- If the team migrates away from Supabase to a different backend-as-a-service
- If Supabase Auth deprecates the Azure provider in favour of a different OAuth mechanism
- If direct MSAL integration becomes necessary for compliance requirements (e.g., Conditional Access policies that MSAL handles but Supabase does not)

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
