# Templates Index

This directory provides standardized code templates and workflow guides for **HELIX Discord Bot**. All templates strictly adhere to **discord.js v14**, Rule 02 (TypeScript ESM), Rule 04 (Roadmap-First Protocol), and Rule 06 (discord.js Standards).

---

## 1. Code Templates

- **[command-template.ts](command-template.ts)**: Standard standalone slash command structure with colocated option definitions and execution handler.
- **[subcommand-template.ts](subcommand-template.ts)**: Subcommand / subcommand group pattern for complex commands (e.g., `/admin`, `/feed`) with colocated subcommands.
- **[event-template.ts](event-template.ts)**: Strongly typed Discord event listener pattern with isolated execution boundaries.
- **[embed-template.ts](embed-template.ts)**: `EmbedHandler` utility pattern for error, success, warning, and info embeds with automatic character and field clamping.

---

## 2. Process & Workflow Guides

- **[issue-roadmap-template.md](issue-roadmap-template.md)**: GitHub issue template where the first post serves as the living roadmap with Mermaid diagrams and progress checklists.
- **[commit-message-guide.md](commit-message-guide.md)**: Conventional commit message standards with emojis and subsystem scopes (`commands`, `admin`, `music`, `feeds`, `events`, `lib`).
- **[embed-migration-guide.md](embed-migration-guide.md)**: Reference guide for migrating legacy raw Discord payloads and webhooks to `EmbedHandler` embeds.

---

## 3. Directory Conventions

Commands and shared libraries are organized as:
```
src/bot/
├── commands/              # Commands with colocated options & subcommands
│   ├── admin/             # e.g., set.ts, ticket.ts, welcome.ts
│   ├── entertainment/     # e.g., gif.ts, slap.ts
│   ├── feeds/             # e.g., feed.ts
│   ├── music/             # e.g., play.ts, pause.ts, queue.ts, volume.ts
│   └── utility/           # e.g., ping.ts, help.ts, stats.ts, info.ts
└── lib/                   # Shared libraries, modules, and utilities
    ├── embeds/            # EmbedHandler builder, limits, variants
    ├── music/             # Audio formatting, track progress, voice helpers
    ├── admin/             # Permission helpers, role hierarchy, modlog
    └── feeds/             # Feed formatting and delivery utilities
```