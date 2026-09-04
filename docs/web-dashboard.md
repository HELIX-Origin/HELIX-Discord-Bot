# Web Dashboard

The dashboard runs in the same Node process as the bot — no separate service, no network hop.

**URL:** `http://localhost:5000/dashboard` (or your public domain in production)

---

## Endpoints

| Route | Description |
|-------|-------------|
| `GET /dashboard` | Admin UI |
| `GET /api/dashboard/stats` | Live gateway ping, guild count, SQLite metrics |
| `POST /api/dashboard/bot/broadcast` | Send a message to a Discord channel by ID |
| `POST /api/dashboard/scaffold` | Trigger project scaffolding |
| `GET /api/dashboard/guilds` | Guild roster and active user sessions |
| `GET /api/auth/callback/discord` | Discord OAuth2 callback — stores session in SQLite |
| `GET /api/health` | Health check — returns `{ "status": "ok" }` |

---

## Authentication

The dashboard uses Discord OAuth2. Sessions are stored in the `user_sessions` SQLite table.

**Required env vars:**

| Variable | Description |
|----------|-------------|
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord application credentials |
| `NEXTAUTH_SECRET` | HMAC signing key for session tokens (32+ chars) |
| `NEXTAUTH_URL` | Public base URL — auto-detected from platform env vars, falls back to `http://localhost:<PORT>` |

`NEXTAUTH_INTERNAL_URL` is always `http://localhost:<PORT>` and never needs to be set manually.

---

## Bot Connection

Dashboard API routes access the live bot client in memory via `HelixBotClient.getInstance()`:

- **Gateway ping** — reads `client.ws.ping` directly
- **Guild cache** — reads `client.guilds.cache` directly  
- **Channel broadcast** — fetches the channel and sends inline
- **SQLite** — shares the same `BotDatabase` singleton as the bot
