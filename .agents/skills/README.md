# 🧠 Agent Technical Skills & Domain Guides (`.agents/skills/`)

This directory contains technical skill definitions, subsystem architectural guides, and engineering playbooks for **HELIX Discord Bot**.

---

## 📋 Skills Catalog

| Skill | Target Domain | Core Focus | Guide File |
|---|---|---|---|
| **Discord.js v14 Engineering** | Discord Subsystem | Self-contained commands (`src/bot/commands/<cat>/<cmd>.ts`), modular `src/bot/lib/`, events, EmbedHandler, API limits | [discord-js](discord-js) |
| **HELIX Development Workflow** | Bot Architecture | Command creation, event registration, persistence, verification checklist | [helix-discord-bot](helix-discord-bot) |
| **Feed Syndication & Threads** | Feed & Content Delivery | RSS/Atom/Reddit ingestion, weekly Sunday Free Games schedule, dedicated thread delivery | [feed-syndication](feed-syndication) |
| **Guild Administration** | Moderation & Roles | Moderation commands, Discord native permissions, role hierarchy, mod log channels | [guild-administration](guild-administration) |
| **Management Dashboard Engineering** | Dashboard & OAuth | Zero-frontend-dep SSR, Discord OAuth2, guild admin authorization, EmbedHandler preview parity | [dashboard-engineering](dashboard-engineering) |
| **TypeScript ESM & Node.js** | Language & Runtime | ESM conventions, `.js` imports, `node:sqlite`, in-memory `AppState` write-through | [typescript](typescript) |
| **GitHub-Flavored Mermaid Diagrams** | Documentation & Diagrams | GitHub-compatible Mermaid syntax, one concern per diagram, legibility | [mermaid-diagrams](mermaid-diagrams) |

---

## 🗺️ Subsystem Architecture Mapping

```mermaid
flowchart TD
    Helix[HELIX Discord Bot] --> Discord[discord-js]
    Helix --> Workflow[helix-discord-bot]
    Helix --> Feeds[feed-syndication]
    Helix --> Admin[guild-administration]
    Helix --> Dashboard[dashboard-engineering]
    Helix --> TS[typescript]
```

---

## 🎯 Usage by Agents

When tasked with implementing or refactoring features in a specific subsystem, agents should review the corresponding skill document to ensure consistency with existing patterns and invariants.
