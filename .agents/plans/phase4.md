# HELIX - Phase 4: Web Dashboard & NextAuth OAuth2 Infrastructure

## Goals & Objectives
Build the companion web dashboard and HTTP server (`src/server.ts`) providing Discord OAuth2 authentication, guild management, system statistics, and REST endpoints.

---

## Sub-Issues & Milestone Breakdown

```mermaid
flowchart TD
    P4["Phase 4: Web Dashboard"] --> Sub1["Sub-Issue 1: Native HTTP Callback Server (src/server.ts)"]
    P4 --> Sub2["Sub-Issue 2: NextAuth-Compatible Discord OAuth2 Route"]
    P4 --> Sub3["Sub-Issue 3: Responsive Dark-Mode Dashboard UI (HTML/CSS/JS)"]
    P4 --> Sub4["Sub-Issue 4: REST API Endpoints (/api/stats, /api/guilds, /health)"]
```

- [x] **Sub-Issue 1: HTTP Server**: Native Node.js `http` server integrated into the bot process.
- [x] **Sub-Issue 2: NextAuth OAuth2**: Endpoint `/api/auth/callback/discord` with state verification and session exchange.
- [x] **Sub-Issue 3: Dashboard UI**: Responsive dark-mode dashboard (`dashboard/index.html`) displaying bot health, guild list, and active plugins.
- [x] **Sub-Issue 4: API Endpoints**: Endpoints `/api/stats`, `/api/guilds`, `/api/plugins`, and `/health`.

---

## Verification & Criteria
1. Web dashboard loads cleanly and handles Discord OAuth2 redirects without external web frameworks.
2. Unit tests verify HTTP routing, session creation, and API payloads.
