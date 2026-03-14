---
status: draft
last-updated: 2026-03-13
owner: juhaszj
type: ux-research
subtype: personas
project: had-management
source-documents:
  - docs/whitepaper-had-management.md
  - docs/brd/BRD-had-management.md
---

# UX Research — Personas
## HAD Management Rewrite · 2026-03-13

> **Evidence policy:** Every item is labeled `[ASSUMED]` or `[DATA-BASED]`.
> `[DATA-BASED]` = directly stated in the whitepaper or BRD.
> `[ASSUMED]` = inferred from context, role patterns, or standard UX research knowledge for this domain.
> No assumed item is presented as a finding without the label.

---

## Context & Scope

The HAD Management system serves a **single small company's internal B2B sales team** [DATA-BASED: whitepaper, I-1]. User research interviews have not been conducted — this persona set is constructed from the requirements documents. Every behavioral and emotional attribute is marked accordingly.

**User population size:** 2-5 sales team members + 1 IT admin [DATA-BASED: BRD §3].
**Primary operator of most CRM writes:** AI agent (Claude Code via MCP) [DATA-BASED: whitepaper].
**Human UI role:** oversight, review, visualization, and exception handling [DATA-BASED: whitepaper].

---

## Persona 1 — Kovács Péter

### Senior Account Manager

> **"Látnom kell, mi áll a számok mögött — különben csak vakrepülés az egész."**
> *(I need to see what's behind the numbers — otherwise the whole thing is blind flying.)*
> [ASSUMED — representative quote for this role archetype]

---

### Basic Profile

| Attribute | Value |
|-----------|-------|
| Name | Kovács Péter |
| Age | 38 [ASSUMED] |
| Role | Senior Account Manager |
| Tenure | 5+ years [ASSUMED] |
| Location | Budapest office [ASSUMED] |
| Primary device | Desktop (Windows laptop) [ASSUMED — internal tool, desktop-primary: BRD §5.2 OS-5] |

---

### Role & Context

Péter manages the largest and most complex accounts in the pipeline [ASSUMED]. He owns 10-20 active deals at any time across multiple pipeline stages [ASSUMED — estimated from BRD §3 "daily users" + small team size]. His day involves reviewing pipeline health, updating deal statuses after client calls, and preparing quarterly pipeline reports for management [ASSUMED].

He does not configure the CRM or handle system administration — he expects it to just work [ASSUMED]. The AI agent (Claude Code) handles most routine data entry on his behalf; Péter reviews the AI's output through the web UI and corrects exceptions [DATA-BASED: whitepaper — "Human oversight and visualization layer"].

He has been using the legacy HAD CRM since its inception and has adapted his workflows around its limitations — including entering currency values always in HUF even when a deal is EUR-denominated, and keeping a personal Excel sheet to compensate for missing stage history [ASSUMED — common adaptation behavior when CRM lacks stage audit trail; BRD §2 confirms no audit trail existed].

---

### Goals

1. Instantly see the current state of his pipeline without needing to click into individual deals [ASSUMED]
2. Trust that deal values and stages reflect reality — not AI agent errors or stale data [ASSUMED — tied to DATA-BASED "human-in-the-loop" oversight model]
3. Record what was discussed in a client call without switching context (mobile or quick UI entry) [ASSUMED]
4. Understand which deals are at risk — overdue next steps, no recent activity [ASSUMED — standard pipeline management goal]
5. Get accurate HUF-equivalent values for EUR and USD deals in pipeline reports [DATA-BASED: BRD BO-4, OQ-3]

---

### Frustrations

1. **Cannot see activity history on the deal page** — activities are fetched but not rendered [DATA-BASED: whitepaper F-3, debt-backlog F-3]. He has to infer deal context from notes fields [ASSUMED].
2. **No audit trail for stage changes** — when a deal's stage has changed, there is no record of when or who moved it [DATA-BASED: BRD §2 problem #3, debt-backlog D-6].
3. **Free-text KAM and owner fields** — typos mean deals don't filter correctly by owner [DATA-BASED: debt-backlog D-1, D-2].
4. **HUF-only reporting** — EUR/USD deals must be mentally converted; Excel is needed for accurate pipeline value [DATA-BASED: BRD §2 problem #4, BO-4].
5. **Deal detail page is read-only** — editing requires going through MCP or direct API, which he cannot do directly [DATA-BASED: debt-backlog F-6].

---

### Behaviours

- Opens the dashboard first every morning to scan pipeline health [ASSUMED]
- Sorts the deals list by "last interaction" to find neglected deals [ASSUMED — standard CRM power user behavior; feature exists DATA-BASED: whitepaper §6]
- Creates a note after every significant client call [ASSUMED] — currently frustrated this is not possible from the UI [DATA-BASED: debt-backlog F-7]
- Checks the Reports page at month/quarter end for revenue numbers [DATA-BASED: BRD S-8, whitepaper §9]
- Keeps personal Excel backup of pipeline with multi-currency totals [ASSUMED — compensating behavior for missing feature]

---

### Tech Comfort

**Level:** Medium-high [ASSUMED]
- Comfortable with CRM-style software and form-based data entry
- Does not write code or use MCP tools directly
- Expects the system to behave like standard enterprise software (CRUD forms, sortable tables, search)
- Trusts the AI agent to do data entry; skeptical until he can verify results in the UI [ASSUMED]

---

### Preferred Channels

- Web UI (desktop browser) [DATA-BASED: whitepaper — "Sales / Account Manager: Web UI (React SPA)"]
- No mobile UI required [DATA-BASED: BRD OS-5 — mobile explicitly out of scope]

---

### What Success Looks Like

- Pipeline view loads in under 2 seconds and is always accurate [ASSUMED for performance; DATA-BASED for accuracy requirement via BRD BO-2, BO-3]
- He can see the full activity history on a deal page in chronological order [DATA-BASED: BRD S-6; addresses debt F-3]
- EUR and USD deal values appear with MNB-converted HUF equivalents [DATA-BASED: BRD BO-4]
- He can log a quick note from the deal detail page without needing MCP access [ASSUMED — addresses debt F-7]
- Deal owner is a real person from the company directory, not a typo-prone free text field [DATA-BASED: BRD BO-5]

---

### Assumption Flags

| Item | Label | Confidence |
|------|-------|-----------|
| Age 38 | ASSUMED | Low |
| 10-20 active deals | ASSUMED | Medium |
| Personal Excel for multi-currency | ASSUMED | High — compensating behavior for known gap |
| Opens dashboard first | ASSUMED | High — standard CRM user behavior |
| Activity after client call | ASSUMED | High — universal sales behavior |
| Trust-but-verify stance on AI agent | ASSUMED | High — consistent with "human-in-the-loop" design |

---

---

## Persona 2 — Szabó Ágnes

### Sales Representative (Junior/Mid)

> **"Ha megcsinálom amit kell, ne kelljen kétszer beírnom."**
> *(If I do what I need to do, I shouldn't have to enter it twice.)*
> [ASSUMED — representative quote for efficiency-focused junior sales rep]

---

### Basic Profile

| Attribute | Value |
|-----------|-------|
| Name | Szabó Ágnes |
| Age | 29 [ASSUMED] |
| Role | Sales Representative |
| Tenure | 1-2 years [ASSUMED] |
| Location | Budapest office [ASSUMED] |
| Primary device | Desktop (Windows laptop) [ASSUMED] |

---

### Role & Context

Ágnes handles a smaller portfolio of deals, mostly in the earlier pipeline stages (lead, qualified, proposal) [ASSUMED — consistent with junior role]. She is still learning the pipeline process and relies on the system to guide her on what to do next [ASSUMED].

Her primary concern is not getting lost in administrative overhead [ASSUMED — common junior sales frustration]. She gets frustrated when the system requires her to enter information twice or when she cannot figure out which field to use for which purpose [ASSUMED — e.g., the close_reason vs. notes ambiguity noted in the whitepaper].

Unlike Péter, she is less likely to maintain personal workarounds — she either adapts her process to the tool's constraints or skips recording information entirely [ASSUMED — behavioral pattern for less experienced users].

She interacts with the AI agent indirectly: the AI logs activities on her behalf when emails arrive, and she reviews the results [DATA-BASED: whitepaper — email intake webhook creates contacts and lead deals, though this is out of scope for MVP; BRD OS-1].

---

### Goals

1. Know exactly what she should do next for each deal (next step owner + due date clearly visible) [ASSUMED — directly related to DATA-BASED next_step_owner and next_step_due fields in whitepaper]
2. Find a contact or deal quickly without knowing the exact name [ASSUMED — search user]
3. Create a new contact or deal without needing help or documentation [ASSUMED — usability goal]
4. Understand what stage a deal is in and what the stages mean [ASSUMED — onboarding/learnability goal]
5. Record a client interaction quickly and get back to her actual work [ASSUMED]

---

### Frustrations

1. **Pipeline stages have no enforcement or guidance** — she is unsure whether it is correct to jump from "lead" to "proposal" [DATA-BASED: whitepaper — "No stage transition validation exists"; debt-backlog F-5]. [ASSUMED that this causes confusion for less experienced users]
2. **Notes vs. close_reason ambiguity** — two fields that appear to serve the same purpose [DATA-BASED: whitepaper — "boundary with notes field was blurry"]. She may fill the wrong one [ASSUMED].
3. **No activity creation from UI** — she cannot log a call or meeting directly from the web interface [DATA-BASED: debt-backlog F-7]. She has to ask a colleague or skip logging it entirely [ASSUMED].
4. **Contacts list is wide (9 columns)** — important information may be off-screen on her laptop display [ASSUMED — based on DATA-BASED 9-column table description in whitepaper §2].
5. **CSV import behavior is unclear** — "overwrite", "skip", "fix" options during duplicate resolution are not self-explanatory [ASSUMED — common onboarding friction; feature DATA-BASED: whitepaper §5].

---

### Behaviours

- Uses the search bar as primary navigation (searches for company or contact name instead of scrolling) [ASSUMED]
- Skips optional fields when creating contacts or deals to get done faster [ASSUMED — common shortcut behavior]
- Checks the deals list sorted by "next step due" to prioritize her day [ASSUMED — tied to DATA-BASED next_step_due field]
- Rarely looks at the Reports page — that is Péter's domain [ASSUMED]
- Does not edit activities once created; treats them as permanent records [ASSUMED — consistent with former append-only design]

---

### Tech Comfort

**Level:** Medium [ASSUMED]
- Comfortable with SaaS productivity tools (Outlook, Teams, basic CRM experience)
- Does not use MCP or API access
- Expects forms to validate and guide her
- Gets frustrated by ambiguous field labels or unclear error messages [ASSUMED]

---

### Preferred Channels

- Web UI (desktop browser) [DATA-BASED: whitepaper — same role category as Account Manager]

---

### What Success Looks Like

- She can see her deals sorted by next step due date and knows immediately what to act on [ASSUMED — addresses DATA-BASED next_step_due field]
- The pipeline stages have tooltip descriptions or labels that explain what each stage means [ASSUMED — addresses DATA-BASED lack of stage validation guidance]
- She can log a note or call directly from the deal detail page in under 30 seconds [ASSUMED — addresses DATA-BASED debt F-7]
- Creating a contact takes one form with no ambiguous fields [ASSUMED — usability target]
- When she makes a mistake, the system lets her fix it — including editing an activity if she logged it on the wrong deal [DATA-BASED: BRD S-6 — full CRUD on activities in rewrite]

---

### Assumption Flags

| Item | Label | Confidence |
|------|-------|-----------|
| Age 29 | ASSUMED | Low |
| Junior-to-mid level | ASSUMED | Medium — BRD mentions 2-5 sales team members; seniority mix inferred |
| Earlier-stage deal focus | ASSUMED | Medium |
| Skips optional fields | ASSUMED | High — universal behavior pattern |
| Does not use Reports | ASSUMED | Medium |
| Confused by notes/close_reason | ASSUMED | High — gap explicitly flagged in whitepaper |

---

---

## Persona 3 — Juhász János (juhaszj)

### IT Admin / System Owner / Sole Maintainer

> **"Én vagyok a fejlesztő, a tesztelő, az adminisztrátor és az ügyeletes tűzoltó is."**
> *(I'm the developer, the tester, the administrator, and the on-call firefighter.)*
> [ASSUMED — representative quote; username matches BRD owner: juhaszj]

---

### Basic Profile

| Attribute | Value |
|-----------|-------|
| Name | Juhász János |
| Age | 35 [ASSUMED] |
| Role | IT Admin / Developer / System Owner |
| Tenure | Company tenure unknown [ASSUMED] |
| Location | Budapest [ASSUMED] |
| Primary device | Desktop (Windows 11) [DATA-BASED: BRD C-4, environment context] |

---

### Role & Context

János is the sole developer and maintainer of the HAD CRM system [DATA-BASED: BRD C-4 — "Sole maintainer (juhaszj)"]. He designed, built, and now owns the legacy system, and is driving the rewrite [DATA-BASED: BRD — identified as project owner throughout].

His interaction with the CRM is fundamentally different from the sales users: he uses the system through multiple interfaces (web UI, MCP tools, direct database queries, REST API) [DATA-BASED: whitepaper — Admin role has same web UI access; MCP tools are his primary AI-agent interface]. He is also the one who will build the new system on top of the requirements this research helps define.

He experiences frustration not from using the CRM as a sales tool, but from maintaining a system that is architecturally fragile [DATA-BASED: whitepaper §"What Was Broken"]. Every change carries risk because there are no tests [DATA-BASED: debt-backlog C-1], type definitions drift [DATA-BASED: debt-backlog C-2], and schema migrations are unsafe [DATA-BASED: debt-backlog D-5].

The rewrite is both a technical necessity and a personal investment in sustainability [ASSUMED — consistent with the thoroughness of the whitepaper and BRD he authored].

---

### Goals

1. Build a system he can change confidently, without fear of silent regressions [DATA-BASED: BRD BO-6 — test coverage; BRD §2 problem #6]
2. Establish a single source of truth for types (Drizzle schemas) so frontend and backend never drift [DATA-BASED: BRD BO-7, §7.2 A resolved]
3. Enable the AI agent to fully operate the CRM via MCP without human workarounds [DATA-BASED: BRD BO-2]
4. Implement real authentication that protects customer data [DATA-BASED: BRD BO-1, §2 problem #1]
5. Keep architecture simple enough that he can maintain it alone [DATA-BASED: BRD C-4 — "Architecture must be simple and well-documented; avoid over-engineering"]
6. Document decisions so future maintainers (or a future version of himself) can understand why things were built the way they were [ASSUMED — consistent with detailed documentation chain visible in project]

---

### Frustrations

1. **The legacy codebase has no tests** — any change he makes is high risk [DATA-BASED: debt-backlog C-1].
2. **Type definitions in two places** — he has caught frontend/backend drift and expects it will keep happening [DATA-BASED: debt-backlog C-2].
3. **MCP tools are the primary interface but have the worst field coverage** — the AI agent, which is supposed to be the primary operator, cannot set half the deal fields [DATA-BASED: BRD §2 problem #2, debt-backlog F-1].
4. **Schema migrations are brittle** — he cannot safely rename a column or add a constraint [DATA-BASED: debt-backlog D-5].
5. **Authentication is completely absent** — the system is not safe to expose on any network [DATA-BASED: BRD §2 problem #1, debt-backlog S-1, S-2].

---

### Behaviours

- Operates the CRM primarily through MCP tools and direct API calls, rarely through the web UI [ASSUMED — developer persona; DATA-BASED: whitepaper shows Admin role identical to Sales Manager in web UI]
- Uses Claude Code (AI agent) extensively for data operations [DATA-BASED: whitepaper — "AI Agent: Primary operator via MCP"]
- Writes detailed specification documents before coding (BRD → research → PRD pattern) [DATA-BASED: evident from the documentation chain in the project]
- Uses Obsidian for session logging and knowledge management [DATA-BASED: project structure shows obsidian-vault]
- Prefers well-defined, reversible architecture choices [ASSUMED — consistent with constraints in BRD C-4]

---

### Tech Comfort

**Level:** Expert [DATA-BASED: sole developer of full-stack TypeScript system]
- Full-stack development (Next.js, Supabase, TypeScript)
- AI agent tooling (Claude Code, MCP protocol)
- Database design and migration
- DevOps fundamentals (Vercel deployment, GitHub)

---

### Preferred Channels

- MCP tools (AI agent operations) [DATA-BASED: whitepaper]
- Web UI (oversight and verification) [DATA-BASED: whitepaper]
- REST API (testing and automation) [DATA-BASED: whitepaper]
- Direct database access (admin operations) [ASSUMED — standard developer behavior]

---

### What Success Looks Like

- He deploys a new feature and knows immediately if it broke anything (CI green) [DATA-BASED: BRD BO-6, SM-5]
- All entity fields are accessible through MCP tools — the AI agent is a reliable primary operator [DATA-BASED: BRD BO-2, SM-2]
- Microsoft Entra ID auth is implemented server-side and no endpoint is publicly accessible [DATA-BASED: BRD BO-1, SM-1]
- He can add a new currency, a new pipeline stage variation, or a new report without touching five different type files [DATA-BASED: BRD BO-7]
- The system runs for months without requiring his intervention beyond occasional dependency updates [ASSUMED — maintenance sustainability goal]

---

### Assumption Flags

| Item | Label | Confidence |
|------|-------|-----------|
| Age 35 | ASSUMED | Low |
| Uses MCP primarily, web UI secondarily | ASSUMED | High — consistent with whitepaper design intent |
| Spec-first workflow | DATA-BASED | High — evident from documentation chain |
| Direct database access | ASSUMED | High — standard developer behavior |
| Maintenance sustainability as primary goal | ASSUMED | High — C-4 constraint and "avoid over-engineering" language |

---

---

## Persona Priority for Rewrite

| Priority | Persona | Rationale |
|----------|---------|-----------|
| 1 | **Kovács Péter** (Account Manager) | Daily user, highest frustration density, most visibility into pipeline health failures |
| 2 | **Juhász János** (IT Admin) | System owner driving the rewrite; his goals ARE the architectural requirements |
| 3 | **Szabó Ágnes** (Sales Rep) | Valid user but needs are largely satisfied by solving Péter's and János's issues |

---

*Generated by ux-researcher agent on 2026-03-13.*
*All items labeled [ASSUMED] or [DATA-BASED]. No research interviews conducted — document-derived personas only.*
