---
status: draft
last-updated: 2026-03-13
owner: juhaszj
type: ux-research
subtype: journey-maps
project: had-management
source-documents:
  - docs/whitepaper-had-management.md
  - docs/brd/BRD-had-management.md
  - docs/research/research-2026-had-management-personas.md
---

# UX Research — Journey Maps
## HAD Management Rewrite · 2026-03-13

> **Evidence policy:** Every item is labeled `[ASSUMED]` or `[DATA-BASED]`.
> Journey maps answer "how does the user experience this" — not "how does the system work."
> Friction and opportunities are surfaced; solutions are not prescribed.

---

## Context

These journey maps represent the most critical flows for each persona, based entirely on document analysis. No user sessions or observational data were collected. The maps reflect how the legacy system is experienced today, with the rewrite's gaps and opportunities surfaced for the product team.

**Mapping scope:**
- Persona 1 (Kovács Péter): Post-call pipeline update flow
- Persona 2 (Szabó Ágnes): New deal creation and first pipeline move
- Persona 3 (Juhász János): AI agent operation verification flow

---

---

## Journey Map 1 — Kovács Péter

### "After the Client Call — Update a Deal and Log the Conversation"

**Why this is the primary journey:** This is the most frequent high-value action a senior account manager performs. It happens after every significant client interaction and directly affects pipeline accuracy. Legacy failures (no activity UI, read-only detail page, no audit trail) make this journey the highest-friction path in the system.

---

### Journey Table

| Phase | Action | Touchpoint | Emotion | Pain Point | Opportunity |
|-------|--------|-----------|---------|-----------|-------------|
| **1. Recall** | Péter finishes a call and needs to update the CRM before he forgets details | Mental — no system touchpoint yet | Motivated, slightly rushed | No reminder or prompt to log activity; relies on discipline [ASSUMED] | Contextual "log activity" entry point from any deal view |
| **2. Navigate** | Opens browser, goes to the CRM, sees the Dashboard | Web UI — Dashboard | Neutral, familiar | Dashboard shows 5 recent activities but not a quick "log something" button [DATA-BASED: whitepaper §1] | Quick-capture activity widget on dashboard |
| **3. Find the deal** | Searches for the client's company name or deal title in the Deals list | Web UI — Deals list, search bar | Mildly frustrated if search returns too many results | Search is basic LIKE matching — returns broad results, no ranking [DATA-BASED: debt-backlog; whitepaper §"What Was Broken" #6] | Scoped search with company + stage filter combined |
| **4. Open deal** | Clicks the deal row to open Deal Detail | Web UI — Deal Detail page | Expecting to see context (history, notes, stage) | Activity timeline is NOT rendered on the Deal Detail page [DATA-BASED: whitepaper F-3, debt-backlog F-3] | Activity timeline on deal page, in reverse chronological order |
| **5. Review context** | Tries to recall what was discussed last time | Web UI — Deal Detail: description, notes fields only | Frustrated — no chronological history visible | Must piece together context from static notes field; no timestamps [DATA-BASED: gap confirmed] | Timestamped, attributed activity log on deal detail |
| **6. Log the call** | Tries to add an activity from the Deal Detail page | Web UI — Deal Detail | Blocked | **There is no UI to add activities.** Must use MCP or direct API, which Péter cannot do [DATA-BASED: debt-backlog F-7] | "Add activity" button directly on deal detail page |
| **7. Workaround** | Writes the call summary into the "notes" field of the deal instead | Web UI — Deal Detail (read-only) | Resigned, skips proper logging | Detail page is entirely read-only — even notes field cannot be edited from UI [DATA-BASED: debt-backlog F-6] | Inline edit capability for notes; separate activity creation |
| **8. Update stage** | Wants to move the deal from "proposal" to "negotiation" after a positive call outcome | Web UI — Deals list or Deal Detail | Uncertain where to do this | No stage change control visible on Deal Detail; must use MCP or know the API [ASSUMED — no inline edit exists; DATA-BASED: F-6] | Stage transition control directly on deal detail |
| **9. No audit trail** | After the stage change (if he manages it), no record exists of the transition | System behavior — invisible to Péter | Unaware of the problem — latent frustration surfaces during reporting | Stage transition is not logged with timestamp or actor [DATA-BASED: BRD §2 #3, debt-backlog D-6] | Stage history panel showing who moved the deal when |
| **10. Currency check** | Checks the deal value — it was originally entered in EUR but displays as a bare number | Web UI — Deal Detail, value field | Confused | HUF hardcoded; no currency symbol shown if the value was intended as EUR [DATA-BASED: debt-backlog D-4, whitepaper rewrite note] | Per-deal currency field with MNB-converted HUF equivalent shown |
| **11. Close loop** | Tries to check what the "next step" for this deal is, assigned to whom | Web UI — Deal Detail: next step card | Relieved if filled in; frustrated if empty or shows a typo-ed name | next_step_owner is free text — may show "Péter" when he's "Kovacs Peter" in another deal [DATA-BASED: debt-backlog D-2] | next_step_owner as dropdown from user directory |

---

### Friction Summary — Top 3

| # | Friction | Severity | Source |
|---|---------|---------|--------|
| F-1 | **No way to log an activity from the UI** — the most basic post-call action is blocked for human users | Critical | DATA-BASED: debt-backlog F-7 |
| F-2 | **Deal Detail page is completely read-only** — updating any field, including notes or stage, requires leaving the UI | High | DATA-BASED: debt-backlog F-6 |
| F-3 | **No activity history on the deal page** — context reconstruction is impossible without the timeline | High | DATA-BASED: whitepaper F-3, debt-backlog F-3 |

---

### Opportunity Summary — Top 3

| # | Opportunity | Phase | Priority |
|---|------------|-------|---------|
| O-1 | Add "Log Activity" button directly on the Deal Detail page — one click to create a note, call, or meeting record | Phase 6 | Must-have |
| O-2 | Render activity timeline on Deal Detail in reverse chronological order with timestamps and type icons | Phase 5 | Must-have |
| O-3 | Inline editing for deal fields (notes, next steps, stage) from the Deal Detail page | Phase 7, 8 | High |

---

### Assumptions in This Map

| Item | Label | Confidence |
|------|-------|-----------|
| Péter opens dashboard first | ASSUMED | High |
| Post-call logging is a high-frequency action | ASSUMED | High — universal sales behavior |
| Péter cannot use MCP tools directly | ASSUMED | High — not his role per whitepaper |
| No stage change control on Deal Detail | ASSUMED | High — no inline edit exists per F-6 |
| EUR deal entered as bare number | ASSUMED | High — D-4 confirms currency gap |

---

---

## Journey Map 2 — Szabó Ágnes

### "First Meeting with a New Lead — Create Contact, Create Deal, Move It Forward"

**Why this is the primary journey:** Onboarding a new lead is the entry point of the entire sales pipeline. For a junior sales rep, this flow tests the system's learnability and clarity. Legacy weaknesses (ambiguous fields, no stage guidance, no form validation context) make this the highest-risk journey for data quality.

---

### Journey Table

| Phase | Action | Touchpoint | Emotion | Pain Point | Opportunity |
|-------|--------|-----------|---------|-----------|-------------|
| **1. Trigger** | Ágnes gets a new business contact after a networking event | External — no system touchpoint | Excited, motivated | No CRM context yet [ASSUMED] | — |
| **2. Create contact** | Opens Contacts list, clicks "New Contact" button | Web UI — Contacts list, Create Contact Modal | Focused | Modal has 9 fields; it is unclear which are required vs. optional [ASSUMED — only "Name" is required per whitepaper, but the form does not clearly signal this] | Required field indicators; contextual help text on ambiguous fields |
| **3. Source field confusion** | Sees "Source" dropdown with options: email, referral, linkedin, other | Web UI — Create Contact Modal | Uncertain | "Referral" and "linkedin" may not match her actual channel (e.g., she met them at a conference) | "other" catch-all exists [DATA-BASED: whitepaper] but no free-text annotation option | Extend source options or allow free-text annotation for "other" |
| **4. KAM field** | Sees "KAM" field — not sure if she should enter her own name or leave it | Web UI — Create Contact Modal | Confused | KAM is free text with no dropdown or default [DATA-BASED: debt-backlog D-1]; unclear if it means "me" or "my manager" [ASSUMED] | KAM as user picker with current user as default |
| **5. Contact created** | Submits form; contact is created | Web UI — Contacts list (post-create) | Relieved | No confirmation message visible in the described UI [ASSUMED — success state not documented]; unsure if it worked | Clear inline success feedback |
| **6. Create deal** | Navigates to Deals list, clicks "New Deal" | Web UI — Deals list, Deal Create Modal | Focused | Deal modal requires "Contact" from a dropdown — she must find the contact she just created [DATA-BASED: whitepaper §8] | Auto-link: if arriving from a contact page, pre-fill the contact field |
| **7. Stage selection** | Sees "Stage" dropdown — selects "lead" (default) | Web UI — Deal Create Modal | Uncertain | Stages have no descriptions in the create modal — she doesn't know what "lead" vs "qualified" means [ASSUMED; DATA-BASED: no stage guidance in create form per whitepaper §8] | Stage tooltips or inline descriptions in the dropdown |
| **8. Missing fields** | Cannot enter project start date in the create modal | Web UI — Deal Create Modal | Unaware | project_start_expected, project_start_actual, project_end not in the create form [DATA-BASED: whitepaper §8, debt-backlog F-2] | Add all project date fields to the create form |
| **9. Value field** | Enters a value — sees no currency selector | Web UI — Deal Create Modal | Uncertain if HUF or EUR | Value field has no currency indicator [DATA-BASED: debt-backlog D-4]; she enters a number without knowing the currency assumption | Per-deal currency selector with clear HUF/EUR/USD labels |
| **10. Deal created** | Deal is saved; navigates to deal detail | Web UI — Deal Detail | Cautiously confident | Deal Detail is read-only — she cannot fix the value or add notes she forgot [DATA-BASED: debt-backlog F-6] | Post-create inline edit mode |
| **11. Move stage** | After a promising follow-up call, wants to move from "lead" to "qualified" | Web UI — unclear how | Frustrated | She cannot find a stage transition control in the UI [ASSUMED; DATA-BASED: F-6 — no inline edit] | Stage transition selector on deal detail |
| **12. Log the follow-up** | Wants to record that the follow-up call happened | Web UI — Deal Detail | Blocked | No activity creation from UI [DATA-BASED: debt-backlog F-7] | "Log activity" quick-action on deal detail |
| **13. Next step** | Wants to set a next step for the deal | Web UI — Deal Detail (read-only) | Resigned | next_step_owner and next_step_due are not editable from the UI [DATA-BASED: F-6] | Editable "Next step" card on deal detail |

---

### Friction Summary — Top 3

| # | Friction | Severity | Source |
|---|---------|---------|--------|
| F-1 | **Pipeline stages have no contextual guidance** — she does not know what each stage means or when to use it | High | ASSUMED — no stage descriptions in whitepaper UI; DATA-BASED: no stage validation |
| F-2 | **KAM field is free text with no default** — creates data quality problems from the very first contact creation | High | DATA-BASED: debt-backlog D-1 |
| F-3 | **After creating a deal, she cannot edit it or log the next action from the UI** — the system forces her to stop her workflow entirely | High | DATA-BASED: debt-backlog F-6, F-7 |

---

### Opportunity Summary — Top 3

| # | Opportunity | Phase | Priority |
|---|------------|-------|---------|
| O-1 | Add stage descriptions (tooltips or inline text) wherever stages are selected or displayed | Phase 7, 11 | High |
| O-2 | Replace KAM and owner free-text with user picker; pre-fill with current user | Phase 4 | Must-have |
| O-3 | Make the deal detail page editable — inline or via "Edit" mode — so the entire post-creation workflow stays in one place | Phase 10, 11, 12, 13 | Must-have |

---

### Assumptions in This Map

| Item | Label | Confidence |
|------|-------|-----------|
| Networking event as trigger | ASSUMED | Low — representative example |
| Stage meaning is unclear to junior users | ASSUMED | High — universal CRM onboarding issue |
| No confirmation message on contact create | ASSUMED | Medium — not documented in whitepaper |
| Does not know to look for MCP workaround | ASSUMED | High — not her role |
| Creates deal manually (vs. AI doing it) | ASSUMED | High — email intake is out of scope MVP |

---

---

## Journey Map 3 — Juhász János (juhaszj)

### "AI Agent Operation — Verify the Agent Did the Right Thing"

**Why this is the primary journey:** The system's design philosophy is "MCP-first, human-in-the-loop." János built this system so that Claude Code (AI agent) does most of the data operations, and the human (typically himself or Péter) verifies through the web UI. This verification loop is the central interaction pattern of the entire system. If this loop fails — if the UI does not show what the agent did — the design philosophy breaks down.

---

### Journey Table

| Phase | Action | Touchpoint | Emotion | Pain Point | Opportunity |
|-------|--------|-----------|---------|-----------|-------------|
| **1. Agent task** | János instructs the AI agent to update a deal: new stage, owner, and next step | MCP tool — `update_deal`, `update_deal_stage` | Confident in the command | MCP tools do not expose description, owner, next_step_owner, next_step_due — agent cannot set them [DATA-BASED: debt-backlog F-1] | Full MCP tool field parity with data model |
| **2. Agent executes** | Agent calls `update_deal_stage`, succeeds; tries to set owner — field not in tool | MCP tool — response | Frustrated | Agent silently cannot complete the full instruction; partial execution with no clear failure mode [DATA-BASED: debt-backlog F-1] | MCP error surfacing when a requested field is not settable |
| **3. Verify in UI** | Opens Deal Detail in the web UI to confirm the stage moved | Web UI — Deal Detail | Alert, checking | Stage shows updated value — that worked. But owner and next step are blank [ASSUMED — logical consequence of F-1] | All deal fields visible on detail page |
| **4. Check activity history** | Wants to confirm the agent logged an activity for this operation | Web UI — Deal Detail | Expecting to see activity list | Activities are fetched but not rendered [DATA-BASED: whitepaper F-3, debt-backlog F-3] | Activity timeline on deal detail |
| **5. Check stage history** | Wants to verify the stage transition was logged (who moved it, when) | Web UI — Deal Detail | Looking for audit trail | **No stage transition history exists in the legacy system** [DATA-BASED: BRD §2 #3, debt-backlog D-6] | Stage history panel: actor, from-stage, to-stage, timestamp |
| **6. Manual correction** | Must manually set owner and next step that the agent could not set | Web UI — Deal Detail (read-only) or direct API call | Resigned — breaks the MCP-first model | Detail page is read-only; he must use the REST API directly [DATA-BASED: debt-backlog F-6] | Inline edit on deal detail; complete MCP tool field coverage |
| **7. Auth concern** | Considers whether the agent's operations are traceable to a named user | System architecture — invisible concern | Concerned | No auth means no actor attribution; all operations are anonymous [DATA-BASED: BRD §2 #1, debt-backlog S-1] | Auth-linked activity and stage history with actor identity |
| **8. Verification complete (partial)** | Confirms what he can, accepts what he cannot verify | Mental reconciliation | Uneasy — uncertainty about system state | Cannot fully verify whether the agent's full intent was executed | Complete operation log viewable in UI per agent session |

---

### Friction Summary — Top 3

| # | Friction | Severity | Source |
|---|---------|---------|--------|
| F-1 | **MCP tools cannot set 7 deal fields** — the primary operator cannot fully execute its instructions, and no error is surfaced | Critical | DATA-BASED: BRD §2 #2, debt-backlog F-1 |
| F-2 | **No stage transition history** — the audit trail central to pipeline analysis does not exist | High | DATA-BASED: BRD §2 #3, debt-backlog D-6 |
| F-3 | **Activity timeline not rendered on Deal Detail** — verification of agent operations is impossible from the UI | High | DATA-BASED: whitepaper F-3, debt-backlog F-3 |

---

### Opportunity Summary — Top 3

| # | Opportunity | Phase | Priority |
|---|------------|-------|---------|
| O-1 | Achieve 100% MCP tool field parity — every deal, contact, and activity field settable via MCP | Phase 1, 2 | Must-have (BRD BO-2) |
| O-2 | Stage transition history table: actor, from_stage, to_stage, timestamp — visible in UI | Phase 5 | Must-have (BRD BO-3) |
| O-3 | Activity timeline on Deal Detail page — shows agent-created and human-created activities together | Phase 4 | Must-have |

---

### Assumptions in This Map

| Item | Label | Confidence |
|------|-------|-----------|
| Agent attempts to set owner in same operation | ASSUMED | Medium — plausible compound command |
| Partial execution produces no clear error | ASSUMED | High — silent gap behavior is standard when fields are simply absent from tool schema |
| János uses REST API for manual corrections | ASSUMED | High — developer persona, has API access |
| Verification workflow is frequent | ASSUMED | High — central to the system's "human-in-the-loop" design |

---

---

## Cross-Persona Friction Summary

These friction points appear across multiple journeys and should be treated as system-level issues:

| Friction | Affected Personas | Source |
|---------|------------------|--------|
| No activity creation from UI | Péter (J1), Ágnes (J2) | DATA-BASED: debt-backlog F-7 |
| Deal Detail page is read-only | Péter (J1), Ágnes (J2), János (J3) | DATA-BASED: debt-backlog F-6 |
| No activity timeline on Deal Detail | Péter (J1), János (J3) | DATA-BASED: whitepaper F-3 |
| Free-text owner / KAM fields | Ágnes (J2), János (J3) | DATA-BASED: debt-backlog D-1, D-2 |
| No stage transition history or guidance | Ágnes (J2), János (J3) | DATA-BASED: debt-backlog D-6, F-5 |

---

*Generated by ux-researcher agent on 2026-03-13.*
*All items labeled [ASSUMED] or [DATA-BASED]. Document-derived journey maps — no observational data.*
