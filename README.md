# HELIX CLI

```
  ██╗  ██╗███████╗██╗     ██╗██╗  ██╗     ██████╗██╗     ██╗
  ██║  ██║██╔════╝██║     ██║╚██╗██╔╝    ██╔════╝██║     ██║
  ███████║█████╗  ██║     ██║ ╚███╔╝     ██║     ██║     ██║
  ██╔══██║██╔══╝  ██║     ██║ ██╔██╗     ██║     ██║     ██║
  ██║  ██║███████╗███████╗██║██╔╝ ██╗    ╚██████╗███████╗██║
  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═╝     ╚═════╝╚══════╝╚═╝
```

**HELIX CLI** is a universal developer assistant and multi-framework project generator built in TypeScript. It delivers production-grade scaffolding across 14 project templates, multi-tiered AI client integration (**Google Antigravity**, **GitHub Copilot**, **Open Code**), and official code hosting CLI automation (**GitHub CLI `gh`**, **GitLab CLI `glab`**, Bitbucket).

<p align="center">
  <a href="https://heroku.com/deploy?template=https://github.com/HELIX-Origin/helix-cli">
    <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy to Heroku (Free-Tier Eco Dyno)">
  </a>
</p>

<p align="center">
  <b>100% Free-Tier Architecture</b> • <b>Zero Paid Heroku Services</b> • <b>Self-Contained SQLite Database</b>
</p>

---

## Key Features

- **Universal Multi-Architecture Support**:
  - **Discord Bots**: `discord.js` v14 with slash command deployment scripts.
  - **Web Applications**: React 19 & Vue 3 with Vite, TypeScript, and Tailwind CSS.
  - **Desktop Applications**: Electron (context-isolated security) and Tauri v2 (Rust backend).
  - **Mobile Applications**: Flutter Riverpod & React Native with Expo Router.
  - **Game Engines**: Unity (C# Assembly Definition), Godot 4 (GDScript), RPG Maker MZ (Plugins), and Ren'Py (Visual Novels).
  - **Backend Services**: Rust (Axum + Tokio), Go 1.22+ (`http.ServeMux`), Java 21 (Spring Boot 3), and Python (FastAPI + uv).
- **Code Hosting CLI Automation**:
  - Automatically initializes Git and creates remote repositories via **GitHub CLI (`gh`)** or **GitLab CLI (`glab`)**.
  - Generates platform-specific CI/CD pipelines (`.github/workflows/ci.yml`, `.gitlab-ci.yml`, `bitbucket-pipelines.yml`).
- **Multi-Tiered AI Client Discovery**:
  - Discovers authenticated local sessions from installed tools:
    - **Google Antigravity**: Active client directory (`~/.gemini/antigravity`) or `agy` CLI.
    - **GitHub Copilot**: Active GitHub CLI login (`gh auth token`) or local `hosts.json`.
    - **Open Code Go / Zen**: Stored token in `~/.opencode/auth.json` or `opencode` CLI.
  - Gracefully falls back to `.env` if clients are not available.
- **Interactive AI Context Assistant**:
  - `helix ai query "<query>"`: Analyzes your current codebase and queries your primary authenticated agent.
  - `helix ai generate "<feature>"`: Generates production-ready, strictly typed code adhering to the detected project structure.

---

## Installation

```bash
# Install globally via npm
npm install -g helix-cli

# Or run directly with npx
npx helix-cli --help
```

---

## CLI Command Reference

### 1. Project Scaffolding (`helix create`)
```bash
helix create <type> <name> [options]

# Examples:
helix create web my-react-app --template web-react --git-platform github
helix create discord-bot my-bot --template discord-bot
helix create desktop my-desktop --template desktop-tauri
helix create game-engine my-godot --template game-godot
helix create backend my-api --template backend-rust
```

Options:
- `-t, --template <name>`: Template override (e.g. `web-react`, `desktop-tauri`, `backend-python`)
- `--git-platform <platform>`: Code hosting platform (`github`, `gitlab`, `bitbucket`, `none`)
- `--repo-visibility <visibility>`: Remote visibility (`public`, `private`)
- `--skip-install`: Skip automatic dependency installation
- `--skip-git`: Skip local git repository initialization
- `--dry-run`: Preview file generation without touching disk

### 2. AI Agent Management (`helix ai`)
```bash
# Check authentication status across all AI clients
helix ai status

# Test connection to a specific provider
helix ai test copilot
helix ai test antigravity
helix ai test opencode

# Query the AI with full workspace context
helix ai query "How do I register a new slash command in this bot?"

# Generate code with project architecture context
helix ai generate "Health check endpoint with timestamp"
```

### 3. Code Hosting CLI Automation (`helix repo`)
```bash
# Check status of installed official CLIs (gh, glab)
helix repo status

# Create a remote repository and automatically push .env to GitHub Secrets
helix repo create --platform github --name my-project --visibility public

# Manually synchronize local .env variables into GitHub Secrets securely
helix repo sync-secrets [--name my-project] [--env-path .env]
```
> [!TIP]
> When creating or synchronizing repositories with GitHub, any local `.env` keys and values are securely piped via standard input into GitHub Secrets (`gh secret set`) without being committed or exposed to the git log.


### 4. Built-in Discord Bot & Web Dashboard (`helix bot`)
Integrate HELIX Code directly into your Discord server and control everything via an interactive browser dashboard:
```bash
# Check Discord bot and NextAuth configuration
helix bot status

# Interactive setup wizard (configures .env and initializes SQLite)
helix bot setup

# Setup database tables and indexes independently
npm run setup

# Launch the Web Dashboard (NextAuth powered)
helix bot dashboard [--port 5000]

# Deploy application slash commands to Discord
helix bot deploy [--guild-id <id>] [--dry-run]

# Start the built-in Discord bot server & dashboard listener
helix bot start [--port 5000]
```

#### Web Dashboard & NextAuth Configuration
The bot server hosts a companion dashboard that runs alongside the bot. Configure the following environment variables in `.env`:
- `NEXTAUTH_URL`: Public-facing base URL (e.g. `http://localhost:5000` or production domain).
- `NEXTAUTH_INTERNAL_URL`: Internal URL used by the dashboard and local loopback connections (e.g. `http://127.0.0.1:5000`).
- `NEXTAUTH_SECRET`: HMAC SHA-256 signing secret for session tokens.
- `DISCORD_CALLBACK_URL`: Base OAuth2 callback URL (`http://localhost:5000`).
- `NEXT_PUBLIC_INVITE_URL`: Administrator invite URL (`https://discord.com/api/oauth2/authorize?client_id=yourclientid&permissions=8&scope=bot`).

#### Dashboard Features:
- **Overview & Diagnostics**: Real-time bot latency, SQLite query logs, scaffold history, AI providers, and code hosting tools.
- **AI Playground**: Send direct prompts to Google Antigravity, GitHub Copilot, or Open Code directly from your browser.
- **Visual Scaffolding Studio**: Blueprint and generate multi-framework projects with 14 templates directly from the web interface.
- **Guild & Member Sessions**: Inspect Discord guild members and active authenticated sessions.
- **NextAuth Token Inspector**: Verify active NextAuth session state and environment keys.

Available Slash Commands in Discord:
- `/helix-help`: Display all HELIX Code and CLI capabilities.
- `/helix-auth`: Authenticate your Discord user account with local HELIX CLI agents.
- `/helix-ai <prompt> [provider]`: Query AI assistants directly from Discord channels.
- `/helix-explain <code> [language]`: Explain code snippets, algorithms, and stack traces.
- `/helix-scaffold <type> <name>`: Blueprint and plan multi-framework project structures.
- `/helix-status`: Diagnostic health of AI agents, tools, and host system.
- `/helix-repo <action>`: Inspect remote repository status and CLI credentials.

### 5. Catalog & Diagnostics
```bash
# List available agents, skills, and templates
helix list templates
helix list agents
helix list skills

# Display system and toolchain diagnostics
helix info

# Check for updates on npm
helix update

# Generate shell autocompletion
helix completion powershell >> $PROFILE
helix completion bash >> ~/.bashrc
```

---

## Supported Templates

| Template ID | Domain | Framework / Engine | Language |
|-------------|--------|--------------------|----------|
| `discord-bot` | Discord | discord.js v14 | TypeScript |
| `web-react` | Web | React 19 + Vite | TypeScript |
| `web-vue` | Web | Vue 3 + Vite | TypeScript |
| `desktop-electron` | Desktop | Electron | TypeScript |
| `desktop-tauri` | Desktop | Tauri v2 | Rust + TypeScript |
| `mobile-flutter` | Mobile | Flutter | Dart |
| `mobile-react-native`| Mobile | Expo Router | TypeScript |
| `game-unity` | Game Engine | Unity LTS | C# |
| `game-godot` | Game Engine | Godot 4 | GDScript |
| `game-rpgm` | Game Engine | RPG Maker MZ/MV | JavaScript |
| `game-renpy` | Game Engine | Ren'Py | Python |
| `backend-rust` | Backend | Axum + Tokio | Rust |
| `backend-go` | Backend | Net/HTTP 1.22+ | Go |
| `backend-java` | Backend | Spring Boot 3 | Java 21 |
| `backend-python` | Backend | FastAPI + uv | Python |

---

## Architecture & Development
- [docs/](file:///d:/Scripts/HELIX%20CLI/docs/index.md): Multi-page architectural specifications, deployment guides, and template catalogs.
- `tests/`: Automated unit and integration test suite with Vitest.
- `src/`: Modular TypeScript source code (CLI, Scaffolding Engine, NextAuth Dashboard, and Built-in Discord Bot).

---

## Documentation

Explore the complete multi-page documentation suite in [docs/](file:///d:/Scripts/HELIX%20CLI/docs/index.md):
- [Architecture Overview](file:///d:/Scripts/HELIX%20CLI/docs/index.md)
- [Discord Bot Architecture & Slash Commands](file:///d:/Scripts/HELIX%20CLI/docs/discord-bot.md)
- [NextAuth Web Dashboard & Zero-Lag Direct Engine](file:///d:/Scripts/HELIX%20CLI/docs/web-dashboard.md)
- [Free-Tier Heroku 1-Click Deployment & GitHub Secrets](file:///d:/Scripts/HELIX%20CLI/docs/deployment-heroku.md)
- [14 Multi-Framework Starter Templates](file:///d:/Scripts/HELIX%20CLI/docs/scaffolding-templates.md)
- [Multi-Tiered AI Integration & Discovery](file:///d:/Scripts/HELIX%20CLI/docs/ai-integration.md)

---

## License

MIT

