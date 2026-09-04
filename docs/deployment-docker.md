# Docker & Self-Hosting Deployment Guide

Deploy the HELIX Discord Bot and companion Web Dashboard in an isolated, production-grade Docker container with automated database migrations and zero host dependencies.

---

## 1. Quick Start with Docker Compose (Recommended)

The easiest way to run the bot and dashboard is with Docker Compose.

### Step 1: Clone the repository and configure `.env`
```bash
git clone https://github.com/HELIX-Origin/helix-cli.git
cd helix-cli
cp .env.example .env
```

Edit `.env` with your Discord application credentials:
```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_CALLBACK_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:5000
NEXTAUTH_SECRET=a_random_32_character_secret_key_here
PORT=5000
```

### Step 2: Start the container
```bash
# Build and start in detached mode
docker compose up -d

# Check live logs
docker compose logs -f
```

The Web Dashboard will be available immediately at:
```
http://localhost:5000/dashboard
```

---

## 2. Running Standalone via Docker CLI

If you prefer building and running the container manually:

```bash
# 1. Build the production multi-stage image
docker build -t helix-discord-bot .

# 2. Run the container with persistent volume mounting for the SQLite database
docker run -d \
  --name helix-discord-bot \
  -p 5000:5000 \
  --env-file .env \
  -v "$(pwd)/data:/app/data" \
  --restart unless-stopped \
  helix-discord-bot

# 3. View logs
docker logs -f helix-discord-bot
```

---

## 3. Persistent Data Storage

The SQLite database (`helix-bot.sqlite`) is stored at `/app/data/helix-bot.sqlite` inside the container. 

The `docker-compose.yml` mounts `./data:/app/data` to guarantee that all:
- Guild configurations and prefix overrides
- Authenticated user OAuth2 sessions
- Scaffolding history and query metrics

are preserved across container updates, rebuilds, and restarts.

---

## 4. Multi-Stage Build Architecture

The [`Dockerfile`](../Dockerfile) uses a 2-stage build:
1. **Builder Stage (`node:22-bookworm-slim`)**:
   - Installs build tools (`python3`, `make`, `g++`, `git`).
   - Compiles TypeScript into standalone dual ESM distributions in `dist/`.
   - Runs `npm prune --omit=dev` to eliminate all development tooling.
2. **Production Runner Stage (`node:22-bookworm-slim`)**:
   - Copies only runtime dependencies and compiled binaries.
   - Includes `git` and `ca-certificates` for optional CLI cloning (`CLONE_CLI=true`).
   - Exposes port `5000` with an integrated HTTP health check (`/health`).
   - Automatically executes `scripts/setup.mjs` on boot to initialize the SQLite database schema prior to launching the Discord gateway client.

---

## 5. Useful NPM Docker Shortcuts

If you have Node.js locally, you can use the built-in npm shortcuts:

```bash
npm run docker:build   # Build the Docker image
npm run docker:up      # Launch via Docker Compose in background
npm run docker:logs    # Follow container logs
npm run docker:down    # Stop and remove containers
```
