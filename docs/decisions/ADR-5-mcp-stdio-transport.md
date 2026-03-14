---
doc-type: ADR
project: had-management
adr-number: 5
title: MCP tools use stdio transport only — no HTTP transport in this release
status: proposed
date: 2026-03-14
author: tech-lead
related-docs:
  - TSD-mcp-tools.md
  - PRD-mcp-tools.md
superseded-by: ~
---

# ADR-5: MCP tools use stdio transport only — no HTTP transport in this release

## Status
`proposed`

## Context

The MCP (Model Context Protocol) specification supports multiple transports: stdio (local process communication) and HTTP with Server-Sent Events (SSE). PRD-MCP section 9 explicitly excludes HTTP transport: "MCP over HTTP transport — reason: stdio transport is the defined integration mode; HTTP MCP would require a public or network-accessible endpoint which is explicitly out of scope."

The system has a single MCP consumer: the AI agent (Claude Code) running locally on the developer's machine. The CRM is deployed on Vercel; MCP tools must interact with the Vercel-hosted database through the application's API layer, not directly.

Authentication for MCP tools must use the same mechanism as the web UI (PRD-MCP-011, PRD-MCP-NFR-005). With stdio transport, the MCP server process runs locally and authenticates against the Vercel-hosted API using a session token or API key held in the local environment, not a public endpoint.

## Decision

We will implement MCP tools as a local stdio MCP server process. The server:
1. Runs as a Node.js process on the developer's machine, started by Claude Code automatically via `claude_desktop_config.json` or equivalent MCP host configuration
2. Each tool call translates to an authenticated HTTP request against the Vercel-hosted Next.js API (`/api/mcp/[tool]` routes, authenticated via a long-lived API token stored in the local `.env`)
3. The API token for the MCP server corresponds to the "HAD Agent" user record (ADR-3) — it is a Supabase service role key or a scoped JWT that identifies the agent user

This means: MCP server = local process; business logic = Vercel-hosted API routes; database = Supabase (always remote).

## Alternatives Considered

| Option | Pros | Cons | Why rejected / chosen |
|--------|------|------|-----------------------|
| MCP over HTTP (SSE transport) | Remote access possible; multiple clients; no local process needed | Requires a public-facing MCP endpoint; significant security surface; explicitly excluded in PRD | Rejected — PRD out-of-scope; public endpoint creates unacceptable attack surface |
| MCP tools with direct Supabase DB access (bypass API layer) | Lower latency; simpler call chain | Business logic in two places (API + MCP); stage history logging and validation would need to be duplicated; database credentials in local environment | Rejected — business logic duplication; schema validation and FK enforcement must be server-side |
| **stdio MCP server → Vercel API routes** | Local-only; no public endpoint; business logic lives once in Vercel; authentication is server-enforced | Local process must be running; MCP calls have HTTP round-trip latency; PRD-MCP-NFR-004 (500ms) must account for this | **Chosen** — matches PRD constraints; single business logic location; no public attack surface |

## Consequences

**Positive:**
- No public MCP endpoint; attack surface is limited to the Vercel API routes (which are already secured)
- Business logic for validation, FK checks, and stage history logging exists only in the API layer
- The MCP server codebase is a thin translation layer (tool schema → HTTP call → response mapping)

**Negative / Trade-offs:**
- MCP tool calls incur HTTP round-trip latency (local → Vercel); PRD-MCP-NFR-004's 500ms target must be measured against this overhead
- If Vercel is unavailable, MCP tools are unavailable (but so is the web UI, so this is not an incremental risk)
- The local MCP server process requires correct `.env` configuration on the developer's machine; misconfiguration means silent auth failure

**Risks:**
- If the long-lived API token for the agent is leaked (e.g., committed to version control), it provides full CRM write access as the agent user
- The 500ms performance target may be challenging for operations that trigger multiple DB writes (e.g., `create_deal` + stage history insert); requires measurement

## Review Trigger

- If a second MCP consumer (e.g., a different AI system or automation tool) needs remote access to the tools
- If the team grows and multiple engineers need to use MCP tools from different machines simultaneously

---
*Version history*
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-03-14 | tech-lead | Initial draft |
