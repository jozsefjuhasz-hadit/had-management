---
status: active
last-updated: 2026-03-16
owner: ui-designer
type: component-spec
project: had-management
---

# Component: Activity Timeline

**Purpose:** Displays a chronological list of activities (calls, emails, meetings, notes) on a deal or contact, giving the user a complete interaction history at a glance. Supports CRUD operations on deal detail pages.

**PRD requirement:** DealDetailPage — activity timeline with logging; ContactDetailPage — read-only activity timeline

---

## Anatomy

### Full variant (DealDetailPage)

```
+-------------------------------------------------------------+
|  Card                                                        |
|  +----------------------------------------------------------+
|  | [Tevékenység idővonal]     [+ Tevékenység rögzítése]     |  CardHeader
|  +----------------------------------------------------------+
|  |  [Icon]  [Type] · [Author] · [Contact] · [Timestamp]    |  Activity entry
|  |          [Content text]                                   |
|  |          [Edit] [Delete]  (visible on hover)              |
|  +----------------------------------------------------------+
|  |  [Icon]  [Type] · [Author] · [Timestamp]                |  Activity entry
|  |          [Content text]                                   |
|  +----------------------------------------------------------+
+-------------------------------------------------------------+
```

### Compact variant (ContactDetailPage)

```
+-------------------------------------------------------------+
|  Card                                                        |
|  +----------------------------------------------------------+
|  | [Tevékenység idővonal]                                   |  CardHeader
|  +----------------------------------------------------------+
|  |  [Type] · [Author]                                       |  Activity entry
|  |  [Content text]                                           |
|  |  [Relative timestamp]                                     |
|  +----------------------------------------------------------+
+-------------------------------------------------------------+
```

Sub-parts:
1. **Card wrapper** — standard Card with CardHeader and CardContent
2. **Header** — title + optional action button (log activity)
3. **Activity entry** — icon + metadata line + content + optional actions
4. **Activity icon** — type-specific Lucide icon (`PhoneIcon`, `MailIcon`, `UsersIcon`, `MessageSquareIcon`)
5. **Metadata line** — activity type label, author name, optional linked contact, timestamp
6. **Content** — free text description of the activity
7. **Action buttons** — edit and delete, visible only on hover (`group-hover:opacity-100`)
8. **Empty state** — text message when no activities exist

---

## Variants

| Variant | When to use |
|---------|------------|
| full | Deal detail page — includes icons, linked contacts, edit/delete actions, log button |
| compact | Contact detail page — simplified, no icons, no actions, read-only |

---

## States

| State | Visual change |
|-------|--------------|
| default | Activity entries stacked with `space-y-3` gap |
| hover (entry) | Edit/delete buttons fade in via `opacity-0 group-hover:opacity-100` transition |
| hover (action button) | Ghost button hover state |
| active | N/A — entries are not clickable |
| focus (action button) | `ring-2 ring-[--ring] ring-offset-2` |
| disabled | N/A |
| loading | Skeleton entries: icon circle + 2 text bars per entry, 3 placeholder entries |
| empty | Centered muted text: "Meg nincs rogzitett tevekenyseg." |
| edited | "(szerkesztve [timestamp])" appended to metadata line |

---

## Sizing

| Property | Value | Tailwind |
|----------|-------|----------|
| Entry gap | 12px | `space-y-3` |
| Icon size | 16px (4 units) | `size-4` |
| Icon-to-content gap | 12px | `gap-3` |
| Type label font | 12px, medium | `text-xs font-medium` |
| Metadata font | 12px, normal | `text-xs` |
| Content font | 14px, normal | `text-sm` |
| Timestamp font | 12px, normal | `text-xs` |
| Action buttons | icon-xs size (ghost variant) | `size="icon-xs" variant="ghost"` |
| Action button transition | opacity, default duration | `transition-opacity` |

---

## Token usage

- **Card background:** `--card`
- **Card border:** `--border`
- **Icon color:** `--muted-foreground`
- **Type label text:** `--muted-foreground`
- **Author/timestamp text:** `--muted-foreground`
- **Content text:** `--card-foreground`
- **Action buttons:** ghost variant uses `--muted-foreground` icons
- **Empty state text:** `--muted-foreground`
- **Border radius:** `--radius` on Card
- **No shadows** — flat design

---

## Activity type icons

| Type | Icon | Label |
|------|------|-------|
| call | `PhoneIcon` | Hivas |
| email | `MailIcon` | Email |
| meeting | `UsersIcon` | Talalkozo |
| note | `MessageSquareIcon` | Feljegyzes |

Icons are defined in `ACTIVITY_ICONS` in DealDetailPage. Consider extracting to a shared constant.

---

## Accessibility

- **Touch target:** Action buttons (edit/delete) must meet 44px minimum. Current `icon-xs` size may be smaller — verify implementation and add sufficient padding if needed.
- **Contrast ratio (metadata):** `--muted-foreground` on `--card` = ~5.0:1 — WCAG AA pass
- **Contrast ratio (content):** `--card-foreground` on `--card` = ~15.4:1 — WCAG AAA pass
- **Keyboard:**
  - Tab navigates to action buttons within each entry
  - Action buttons are standard Buttons — Enter/Space activates
  - Log activity button in header is focusable
  - Consider `aria-label` on action buttons since they use icon-only display ("Szerkesztes" / "Torles")
- **ARIA:**
  - Timeline container: consider `role="feed"` or `role="list"` with `aria-label="Tevekenyseg idovonal"`
  - Each entry: `role="article"` or `role="listitem"`
  - Action buttons: must have `title` or `aria-label` (currently using `title` attribute)
  - Empty state: `role="status"` with `aria-live="polite"`
  - Edit/delete dialogs: properly managed via shadcn Dialog (focus trap built-in)
- **Screen reader order:** Entries are sorted newest-first. Consider announcing sort order.

---

## shadcn/ui mapping

- **Base component:** `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- **Customisation needed:**
  - Header uses flex layout with justify-between for title + action button
  - Ghost button with `icon-xs` size for inline edit/delete
  - `group` / `group-hover:opacity-100` for reveal-on-hover pattern
- **New component required:** Recommended — extract `<ActivityTimeline activities onEdit onDelete onLog variant="full"|"compact" />` to share between DealDetailPage and ContactDetailPage
- **Sub-components to extract:**
  - `<ActivityEntry>` — single entry with icon, metadata, content, actions
  - `<LogActivityForm>` — already exists inline, extract to shared component
