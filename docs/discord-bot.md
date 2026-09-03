# Discord Bot Architecture & Engine

The HELIX Discord Bot integrates your development toolchain and AI agents directly into your Discord servers.

---

## 1. Slash Commands

The bot registers and deploys rich slash commands:
- `/helix-help`: Detailed guide of all bot functions, CLI tools, and architecture features.
- `/helix-auth`: Per-user authentication allowing individual server members to link their own AI sessions without sharing server credentials.
- `/helix-ai <prompt> [provider]`: Query AI assistants directly from channels.
- `/helix-explain <code> [language]`: Instant explanation and debugging of code blocks.
- `/helix-scaffold <type> <name>`: Blueprint project structures across 14 multi-framework starter templates.
- `/helix-status`: Diagnostic health of the bot, internal SQLite database, AI providers, and host machine.
- `/helix-repo <action>`: Inspect connected Git remote repositories and official CLIs (`gh`, `glab`).

---

## 2. SQLite Database Engine

- **Path**: `data/helix-bot.sqlite`
- **Engine**: Node native SQLite (`node:sqlite` / `DatabaseSync`)
- **Initialization**: Run `npm run setup` to generate the database, tables, and indices.
- **Tables**:
  - `user_sessions`: Per-user OAuth2 credentials and token timestamps.
  - `guild_settings`: Guild command prefix, preferred AI model, and custom callback URLs.
  - `query_logs`: Every prompt, execution provider, and timestamp.
  - `scaffold_history`: Project generation logs.
  - `bot_kv`: General key-value store.

---

## 3. Administrator Invite URL (`NEXT_PUBLIC_INVITE_URL`)

- Defined in `.env` and generated automatically during `helix bot setup`:
  ```
  NEXT_PUBLIC_INVITE_URL="https://discord.com/api/oauth2/authorize?client_id=yourclientid&permissions=8&scope=bot"
  ```
- **Permissions Bitflag**: `8` (Administrator).
- **Scope**: `bot`.
- Automatically handled natively by Discord without requiring any redirect URI.
