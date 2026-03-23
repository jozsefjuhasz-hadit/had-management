# Project: had-management
> Layer: C:\claude\had-workspace\had-management\CLAUDE.md
> Workspace rules fully apply — only project-specific overrides are listed here.

Internal management tool (HAD CRM rewrite). Accessible only via company M365 accounts.

## Architecture

```
PRIMARY    Web UI       <--> Human (sales, admin)
SECONDARY  MCP Tools    <--> AI agents (Claude)
```

## Start commands

```bash
bun run dev          # dev server — localhost:3000
bun run typecheck    # TypeScript check
bun run lint         # ESLint
bun run test         # Vitest unit tests
bun run test:e2e     # Playwright E2E tests
bun run build        # production build
bunx drizzle-kit migrate   # run DB migrations
bunx drizzle-kit studio    # DB browser — localhost:4983
```

## Permissions model

| Role | Description |
|------|-------------|
| `admin` | Full access, user management |
| `manager` | Deal + contact management, reports |
| `sales` | Own deals + contacts only |

- All admin routes under `/(dashboard)/admin/` — middleware + Server Action double verification

## Terminology

<!-- Exception: Hungarian UI labels are intentional — the product UI language is Hungarian. This is not a language policy violation. -->
| English (code, DB, API) | Hungarian (UI, docs) |
|-------------------------|----------------------|
| `user` / `profile` | Felhasználó |
| `contact` | Kapcsolat |
| `deal` | Ügylet |
| `stage` | Fázis |
| `kam` / `responsible` | Felelős |
| `audit_log` | Napló |

## Project-specific constraints

- `profiles` table: auto-created via `handle_new_user()` trigger
- Env validation: `src/lib/env.ts` — throws on missing vars at startup
- shadcn/ui extension: wrap under `src/components/<feature>/`, never modify `/ui/` directly
- Multi-currency: MNB SOAP API (http://www.mnb.hu/arfolyamok.asmx), daily sync, default HUF
