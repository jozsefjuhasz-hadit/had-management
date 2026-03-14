---
status: draft
last-updated: 2026-03-13
owner: juhaszj
doc-type: PRD
project: had-management
feature: Reports (Beta) + Multi-Currency (MNB API)
version: 1.0
approved-by: pending
related-docs:
  brd: BRD-had-management.md
  implements: [S-7, S-8, S-10, BO-4]
---

# PRD: Reports Module (Beta) + Multi-Currency (MNB API)

## 1. Overview

The Reports module gives the sales team a factual, consolidated view of pipeline performance — actual revenue, open pipeline value, and forecasted deals — broken down by year and quarter. In this rewrite, the module gains multi-currency awareness: deal values entered in EUR or USD are converted to HUF using daily exchange rates fetched from the Hungarian National Bank (MNB) SOAP API, ensuring pipeline totals are accurate regardless of currency. The module also surfaces on the Dashboard as KPI cards, so Péter sees the headline numbers without opening the full reports page.

Reports retains Beta status from the legacy system. This is communicated transparently to users, with a clear definition of what "Beta" means for them: the data is accurate, but the reporting calculations and presentation may change in a future release without notice, and some edge cases in date bucketing or currency conversion may not be fully resolved.

## 2. Problem Statement

The legacy Reports page is implemented and functional, but it suffers from a silent inaccuracy: all deal values are treated as HUF regardless of the actual currency negotiated. When EUR or USD deals exist in the pipeline, every aggregate (pipeline value, won value, forecast) is wrong. Péter keeps a personal Excel spreadsheet specifically to compensate for this gap — a clear signal that the system's reporting is not trusted.

The Dashboard KPI cards have the same problem. The "Pipeline Value" card is misleading when multi-currency deals exist.

Addresses: S-7, S-8, BO-4, SM-4, debt items D-4, UX-8

## 3. Users & Personas

| Persona | Who they are | Primary goal | Current frustration |
|---------|-------------|-------------|-------------------|
| Kovács Péter (Account Manager) | Senior account manager; reviews pipeline daily and quarterly revenue at month end | See accurate pipeline and revenue numbers that include EUR and USD deals converted to HUF | All aggregate values are HUF-only; EUR/USD deals silently inflate or deflate totals; personal Excel is the workaround |
| Juhász János (IT Admin) | System owner | Confirm exchange rate sync is reliable and the aggregation logic is correct; not a reporting user himself | No exchange rate infrastructure exists at all in legacy |

Ágnes rarely uses the Reports page — she checks deals sorted by next step due date instead. Reports is primarily Péter's domain.

## 4. User Flows

### Flow 1: View dashboard KPI cards

**Trigger:** Péter opens the application and sees the Dashboard first.

1. The Dashboard loads with three KPI cards: Open Deals Count, Pipeline Value (HUF), Won Value (HUF).
2. Pipeline Value shows the sum of all active deal values (stages: lead, qualified, proposal, negotiation), each converted to HUF using the most recent cached exchange rate.
3. Won Value shows the sum of won deal values, similarly converted.
4. A stage breakdown (bar or progress representation) shows the count and value of deals per active stage.
5. The five most recent activities are shown with links to the related deal or contact.
6. If the exchange rate data is stale (older than 24 hours) or unavailable, a visible notice appears: "Exchange rates may not be current (last updated: [date])."

**Result:** Péter sees accurate headline numbers in under 2 seconds.

**Error states:**
- Exchange rate data unavailable (MNB API down, no cached data) → KPI cards show values flagged as "HUF (no conversion available)" to distinguish from accurate multi-currency totals.

---

### Flow 2: View the Reports page

**Trigger:** Péter opens the Reports page at month-end to prepare the quarterly summary.

1. Péter navigates to Reports.
2. A "Beta" banner is visible at the top: "This module is in beta. Data is accurate, but report format and calculations may change. If you notice a discrepancy, contact juhaszj."
3. A year selector allows him to choose the reporting year (populated from years that have deal data).
4. Three KPI cards show for the selected year: Actual Revenue (won deals), Forecast (won + open pipeline), Total (same as Forecast).
5. A quarterly breakdown table shows: Q1/Q2/Q3/Q4, with actual won value and forecasted value per quarter.
6. A bar chart visualizes quarterly actual vs. forecast.
7. An all-time stage breakdown table shows deal count and value by stage.
8. All monetary values are shown in HUF (the base reporting currency). The conversion note is shown: "All values converted to HUF using MNB rates. Last updated: [date/time]."
9. Péter can switch the display currency to EUR or USD using a selector. When a non-HUF display currency is selected, all HUF aggregates are divided by the current rate for that currency.

**Result:** Péter sees accurate, multi-currency-aware revenue data for his reporting needs.

**Error states:**
- No data exists for selected year → Friendly empty state: "No deals found for [year]."
- Display currency conversion unavailable → Selector for EUR/USD is disabled with tooltip: "EUR/USD display requires current exchange rate data."

---

### Flow 3: MNB exchange rate sync (background, automated)

**Trigger:** Automated daily process at a configured time (e.g., 06:00).

1. The system calls the MNB SOAP API endpoint (`http://www.mnb.hu/arfolyamok.asmx`) to fetch the current EUR/HUF and USD/HUF exchange rates.
2. The fetched rates are stored in the application's exchange rate cache/table with a timestamp.
3. If the fetch fails (network error, MNB API unavailable), the system retries once after a short delay.
4. If both attempts fail, the system logs the failure and retains the previous day's rates as a fallback. A stale-rate indicator is flagged.
5. No user action is required for the daily sync.

**Result:** Exchange rates are current. All monetary aggregations use today's rates.

**Error states:**
- MNB API returns an unexpected response format → The sync fails gracefully; the previous cached rate is retained; the stale indicator is set; juhaszj is notified via server logs.

---

## 5. Feature Requirements (MoSCoW)

### Must Have — launch blocker

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-REP-001 | Each deal record stores a currency field (HUF, EUR, or USD). This field is set at deal creation and editable thereafter. The currency is visible alongside the deal value everywhere values appear (list view, detail page, reports, KPI cards). | **Given** a deal is created with currency EUR and value 1000, **when** that deal appears in any monetary context (list, detail, KPI, report), **then** "EUR" is shown alongside the value. **Given** a user changes a deal's currency from EUR to USD, **when** the change is saved, **then** all subsequent aggregations use the USD rate for that deal. |
| PRD-REP-002 | The system fetches EUR/HUF and USD/HUF exchange rates from the MNB SOAP API once per day and caches them with a timestamp. | **Given** the daily exchange rate sync runs, **when** the MNB API returns valid rates, **then** the cached EUR/HUF and USD/HUF rates are updated and the cache timestamp is set to the current date and time. **Given** the daily sync fails (MNB unavailable), **when** the system attempts the sync, **then** the previous day's rates are retained in cache and a stale flag is set; no exception propagates to users. |
| PRD-REP-003 | All monetary aggregations in pipeline KPI cards and the Reports page convert deal values to HUF using the most recently cached MNB exchange rates before summing. HUF deals require no conversion. | **Given** the pipeline has one deal at 1000 EUR and one at 500000 HUF, **when** the Pipeline Value KPI is calculated, **then** the displayed total is (1000 × EUR/HUF rate) + 500000 HUF. **Given** the EUR/HUF rate is 390, **when** a 1000 EUR deal is included in an aggregate, **then** it contributes 390000 HUF to the total. |
| PRD-REP-004 | When exchange rate data is stale (older than 24 hours) or unavailable, the UI displays a visible notice on all affected KPI cards and the Reports page indicating the last successful rate update date. | **Given** the last successful rate sync was more than 24 hours ago, **when** any monetary aggregate is displayed, **then** a notice "Exchange rates may not be current (last updated: [date])" is shown alongside the value. |
| PRD-REP-005 | The Dashboard displays three KPI cards: Open Deals Count, Pipeline Value (HUF, multi-currency converted), Won Value (HUF, multi-currency converted). Pipeline Value includes only deals in stages: lead, qualified, proposal, negotiation. Won Value includes only stage: won. | **Given** the dashboard loads with 3 open deals (1 in EUR, 1 in USD, 1 in HUF) and 1 won deal, **when** the KPI cards render, **then** Pipeline Value = sum of converted HUF equivalents for the 3 open deals, and Won Value = converted HUF equivalent of the won deal only. |
| PRD-REP-006 | The Reports page carries a persistent "Beta" label and a user-visible explanation of what beta means: data accuracy is expected, but report format and calculations may change without prior notice; edge cases may exist. | **Given** any authenticated user opens the Reports page, **when** the page loads, **then** a non-dismissible beta notice is visible at the top of the page with the text or equivalent: "Reports is in beta. Data shown is accurate, but presentation and calculations may change in future releases." |

### Should Have — important but not blocking launch

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-REP-010 | The Reports page allows the user to select a display currency (HUF, EUR, USD). When a non-HUF display currency is selected, all aggregate values are divided by the current exchange rate for that currency. The HUF conversion source rates remain the same (MNB). | **Given** a user selects EUR as display currency, **when** the pipeline value (normally shown in HUF) is calculated at 3 900 000 HUF and the EUR/HUF rate is 390, **then** the displayed value is 10 000 EUR. |
| PRD-REP-011 | The Reports page includes a year selector populated from years with existing deal data. When a year is selected, all KPI cards and the quarterly breakdown update to reflect that year. | **Given** deals exist in years 2024 and 2025, **when** the user opens the year selector, **then** 2024 and 2025 are listed; selecting one updates all report sections. |
| PRD-REP-012 | A quarterly breakdown table shows Actual (won deal value) and Forecast (won + open pipeline value) for each quarter of the selected year. | **Given** the year 2025 is selected and deals are present in Q2 and Q3, **when** the quarterly table renders, **then** Q2 and Q3 show non-zero actuals and/or forecasts; Q1 and Q4 show zeros. |
| PRD-REP-013 | An all-time stage breakdown table shows deal count and total value (in display currency) per stage across all years. | **Given** the database contains deals in all 6 stages, **when** the stage breakdown table renders, **then** each stage shows count and value; won and lost stages are included. |

### Could Have — nice to have, defer if needed

| ID | Requirement | Acceptance Criteria |
|----|-------------|-------------------|
| PRD-REP-020 | A bar chart visualization of quarterly actual vs. forecast is shown on the Reports page. | **Given** the Reports page loads with quarterly data, **when** the chart renders, **then** a grouped bar chart shows actual and forecast side-by-side for each quarter. |
| PRD-REP-021 | The Dashboard includes a stage breakdown representation (bar or progress) showing the count of deals per active pipeline stage. | **Given** the Dashboard loads, **when** the stage breakdown renders, **then** each of the four active stages (lead, qualified, proposal, negotiation) is shown with a deal count. |
| PRD-REP-022 | The exchange rate cache table is visible to admins in a system settings view, showing the last fetched rate and timestamp. | **Given** an admin views system settings, **when** the exchange rate section loads, **then** the current EUR/HUF and USD/HUF rates and their fetch timestamps are shown. |

### Will Not Have — explicit scope boundary for this release

| Item | Reason for exclusion |
|------|---------------------|
| Custom report builder (user-defined grouping, date ranges, filters) | Out of scope for this release. Standard year/quarter view is sufficient. |
| PDF or spreadsheet export of reports | Not in BRD scope. Post-MVP addition if requested by the sales team. |
| Forecasting model (probability-weighted pipeline) | Current pipeline value is a simple sum, not a probability-weighted forecast. Weighted forecasting is a significant feature requiring a deal probability field. |
| Historical exchange rate storage (one rate per day) | Daily sync overwrites the current cached rate. Historical rate lookups (e.g., what was the rate when the deal was created?) are out of scope. Deals display in current-rate equivalents only. |
| Report subscriptions or scheduled email delivery | No email integration in this release. |
| Revenue attribution by user/owner | Not in BRD scope; team is too small for individual quota tracking. |

## 6. Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| PRD-REP-NFR-001 | Performance | The Dashboard KPI cards load in under 2 seconds, including multi-currency conversion. | Measured by page load time with a seeded dataset of 200 deals in mixed currencies. |
| PRD-REP-NFR-002 | Reliability | If the MNB SOAP API is unavailable, the system falls back to the last successfully cached rates and flags the stale state. No unhandled exception reaches the user. | Verified by blocking the MNB endpoint and confirming the UI shows a stale rate notice instead of an error. |
| PRD-REP-NFR-003 | Accuracy | Exchange rates are fetched from the official MNB SOAP API. No hardcoded or third-party rate source is used. | Code review confirms the single source of exchange rate data is the MNB endpoint; no fallback rate is hardcoded. |
| PRD-REP-NFR-004 | Transparency | All monetary aggregates shown in the UI include an indicator of the currency conversion source and timestamp. | Visual audit: every aggregate display includes a note such as "MNB rate, last updated [date]." |
| PRD-REP-NFR-005 | Accessibility | The Reports page meets WCAG 2.1 AA. Chart visualizations include text alternatives for screen readers. | No critical violations in automated accessibility audit. |

## 7. Success Metrics

| Metric | Baseline | Target | How measured |
|--------|---------|--------|-------------|
| Pipeline value accuracy | Incorrect whenever EUR/USD deals exist (legacy) | Pipeline value equals manual calculation using MNB rates | Verified in test with seeded mixed-currency deals; automated test confirms |
| Exchange rate freshness | No exchange rate infrastructure (legacy) | Exchange rates updated daily; stale rate notice shown when >24 hours old | Monitoring: timestamp of last successful MNB sync |
| Personal Excel workaround usage | Péter uses Excel for multi-currency reporting (assumed) | Zero use of external spreadsheet for pipeline value (user feedback) | User feedback interview at 4-week post-launch |
| Reports page beta notice visibility | N/A | 100% of report page views include the beta notice in viewport | Visual audit; automated screenshot test |

## 8. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | At what time of day should the MNB daily rate sync run? The MNB publishes rates at approximately 11:00 CET on business days. Should we sync at 12:00 daily to ensure the latest rate? | juhaszj | TSD phase | Open — recommend 12:00 CET daily |
| 2 | What happens to deal values on weekends and holidays when MNB does not publish new rates? Should the system use the last business day's rate, or flag all weekend values as stale? | juhaszj | TSD phase | Open — recommend using last available rate, suppress stale notice on weekends |
| 3 | Should historical deal values (e.g., a deal created in 2024) use the current rate or the rate at the time the deal was created? | juhaszj | Before TSD | Open — recommend current rate only for simplicity; note as a known limitation in beta |
| 4 | Is the MNB SOAP API accessible from Vercel's deployment region (likely US or EU edge)? | juhaszj | Before TSD | Open — verify connectivity in infrastructure spike |

## 9. Out of Scope (explicit)

- Custom date range filtering in reports — reason: year/quarter granularity is sufficient for current reporting needs.
- PDF or spreadsheet export — reason: not in BRD scope; deferred to post-MVP.
- Probability-weighted forecasting — reason: requires a deal probability field not currently in the data model.
- Historical exchange rate storage — reason: current-rate conversion is sufficient for this release; historical rate lookup adds storage and complexity without a confirmed use case.
- Per-user revenue reporting / quotas — reason: team is too small; no quota management system exists.

## 10. Dependencies

- PRD-DEALS: Per-deal currency field must be part of the deal data model (PRD-DEAL-001, PRD-DEAL-006).
- PRD-AUTH: All reports endpoints require authenticated sessions.
- External: MNB SOAP API (`http://www.mnb.hu/arfolyamok.asmx`) must be accessible from the deployment environment (BRD D-4).

## 11. Next Steps

- [ ] Infrastructure spike: Verify MNB SOAP API accessibility from Vercel — owner juhaszj — before TSD
- [ ] Decide on weekend/holiday rate handling — owner juhaszj — before TSD
- [ ] TSD: Exchange rate cache schema and sync job design — due TBD
- [ ] TSD: Multi-currency aggregation logic specification — due TBD
- [ ] PRD review — due TBD
- [ ] PRD approval — due TBD

---

*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-13 | juhaszj | Initial draft |
