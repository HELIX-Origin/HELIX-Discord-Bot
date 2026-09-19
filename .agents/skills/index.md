# Skills Catalog

Index of technical skills, subsystem domain guides, and engineering references for **HELIX Discord Bot**.

---

## Active Skills Directory

| Skill | Target Domain | Core Focus | File |
|---|---|---|---|
| **Discord.js v14 Engineering** | Discord Subsystem | Modular `lib/options/<category>/`, commands, events, EmbedHandler, API limits | [discord-js](discord-js) |
| **HELIX Development Workflow** | Bot Architecture | Command creation, event registration, persistence, verification checklist | [helix-discord-bot](helix-discord-bot) |
| **Feed Syndication & Threads** | Feed & Content Delivery | RSS/Atom/Reddit, weekly Sunday Free Games, dedicated thread delivery | [feed-syndication](feed-syndication) |
| **Guild Administration** | Moderation & Roles | Moderation actions, permissions, role hierarchy, mod log channels | [guild-administration](guild-administration) |
| **Management Dashboard Engineering** | Dashboard & OAuth | Zero-frontend-dep SSR, Discord OAuth2, guild admin authorization, EmbedHandler parity | [dashboard-engineering](dashboard-engineering) |
| **TypeScript ESM & Node.js** | Language & Runtime | ESM conventions, `.js` imports, `node:sqlite`, in-memory `AppState` | [typescript](typescript) |
| **GitHub-Flavored Mermaid Diagrams** | Documentation & Diagrams | GitHub-compatible Mermaid syntax, one concern per diagram, legibility | [mermaid-diagrams](mermaid-diagrams) |

---

## Skill Domain Mapping

```mermaid
flowchart TD
    Helix[HELIX Discord Bot] --> Discord[discord-js]
    Helix --> Workflow[helix-discord-bot]
    Helix --> Feeds[feed-syndication]
    Helix --> Admin[guild-administration]
    Helix --> TS[typescript]
```