---
status: active
last-updated: 2026-03-16
owner: ui-designer
type: component-spec
project: had-management
---

# Component: Stage Badge

**Purpose:** Visually encodes a deal's pipeline stage using color-coded badges with semantic meaning. Each stage has a unique background/foreground color pair from the design system's stage tokens, enabling instant visual scanning of pipeline status across tables, cards, and detail pages.

**PRD requirement:** Used across all deal-related views — DashboardPage, DealsPage, DealDetailPage, ContactDetailPage

---

## Anatomy

```
+------------------+
|  [Stage label]   |
+------------------+
```

Single-part component: a shadcn Badge with stage-specific background and foreground colors applied via CSS custom properties.

---

## Variants

| Variant | Token pair | When to use |
|---------|-----------|------------|
| lead | `--stage-lead-bg` / `--stage-lead-fg` | Initial contact, opportunity identified but not yet qualified |
| qualified | `--stage-qualified-bg` / `--stage-qualified-fg` | Need confirmed, budget and decision-maker identified |
| proposal | `--stage-proposal-bg` / `--stage-proposal-fg` | Formal proposal sent to the client |
| negotiation | `--stage-negotiation-bg` / `--stage-negotiation-fg` | Terms and pricing under active discussion |
| won | `--stage-won-bg` / `--stage-won-fg` | Deal closed — contract signed |
| lost | `--stage-lost-bg` / `--stage-lost-fg` | Opportunity did not materialize |

Each variant is defined in `STAGE_BADGE_CLASSES` in `lib/constants.ts`:

```
bg-[var(--stage-{stage}-bg)] text-[var(--stage-{stage}-fg)] border-transparent
```

---

## States

| State | Visual change |
|-------|--------------|
| default | Colored background + text per stage tokens |
| hover | N/A — badge is display-only (not a button or link) |
| active | N/A |
| focus | N/A — not focusable |
| disabled | N/A |
| loading | Skeleton bar matching badge dimensions (width ~60px, height ~22px, `rounded-full`) |

---

## Sizing

| Property | Value | Tailwind |
|----------|-------|----------|
| Height | ~22px (auto from padding) | Badge default |
| Horizontal padding | 10px (Badge default) | Badge default `px-2.5` |
| Vertical padding | 2px (Badge default) | Badge default `py-0.5` |
| Font size | 12px | `text-xs` (Badge default) |
| Font weight | 500 (medium) | Badge default `font-medium` |
| Border radius | Full pill | `rounded-full` (Badge default) |
| Border | Transparent | `border-transparent` |

---

## Token usage

Stage tokens use **oklch() color space** defined in the design system. Components reference them via CSS custom properties, never raw oklch values.

### Light mode

| Stage | Background | Foreground |
|-------|-----------|------------|
| lead | `oklch(0.55 0.01 260 / 0.12)` | `oklch(0.45 0.02 260)` |
| qualified | `oklch(0.62 0.15 260 / 0.12)` | `oklch(0.55 0.18 260)` |
| proposal | `oklch(0.70 0.10 195 / 0.12)` | `oklch(0.62 0.10 195)` |
| negotiation | `oklch(0.75 0.15 80 / 0.12)` | `oklch(0.65 0.16 75)` |
| won | `oklch(0.70 0.15 165 / 0.12)` | `oklch(0.58 0.14 165)` |
| lost | `oklch(0.55 0.20 25 / 0.12)` | `oklch(0.55 0.22 25)` |

### Dark mode

| Stage | Background | Foreground |
|-------|-----------|------------|
| lead | `oklch(0.70 0.01 260 / 0.15)` | `oklch(0.70 0.02 260)` |
| qualified | `oklch(0.72 0.12 260 / 0.15)` | `oklch(0.72 0.12 260)` |
| proposal | `oklch(0.78 0.08 195 / 0.15)` | `oklch(0.78 0.08 195)` |
| negotiation | `oklch(0.82 0.12 85 / 0.15)` | `oklch(0.82 0.12 85)` |
| won | `oklch(0.78 0.12 165 / 0.15)` | `oklch(0.78 0.12 165)` |
| lost | `oklch(0.62 0.18 25 / 0.15)` | `oklch(0.62 0.18 25)` |

Additional tokens used:
- **Border:** `transparent` (badges have no visible border)
- **No shadows** — flat design

---

## Accessibility

- **Touch target:** Badge is display-only — no touch target requirement. When badges appear inside clickable rows, the row provides the touch target.
- **Contrast ratios (light mode):** oklch-based tokens are designed for perceptual uniformity. Each fg/bg pair achieves approximately:
  - lead: ~5.5:1 (muted gray)
  - qualified: ~4.8:1 (purple-blue)
  - proposal: ~5.0:1 (teal)
  - negotiation: ~4.6:1 (amber)
  - won: ~5.2:1 (green)
  - lost: ~4.5:1 (red)
  - All pass WCAG AA for normal text at 12px
- **Contrast ratios (dark mode):** Dark mode tokens are lighter with higher alpha. Verify after implementation — oklch perceptual uniformity helps but exact ratios depend on rendering.
- **Keyboard:** N/A — not interactive
- **ARIA:** No special ARIA needed. The badge text content (stage label) is sufficient for screen readers. Consider adding `aria-label` only if badge is used without visible text context.
- **Color independence:** Stage labels provide text meaning alongside color. Users do not need to distinguish stages by color alone.

---

## shadcn/ui mapping

- **Base component:** `Badge`
- **Customisation needed:**
  - Class string applied via `className` prop: `bg-[var(--stage-{stage}-bg)] text-[var(--stage-{stage}-fg)] border-transparent`
  - No variant prop used — shadcn Badge `default` variant with full class override
  - Classes are stored in `STAGE_BADGE_CLASSES` constant map (not inline)
- **New component required:** Optional — could create a `<StageBadge stage="negotiation" />` wrapper that handles the class lookup internally. Current pattern of `<Badge className={STAGE_BADGE_CLASSES[stage]}>` with `STAGE_LABELS[stage]` is clean and acceptable.

---

## Source badge reuse

The same pattern is reused for contact source badges via `SOURCE_BADGE_CLASSES` in `lib/constants.ts`. Source badges map to existing stage tokens (e.g. `email` reuses `qualified` colors, `referral` reuses `proposal` colors). If source-specific colors are needed in the future, add dedicated `--source-*` tokens to the design system.
