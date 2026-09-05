# Web Dashboard

The dashboard runs in the same Node process as the bot — no separate service, no network hop.

**URL:** `http://localhost:5000/dashboard` (or your public domain in production)

---

## Dashboard Tabs & Features

1. **Overview**: Real-time connected guild counters, live Discord OAuth2 session statistics, recent scaffolding operations feed, and SQLite database storage metrics.
2. **Direct Broadcast**: Instant channel announcement dispatcher communicating directly with the Discord gateway client with zero network lag.
3. **Language Plugins**: Live in-process plugin registry matrix displaying all active AST linters, capabilities (`lint`, `debug`, `explain`, `docs`, `generate`, `refactor`, `inspect`), supported file extensions, and direct 1-click integration with the official [HELIX Plugin Starter Template](https://github.com/HELIX-Origin/HELIX-Plugin-Template).
4. **Scaffolding Studio**: Visual project blueprint generator supporting all 17 multi-framework starter templates across Web, Discord, Desktop, Mobile, Game Engine, and Backend stacks with real-time file tree previews.
5. **Member Sessions**: Live session management table displaying authenticated Discord users with one-click session revocation.
6. **Guild Configuration**: Real-time guild routing editor for configuring command prefixes (`>`), support ticket hubs, moderation log channels, and welcome channels.
7. **NextAuth & Environment**: Infrastructure diagnostic cards showing active `NEXTAUTH_URL`, `NEXTAUTH_INTERNAL_URL`, OAuth2 callback redirect endpoints, and SQLite file path.

---

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/dashboard` | `GET` | Responsive Admin Web Dashboard UI |
| `/api/dashboard/stats` | `GET` | Real-time gateway ping, connected guilds, SQLite metrics, live plugins list |
| `/api/dashboard/bot/broadcast` | `POST` | Send an announcement to a Discord channel by ID |
| `/api/dashboard/bot/revoke-session` | `POST` | Invalidate an active Discord OAuth2 session |
| `/api/dashboard/scaffold` | `POST` | Generate or preview scaffolding blueprints with file lists |
| `/api/dashboard/guilds` | `GET`, `POST` | Read guild roster and update guild routing configurations |
| `/api/auth/providers` | `GET` | NextAuth OAuth provider discovery endpoint |
| `/api/auth/csrf` | `GET` | NextAuth CSRF token endpoint |
| `/api/auth/session` | `GET` | Check active session cookie |
| `/api/auth/signin` | `GET` | Discord OAuth2 authorization redirect |
| `/api/auth/signout` | `GET` | Clear session cookie and redirect to dashboard |
| `/api/auth/callback/discord` | `GET` | Discord OAuth2 callback — persists session to SQLite |
| `/api/health` | `GET` | Zero-downtime health check — returns `{ "status": "ok" }` |
| `/icon.jpg` | `GET` | Serves dashboard favicon and icon asset |

---

## Authentication

The dashboard uses Discord OAuth2. Sessions are stored securely in the `user_sessions` SQLite table.

**Required env vars:**

| Variable | Description |
|----------|-------------|
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord application credentials |
| `NEXTAUTH_SECRET` | HMAC signing key for session tokens (32+ chars) |
| `NEXTAUTH_URL` | Public base URL (optional, e.g. `https://bot.example.com`), falls back to `http://localhost:<PORT>` |

---

## Direct In-Memory Bot Connection

Dashboard API routes access the live bot client in memory via `HelixBotClient.getInstance()`:

- **Gateway ping** — reads `client.ws.ping` directly
- **Guild cache** — reads `client.guilds.cache` directly  
- **Channel broadcast** — fetches the channel and sends inline
- **SQLite** — shares the same synchronous `BotDatabase` singleton as the bot
