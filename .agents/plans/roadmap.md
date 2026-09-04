# HELIX -- Project Roadmap

```mermaid
flowchart TD
    subgraph Foundation ["Core Foundation"]
        P1["Phase 1: Agent Ecosystem & Universal Foundation ✅"]
        P2["Phase 2: Project Scaffolding Engine & Templates ✅"]
        P3["Phase 3: Database & Autonomous Schema Migrations ✅"]
    end

    subgraph BotCore ["Bot Core & Web Dashboard"]
        P4["Phase 4: Web Dashboard & NextAuth OAuth2 ✅"]
        P5["Phase 5: Discord Bot Gateway Client & Commands ✅"]
        P6["Phase 6: Production Packaging, Docker & Deploy ✅"]
    end

    subgraph Intelligence ["Code Intelligence & Community"]
        P7["Phase 7: Full Bot Architecture Stabilization ✅"]
        P8["Phase 8: Language Plugin System & Intelligence Engine ✅"]
        P9["Phase 9: Plugin Template Repository & Ecosystem ✅"]
    end

    P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9
```

---

## Phase Milestones & GitHub Tracking

```mermaid
flowchart LR
    P7Plan["Phase 7 (#4)"] --> Sub5["#5: Auth & Config"]
    P7Plan --> Sub6["#6: Command Suite"]
    P7Plan --> Sub7["#7: Bot Core Migration"]
    P7Plan --> Sub8["#8: Verification & DB"]

    P8Plan["Phase 8 (#11)"] --> P8Sub1["Sub 1: Plugin Architecture"]
    P8Plan --> P8Sub2["Sub 2: Ingestion & Source Providers"]
    P8Plan --> P8Sub3["Sub 3: 13 Built-in Plugins"]
    P8Plan --> P8Sub4["Sub 4: messages.json Engine"]

    P9Plan["Phase 9 (#12)"] --> P9Sub1["Sub 1: Starter Template SDK"]
    P9Plan --> P9Sub2["Sub 2: Plugin Authoring Guide"]
    P9Plan --> P9Sub3["Sub 3: Vitest Test Harness"]
    P9Plan --> P9Sub4["Sub 4: Community Docs"]
```

| Phase | Milestone Name | Status | GitHub Issue | Sub-Issues |
|-------|----------------|--------|--------------|------------|
| **Phase 1** | Agent Ecosystem & Universal Foundation | Completed | N/A | 4 Sub-Tasks |
| **Phase 2** | Project Scaffolding Engine & Templates | Completed | N/A | 4 Sub-Tasks |
| **Phase 3** | Database & Autonomous Schema Migrations | Completed | N/A | 4 Sub-Tasks |
| **Phase 4** | Web Dashboard & NextAuth OAuth2 | Completed | N/A | 4 Sub-Tasks |
| **Phase 5** | Discord Bot Gateway Client & Commands | Completed | N/A | 4 Sub-Tasks |
| **Phase 6** | Production Packaging, Docker & Deploy | Completed | N/A | 4 Sub-Tasks |
| **Phase 7** | Full Bot Architecture Stabilization | Completed | [#4](https://github.com/HELIX-Origin/HELIX/issues/4) | [#5](https://github.com/HELIX-Origin/HELIX/issues/5), [#6](https://github.com/HELIX-Origin/HELIX/issues/6), [#7](https://github.com/HELIX-Origin/HELIX/issues/7), [#8](https://github.com/HELIX-Origin/HELIX/issues/8) |
| **Phase 8** | Language Plugin System & Intelligence Engine | Completed | [#11](https://github.com/HELIX-Origin/HELIX/issues/11) | 4 Sub-Tasks |
| **Phase 9** | Plugin Template Repository & Ecosystem | Completed | [#12](https://github.com/HELIX-Origin/HELIX/issues/12) | 4 Sub-Tasks |

---

### [Phase 1](phase1.md) — Agent Ecosystem & Universal Foundation
- [x] Universal agent directory structure (`.agents/`, `.copilot/`, `.gemini/`, `.opencode/`)
- [x] Mandatory rules: Zero-AI runtime (`01`), Discord bot architecture (`02`), messages.json (`03`), GitHub issues protocol (`04`), documentation standards (`05`)
- [x] 21 framework and language skills knowledge base
- [x] Bug tracking index with GitHub Issues synchronization

### [Phase 2](phase2.md) — Project Scaffolding Engine & Templates
- [x] Scaffolding engine with template variable interpolation (`TemplateEngine`)
- [x] Binary asset safe bypass (`isBinaryFile`)
- [x] 17 production-ready starter templates across Web, Desktop, Mobile, Game, and Backend domains
- [x] Scaffolding Discord commands (`>project create`, `>project scaffold`)

### [Phase 3](phase3.md) — Database & Autonomous Schema Migrations
- [x] SQLite database singleton (`BotDatabase`) using `better-sqlite3`
- [x] Autonomous schema migrations on boot (`migrations.ts`)
- [x] Tables: `guild_settings`, `tickets`, `moderation_logs`, `warnings`, `user_settings`, `user_sessions`, `bot_kv`
- [x] Per-guild configuration persistence (custom prefix, ticket hub, mod log channel)

### [Phase 4](phase4.md) — Web Dashboard & NextAuth OAuth2
- [x] Native Node.js HTTP server (`src/server.ts`)
- [x] NextAuth Discord OAuth2 callback handler (`/api/auth/callback/discord`)
- [x] Responsive dark-mode dashboard HTML/CSS/JS (`dashboard/index.html`)
- [x] REST API endpoints (`/api/stats`, `/api/guilds`, `/api/plugins`, `/health`)

### [Phase 5](phase5.md) — Discord Bot Gateway Client & Commands
- [x] Vanilla discord.js v14 client architecture (`HelixBotClient`)
- [x] 25 commands across 5 categories (`mod`, `util`, `info`, `project`, `config`)
- [x] Thread-based ticket system with interactive buttons and modals
- [x] Unified `execute(context)` execution supporting prefix (`>`) and slash commands

### [Phase 6](phase6.md) — Production Packaging, Docker & Deploy
- [x] Production multi-stage Docker image (`node:22-bookworm-slim`)
- [x] Docker Compose with persistent SQLite volume (`./data:/app/data`)
- [x] GitHub Actions CI matrix runner across Ubuntu, Windows, macOS
- [x] Resolved BUG-001, BUG-002, BUG-003

### [Phase 7](phase7.md) — Full Bot Architecture Stabilization
- [x] Complete transition to standalone Discord bot architecture (GitHub Issue [#4](https://github.com/HELIX-Origin/HELIX/issues/4))
- [x] Multi-platform dynamic URL auto-detection in `src/env.ts` (Resolved BUG-004)
- [x] TypeScript strict mode type safety and type narrowing (Resolved BUG-005)
- [x] Resolved sub-issues #5, #6, #7, #8

### [Phase 8](phase8.md) — Language Plugin System & Intelligence Engine
- [x] Zero-AI local language plugin architecture (GitHub Issue [#11](https://github.com/HELIX-Origin/HELIX/issues/11))
- [x] Universal multi-source code ingestion (Chat codeblocks, Discord attachments, GitHub, GitLab, Bitbucket, Pastebins)
- [x] 13 built-in language plugins (`typescript`, `python`, `rust`, `go`, `java`, `csharp`, etc.)
- [x] Bot commands: `>lint`, `>explain`, `>debug`, `>refactor`, `>generate`, `>inspect`, `>docs`
- [x] Centralized message formatting engine (`messages.json` + `message-handler.ts`, Resolved BUG-006)

### [Phase 9](phase9.md) — Plugin Template Repository & Ecosystem
- [x] Template repository specification (`HELIX-Origin/helix-plugin-template`) (GitHub Issue [#12](https://github.com/HELIX-Origin/HELIX/issues/12))
- [x] Pluggable `SourceProvider` registration for custom code repositories
- [x] Comprehensive community plugin authoring guide (`docs/plugin-authoring.md`)
- [x] Public plugin installation via `>plugin install <owner/repo>`
