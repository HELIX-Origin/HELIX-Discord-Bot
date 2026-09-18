# 🤖 AI Agent Ecosystem (`.agents/`)

This directory contains the operational specifications, mandatory engineering rules, domain skills, and code templates for AI agents, coding assistants, and contributors working on **HELIX Discord Bot**.

> 📖 **Primary Operating Manual**: For high-level project status, architectural mandates, and current issue tracking, refer to the root entry point: [**`AGENTS.md`**](../AGENTS.md).  
> 📝 **Local Tracking**: `PLAN.md`, `BUGS.md`, and `TODO.md` are local-only workspace scratchpads (gitignored) and must never be committed to the repository.

---

## 📁 Ecosystem Structure

| Directory | Purpose | Primary Focus | Link |
|---|---|---|---|
| [**`agents/`**](agents/) | **Agent Roles Catalog** | Focus-area agent teams: primary agents with sub-agents (coordination, engineering, quality, documentation) | [Browse Agents](agents/README.md) |
| [**`rules/`**](rules/) | **Mandatory Rules** | Non-negotiable safety, architecture, discord.js v14, documentation, and code style rules (Rules 00–09) | [Browse Rules](rules/README.md) |
| [**`skills/`**](skills/) | **Domain Skills** | In-depth technical guides for Discord.js, feeds, and SQLite state | [Browse Skills](skills/README.md) |
| [**`templates/`**](templates/) | **Code & Workflow Templates** | Production-ready blueprints for commands, subcommands, events, embeds, and GitHub roadmaps | [Browse Templates](templates/README.md) |

---

## 🔄 Agent Collaboration Workflow

```mermaid
flowchart TD
    UserGoal(["User Request / Issue Goal"]) --> Orchestrator["Orchestrator Agent (Primary)"]

    Orchestrator --> Engineering["Code Architect (Primary)"]
    Orchestrator --> Quality["Test Automation (Primary)"]
    Orchestrator --> Documentation["Documentation Specialist (Primary)"]

    Engineering --> DiscordSer["Discord Specialist (Sub)"]
    Engineering --> FeedWatch["Feed Watcher (Sub)"]
    Engineering --> DashboardSer["Dashboard Specialist (Sub)"]
    Quality --> Auditor["Security Auditor (Sub)"]
    Documentation --> WikiSer["Wiki Specialist (Sub)"]
    Documentation --> IssueMgr["Issue & Roadmap Manager (Sub)"]

    Engineering --> VerifyGate{"Validation Gate: npm run check"}
    Quality --> VerifyGate
    DiscordSer --> VerifyGate
    FeedWatch --> VerifyGate
    DashboardSer --> VerifyGate
    Auditor --> VerifyGate

    VerifyGate -->|"Pass: 0 errors, 0 warnings"| Done(["Commit & Push to Remote"])
```

---

## 🛡️ Core Governance & Principles

1. **Safety First (Rule 00)**: Zero irreversible damage, secrets remain exclusively in `.env`, production databases are preserved.
2. **Zero Unsolicited Injection (Rule 01)**: No unapproved third-party runtime dependencies.
3. **Strict Discord.js v14 Standards (Rule 06)**: Self-contained commands with colocated options (`src/bot/commands/<category>/<command>.ts`), dynamic discovery (`src/bot/handlers/loader.ts`), and reusable modular utilities in `src/bot/lib/`.
4. **Mandatory Verification Gate**: All changes must pass `npm run check` (`tsc --noEmit`, `typecheck:test`, `format:check`, `eslint`, and `vitest run`) before any commit.
