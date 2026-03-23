---
status: active
last-updated: 2026-03-16
owner: ui-designer
type: component-spec
project: had-management
---

# Component: Data Table

**Purpose:** Presents a collection of records (contacts, deals) in a scannable, tabular layout with a fixed header row and clickable data rows that navigate to detail pages. Optimized for data density in B2B admin contexts.

**PRD requirement:** ContactsPage — contact list; DealsPage — deal list

---

## Anatomy

```
+-------------------------------------------------------------+
|  Card (no padding)                                           |
|  +----------------------------------------------------------+
|  | [Col1]  [Col2]  [Col3]  [Col4]  [Col5]  |  Header row   |
|  +----------------------------------------------------------+
|  | [Data]  [Data]  [Data]  [Data]  [Data]  |  Data row 1    |  <-- clickable Link
|  +----------------------------------------------------------+
|  | [Data]  [Data]  [Data]  [Data]  [Data]  |  Data row 2    |  <-- clickable Link
|  +----------------------------------------------------------+
|  | ...                                                       |
+-------------------------------------------------------------+
```

Sub-parts:
1. **Card wrapper** — `CardContent` with `p-0` to eliminate padding, giving the table a full-bleed appearance
2. **Header row** — grid row with uppercase muted labels, non-interactive
3. **Data rows** — grid rows wrapped in `<Link>`, separated by `divide-y`
4. **Cell content** — text, badges, icons, or composite elements (name + subtitle)
5. **Empty state** — centered icon + message when no results match filters

---

## Variants

| Variant | When to use |
|---------|------------|
| contacts | 5-column layout: Name/Company, Email, Source, Owner, Last interaction |
| deals | Similar layout adapted for deal fields: Title, Contact, Stage, Value, Date |
| generic | Future: configurable column definitions |

Current implementations are page-specific inline compositions. No shared component exists yet.

---

## States

| State | Visual change |
|-------|--------------|
| default | Rows displayed with `divide-y` separators, flat background |
| hover (row) | `hover:bg-muted/40` — subtle muted background shift, 150ms transition |
| active (row) | Browser-default link active state |
| focus (row) | `focus-visible:ring-2 ring-[--ring] ring-offset-2` on the Link element |
| disabled | N/A — rows are always navigable if present |
| loading | Skeleton rows: 5 skeleton bars per row, matching column widths. Show 5 placeholder rows. |
| empty (filtered) | Centered `SearchIcon` (size-6) + "Nincs talalt a szuresre." text in `text-muted-foreground` |
| empty (no data) | Centered entity icon (size-10) + explanatory text + CTA button |

---

## Sizing

| Property | Value | Tailwind |
|----------|-------|----------|
| Card padding | 0 | `p-0` on CardContent |
| Header row height | ~36px (auto from padding) | `py-2 px-4` |
| Header font | 12px, medium, uppercase, wide tracking | `text-xs font-medium uppercase tracking-wide` |
| Data row height | ~48px (auto from padding) | `py-3 px-4` |
| Data row primary text | 14px, medium | `text-sm font-medium` |
| Data row secondary text | 12px, muted | `text-xs text-muted-foreground` |
| Column grid (contacts) | `2fr 1.5fr 1fr 1fr 1fr` | `grid-cols-[2fr_1.5fr_1fr_1fr_1fr]` |
| Column gap | 16px | `gap-4` |
| Row hover transition | 150ms background-color | `transition-[background-color] duration-150` |

---

## Token usage

- **Card background:** `--card`
- **Card border:** `--border`
- **Header text:** `--muted-foreground`
- **Row background (default):** transparent (inherits `--card`)
- **Row background (hover):** `--muted` at 40% opacity
- **Primary cell text:** `--card-foreground`
- **Secondary cell text:** `--muted-foreground`
- **Row dividers:** `divide-y` uses `--border`
- **Border radius:** `--radius` on Card only; rows have `rounded-lg` on hover for clipped effect
- **No shadows** — flat design

---

## Accessibility

- **Touch target:** Entire row is a `<Link>` — row height 48px meets 44px minimum
- **Contrast ratio (header):** `--muted-foreground` on `--card` = ~5.0:1 — WCAG AA pass
- **Contrast ratio (data):** `--card-foreground` (#142733) on `--card` (#ffffff) = ~15.4:1 — WCAG AAA pass
- **Contrast ratio (dark mode):** `--card-foreground` (#ffffff) on `--card` (#142733) = ~15.4:1 — WCAG AAA pass
- **Keyboard:**
  - Each row is a `<Link>`, so Tab navigates row-by-row
  - Enter/Space activates the link
  - Consider `role="table"`, `role="row"`, `role="columnheader"`, `role="cell"` for screen reader semantics if not using native `<table>` elements
- **ARIA:**
  - Header row: should have `role="row"` with `role="columnheader"` cells
  - Data rows: `role="row"` with `role="cell"` children
  - Empty state: `role="status"` with `aria-live="polite"`
  - Current implementation uses divs with grid — consider adding explicit ARIA roles or migrating to semantic `<table>`
- **Responsive:** At `< 768px`, hide non-essential columns (source, last interaction). At `< 480px`, show only name + primary badge.

---

## shadcn/ui mapping

- **Base component:** `Card`, `CardContent`
- **Customisation needed:**
  - `CardContent` with `p-0` class override
  - Row layout uses CSS Grid, not shadcn Table component
  - Badge components for source/stage indicators
- **New component required:** Recommended — extract a `<DataTable columns rows emptyState />` component that encapsulates the grid pattern, header rendering, row linking, and empty states
- **Alternative:** shadcn/ui `Table` component could be used, but current grid approach gives more flexible column sizing. If migrating, use `<Table>` + `<TableHeader>` + `<TableRow>` + `<TableCell>`.
