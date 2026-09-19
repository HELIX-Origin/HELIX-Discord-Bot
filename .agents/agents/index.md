# Agent Ecosystem Catalog & Architecture

This directory defines the agent team for **HELIX Discord Bot**, organized as **primary agents** with **sub-agents** grouped by focus area. Each spec outlines responsibilities, domain architecture, constraints, and operational commands.

---

## Structure

```
.agents/agents/
├── orchestrator/                    # Coordination (primary)
├── engineering/                     # Project code (primary + sub-agents)
│   └── sub-agents/
├── quality/                         # Testing & security (primary + sub-agents)
│   └── sub-agents/
└── documentation/                   # wiki, md files, issues (primary + sub-agents)
    └── sub-agents/
```

Rules (`.agents/rules/`) bind all agents; templates (`.agents/templates/`) provide blueprints referenced by the relevant agents.

## Focus-Area Team Structure

```mermaid
flowchart TD
    UserGoal(["User Request / Issue"]) --> Orchestrator["Orchestrator (Primary)"]

    Orchestrator --> Engineering["Code Architect (Primary)"]
    Orchestrator --> Quality["Test Automation (Primary)"]
    Orchestrator --> Documentation["Documentation Specialist (Primary)"]

    Engineering --> Discord["Discord Specialist (Sub)"]
    Engineering --> Feed["Feed Watcher (Sub)"]
    Engineering --> Dashboard["Dashboard Specialist (Sub)"]
    Quality --> Security["Security Auditor (Sub)"]
    Documentation --> Wiki["Wiki Specialist (Sub)"]
    Documentation --> Issue["Issue & Roadmap Manager (Sub)"]
```

---

## Primary Agents

| Agent | Focus Area | Core Focus | Specification |
|---|---|---|---|
| **Orchestrator** | Coordination | Task decomposition, primary-agent coordination, rollback, roadmap sync | [orchestrator/orchestrator](orchestrator/orchestrator) |
| **Code Architect** | Engineering | TypeScript ESM, SQLite write-through, HTTP dashboard, sub-agent ownership | [engineering/code-architect](engineering/code-architect) |
| **Test Automation** | Quality | Verification gate (`npm run check`), test harnesses, mock servers | [quality/test-automation](quality/test-automation) |
| **Documentation Specialist** | Documentation | wiki/, md files, issues, rule/skill/template sync | [documentation/documentation-specialist](documentation/documentation-specialist) |

## Sub-Agents

| Agent | Primary | Core Focus | Specification |
|---|---|---|---|
| **Discord Specialist** | Code Architect | discord.js v14 commands, events, EmbedHandler | [engineering/sub-agents/discord-specialist](engineering/sub-agents/discord-specialist) |
| **Feed Watcher** | Code Architect | RSS/Atom/Reddit, dedicated thread delivery, stream alerts | [engineering/sub-agents/feed-watcher](engineering/sub-agents/feed-watcher) |
| **Dashboard Specialist** | Code Architect | SSR dashboard, Discord OAuth2, theme | [engineering/sub-agents/dashboard-engineer](engineering/sub-agents/dashboard-engineer) |
| **Security Auditor** | Test Automation | Secrets, ESLint, formatting, dependencies | [quality/sub-agents/security-auditor](quality/sub-agents/security-auditor) |
| **Wiki Specialist** | Documentation Specialist | `wiki/`, README, `.env.example`, `.agents/` catalogs | [documentation/sub-agents/wiki-specialist](documentation/sub-agents/wiki-specialist) |
| **Issue & Roadmap Manager** | Documentation Specialist | GitHub issues, roadmaps, PRs, release notes | [documentation/sub-agents/issue-manager](documentation/sub-agents/issue-manager) |

---

## Subsystem Reference

| Subsystem | Source Location | Responsibility |
|---|---|---|
| **Discord Bot** | `src/bot/` | Discord client, slash commands, event handlers |
| **Modular Lib** | `src/bot/lib/` | Command options, EmbedHandler, feed helpers |
| **Dashboard** | `src/dashboard/` | Native HTTP server, Discord OAuth, REST API, SSR |
| **Persistence** | `src/db/` | `node:sqlite` tables, schema migrations |
| **State** | `src/state/` | In-memory `AppState`, entity definitions |
| **Feed Syndication** | `src/feed/` | XML parser, HTML scraper, free games, thread delivery |
| **Documentation** | `wiki/`, `README`, `AGENTS` | Wiki sync, `.env.example`, catalogs |
| **Issues & Roadmaps** | GitHub issues/PRs | Roadmap-first tracking, release notes |