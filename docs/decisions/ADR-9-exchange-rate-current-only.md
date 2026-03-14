---
doc-type: ADR
project: had-management
adr-number: 9
title: Exchange rate conversions use the current cached rate only — no historical rate storage
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-reports.md
  - PRD-reports.md
superseded-by: ~
---

# ADR-9: Exchange rate conversions use the current cached rate only — no historical rate storage

## Status
`proposed`

## Context

PRD-REP Open Question 3 asks whether a historical deal (e.g., created in 2024 at EUR value) should use the current rate or the rate at the time of creation. PD-4 documents this as a known limitation and recommends current-rate-only for simplicity, noting it must be documented as a known beta limitation.

PRD section 9 (Will Not Have) explicitly excludes "Historical exchange rate storage (one rate per day)."

Storing the rate at time of deal creation would require a `rate_eur_at_creation` and `rate_usd_at_creation` field on every deal, populated at insert time. This would make historical HUF totals stable, but adds schema complexity and doesn't match the MVP scope.

## Decision

The `exchange_rates` table stores a single row per currency pair (EUR/HUF, USD/HUF), overwritten on each successful daily sync. No historical rate table is maintained.

All monetary aggregations (pipeline value, won value, quarterly reports) convert foreign-currency deal values using the currently cached rate at query time. The HUF equivalent of a 2024 EUR deal will change if the exchange rate changes — this is a known limitation, documented in the beta notice.

The beta notice on the Reports page must include: "All values in foreign currencies (EUR, USD) are converted to HUF using the most recently available MNB rate. Historical rates are not stored. HUF equivalents for past deals may differ from their value at time of creation."

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| Store rate at deal creation (rate_at_creation on deal table) | Stable HUF equivalents over time; accurate historical reporting | Adds 2 columns to deals table; populating on creation requires exchange rates to be available at deal-create time (creates a dependency); significant added complexity for beta scope | Rejected — PRD explicitly excludes this; adds complexity beyond MVP |
| Full daily rate history table (one row per currency per day) | Enables point-in-time queries; maximum accuracy | High storage and query complexity; requires joining deals to rates by date; out of PRD scope | Rejected — explicitly excluded in PRD Will Not Have |
| **Current rate only (single cached row per currency)** | Minimal schema; simple queries; no join overhead | HUF equivalents for historical deals will drift over time; flagged as known limitation | **Chosen** — matches PRD constraints; acceptable for beta; explicitly documented |

## Consequences

**Positive:**
- Exchange rate schema is two rows (EUR/HUF and USD/HUF) in a single table
- All aggregation queries are simple: `value * (SELECT rate FROM exchange_rates WHERE currency = 'EUR')`
- No schema complexity on the deals table

**Negative / Trade-offs:**
- A deal recorded as "1000 EUR" in 2024 will show a different HUF equivalent in 2025
- This means the "2024 Actual Revenue" figure on the Reports page is not a stable historical fact — it changes daily with the exchange rate
- Péter may notice discrepancies between past reports if rates have moved significantly

**Risks:**
- If the exchange rate cache is empty (first run before any sync), all foreign-currency aggregations will return null or zero; this must be handled gracefully in the query layer

## Review Trigger

- If a post-MVP requirement for stable historical HUF reporting is confirmed by the business
- If the exchange rate drift causes material discrepancies in quarterly revenue reporting

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
