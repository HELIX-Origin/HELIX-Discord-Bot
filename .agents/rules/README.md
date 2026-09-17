# 📜 Mandatory Agent Rules (`.agents/rules/`)

This directory contains the permanent, non-negotiable architectural, security, and coding rules governing all automated agents, coding assistants, and contributors working on **HELIX Discord Bot**.

---

## 🚦 Enforcement & Rule Hierarchy

1. **Rule 00 (Safety & Compliance)** and **Rule 01 (Zero Unsolicited Injection)** supersede all other implementation decisions without exception.
2. **Rule 06 (Discord.js Standards)** is mandatory across all Discord commands, events, embed responses, and interactions.
3. Every commit or pull request must pass the full verification gate (`npm run check`) enforcing type checks, tests, formatting, and linting.

---

## 📋 Rules Catalog

| Rule | Title | Scope & Invariants | Specification File |
|---|---|---|---|
| **Rule 00** | Agent Safety, Instruction Compliance & Damage Prevention | Core Safety, Data Protection & Secrets in `.env` | [agent-safety-compliance.md](agent-safety-compliance.md) |
| **Rule 01** | Dependency & Tool Approval (Zero Unsolicited Injection) | Runtime Dependency Hygiene — explicit user approval required | [zero-unsolicited-injection.md](zero-unsolicited-injection.md) |
| **Rule 02** | TypeScript Source Conventions & Architecture | Strict TypeScript ESM, explicit `.js` imports, clean module layering | [typescript-architecture.md](typescript-architecture.md) |
| **Rule 03** | Centralized Message & Discord Embed Standards | Standardized `EmbedHandler` construction, title/desc length clamping | [message-formatting.md](message-formatting.md) |
| **Rule 04** | Remote Issue, PR & Comment Protocol | Roadmap-First Tracking, Mermaid diagrams, live first post body | [remote-issue-protocol.md](remote-issue-protocol.md) |
| **Rule 05** | Documentation Standards & Wiki Synchronization | Centralized `wiki/` docs synchronization and Markdown formatting | [documentation-standards.md](documentation-standards.md) |
| **Rule 06** | Discord.js Standards & Modular Architecture | Self-contained commands (`commands/<cat>/<cmd>.ts`), dynamic loader, modular `lib/` | [discord-js-standards.md](discord-js-standards.md) |
| **Rule 07** | Management Dashboard & Discord Integration Standards | Zero-frontend-dep SSR, Discord OAuth2, guild admin authorization, EmbedHandler parity | [dashboard-standards.md](dashboard-standards.md) |
| **Rule 08** | Semantic Versioning & Release Management Standards | SemVer (`X.Y.Z`), Version Sync & Structured GitHub Releases | [release-standards.md](release-standards.md) |

---

## 🔍 Verification Pipeline

All rules are verified through the automated check script:
```bash
npm run check
```
Which executes:
1. `npm run typecheck` (`tsc --noEmit`)
2. `npm run typecheck:test` (`tsc --noEmit --project tsconfig.test.json`)
3. `npm run format:check` (`prettier --check src`)
4. `npm run lint` (`eslint src --max-warnings 0`)
5. `npm test` (`vitest run`)
