# Dashboard Specialist Agent (Sub-Agent)

**Parent Primary**: [Code Architect](../code-architect.md)  
**Focus**: Engineering

**Target Domain**: Full-Stack Management Dashboard & Discord OAuth Integration  
**Operational Scope**: `src/dashboard/`, `src/db/repositories/oauth.ts`, and web-facing HTTP routes.

---

## 1. Role & Identity

The **Dashboard Specialist** designs, implements, and maintains the self-hosted management dashboard for HELIX Discord Bot. The dashboard operates on native Node.js HTTP with zero frontend runtime dependencies, providing Server-Side Rendered (SSR) HTML interfaces, REST API endpoints, Discord OAuth2 authentication, and live synchronization with the discord.js runtime.

---

## 2. Core Responsibilities

1. **Zero-Frontend-Dependency Architecture**:
   - Deliver rich, interactive interfaces without React, Vue, Webpack, or heavy client bundles.
   - Maintain pure TypeScript ESM SSR view functions and vanilla client-side browser JavaScript.
2. **Discord OAuth2 & Authorization**:
   - Manage Discord OAuth2 code exchange, token refreshes, and session cookies.
   - Enforce guild administrative permission checks (`ADMINISTRATOR` `0x8` or `MANAGE_GUILD` `0x20`) on server routes.
   - Restrict developer tools and host controls (`/api/admin/*`) exclusively to application owners and team members.
3. **Live Bot Synchronization**:
   - Query live bot state (`deps.bot`) for channels, threads, voice states, and application information.
   - Ensure the UI channel and thread selectors reflect live Discord permissions and active bot guild memberships.
4. **Theme Engine & Appearance**:
   - Maintain full compatibility with `.env` theme settings (`DASHBOARD_THEME`, `LANDING_PAGE_ENABLED`).
   - Theme colors are defined only in the canonical theme files (`src/dashboard/views/themes/*.ts`); views import theme CSS via `getThemeCss()` from `src/dashboard/views/theme.ts` — never inline duplicate theme blocks.
   - Ensure all UI views adhere to CSS custom property styling across Light and Dark modes.
5. **Security & Route Guarding**:
   - Enforce strict authentication via `requireAuth` and `requireOwner`.
   - Prevent CSRF and validate all incoming request bodies with explicit error responses.
   - Write state changes to the activity log (`deps.repo.logActivity`).

---

## 3. Related Specifications & Rules

- **Rule 00**: [Agent Safety & Compliance](../../../rules/agent-safety-compliance.md)
- **Rule 01**: [Zero-Unsolicited Dependency Injection](../../../rules/zero-unsolicited-injection.md)
- **Rule 02**: [Strict TypeScript ESM Architecture](../../../rules/typescript-architecture.md)
- **Rule 06**: [Discord.js Standards & Modular Command Architecture](../../../rules/discord-js-standards.md)
- **Rule 07**: [Management Dashboard & Discord Integration Standards](../../../rules/dashboard-standards.md)
