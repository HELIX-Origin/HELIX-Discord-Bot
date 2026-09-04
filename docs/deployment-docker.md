# Docker / Self-Hosting

---

## Docker Compose (recommended)

```bash
git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git
cd HELIX-Discord-Bot
cp .env.example .env   # fill in required vars
docker compose up -d
```

Dashboard available at `http://localhost:5000/dashboard`. Logs: `docker compose logs -f`.

The `docker-compose.yml` mounts `./data:/app/data` so the SQLite database survives container rebuilds.

---

## Standalone Docker

```bash
docker build -t helix-discord-bot .

docker run -d \
  --name helix-discord-bot \
  -p 5000:5000 \
  --env-file .env \
  -v "$(pwd)/data:/app/data" \
  --restart unless-stopped \
  helix-discord-bot
```

---

## Required `.env` for Docker

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=a_random_32_character_secret
PORT=5000
```

`DISCORD_CALLBACK_URL` and `NEXTAUTH_URL` should be set to your server'\''s public URL when self-hosting behind a domain:

```env
DISCORD_CALLBACK_URL=https://helix.yourdomain.com
NEXTAUTH_URL=https://helix.yourdomain.com
```

---

## Image Architecture

The `Dockerfile` uses a 2-stage build:

1. **Builder** (`node:22-bookworm-slim`) — compiles TypeScript, prunes dev dependencies
2. **Runner** (`node:22-bookworm-slim`) — minimal runtime image, exposes port `5000`

Health check: `GET /api/health` returns `{ "status": "ok" }`.
