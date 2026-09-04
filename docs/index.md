# HELIX CLI & Bot Documentation

Welcome to the comprehensive documentation for **HELIX CLI**, the built-in **Discord Bot**, and the **NextAuth Web Dashboard**.

```mermaid
graph LR
    subgraph "Client Interfaces"
        CLI["helix CLI Commands<br/>(Terminal / CI)"]
        WebUI["Web Dashboard UI<br/>(Browser)"]
        SlashCmd["Discord Slash Commands<br/>(Guilds & DMs)"]
    end

    subgraph "Core Execution Engines"
        ScaffoldEngine["Scaffolding Engine<br/>(14 Templates)"]
        AuthResolver["Credential Discovery<br/>(Antigravity • Copilot • Open Code)"]
        RepoManager["Hosting & Git Automation<br/>(gh • glab • git)"]
    end

    subgraph "Runtime & Storage"
        BotGateway["Discord Gateway Client<br/>(discord.js)"]
        NextAuth["NextAuth & OAuth2 Router<br/>(Port 5000)"]
        SQLiteDB[("SQLite Storage<br/>data/helix-bot.sqlite")]
    end

    CLI --> Core Execution Engines
    WebUI --> NextAuth
    SlashCmd --> BotGateway
    BotGateway <--> SQLiteDB
    NextAuth <--> SQLiteDB
    BotGateway <--> NextAuth
```

---

## Documentation Sections

1. [Discord Bot Architecture](file:///d:/Scripts/HELIX%20CLI/docs/discord-bot.md)
   - Slash commands (`/helix-ai`, `/helix-auth`, `/helix-scaffold`, `/helix-status`, `/helix-repo`, `/helix-explain`, `/helix-help`).
   - Per-user OAuth2 session management and SQLite storage.
   - Gateway connection and administrator permission scopes.

2. [NextAuth Web Dashboard](file:///d:/Scripts/HELIX%20CLI/docs/web-dashboard.md)
   - Zero-lag, in-process architecture connecting directly to the bot client and SQLite database.
   - Public vs Internal connection routing (`NEXTAUTH_URL` and `NEXTAUTH_INTERNAL_URL`).
   - Direct bot interaction endpoints: live gateway latency, AI prompts, visual scaffolding studio, and channel broadcaster.

3. [Free-Tier Heroku 1-Click Deployment](file:///d:/Scripts/HELIX%20CLI/docs/deployment-heroku.md)
   - Deploying using 100% free-tier services (Eco Dyno, self-contained local SQLite, zero paid add-ons).
   - Linking GitHub repository secrets directly to Heroku config variables.
   - Setting up the 1-click button and automated deployment workflow.

4. [Docker & Self-Hosting Deployment](deployment-docker.md)
   - Multi-stage production container setup with Node 22 and SQLite volume persistence.
   - 1-command startup with Docker Compose (`docker compose up -d`).
   - Standalone container runs and environment variables configuration.

5. [Scaffolding & Starter Templates](scaffolding-templates.md)
   - Detailed specifications for all 14 multi-framework starter templates across Web, Desktop, Mobile, Game Engines, and Backend services.

6. [AI Agent Integration & Discovery](ai-integration.md)
   - Multi-tiered local client discovery for **Google Antigravity**, **GitHub Copilot**, and **Open Code**.
   - Context-aware code generation and prompt synthesis.
