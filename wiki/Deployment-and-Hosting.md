# 🚀 Deployment & Hosting Guide

HELIX Discord Bot is optimized for self-hosted deployments on **Docker**, **Linux VPS**, and bare metal with native SSL. Cloud PaaS platforms are intentionally not supported.

---

## 🐳 Option 1: Docker & Docker Compose (Recommended)

The repository ships with a production `Dockerfile` and `docker-compose.yml` (multi-stage Node 22 Alpine build, non-root user, `/health` probe, persistent SQLite volume).

### 1. Project Files Setup
```yaml
services:
  helix-discord-bot:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: helix-discord-bot
    restart: unless-stopped
    ports:
      - "3131:3131"
    volumes:
      - ./data:/app/data
    env_file:
      - path: .env
        required: false
    environment:
      - NODE_ENV=production
      - INTERNAL_URL=0.0.0.0
      - SQLITE_DATA=/app/data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3131/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

### 2. Launch Container
```bash
# Build and start in background
docker compose up -d --build

# View real-time container logs
docker compose logs -f
```

---

## 🖥️ Option 2: Linux VPS with PM2 & Systemd

For hosting directly on an Ubuntu/Debian/Rocky Linux server:

### 1. Install Node.js & Global Process Manager
```bash
# Install Node.js 22.x LTS (required: >= 22.9.0 for native node:sqlite)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Clone and Build Project
```bash
git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git /opt/helix-rss
cd /opt/helix-rss

npm install
npm run build
cp .env.example .env
nano .env  # Configure credentials
```

### 3. Start with PM2
```bash
# Start the compiled server
pm2 start dist/index.js --name "helix-discord-bot"

# Save PM2 process list and configure auto-restart on system reboot
pm2 save
pm2 startup
```

### 3b. Alternative: Start with tmux (Session-Based)
Prefer a lightweight no-daemon approach? Use `tmux` to keep the process alive inside a persistent terminal session — great for quick VPS setups that don't need process management.

```bash
# Install tmux if not already present
sudo apt-get install -y tmux

# Start a new detachable session named "helix-discord-bot"
tmux new -s helix-discord-bot

# Inside the session, start the compiled server
npm start

# Detach and keep it running in the background
# Press Ctrl+B, then D
```

Reattach the session later to see logs or restart the process:
```bash
# List sessions
tmux ls

# Reattach
tmux attach -t helix-discord-bot
```

> **Note:** tmux keeps the process running only while the session persists. For auto-restart across reboots, use PM2 (`pm2 startup`) or a systemd unit instead.

---

## 🌐 Reverse Proxy Configuration

When hosting the dashboard publicly on the web, place it behind a reverse proxy with SSL termination.

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name rss.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rss.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/rss.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rss.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3131;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*Make sure `PUBLIC_URL=https://rss.yourdomain.com` is configured in `.env` so OAuth callbacks are generated against the public hostname.*

---

### Caddy (Manual Reverse Proxy Setup)

HELIX Discord Bot does not ship built-in Caddy support, but Caddy is a great option if you need a self-managed HTTPS proxy. You can install and run Caddy as your own process and point it at the service.

#### 1. Install Caddy
```bash
# Debian/Ubuntu
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```
```powershell
# Windows (download from https://caddyserver.com/download)
# Place caddy.exe in a folder, e.g. C:\caddy
```

#### 2. Create a Caddyfile
```caddyfile
rss.yourdomain.com {
    # Caddy automatically forwards X-Forwarded-* headers to the proxy target
    reverse_proxy 127.0.0.1:3131
}
```
Caddy automatically provisions and renews Let's Encrypt certificates for the hostname.

#### 3. Run Caddy
```bash
# Linux (foreground, uses ./Caddyfile by default)
caddy run

# Windows
C:\caddy\caddy.exe run --config C:\caddy\Caddyfile
```
> **Note:** Set `PUBLIC_URL=https://rss.yourdomain.com` in `.env` so dashboard links and OAuth callbacks use the public hostname, and log in with your own domain instead of `IP:port`.

---

## 🪟 Option 3: Windows (Local Hosting)

HELIX Discord Bot runs natively on Windows with Node.js.

### 1. Install Node.js
Download and install the **Node.js 22.x LTS** (>=22.9.0 for native `node:sqlite`) from [nodejs.org](https://nodejs.org). Make sure `node` and `npm` are available in a new terminal:
```powershell
node --version
npm --version
```

### 2. Clone and Build
```powershell
git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git
cd HELIX-RSS
npm install
npm run build
Copy-Item .env.example .env
notepad .env   # Configure credentials
```

### 3. Start Manually
```powershell
npm start
```

### 4. Keep It Running on Boot (Task Scheduler)
Use Windows Task Scheduler to start the service automatically at system startup, so the bot/dashboard survives reboots without needing to log in.

1. Open **Task Scheduler** (search `taskschd.msc` or "Task Scheduler").
2. Click **Create Task** in the right-hand Actions panel.
3. On the **General** tab:
   - Name: `HELIX Discord Bot`
   - Check **Run whether user is logged on or not**.
   - Check **Run with highest privileges** (only if needed for port binding; port 3131 normally doesn't require it).
4. On the **Triggers** tab, click **New...** and set **Begin the task:** to **At startup**. Click OK.
5. On the **Actions** tab, click **New...** and set:
   - **Action:** Start a program
   - **Program/script:** `cmd.exe`
   - **Add arguments:** `/c ""C:\Program Files\nodejs\npm.cmd" start --prefix C:\path\to\HELIX-RSS"` (replace with the actual project path)
   - Click OK.
6. On the **Conditions** tab, uncheck **Start the task only if the computer is on AC power** if you run this on a laptop.
7. Click **OK**, enter your Windows password when prompted.

The task will start the dashboard/bot whenever Windows boots. To stop it, use Task Manager or Task Scheduler > End task.

> **Note:** Keep the terminal window approach in mind when binding the port; set `INTERNAL_URL` in `.env` if you need a different port.

---

## 🚫 Cloud PaaS Platforms (Retired)

Heroku, Render, Fly.io, and Railway deployment support has been **retired**. HELIX Discord Bot is self-hosted exclusively on Local, VPS, and Docker. This removes platform-lock-in, payment barriers, and out-of-sync credential state.
