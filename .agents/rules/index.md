# Mandatory Agent Rules

Index of permanent, non-negotiable rules for all AI coding assistants, automated agents, and contributors working on **HELIX Discord Bot**. These rules enforce safety, prevent irreversible damage, ensure strict architectural adherence, and mandate discord.js v14 compliance.

---

## Active Rules Directory

| Rule | Title | Primary Scope | Specification File |
|---|---|---|---|
| **Rule 00** | Agent Safety, Instruction Compliance & Damage Prevention | Core Safety, Data Protection & Secrets | [agent-safety-compliance](agent-safety-compliance) |
| **Rule 01** | Dependency & Tool Approval (Zero Unsolicited Injection) | Runtime Dependency Hygiene | [zero-unsolicited-injection](zero-unsolicited-injection) |
| **Rule 02** | TypeScript Source Conventions & Architecture | Project Structure & ESM Invariants | [typescript-architecture](typescript-architecture) |
| **Rule 03** | Centralized Message & Discord Embed Standards | Embed Construction & Delivery Targets | [message-formatting](message-formatting) |
| **Rule 04** | Remote Issue, PR & Comment Protocol | Roadmap-First Tracking & GitHub Workflows | [remote-issue-protocol](remote-issue-protocol) |
| **Rule 05** | Documentation Standards & Wiki Synchronization | Wiki Alignment & Markdown Quality | [documentation-standards](documentation-standards) |
| **Rule 06** | Discord.js Standards & Modular Lib Architecture | Discord API Limits, Options & Commands | [discord-js-standards](discord-js-standards) |
| **Rule 07** | Management Dashboard & Discord Integration Standards | Zero-Frontend-Dep SSR & Discord OAuth2 | [dashboard-standards](dashboard-standards) |
| **Rule 08** | Semantic Versioning & Release Management Standards | SemVer (`X.Y.Z`), Version Sync & GitHub Releases | [release-standards](release-standards) |
| **Rule 09** | GitHub-Flavored Mermaid & Diagram Standards | Mermaid rendering on GitHub, legibility & diagram splitting | [mermaid-standards](mermaid-standards) |

---

## Enforcement Hierarchy
1. **Rule 00 (Safety)** and **Rule 01 (Zero Unsolicited Injection)** supersede all other implementation decisions.
2. **Rule 06 (Discord.js Standards)** is mandatory for all Discord-facing commands, events, embeds, and option definitions.
3. Every pull request or task completion must verify compliance via `npm run check` (Rule 00 & Rule 02).