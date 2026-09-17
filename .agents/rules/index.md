# Mandatory Agent Rules

Index of permanent, non-negotiable rules for all AI coding assistants, automated agents, and contributors working on **HELIX Discord Bot**. These rules enforce safety, prevent irreversible damage, ensure strict architectural adherence, and mandate discord.js v14 compliance.

---

## Active Rules Directory

| Rule | Title | Primary Scope | Specification File |
|---|---|---|---|
| **Rule 00** | Agent Safety, Instruction Compliance & Damage Prevention | Core Safety, Data Protection & Secrets | [agent-safety-compliance.md](agent-safety-compliance.md) |
| **Rule 01** | Dependency & Tool Approval (Zero Unsolicited Injection) | Runtime Dependency Hygiene | [zero-unsolicited-injection.md](zero-unsolicited-injection.md) |
| **Rule 02** | TypeScript Source Conventions & Architecture | Project Structure & ESM Invariants | [typescript-architecture.md](typescript-architecture.md) |
| **Rule 03** | Centralized Message & Discord Embed Standards | Embed Construction & Delivery Targets | [message-formatting.md](message-formatting.md) |
| **Rule 04** | Remote Issue, PR & Comment Protocol | Roadmap-First Tracking & GitHub Workflows | [remote-issue-protocol.md](remote-issue-protocol.md) |
| **Rule 05** | Documentation Standards & Wiki Synchronization | Wiki Alignment & Markdown Quality | [documentation-standards.md](documentation-standards.md) |
| **Rule 06** | Discord.js Standards & Modular Lib Architecture | Discord API Limits, Options & Commands | [discord-js-standards.md](discord-js-standards.md) |
| **Rule 07** | Management Dashboard & Discord Integration Standards | Zero-Frontend-Dep SSR & Discord OAuth2 | [dashboard-standards.md](dashboard-standards.md) |
| **Rule 08** | Semantic Versioning & Release Management Standards | SemVer (`X.Y.Z`), Version Sync & GitHub Releases | [release-standards.md](release-standards.md) |

---

## Enforcement Hierarchy
1. **Rule 00 (Safety)** and **Rule 01 (Zero Unsolicited Injection)** supersede all other implementation decisions.
2. **Rule 06 (Discord.js Standards)** is mandatory for all Discord-facing commands, events, embeds, and option definitions.
3. Every pull request or task completion must verify compliance via `npm run check` (Rule 00 & Rule 02).