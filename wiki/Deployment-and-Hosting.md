# 🚀 Deployment & Hosting Guide

HELIX Discord Bot is optimized for self-hosted deployments on **Docker**, **Linux VPS**, and bare metal (with SSL handled by reverse proxies like Nginx/Caddy or the host system). Cloud PaaS platforms are intentionally not supported.

> **Music Playback**: Connects to an external Lavalink v4 server. Configure `LAVA_HOST`, `LAVA_PORT`, `LAVA_PASS`, and `LAVA_SECURE` in `.env`.

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

## 🖥️ Option 2: Linux VPS with systemd & Root Access (Recommended)

For hosting directly on an Ubuntu, Debian, or Rocky Linux server with root or sudo access.

> [!IMPORTANT]
> **Recommended Directory: `/etc/servers/helix-discord-bot`**  
> When self-hosting on a Linux VPS with root access, running the bot directly from `/root` (or a subfolder in `/root`) causes systemd to fail to find or enter the working directory (resulting in `CHDIR` errors / exit code 200) due to strict Linux directory permissions (`0700` on `/root`) and systemd filesystem isolation (`ProtectHome`).  
> **Always clone and run the bot from a standard system directory such as `/etc/servers/helix-discord-bot`.**

### 1. Install Node.js 22+ & Git
```bash
# Install Node.js 22.x LTS (required: >= 22.9.0 for native node:sqlite)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

### 2. Clone to `/etc/servers/helix-discord-bot` and Build
```bash
# Create dedicated server directory
sudo mkdir -p /etc/servers
cd /etc/servers

# Clone repository
sudo git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git helix-discord-bot
cd /etc/servers/helix-discord-bot

# Install dependencies and compile TypeScript
npm install
npm run build

# Configure environment variables
cp .env.example .env
nano .env
```

### 3a. Start as 24/7 systemd Service (Recommended)

The repository provides an automated installation script that configures, secures, and enables a native systemd service with automatic restarts and sandbox protections:

```bash
# Make script executable and run as root/sudo
sudo chmod +x ./scripts/install-service.sh
sudo ./scripts/install-service.sh
```

The installer configures `/etc/systemd/system/helix-discord-bot.service` targeting `/etc/servers/helix-discord-bot`:

```ini
[Unit]
Description=HELIX Discord Bot - Self-Hosted Discord Bot & Dashboard
Documentation=https://github.com/HELIX-Origin/HELIX-Discord-Bot/wiki
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/etc/servers/helix-discord-bot
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
TimeoutStopSec=20

# Environment & capabilities
Environment=NODE_ENV=production
EnvironmentFile=-/etc/servers/helix-discord-bot/.env
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE

# Security & Sandboxing hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=/etc/servers/helix-discord-bot/data

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=helix-discord-bot

[Install]
WantedBy=multi-user.target
```

**Service Management Commands:**
```bash
# Check service status
sudo systemctl status helix-discord-bot

# Stream live service logs
sudo journalctl -u helix-discord-bot -f

# Restart or stop service
sudo systemctl restart helix-discord-bot
sudo systemctl stop helix-discord-bot
```

### 3b. Alternative: PM2 Process Manager
If you prefer PM2 for process monitoring:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start compiled application
cd /etc/servers/helix-discord-bot
pm2 start dist/index.js --name "helix-discord-bot"

# Save PM2 process list and configure startup on boot
pm2 save
pm2 startup
```

### 3c. Alternative: tmux (Session-Based)
Prefer a lightweight no-daemon approach? Use `tmux` to keep the process alive inside a persistent terminal session — great for quick VPS setups that don't need process management.

```bash
# Install tmux if not already present
sudo apt-get install -y tmux

# Start a new detachable session named "helix-discord-bot"
tmux new -s helix-discord-bot

# Inside the session, start the server
cd /etc/servers/helix-discord-bot
npm start

# Detach and keep it running in the background:
# Press Ctrl+B, then D
```

Reattach the session later to view logs or manage the process:
```bash
tmux ls
tmux attach -t helix-discord-bot
```

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

### 1. Install Node.js & Java
Download and install the **Node.js 22.x LTS** (>=22.9.0 for native `node:sqlite`) from [nodejs.org](https://nodejs.org).

Install **Java 21** (required for embedded Lavalink node) from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/#java21) or [Eclipse Temurin](https://adoptium.net/temurin/releases/?version=21).

Make sure `node`, `npm`, and `java` are available in a new terminal:
```powershell
node --version
npm --version
java --version
```

### 2. Clone and Build
```powershell
git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git
cd HELIX-Discord-Bot
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
   - **Add arguments:** `/c ""C:\Program Files\nodejs\npm.cmd" start --prefix C:\path\to\HELIX-Discord-Bot"` (replace with the actual project path)
   - Click OK.
6. On the **Conditions** tab, uncheck **Start the task only if the computer is on AC power** if you run this on a laptop.
7. Click **OK**, enter your Windows password when prompted.

The task will start the dashboard/bot whenever Windows boots. To stop it, use Task Manager or Task Scheduler > End task.

> **Note:** Keep the terminal window approach in mind when binding the port; set `INTERNAL_URL` in `.env` if you need a different port.

---

## 🚫 Cloud PaaS Platforms (Retired)

Heroku, Render, Fly.io, and Railway deployment support has been **retired**. HELIX Discord Bot is self-hosted exclusively on Local, VPS, and Docker. This removes platform-lock-in, payment barriers, and out-of-sync credential state.
