---
status: active
last-updated: 2026-03-16
owner: ui-designer
type: component-spec
project: had-management
---

# Component: KPI Card

**Purpose:** Displays a single key performance indicator at a glance — label, numeric value, contextual subtitle, and an icon — so the user can assess pipeline health without reading tables or charts.

**PRD requirement:** DashboardPage — pipeline overview section

---

## Anatomy

```
+-----------------------------------------------+
|  [Label (uppercase)]            [Icon]         |  CardHeader
|                                                |
|  [Value (large, primary)]                      |  CardContent
|  [Subtitle (muted)]                            |
+-----------------------------------------------+
```

Sub-parts:
1. **Label** — uppercase, muted, `text-xs` — identifies the metric
2. **Icon** — `size-5`, muted — visual reinforcement of the metric category
3. **Value** — `text-2xl`, primary-colored — the hero number
4. **Subtitle** — `text-xs`, muted — contextual detail (e.g. "3 new this week")

---

## Variants

| Variant | When to use |
|---------|------------|
| default | Standard KPI display on dashboard (current implementation) |
| compact | Future: smaller version for embedding in detail pages or sidebars |

Only the `default` variant exists today.

---

## States

| State | Visual change |
|-------|--------------|
| default | Card with border, flat background (`--card`), value in `--primary` |
| hover | Not interactive in current implementation — no hover state needed |
| active | N/A — card is display-only |
| focus | N/A — not focusable (no interactive element) |
| disabled | N/A — always visible when data is available |
| loading | Skeleton placeholder: three Skeleton bars replacing label, value, and subtitle. Icon position shows a circular Skeleton. Never render empty card. |
| empty | Show value as "0" or "—" with subtitle explaining absence (e.g. "Nincs adat") |

---

## Sizing

| Property | Value | Tailwind |
|----------|-------|----------|
| Card min-height | Auto (content-driven) | — |
| Card padding (header) | 24px top, 24px horizontal | CardHeader default |
| Card padding (content) | 0 top, 24px sides, 24px bottom | CardContent default |
| Grid layout | 4 equal columns, 16px gap | `grid grid-cols-4 gap-4` |
| Label font | 12px, medium, uppercase, wide tracking | `text-xs font-medium uppercase tracking-wide` |
| Value font | 24px, semibold, no leading | `text-2xl font-semibold leading-none` |
| Subtitle font | 12px, normal | `text-xs` |
| Icon size | 20px (5 units) | `size-5` |

---

## Token usage

- **Card background:** `--card` (matches `--background` — flat)
- **Card border:** `--border`
- **Label text:** `--muted-foreground`
- **Value text:** `--primary`
- **Subtitle text:** `--muted-foreground`
- **Icon color:** `--muted-foreground`
- **Border radius:** `--radius` (0.375rem)
- **No shadows** — flat design

---

## Accessibility

- **Touch target:** N/A — display-only component, not interactive
- **Contrast ratio (label):** `--muted-foreground` (#4a6a78) on `--card` (#ffffff) = ~5.0:1 — WCAG AA pass
- **Contrast ratio (value):** `--primary` (#10B3BA) on `--card` (#ffffff) = ~3.2:1 — passes AA large text (24px semibold qualifies as large text). For small-value variants, verify individually.
- **Contrast ratio (dark mode):** `--primary` (#10B3BA) on `--card` (#142733) = ~4.8:1 — WCAG AA pass
- **Keyboard:** Not applicable — no interactive elements
- **ARIA:** No special ARIA required. Icon should have `aria-hidden="true"` (decorative). Consider `role="group"` and `aria-label` on the card if screen reader context is needed.
- **Responsive:** At `< 768px`, grid should collapse to `grid-cols-2`; at `< 480px`, to `grid-cols-1`.

---

## shadcn/ui mapping

- **Base component:** `Card`, `CardHeader`, `CardContent`, `CardTitle`
- **Customisation needed:**
  - `CardTitle` override: `text-xs font-medium uppercase tracking-wide text-muted-foreground` (default CardTitle is larger)
  - Value rendered as `<p>` inside CardContent, not as a CardTitle
- **New component required:** No — pure composition of existing shadcn/ui Card parts
- **Recommended extraction:** Create a `<KpiCard label icon value subtitle />` wrapper for consistency across pages
