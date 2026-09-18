# 🚀 Deployment & Hosting Guide

HELIX Discord Bot is optimized for self-hosted deployments on **Docker**, **Linux VPS**, and bare metal, with support for manual hosting on container-enabled cloud PaaS platforms (Railway, Render, Fly.io). One-click deployment buttons are intentionally not provided.

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
> **Recommended Directory: `/opt/helix-discord-bot`**  
> When self-hosting on a Linux VPS with root access, running the bot directly from `/root` (or a subfolder in `/root`) causes systemd to fail to find or enter the working directory (resulting in `CHDIR` errors / exit code 200) due to strict Linux directory permissions (`0700` on `/root`) and systemd filesystem isolation (`ProtectHome`).  
> **Always clone and run the bot from a standard system directory such as `/opt/helix-discord-bot`.**

### 1. Install Node.js 22+ & Git
```bash
# Install Node.js 22.x LTS (required: >= 22.9.0 for native node:sqlite)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

### 2. Clone to `/opt/helix-discord-bot` and Build
```bash
# Navigate to /opt
cd /opt

# Clone repository
sudo git clone https://github.com/HELIX-Origin/HELIX-Discord-Bot.git helix-discord-bot
cd /opt/helix-discord-bot

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

The installer configures `/etc/systemd/system/helix-discord-bot.service` targeting `/opt/helix-discord-bot`:

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
WorkingDirectory=/opt/helix-discord-bot
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
TimeoutStopSec=20

# Environment & capabilities
Environment=NODE_ENV=production
EnvironmentFile=-/opt/helix-discord-bot/.env
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE

# Security & Sandboxing hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=/opt/helix-discord-bot/data

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

# Navigate to project directory
cd /opt/helix-discord-bot

# Install dependencies and build
npm install
npm run build

# Start the compiled bot directly with PM2
pm2 start dist/index.js --name "helix-discord-bot" --watch dist --ignore-watch="data node_modules .git logs"

# View live real-time logs
pm2 logs helix-discord-bot

# Check status and resource metrics
pm2 status
pm2 monit

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
cd /opt/helix-discord-bot
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

### 1. Install Node.js
Download and install the **Node.js 22.x LTS** (>=22.9.0 for native `node:sqlite`) from [nodejs.org](https://nodejs.org).

Make sure `node` and `npm` are available in a new terminal:
```powershell
node --version
npm --version
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

## ☁️ Option 4: Manual Cloud PaaS Hosting (Railway, Render, Fly.io)

For users who prefer managed container hosting instead of maintaining a VPS, HELIX Discord Bot can be deployed manually on container-enabled cloud PaaS providers.

> [!NOTE]
> **No One-Click Deploy Buttons**: One-click deployment buttons and automated templates are intentionally not provided. Automated templates frequently fail over time, inject out-of-sync credentials, and hide storage configuration. Users connect their own repository fork and explicitly configure persistent storage and environment variables.

### ⚠️ Critical PaaS Prerequisites

1. **Persistent Storage Volume (Mandatory for SQLite)**:
   HELIX Discord Bot stores feeds, server settings, mod logs, and command toggles in a local SQLite file (`database.sqlite`).
   Cloud containers are ephemeral by default — **you must attach a persistent volume** mounted to `/app/data` (or set `SQLITE_DATA=/app/data`). Without a persistent volume, database changes will be wiped on every redeploy or container restart.
2. **Environment Variables**:
   All configuration is provided via the platform's Environment Variables dashboard (never hardcoded in repo code).
3. **Public URL & OAuth Callback**:
   Set `PUBLIC_URL` to your assigned HTTPS domain (e.g. `https://my-helix-bot.up.railway.app`). Ensure this exact callback URL is registered in the Discord Developer Portal under **OAuth2 > Redirects**:
   `https://<your-domain>/api/auth/callback/discord`
4. **Dynamic Port Binding**:
   HELIX Discord Bot automatically reads `process.env.PORT` injected by cloud providers and binds to `0.0.0.0:$PORT`.

---

### Platform Walkthroughs

#### 🚂 Railway (Recommended PaaS)
Railway provides seamless Dockerfile support and persistent volume attachments:
1. **New Project**: Click **New Project** > **Deploy from GitHub repo** > select your repository.
2. **Attach Volume**:
   - In your service view, go to **Settings** > **Volumes** (or right-click the canvas > **Volume**).
   - Mount path: `/app/data`.
3. **Set Variables**:
   In the **Variables** tab, add:
   - `NODE_ENV`: `production`
   - `SQLITE_DATA`: `/app/data`
   - `PUBLIC_URL`: `https://${{RAILWAY_PUBLIC_DOMAIN}}`
   - `DISCORD_TOKEN`: `your_bot_token`
   - `DISCORD_CLIENT_ID`: `your_client_id`
   - `DISCORD_CLIENT_SECRET`: `your_client_secret`
   - `DISCORD_REDIRECT_URL`: `https://discord.com/oauth2/authorize?client_id=your_client_id&permissions=8&integration_type=0&scope=bot+applications.commands`
4. **Networking**: Under **Settings** > **Networking**, click **Generate Domain** to get a public HTTPS address.

#### 🌐 Render (Web Service + Persistent Disk)
1. **New Web Service**: Click **New +** > **Web Service** > connect your GitHub repository.
2. **Build & Start**:
   - **Environment**: `Docker` (Render will build using the repository `Dockerfile`)
   - **Instance Type**: Select an instance tier that supports disks (Starter or higher).
3. **Attach Disk**:
   - Under **Disks**, click **Add Disk**.
   - **Name**: `helix-data`
   - **Mount Path**: `/app/data`
   - **Size**: `1 GB` (or larger)
4. **Environment Variables**:
   Add `NODE_ENV=production`, `SQLITE_DATA=/app/data`, `PUBLIC_URL=https://<your-subdomain>.onrender.com`, and your Discord API tokens.

#### 🪰 Fly.io (Fly CLI)
1. Launch app configuration without immediate deployment:
   ```bash
   fly launch --no-deploy
   ```
2. Create a persistent volume for the SQLite database:
   ```bash
   fly volumes create helix_data --size 1
   ```
3. Update `fly.toml` to attach the volume to `/app/data`:
   ```toml
   [mounts]
     source = "helix_data"
     destination = "/app/data"

   [http_service]
     internal_port = 3131
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 1
   ```
4. Set required secrets:
   ```bash
   fly secrets set \
     DISCORD_TOKEN="your_token" \
     DISCORD_CLIENT_ID="your_client_id" \
     DISCORD_CLIENT_SECRET="your_client_secret" \
     PUBLIC_URL="https://your-app.fly.dev" \
     SQLITE_DATA="/app/data"
   ```
5. Deploy:
   ```bash
   fly deploy
   ```
