---
doc-type: ADR
project: had-management
adr-number: 2
title: Configure Microsoft Entra ID as single-tenant (company-only)
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-auth.md
  - PRD-auth.md
superseded-by: ~
---

# ADR-2: Configure Microsoft Entra ID as single-tenant (company-only)

## Status
`proposed`

## Context

When registering an Azure AD application, the administrator must choose the supported account type:
- **Single-tenant**: only users from the registering organization's Entra ID directory
- **Multi-tenant**: any Azure AD organization
- **Multi-tenant + personal**: any Azure AD account plus personal Microsoft accounts

PRD-auth.md Open Question 2 leaves this open but notes "single-tenant strongly recommended."

The BRD states the system is internal-only (C-3: "Internal tool only"), all users authenticate via company M365 accounts (C-1), and external users are explicitly excluded. Guest/external accounts are explicitly out of scope in PRD section 9.

## Decision

We will register the Entra ID application as **single-tenant**, restricting authentication to users in the company's Entra ID tenant only. The Supabase Auth Azure provider will be configured with the company's specific tenant ID (not `common` or `organizations` endpoint).

At the application level, a server-side check will verify that the authenticated user's `iss` claim matches the expected tenant ID. Any token from an external tenant is rejected with a 401.

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| Multi-tenant configuration | Allows future contractor or partner access without reconfiguration | Dramatically expands attack surface; external accounts can attempt authentication; does not match business requirement | Rejected — system is strictly internal; external access is explicitly out of scope |
| Multi-tenant + personal accounts | Maximum flexibility | Personal accounts cannot access internal company data; no business case; highest security risk | Rejected — no use case; introduces personal account confusion |
| **Single-tenant** | Only company users can authenticate; minimal attack surface; matches BRD C-1 and C-3 | Cannot add external users without re-registration or B2B invite | **Chosen** — matches all stated constraints; aligns with BRD and PRD |

## Consequences

**Positive:**
- Only users in the company's Entra ID directory can authenticate; no external account risk
- Token validation is simpler (single issuer)
- Tenant-specific conditional access policies (MFA, device compliance) are automatically applied

**Negative / Trade-offs:**
- If a contractor needs access, they must be provisioned as a guest in the company's Entra ID, not just given the URL
- Re-registration or tenant change requires updating both the Azure app registration and the Supabase Auth configuration

**Risks:**
- If the company's Entra ID tenant is migrated or renamed, the tenant ID in configuration must be updated
- Single-admin guard (PRD-AUTH-012) becomes more critical: if the sole Entra ID admin is unavailable, account recovery is an IT operation outside the application

## Review Trigger

- If a business requirement for external contractor or partner access to the CRM is confirmed
- If the company undergoes a domain migration or M365 tenant reorganization

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
