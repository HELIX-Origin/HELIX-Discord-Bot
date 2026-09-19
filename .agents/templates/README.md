# 📐 Engineering & Governance Templates (`.agents/templates/`)

This directory provides standardized code blueprints, discord.js v14 patterns, and process templates for **HELIX Discord Bot**.

All templates adhere strictly to:
- **Rule 02**: TypeScript ESM architecture (`.js` imports, strict typing).
- **Rule 04**: Remote issue roadmap protocol (living first post with Mermaid diagrams).
- **Rule 06**: Discord.js v14 standards (self-contained commands with colocated options, modular `lib/` utilities).
- **Rule 07**: Zero-frontend-dep SSR dashboard standards.

---

## 🛠️ 1. Code Blueprints

| Template | Scope | Description |
|---|---|---|
| [**`command-template`**](command-template) | Slash Command | Standalone command template with colocated options, execution handler, and error catching |
| [**`subcommand-template`**](subcommand-template) | Complex Command | Subcommand and subcommand group pattern (e.g., `/role`, `/voice`) |
| [**`event-template`**](event-template) | Discord Event | Strongly typed Discord event listener pattern with isolated execution boundaries |
| [**`embed-template`**](embed-template) | Embed Standards | Standardized `EmbedHandler` template, formatting guide, and production blueprints |
| [**`dashboard-route-template`**](dashboard-route-template) | HTTP API Route | Dashboard domain REST route handler with authentication and audit logging |
| [**`dashboard-view-template`**](dashboard-view-template) | SSR View Component | Dashboard SSR HTML component template with safe escaping |

---

## 📋 2. Process & Workflow Guides

| Template | Scope | Description |
|---|---|---|
| [**`issue-roadmap-template`**](issue-roadmap-template) | GitHub Issues | Living roadmap template for GitHub issues with Mermaid diagrams and progress tracking |
| [**`issue-template`**](issue-template) | Issue Body | Standard issue reporting blueprint |
| [**`mermaid-diagram-template`**](mermaid-diagram-template) | Mermaid Diagrams | GitHub-flavored Mermaid diagram template following Rule 09 with legibility checklist |
| [**`commit-message-guide`**](commit-message-guide) | Git Commits | Conventional commit standard with emojis and subsystem scopes |
| [**`release-notes-template`**](release-notes-template) | GitHub Releases | Structured release notes blueprint with emoji markers and upgrade steps |

---

## 📂 Command & Library Directory Convention

```
src/bot/
├── commands/              # Self-contained commands with colocated options & subcommands
│   ├── admin/             # e.g., role.ts, server.ts, set.ts, voice.ts
│   ├── entertainment/     # e.g., gif.ts, slap.ts, hug.ts
│   ├── feeds/             # e.g., rss.ts, youtube.ts, twitch.ts, free-games.ts, reddit.ts
│   ├── mod/               # e.g., kick.ts, ban.ts, warn.ts, purge.ts, lock.ts
│   └── utility/           # e.g., about.ts, help.ts, stats.ts, ping.ts
└── lib/                   # Shared reusable libraries, modules, and utilities
    ├── embeds/            # EmbedHandler builder, limits, variants, responses
    ├── admin/             # Permission helpers, role hierarchy, modlog
    └── feeds/             # Feed formatting and delivery utilities
```
