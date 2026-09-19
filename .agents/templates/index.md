# Templates Index

This directory provides standardized code templates and workflow guides for **HELIX Discord Bot**. All templates strictly adhere to **discord.js v14**, Rule 02 (TypeScript ESM), Rule 04 (Roadmap-First Protocol), and Rule 06 (discord.js Standards).

---

## 1. Code Templates

- **[command-template](command-template)**: Standard standalone slash command structure with colocated option definitions and execution handler.
- **[subcommand-template](subcommand-template)**: Subcommand / subcommand group pattern for complex commands (e.g., `/admin`, `/feed`) with colocated subcommands.
- **[event-template](event-template)**: Strongly typed Discord event listener pattern with isolated execution boundaries.
- **[embed-template](embed-template)**: Standard `EmbedHandler` formatting guide, production blueprints, and semantic variant patterns.
- **[dashboard-route-template](dashboard-route-template)**: Standard dashboard domain route handler with authentication and audit logging.
- **[dashboard-view-template](dashboard-view-template)**: Standard dashboard SSR view component template with HTML escaping.

---

## 2. Process & Workflow Guides

- **[issue-roadmap-template](issue-roadmap-template)**: GitHub issue template where the first post serves as the living roadmap with Mermaid diagrams and progress checklists.
- **[mermaid-diagram-template](mermaid-diagram-template)**: GitHub-flavored Mermaid diagram template following Rule 09, with compliance checklist.
- **[commit-message-guide](commit-message-guide)**: Conventional commit message standards with emojis and subsystem scopes (`commands`, `admin`, `music`, `feeds`, `events`, `lib`).
- **[release-notes-template](release-notes-template)**: Structured GitHub release notes template following Rule 08 with emoji markers and upgrade instructions.

---

## 3. Directory Conventions

Commands and shared libraries are organized as:
```
src/bot/
├── commands/              # Commands with colocated options & subcommands
│   ├── admin/             # e.g., set.ts, ticket.ts, welcome.ts
│   ├── entertainment/     # e.g., gif.ts, slap.ts
│   ├── feeds/             # e.g., feed.ts
│   └── utility/           # e.g., ping.ts, help.ts, stats.ts, info.ts
└── lib/                   # Shared libraries, modules, and utilities
    ├── embeds/            # EmbedHandler builder, limits, variants
    ├── admin/             # Permission helpers, role hierarchy, modlog
    └── feeds/             # Feed formatting and delivery utilities
```