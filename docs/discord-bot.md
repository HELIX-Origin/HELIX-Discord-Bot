# Bot Reference

## Commands

Default prefix: `>` — configurable per guild. All commands are available as both prefix and slash.

### Moderation

| Command | Description | Required Permission |
|---------|-------------|---------------------|
| `>kick @user [reason]` | Kick a member | KickMembers |
| `>ban @user [reason]` | Ban a member | BanMembers |
| `>unban <userId> [reason]` | Unban by ID | BanMembers |
| `>timeout @user <minutes> [reason]` | Timeout (max 28 days) | ModerateMembers |
| `>untimeout @user` | Remove timeout | ModerateMembers |
| `>purge <1–100>` | Bulk delete messages in current channel | ManageMessages |
| `>warn user @user [reason]` | Issue a warning (logged to DB) | ModerateMembers |
| `>warn list @user` | View a member's warning history | ModerateMembers |
| `>warn clear @user` | Clear all warnings for a member | ModerateMembers |

### Utility

| Command | Description |
|---------|-------------|
| `>ping` | Gateway latency |
| `>avatar [@user]` | Get avatar URL |
| `>serverinfo` | Server statistics |
| `>userinfo [@user]` | User information |
| `>poll <question>` | Reaction poll |
| `>snowflake <id>` | Decode a Discord snowflake |
| `>remind <time> <message>` | Set a timed reminder |

### Info

| Command | Description |
|---------|-------------|
| `>help` | All commands |
| `>info` | Bot diagnostics and version |
| `>status` | System health (gateway, DB, uptime) |
| `>list` | Available scaffold template IDs |

### Project Scaffolding

| Command | Description |
|---------|-------------|
| `>create <type> <name>` | Scaffold a new project from a template |
| `>scaffold <type>` | Preview the file tree for a template |

See [Scaffolding Templates](scaffolding-templates.md) for all valid `<type>` values.

### Configuration

**`>set <subcommand>`** — Requires ManageGuild.

| Subcommand | Description |
|------------|-------------|
| `prefix <char>` | Change the guild command prefix |
| `tickets-hub <#channel>` | Channel where the ticket panel is posted |
| `ticket-manager-role <@role>` | Role that can manage all tickets |
| `mod-log-channel <#channel>` | Channel for moderation action logs |
| `welcome-channel <#channel>` | Channel for member join messages |
| `view` | Display all current guild settings |

**`>ticket <subcommand>`**

| Subcommand | Description |
|------------|-------------|
| `create [subject]` | Open a new ticket thread |
| `close` | Close the ticket in the current thread |
| `setup-hub` | Post the interactive ticket panel in the configured hub channel |
| `add @user` | Add a user to the current ticket thread |
| `remove @user` | Remove a user from the current ticket thread |
| `transcript` | Export the thread message history |

**`>plugin <subcommand>`**

| Subcommand | Description |
|------------|-------------|
| `list` | List installed plugin repos and their languages |
| `install <owner/repo>` | Clone a GitHub plugin repo and register all plugins |
| `remove <id>` | Remove a plugin |
| `info <id>` | Show plugin manifest details |
| `enable <id>` / `disable <id>` | Toggle a plugin |

---

## Database

**Location:** `HELIX/data/helix-bot.sqlite` (auto-created on first boot)  
**Engine:** Node native `DatabaseSync` (`node:sqlite`) — no external DB process required.

Schema is created and migrated automatically at startup. No setup step needed.

| Table | Contents |
|-------|----------|
| `guild_settings` | Per-guild prefix, hub channel, manager role, log channels |
| `tickets` | Open and closed ticket records with thread/channel IDs |
| `moderation_logs` | Kick, ban, timeout, purge, warn actions with reason and actor |
| `warnings` | Per-user warning history |
| `user_sessions` | Discord OAuth2 session tokens (dashboard login) |
| `user_settings` | Per-user notification preferences |
| `query_logs` | Prompt/query history and provider metadata |
| `scaffold_history` | Project generation records |
| `bot_kv` | General-purpose key-value store |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token |
| `DISCORD_CLIENT_ID` | Yes | Application client ID |
| `DISCORD_CLIENT_SECRET` | Yes | OAuth2 client secret (dashboard) |
| `NEXTAUTH_SECRET` | Yes | Session signing secret (32+ chars) |
| `PORT` | No | HTTP server port — defaults to `5000` |
| `BOT_OWNER_ID` | No | Discord user ID for bot-owner-only commands |
| `NEXT_PUBLIC_INVITE_URL` | No | Pre-built bot invite URL — auto-generated from `CLIENT_ID` if unset |
| `DISCORD_CALLBACK_URL` | No | OAuth2 base URL — auto-detected on Heroku/Render/Railway |
| `NEXTAUTH_URL` | No | Public NextAuth URL — auto-detected on Heroku/Render/Railway |
| `DISCORD_DB_PATH` | No | Custom SQLite file path — defaults to `data/helix-bot.sqlite` |
