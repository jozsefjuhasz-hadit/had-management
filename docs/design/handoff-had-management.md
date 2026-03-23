---
status: active
last-updated: 2026-03-16
owner: ui-designer
type: developer-handoff
project: had-management
---

# UI Handoff — had-management / composite components

Date: 2026-03-16
Designed by: ui-designer agent

---

## Components specified

1. [KPI Card](./kpi-card-spec.md) — Dashboard metric card with label, value, subtitle, icon
2. [Data Table](./data-table-spec.md) — Card-based tabular list with header row and clickable rows
3. [Detail Metric Card](./detail-metric-card-spec.md) — Simplified metric card for detail pages
4. [Activity Timeline](./activity-timeline-spec.md) — Chronological activity list with CRUD support
5. [Stage Badge](./stage-badge-spec.md) — Color-coded pipeline stage indicator

---

## Design tokens used

### Core tokens (from shadcn/ui CSS variables)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--card` | #ffffff | #142733 | Card backgrounds |
| `--card-foreground` | #142733 | #ffffff | Primary text on cards |
| `--primary` | #10B3BA | #10B3BA | KPI values, metric values, links |
| `--primary-foreground` | #ffffff | #142733 | Text on primary backgrounds |
| `--muted` | #f0f4f5 | #1a303e | Row hover (at 40% opacity) |
| `--muted-foreground` | #4a6a78 | #7a9aaa | Labels, metadata, icons, timestamps |
| `--border` | #d1dce1 | #1e3a4a | Card borders, row dividers |
| `--ring` | #10B3BA | #10B3BA | Focus rings |
| `--destructive` | #dc2626 | #ef4444 | Delete actions, validation errors |
| `--radius` | 0.375rem | 0.375rem | Border radius |

### Stage badge tokens (oklch color space)

| Token | Usage |
|-------|-------|
| `--stage-lead-bg` / `--stage-lead-fg` | Lead stage badge |
| `--stage-qualified-bg` / `--stage-qualified-fg` | Qualified stage badge, Email source badge |
| `--stage-proposal-bg` / `--stage-proposal-fg` | Proposal stage badge, Referral/LinkedIn source badge |
| `--stage-negotiation-bg` / `--stage-negotiation-fg` | Negotiation stage badge |
| `--stage-won-bg` / `--stage-won-fg` | Won stage badge |
| `--stage-lost-bg` / `--stage-lost-fg` | Lost stage badge |

### Typography tokens

| Token | Value | Usage |
|-------|-------|-------|
| `text-xs` | 12px | Labels, badges, metadata, timestamps |
| `text-sm` | 14px | Table cells, activity content, secondary text |
| `text-2xl` | 24px | KPI values, metric values |
| `font-medium` | 500 | Labels, cell primary text |
| `font-semibold` | 600 | Values, headings |
| `uppercase tracking-wide` | — | Section labels, table headers |

---

## shadcn/ui components required

| Component | Variant | Customisation |
|-----------|---------|--------------|
| Card | default | No shadow (flat design enforced globally) |
| CardHeader | default | Standard usage |
| CardTitle | default | Override to `text-xs font-medium uppercase tracking-wide text-muted-foreground` for metric labels |
| CardContent | default | `p-0` for Data Table; default for others |
| Badge | default | Class override via `STAGE_BADGE_CLASSES` — `bg-[var(--stage-{name}-bg)]` `text-[var(--stage-{name}-fg)]` `border-transparent` |
| Badge | outline | Used for date badges, archived status |
| Button | outline | Edit, cancel actions |
| Button | ghost | `icon-xs` size for timeline inline actions |
| Button | default | Primary actions (save, log activity) |
| Button | destructive | Delete confirmation |
| Dialog | default | Activity log/edit, delete confirmation |
| Skeleton | default | Loading states for all components |

---

## New components (not in shadcn/ui)

These are composite components that should be extracted from existing page-level code:

### 1. KpiCard

```
Props: { label: string; value: string; subtitle?: string; icon?: ReactNode }
```

Wraps Card + CardHeader + CardContent. Used on DashboardPage. Could also serve DetailMetricCard use case with optional icon/subtitle.

### 2. DataTable

```
Props: { columns: ColumnDef[]; rows: Row[]; onRowClick: (id) => void; emptyState: ReactNode }
```

Wraps Card with p-0 CardContent, grid-based header and rows. Currently implemented inline in ContactsPage and DealsPage.

### 3. ActivityTimeline

```
Props: { activities: Activity[]; variant: "full" | "compact"; onLog?: () => void; onEdit?: (id) => void; onDelete?: (id) => void }
```

Wraps Card with sorted activity entries. Full variant includes icons and CRUD actions. Compact variant is read-only.

### 4. StageBadge (optional extraction)

```
Props: { stage: DealStage }
```

Wraps Badge with automatic class and label lookup from constants. Simplifies usage from `<Badge className={STAGE_BADGE_CLASSES[stage]}>{STAGE_LABELS[stage]}</Badge>` to `<StageBadge stage={stage} />`.

---

## Accessibility summary

| Component | Contrast | Keyboard | ARIA |
|-----------|----------|----------|------|
| KPI Card | AA pass (value as large text) | N/A (display-only) | Decorative icons need `aria-hidden` |
| Data Table | AAA pass (data text) | Tab through rows (Link), Enter to navigate | Needs `role="table"` or semantic `<table>` migration |
| Detail Metric Card | AA pass (value as large text) | N/A (display-only) | Consider `role="group"` + `aria-label` |
| Activity Timeline | AA pass (all text) | Tab to action buttons | Action buttons need `aria-label`; container needs `role="list"` |
| Stage Badge | AA pass (all stage colors) | N/A (display-only) | Text labels ensure color independence |

---

## What ui-prototyper needs from this handoff

- **Token overrides:** None — all tokens are already defined in `globals.css` and `SKILL.md`. Stage tokens use oklch, must be referenced via CSS variables only.
- **Component variants:** Extract KpiCard, DataTable, ActivityTimeline as shared components in `components/shared/` or `components/ui/`. StageBadge extraction is optional.
- **State behaviours:**
  - Data Table rows: `hover:bg-muted/40` with `transition-[background-color] duration-150`
  - Activity Timeline actions: `opacity-0 group-hover:opacity-100 transition-opacity`
  - Loading states: use shadcn Skeleton component for all 5 components
  - Empty states: centered icon + muted text, never blank cards
- **Known visual decisions:**
  - No shadows anywhere — flat design is non-negotiable
  - No gradients anywhere — removed in brand-guardian audit
  - KPI/metric values use `text-primary` (brand teal) — this is intentional for visual hierarchy
  - Table headers are uppercase muted labels — consistent across all data tables
  - Stage badge border is always `transparent` — color distinction comes from bg/fg only
  - Row hover uses `muted/40` not full `muted` — subtlety is intentional

---

## What is NOT in this handoff

- **Form components** — CreateContactForm, LogActivityForm, CloseDealDialog are form-heavy components that need their own specification pass
- **Page layout** — overall page structure, sidebar, breadcrumbs, page-header are shared components already implemented and not re-specified here
- **Responsive breakpoints** — noted in each spec but not fully designed; desktop-first is the current approach per user research
- **Animation/motion** — only hover transitions specified; no page transitions, mount animations, or skeleton-to-content transitions designed
- **Error states** — form validation errors are in form components (not in this handoff); API error states for data fetching not yet designed
- **Pagination** — Data Table currently shows all rows; pagination design deferred
- **Sorting** — Data Table currently has no sort functionality; column sort UX not designed
- **Dark mode verification** — token values are defined for dark mode but visual testing against actual dark renders is not included in this pass
- **Stage history timeline** — similar to Activity Timeline but with different data shape (DealDetailPage right column); not specified separately but follows same pattern
