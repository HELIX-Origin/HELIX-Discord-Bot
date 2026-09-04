# HELIX -- Agents Documentation

Primary reference for agents, skills, plans, bugs, and templates used across all AI coding assistants working on this repo.

## Repository Layout

```
HELIX CLI/
├── HELIX/                # The bot (self-contained)
│   ├── index.ts          # Entry point
│   ├── src/              # Bot source (commands, handlers, plugins, db, server)
│   ├── dashboard/        # Web dashboard and OAuth2 router
│   └── package.json      # Bot package
├── .agents/              # Universal agent configuration
│   ├── agents/           # Project-type agent files
│   ├── skills/           # Framework and language skills
│   ├── plans/            # Phase roadmap tracking
│   ├── bugs/             # Bug tracking (one file per issue)
│   └── templates/        # YML scaffold templates with index
├── tests/                # Vitest test suite
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .gemini/              # Antigravity-specific config
├── .copilot/             # GitHub Copilot-specific config
├── .opencode/            # Open Code-specific config
├── docs/                 # End-user documentation
└── package.json          # Workspace root (test runner only)
```

## Mandatory Rules (`.agents/rules/`)

Non-negotiable invariants for all AI coding assistants:

| Rule | Description | File |
|------|-------------|------|
| `00-agent-safety-compliance` | Safety rules: prevent irreversible damage, ensure strict instruction compliance | [00-agent-safety-compliance.md](.agents/rules/00-agent-safety-compliance.md) |
| `01-zero-ai-architecture` | No external AI dependencies; plugins execute locally | [01-zero-ai-architecture.md](.agents/rules/01-zero-ai-architecture.md) |
| `02-discord-bot-architecture` | Vanilla discord.js, unified `execute()`, named exports, no sub-indexes | [02-discord-bot-architecture.md](.agents/rules/02-discord-bot-architecture.md) |
| `03-message-formatting` | `messages.json` single source of truth, `message-handler.ts` only | [03-message-formatting.md](.agents/rules/03-message-formatting.md) |
| `04-remote-issue-protocol` | Safe UTF-8 file-based comments for `gh issue` / `gh pr` | [04-remote-issue-protocol.md](.agents/rules/04-remote-issue-protocol.md) |
| `05-documentation-standards` | Minimal root landing page, comprehensive `docs/` | [05-documentation-standards.md](.agents/rules/05-documentation-standards.md) |

---

## Agents (`.agents/agents/`)

| Agent | Purpose | File |
|-------|---------|------|
| `discord-bot` | Discord bot architecture, slash commands, gateway | [discord-bot.md](.agents/agents/discord-bot.md) |
| `web` | React, Vue, Svelte, Angular, Vite, Next.js | [web.md](.agents/agents/web.md) |
| `desktop` | Electron, Tauri v2 | [desktop.md](.agents/agents/desktop.md) |
| `mobile` | Flutter, React Native, Expo | [mobile.md](.agents/agents/mobile.md) |
| `game-engine` | Unity, Godot 4, RPG Maker MZ, Ren'\''Py | [game-engine.md](.agents/agents/game-engine.md) |
| `backend` | Rust, Go, Java, Python | [backend.md](.agents/agents/backend.md) |
| `code-hosting` | GitHub, GitLab, Bitbucket CI/CD | [code-hosting.md](.agents/agents/code-hosting.md) |

---

## Skills (`.agents/skills/`)

### Discord
- [discord-bot-setup](.agents/skills/discord-bot-setup.md): discord.js project setup

### Web
- [web-basics](.agents/skills/web-basics.md): HTML5, CSS3, Vite
- [react-development](.agents/skills/react-development.md): React 19, hooks, Vite
- [vue-development](.agents/skills/vue-development.md): Vue 3 Composition API, Pinia
- [angular-development](.agents/skills/angular-development.md): Angular standalone, signals
- [svelte-development](.agents/skills/svelte-development.md): Svelte 5 runes, SvelteKit

### Desktop
- [electron-setup](.agents/skills/electron-setup.md): Electron main/preload/renderer, IPC
- [tauri-setup](.agents/skills/tauri-setup.md): Tauri v2, Rust backend

### Mobile
- [flutter](.agents/skills/flutter.md): Flutter, Riverpod/Bloc
- [react-native](.agents/skills/react-native.md): React Native, Expo Router

### Game Engines
- [unity](.agents/skills/unity.md): Unity C#, assembly definitions
- [rpgm](.agents/skills/rpgm.md): RPG Maker MZ/MV plugins
- [ren-py](.agents/skills/ren-py.md): Ren'\''Py visual novel scripting
- [godot](.agents/skills/godot.md): Godot 4 GDScript

### Backend
- [rust](.agents/skills/rust.md): Cargo, Tokio, Serde
- [go](.agents/skills/go.md): Go modules, goroutines
- [java](.agents/skills/java.md): Java 21, Spring Boot
- [python](.agents/skills/python.md): Python, uv, FastAPI

### Platform
- [code-hosting-platforms](.agents/skills/code-hosting-platforms.md): gh, glab, Bitbucket

---

## Plan Tracking (`.agents/plans/`)

- [roadmap.md](.agents/plans/roadmap.md) — Master 8-phase roadmap
- [phase1.md](.agents/plans/phase1.md) — Core Foundation & Agent Ecosystem
- [phase2.md](.agents/plans/phase2.md) — TypeScript CLI Architecture & Scaffolding Engine
- [phase3.md](.agents/plans/phase3.md) — Project Type Generators & Template System
- [phase4.md](.agents/plans/phase4.md) — Code Hosting Platform Integrations
- [phase5.md](.agents/plans/phase5.md) — Testing Suite & Verification
- [phase6.md](.agents/plans/phase6.md) — Packaging, Docker & Production Release
- [phase7.md](.agents/plans/phase7.md) — Full Discord Bot Architecture Transition
- [phase8.md](.agents/plans/phase8.md) — Language Plugin System & Code Intelligence Engine
- [phase9.md](.agents/plans/phase9.md) — Plugin Template Repository & Community Ecosystem

---

## Bug Tracking (`.agents/bugs/`)

- [bug-tracking.md](.agents/bugs/bug-tracking.md) — Active bug index
- [BUG-001](.agents/bugs/BUG-001-credential-discovery-path.md) — Cross-platform config path resolution — **Resolved**
- [BUG-002](.agents/bugs/BUG-002-game-engine-template-placeholders.md) — Binary asset preservation in templates — **Resolved**
- [BUG-003](.agents/bugs/BUG-003-heroku-deploy-dynamic-url-detection.md) — Heroku dynamic URL detection — **Resolved**
- [BUG-004](.agents/bugs/BUG-004-auto-resolve-url-env.md) — Auto-resolve NEXTAUTH_URL and callback URLs — **Resolved**
- [BUG-005](.agents/bugs/BUG-005-typescript-strict-mode-errors.md) — TypeScript strict mode errors — **Resolved**
- [BUG-006](.agents/bugs/BUG-006-messages-json-formatting-refactor.md) — Centralized Message Formatting Engine & messages.json refactor — **Resolved**

---

## Templates (`.agents/templates/`)

All templates indexed in [.agents/templates/index.md](.agents/templates/index.md):

`discord-bot.md`, `web-react.md`, `web-vue.md`, `web-app.md`,
`desktop-electron.md`, `desktop-tauri.md`, `desktop-app.md`,
`mobile-flutter.md`, `mobile-react-native.md`,
`game-unity.md`, `game-godot.md`, `game-rpgm.md`, `game-renpy.md`,
`backend-rust.md`, `backend-go.md`, `backend-java.md`, `backend-python.md`,
[mermaid-diagram-guide.md](.agents/templates/mermaid-diagram-guide.md)

---

## Quick Start

```bash
# Start the bot and web dashboard
npm start

# Run the full test suite
npm test

# Type check
npm run typecheck

# Configure a guild in Discord
>set prefix >
>set tickets-hub #support
>set mod-log-channel #mod-logs
>ticket setup-hub

# Install a language plugin
>plugin install HELIX-Origin/helix-origin
```
