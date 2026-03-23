---
doc-type: TSD
project: had-management
feature: Reports (Beta) + Multi-Currency (MNB API)
version: 1.0
status: approved
date: 2026-03-16
author: tech-lead
approved-by: juhaszj
related-docs:
  prd: PRD-reports.md
  implements: [PRD-REP-001, PRD-REP-002, PRD-REP-003, PRD-REP-004, PRD-REP-005, PRD-REP-006, PRD-REP-010, PRD-REP-011, PRD-REP-012, PRD-REP-013]
---

# TSD: Reports (Beta) + Multi-Currency (MNB API)

## 1. Overview

Implements the daily MNB SOAP exchange rate sync, the `exchange_rates` cache table, multi-currency aggregation logic (convert EUR/USD deal values to HUF at current rate), the Dashboard KPI cards, and the Reports page (beta). Currency field on the `deals` table is defined in TSD-deals; this TSD covers the reporting layer that consumes it.

Implements: PRD-REP-001 through PRD-REP-013.

Key decisions: ADR-4 (Vercel Cron + Next.js API route for MNB sync), ADR-9 (current rate only, no historical rates).

**Infrastructure spike flagged (PD-3 / ADR-4):** Vercel HTTP outbound connectivity to `http://www.mnb.hu/arfolyamok.asmx` must be verified before deployment. If blocked, a proxy fallback is required. This does not block TSD authoring but must be resolved before the sync cron is deployed.

## 2. Tech Stack

| Layer | Technology | Version | Justification / ADR |
|-------|-----------|---------|---------------------|
| Exchange rate sync | Next.js API route `/api/cron/sync-exchange-rates` | Next.js 15 | ADR-4 |
| Scheduler | Vercel Cron (`vercel.json`) | — | ADR-4; runs at 12:00 CET daily |
| SOAP parsing | Native `fetch` + `DOMParser` (Node.js `xml2js` as fallback) | Latest | Minimal dependency; MNB SOAP response is simple XML |
| Aggregation queries | Drizzle ORM SQL | Latest | All conversion logic in SQL; avoids JS-level row iteration |
| Currency conversion formula | `value * (SELECT rate FROM exchange_rates WHERE currency_pair = 'EUR/HUF')` | — | Inline subquery or CTE |
| Chart (Could Have) | `recharts` wrapped in a Client Component | Latest | Lightweight; no D3 dependency |

## 3. Data Model

### Entity: exchange_rates

**Purpose:** Single-row-per-currency-pair cache of the most recently fetched MNB rates. Overwritten on each successful sync. No historical data stored (ADR-9).

```
Fields:
  id:            uuid        — PRIMARY KEY, default gen_random_uuid()
  currency_pair: text        — NOT NULL, UNIQUE — enum: 'EUR/HUF' | 'USD/HUF'
  rate:          numeric(12,6) — NOT NULL — e.g., 390.123456
  fetched_at:    timestamptz — NOT NULL — timestamp of the successful MNB API call
  stale_since:   timestamptz — NULLABLE — set when a sync fails and rate is older than 24h; cleared on next success

Primary key: id
Indexes:
  currency_pair — UNIQUE — reason: fast single-row lookup by currency pair in all aggregation queries

Relations:
  referenced by aggregation queries at report/dashboard query time (no FK — value lookup)
```

**Access rules:**

| Operation | Who | Condition |
|-----------|-----|-----------|
| read | user, admin | authenticated — via aggregation queries; direct read for admin system settings (PRD-REP-022 Could Have) |
| write | system only | cron job via `CRON_SECRET` header; no user-facing write |
| delete | none | rows are upserted, never deleted |

### Note on currency field in deals

The `currency` field (`HUF | EUR | USD`) on the `deals` table is defined in TSD-deals. It is consumed here for all aggregation queries.

## 4. API / Operations

### Operation: POST /api/cron/sync-exchange-rates
- **Trigger:** Vercel Cron at 12:00 CET daily
- **Input:** `Authorization: Bearer ${CRON_SECRET}` header
- **Validation:** `CRON_SECRET` header must match environment variable; reject 401 otherwise
- **Authorization:** Cron secret only — not a user-facing endpoint; should NOT be accessible via the web UI
- **Business logic:**
  1. Verify `CRON_SECRET` header
  2. Build MNB SOAP request for `GetCurrentExchangeRates` method
  3. Call `http://www.mnb.hu/arfolyamok.asmx` with `fetch`, 10-second timeout
  4. On success: parse XML response; extract EUR/HUF and USD/HUF rates
  5. Upsert `exchange_rates` table for each currency pair: `rate = parsed_rate`, `fetched_at = now()`, `stale_since = null`
  6. Return `200 { synced: ["EUR/HUF", "USD/HUF"], fetched_at }`
  7. On first failure: retry once after 5 seconds
  8. On second failure: log error; set `stale_since = now()` if previous `fetched_at` is more than 24h ago; return `500 { error: "SYNC_FAILED" }`
- **Output:** `200 { synced: [...], fetched_at }` or `500 { error: "SYNC_FAILED", reason }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | Unauthorized | Missing or wrong CRON_SECRET | 401 |
  | MNB unavailable (both retries fail) | Network error or timeout | 500 — previous rates retained; stale_since set |
  | Unexpected SOAP format | XML parse fails | 500 — previous rates retained; stale_since set; error logged |

**MNB SOAP request format:**
```xml
POST http://www.mnb.hu/arfolyamok.asmx HTTP/1.1
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://www.mnb.hu/webservices/MNBArfolyamServiceSoap/GetCurrentExchangeRates"

<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCurrentExchangeRates xmlns="http://www.mnb.hu/webservices/" />
  </soap:Body>
</soap:Envelope>
```

Expected response: XML containing currency nodes with `curr` attribute and exchange rate value. Parser must extract `curr="EUR"` and `curr="USD"` values.

### Operation: GET /api/dashboard/kpis
- **Trigger:** Dashboard page load
- **Input:** None
- **Authorization:** Authenticated
- **Business logic:**
  1. Fetch current exchange rates from `exchange_rates` table
  2. Determine `is_stale`: `fetched_at < now() - 24 hours` → stale = true
  3. Run aggregation query:
     ```sql
     SELECT
       COUNT(*) FILTER (WHERE stage NOT IN ('won','lost')) as open_deal_count,
       SUM(
         CASE currency
           WHEN 'HUF' THEN value
           WHEN 'EUR' THEN value * eur_rate
           WHEN 'USD' THEN value * usd_rate
         END
       ) FILTER (WHERE stage NOT IN ('won','lost')) as pipeline_value_huf,
       SUM(
         CASE currency
           WHEN 'HUF' THEN value
           WHEN 'EUR' THEN value * eur_rate
           WHEN 'USD' THEN value * usd_rate
         END
       ) FILTER (WHERE stage = 'won') as won_value_huf
     FROM deals
     ```
  4. Fetch 5 most recent activities with deal/contact display names
  5. Return KPI data with stale indicator
- **Output:** `200 { open_deal_count: N, pipeline_value_huf: N, won_value_huf: N, rates_stale: bool, rates_last_updated: timestamptz | null, recent_activities: [...] }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | No rates cached | exchange_rates table empty (first run) | `200` with values where foreign-currency deals show `null` in conversion fields; `rates_stale: true`, `rates_last_updated: null` |

### Operation: GET /api/reports
- **Trigger:** Reports page load
- **Input:** `year?: number`, `display_currency?: 'HUF'|'EUR'|'USD'`
- **Authorization:** Authenticated
- **Business logic:**
  1. Default `year` to current year if not provided
  2. Fetch exchange rates; determine stale status
  3. Query deals for the selected year (filter by `EXTRACT(YEAR FROM expected_close) = year` OR `EXTRACT(YEAR FROM created_at) = year` — use expected_close as the primary bucketing field, fall back to created_at)
  4. Compute KPI cards for year: actual revenue (stage=won), forecast (won + open pipeline)
  5. Compute quarterly breakdown: group deals by quarter of `expected_close`; sum actual (won) and forecast (won + open) per quarter
  6. Compute all-time stage breakdown: count and HUF total by stage
  7. If `display_currency` is EUR or USD: divide all HUF totals by the corresponding rate; if rate unavailable, return error in currency selector response
  8. Return all sections
- **Output:** `200 { year, available_years: [...], kpis: {...}, quarterly: [...], stage_breakdown: [...], display_currency, rates_stale: bool, rates_last_updated }`
- **Error states:**
  | Error | Condition | Response |
  |-------|-----------|----------|
  | No data for year | No deals match selected year | `200` with all values = 0 and `empty: true` |
  | Display currency unavailable | EUR/USD requested but rates empty | `200` with `display_currency_unavailable: true`; values shown in HUF |

### Operation: GET /api/reports/years
- **Trigger:** Year selector on Reports page
- **Authorization:** Authenticated
- **Business logic:** `SELECT DISTINCT EXTRACT(YEAR FROM expected_close) FROM deals ORDER BY year DESC` (also include years from `created_at` if `expected_close` is null)
- **Output:** `200 { years: [2025, 2024, ...] }`

## 5. Auth & Permissions Matrix

| Role | Operation | Allowed | Condition |
|------|-----------|---------|-----------|
| unauthenticated | any | No | 401 |
| user | dashboard KPIs | Yes | Authenticated |
| user | reports page | Yes | Authenticated |
| user | exchange rate admin view (PRD-REP-022) | No | Admin only |
| admin | exchange rate admin view | Yes | Role = admin |
| cron (CRON_SECRET) | sync-exchange-rates | Yes | Valid CRON_SECRET header only |

## 6. Non-Functional Implementation

| Requirement | Implementation approach | Verification method |
|-------------|------------------------|-------------------|
| PRD-REP-NFR-001 Dashboard KPIs < 2s with 200 mixed-currency deals | Single aggregation SQL query (no N+1); exchange rates fetched as single 2-row lookup; composite index on (stage, value, currency) | Load test: seed 200 deals; measure TTFB |
| PRD-REP-NFR-002 MNB unavailability fallback | Previous rates retained on sync failure; `stale_since` set; UI shows stale notice; 500 returned to Vercel Cron logs | Test: block MNB endpoint; verify cron returns 500, previous rates intact, UI shows stale notice |
| PRD-REP-NFR-003 Official MNB rates only | No hardcoded rates; no fallback to third-party API; code review | `grep -r 'hardcoded\|fallback_rate\|fixer\|openexchange' src/` returns no results |
| PRD-REP-NFR-004 Transparency — MNB rate timestamp | All monetary aggregates in Dashboard and Reports include `rates_last_updated` in response; UI renders "MNB rate, last updated [date]" | Visual audit of Dashboard and Reports pages |
| PRD-REP-NFR-005 Accessibility | Chart (recharts, Could Have) rendered with `role="img"` and descriptive `aria-label`; table equivalents for all chart data | axe audit on Reports page |
| Weekend/holiday rate handling (PRD Open Q2) | `stale_since` is only set when `fetched_at < now() - 24h`; on weekends, MNB does not publish new rates — Friday's rates will be used Saturday and Sunday. The cron job will attempt a fetch, likely fail (MNB returns no data on weekends), and retain Friday's rates. Since `fetched_at` is the timestamp of the last *successful* fetch, the UI may show "stale" on weekends. This is acceptable for beta. | Document in beta notice |

## 7. Testing Strategy

| Type | Tool | Scope | What is tested |
|------|------|-------|----------------|
| Unit | Vitest | MNB SOAP parser, currency conversion formula, stale detection logic | Parse valid XML → correct rates; parse malformed XML → error; stale detection: 23h → not stale, 25h → stale |
| Integration | Vitest + Supabase test client | `/api/cron/sync-exchange-rates`, `/api/dashboard/kpis`, `/api/reports` | Sync writes rates correctly; KPI aggregation with mixed-currency seeded deals; quarterly breakdown; empty year |
| E2E | Playwright | Flow 1 (Dashboard KPI cards), Flow 2 (Reports page) | KPI cards render with currency note; beta banner visible; stale notice appears when `fetched_at` is old |

PRD acceptance criteria mapping:
- PRD-REP-003 → Integration: seed 1000 EUR deal + 500000 HUF deal; EUR/HUF rate = 390; assert pipeline_value_huf = 390000 + 500000 = 890000
- PRD-REP-004 → E2E: set `fetched_at` to 25h ago; assert stale notice visible on Dashboard
- PRD-REP-005 → Integration: seed deals in stages lead/qualified/proposal/negotiation/won; assert KPI cards reflect correct counts and values
- PRD-REP-006 → E2E: navigate to Reports; assert beta banner present and non-dismissible

## 8. Migration / Deployment Notes

- Breaking changes: no (new tables only; clean slate)
- Migration script required: no — Drizzle kit push creates `exchange_rates` table
- Tested on staging: no — pending
- Rollback plan: revert deployment; rates are stateless (re-fetched on next cron run)
- Feature flag required: no
- **Vercel Cron configuration** (`vercel.json`):
  ```json
  {
    "crons": [{
      "path": "/api/cron/sync-exchange-rates",
      "schedule": "0 11 * * *"
    }]
  }
  ```
  Note: `0 11 * * *` = 11:00 UTC = 12:00 CET (non-DST) / 13:00 CEST (DST). Adjust for DST or use a fixed 11:00 UTC year-round. MNB typically publishes by 11:00 CET; 11:00 UTC is conservative. Confirm with juhaszj before deployment.

- **Environment variables required:**
  - `CRON_SECRET` — random string; set in Vercel environment; used to authenticate cron endpoint

## 9. Open Technical Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Infrastructure spike: can Vercel serverless functions make outbound HTTP calls to `http://` (not HTTPS) endpoints? Verify before deployment. If blocked, design a minimal HTTPS proxy (e.g., Cloudflare Worker) | juhaszj | Before deployment (PD-3 / ADR-4) |
| 2 | MNB SOAP: should the parser use `xml2js` (npm) or hand-rolled DOMParser? The MNB response is simple XML with ~30 currency nodes. Hand-rolled is sufficient for MVP; adds no dependency. | tech-lead | Resolved: hand-rolled parser using `fast-xml-parser` (1 small dependency, zero overhead) |
| 3 | Vercel Cron schedule: 11:00 UTC vs 12:00 CET DST handling. Confirm acceptable to always use 11:00 UTC (slightly earlier in summer). | juhaszj | Before deployment |

## 10. ADRs Triggered

- [x] ADR-4: Vercel Cron + Next.js API route for MNB sync
- [x] ADR-9: Current rate only, no historical rate storage

## 11. Next Steps

- [ ] TSD review — awaiting human approval
- [ ] Infrastructure spike: Vercel HTTP outbound connectivity — owner: juhaszj
- [ ] ADR-4 approval — awaiting human review
- [ ] Implementation begins — after TSD approval and infrastructure spike resolution

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
