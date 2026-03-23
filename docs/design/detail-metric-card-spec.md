---
status: active
last-updated: 2026-03-16
owner: ui-designer
type: component-spec
project: had-management
---

# Component: Detail Metric Card

**Purpose:** Shows a single metric with a label and large value on detail pages (e.g. "Active deals: 5", "Open pipeline: 12.5M HUF"). Provides at-a-glance KPIs specific to the entity being viewed.

**PRD requirement:** ContactDetailPage — contact-level metrics row

---

## Anatomy

```
+-------------------------------+
|  [Label (uppercase, muted)]   |  CardHeader
|                               |
|  [Value (large, primary)]     |  CardContent
+-------------------------------+
```

Sub-parts:
1. **Label** — uppercase, muted, `text-xs` — identifies the metric
2. **Value** — `text-2xl`, primary-colored — the number or formatted amount

This is a simplified version of the KPI Card — no icon, no subtitle.

---

## Variants

| Variant | When to use |
|---------|------------|
| default | Numeric count (e.g. "5") |
| currency | Formatted currency value (e.g. "12 500 000 HUF") |
| percentage | Future: percentage display with optional trend indicator |

---

## States

| State | Visual change |
|-------|--------------|
| default | Card with border, flat background, value in `--primary` |
| hover | Not interactive — no hover state |
| active | N/A — display-only |
| focus | N/A — not focusable |
| disabled | N/A |
| loading | Two Skeleton bars: short one for label, wider one for value |
| empty/zero | Display "0" or formatted zero (e.g. "0 HUF") — never leave blank |

---

## Sizing

| Property | Value | Tailwind |
|----------|-------|----------|
| Grid layout | 3 equal columns, 12px gap | `grid grid-cols-3 gap-3` |
| Card padding (header) | Default CardHeader | — |
| Card padding (content) | Default CardContent | — |
| Label font | 12px, medium, uppercase, wide tracking | `text-xs font-medium uppercase tracking-wide` |
| Value font | 24px, semibold | `text-2xl font-semibold` |

---

## Token usage

- **Card background:** `--card`
- **Card border:** `--border`
- **Label text:** `--muted-foreground`
- **Value text:** `--primary`
- **Border radius:** `--radius` (0.375rem)
- **No shadows** — flat design

---

## Accessibility

- **Touch target:** N/A — display-only
- **Contrast ratio (label):** `--muted-foreground` on `--card` = ~5.0:1 — WCAG AA pass
- **Contrast ratio (value):** `--primary` on `--card` = ~3.2:1 — passes AA large text (24px semibold qualifies as large text per WCAG)
- **Contrast ratio (dark mode):** `--primary` (#10B3BA) on `--card` (#142733) = ~4.8:1 — WCAG AA pass
- **Keyboard:** Not applicable
- **ARIA:** Consider wrapping the metric group in `role="group"` with `aria-label` matching the label text for screen reader context. Label and value should be programmatically associated (e.g. the CardTitle serves as a visual label for the value).
- **Responsive:** At `< 768px`, collapse to `grid-cols-1` or `grid-cols-2`

---

## shadcn/ui mapping

- **Base component:** `Card`, `CardHeader`, `CardTitle`, `CardContent`
- **Customisation needed:**
  - `CardTitle` override: `text-xs font-medium uppercase tracking-wide text-muted-foreground`
  - Value rendered as `<p>` with `text-2xl font-semibold text-primary`
- **New component required:** Recommended — extract a `<DetailMetricCard label value />` wrapper to eliminate repetition across detail pages
- **Relationship to KPI Card:** This is structurally a subset of KPI Card (no icon, no subtitle). Could be unified as `<KpiCard>` with optional icon/subtitle props.
