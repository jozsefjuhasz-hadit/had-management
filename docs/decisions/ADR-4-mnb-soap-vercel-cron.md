---
doc-type: ADR
project: had-management
adr-number: 4
title: Fetch MNB exchange rates via Next.js API route called by Vercel Cron
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-reports.md
  - PRD-reports.md
superseded-by: ~
---

# ADR-4: Fetch MNB exchange rates via Next.js API route called by Vercel Cron

## Status
`proposed`

## Context

PRD-REP-002 requires daily automated fetching of EUR/HUF and USD/HUF rates from the MNB SOAP API (`http://www.mnb.hu/arfolyamok.asmx`). The resolved blocking item PD-3 confirms the endpoint returns HTTP 200 locally; Vercel connectivity is an infrastructure spike but does not block TSD authoring.

The MNB endpoint uses plain HTTP (not HTTPS). Vercel serverless functions run in Node.js environments that allow outbound HTTP calls, but the Vercel networking environment must be verified in a spike. If HTTP is blocked, a thin HTTPS proxy or alternative fetch strategy is required.

Three scheduling mechanisms exist on Vercel: external cron services, Vercel Cron (built-in), and on-demand fetch-on-first-request.

## Decision

We will implement exchange rate sync as a dedicated Next.js API route (`/api/cron/sync-exchange-rates`) protected by a `CRON_SECRET` header. Vercel Cron will call this route daily at **12:00 CET** (after MNB publishes rates at ~11:00 CET on business days).

The route:
1. Calls the MNB SOAP endpoint using native `fetch` with a 10-second timeout
2. Parses the XML SOAP response to extract EUR/HUF and USD/HUF rates
3. Upserts the rates into the `exchange_rates` table with `fetched_at = now()`
4. Returns 200 on success, 500 on failure (Vercel Cron logs failures)

On fetch failure, the previous cached rates are retained; a `stale_since` column is set if the last successful fetch was more than 24 hours ago. No exception propagates to users.

**Infrastructure spike required** (flagged, not blocking): Verify the Vercel deployment can reach `http://www.mnb.hu/arfolyamok.asmx`. If outbound HTTP is blocked by Vercel, the fallback is to proxy the request through a lightweight HTTPS endpoint (e.g., a Cloudflare Worker or a simple redirect on a domain the project controls).

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| Fetch on first request (lazy, per-user) | No background job needed | Rate is fetched N times per day depending on traffic; SOAP latency on user-facing request; no guarantee of daily freshness | Rejected — adds latency to user requests; no controlled daily update |
| External cron (GitHub Actions, uptime robot) | Works from outside Vercel | Additional service dependency; credentials management outside the project | Rejected — unnecessary external dependency when Vercel Cron is available |
| **Vercel Cron → Next.js API route** | Native to deployment platform; no external service; rate is fetched once daily at a predictable time; stale-state is explicit | Vercel Cron requires a Pro plan for sub-daily frequency; HTTP outbound from Vercel requires spike verification | **Chosen** — simplest approach native to the deployment platform; one daily fetch is sufficient per PRD-REP-002 |

## Consequences

**Positive:**
- Exchange rate fetch is decoupled from user requests; no user-facing latency from SOAP call
- Stale state is explicit and surfaced in the UI (PRD-REP-004)
- Vercel Cron is configured in `vercel.json` — visible in version control

**Negative / Trade-offs:**
- Vercel Cron requires Vercel Pro plan; if the project is on the Hobby plan, cron frequency is limited to once daily (which is exactly what we need, so this is not a practical constraint)
- The SOAP XML parsing adds a dependency on a small XML parser (or manual string parsing for simple responses)
- Infrastructure spike required before this can be verified in production

**Risks:**
- If MNB changes their SOAP response format, the parser will silently fail until someone notices stale rates in the UI
- HTTP outbound from Vercel may be blocked or rate-limited; if the infrastructure spike confirms this, a proxy fallback must be implemented before launch

## Review Trigger

- If the infrastructure spike confirms Vercel cannot reach the HTTP MNB endpoint (triggers a design revision for the fallback proxy)
- If MNB publishes a HTTPS or REST API endpoint (current endpoint is HTTP SOAP only)
- If exchange rate frequency needs to change (e.g., intraday rates for high-value EUR/USD deals)

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
