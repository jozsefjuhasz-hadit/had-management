# shadcn/ui — Project Skill

## Project Context

This project uses **shadcn/ui** with the following configuration (from `components.json`):

| Setting | Value |
|---------|-------|
| Style | base-nova (shadcn v4 equivalent of New York) |
| Base color | Neutral |
| CSS variables | enabled |
| Icon library | lucide |
| RSC | true |
| TSX | true |

## Framework

**Next.js App Router** — `rsc: true` means components are Server Components by default.
Use `"use client"` directive when client-side interactivity is needed.

## Aliases

| Alias | Path |
|-------|------|
| `@/components/ui` | `components/ui/` |
| `@/components` | `components/` |
| `@/lib/utils` | `lib/utils.ts` |
| `@/lib` | `lib/` |
| `@/hooks` | `hooks/` |

## Installed Components

- `button` — `components/ui/button.tsx`

## Adding Components

```bash
npx shadcn@latest add <component-name>
```

Examples:
```bash
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add table
```

## Usage Pattern

```tsx
// Server Component (default)
import { Button } from "@/components/ui/button"

// Client Component (when needed)
"use client"
import { Button } from "@/components/ui/button"
```

## CSS Variables

Theme variables are defined in `app/globals.css`.
Colors follow the CSS variable pattern: `hsl(var(--primary))`.
