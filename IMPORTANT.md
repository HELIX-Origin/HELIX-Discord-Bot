# ⚠️ Important Guidelines & Operational Boundaries

This document outlines critical operational requirements, security practices, architecture decisions, and troubleshooting gotchas for running and maintaining **HELIX Discord Bot**.

---

## 🔒 Security & Authentication

1. **Secrets Management**:
   - Never commit `.env` or hardcode tokens (`DISCORD_TOKEN`, `DISCORD_CLIENT_SECRET`, `SESSION_SECRET`, `DATABASE_URL`).
   - Rotate `SESSION_SECRET` on production deployments to invalidate compromised sessions.

2. **Discord OAuth2 & Permissions**:
   - The bot requires `Bot` and `applications.commands` scopes.
   - Channel permissions needed for delivery:
     - `View Channel`
     - `Send Messages`
     - `Embed Links`
     - `Attach Files` (for image downloads/attachments)
     - `Use External Emojis`
   - Direct Discord REST API delivery is utilized rather than webhooks, ensuring strict permission enforcement and centralized logging.

3. **Application Ownership & Admin Authorization**:
   - When `OWNER_IDS` is omitted in `.env`, the system automatically queries the Discord REST API to fetch the Application Owner ID (and team members, if applicable).
   - Only registered Owner IDs can modify server-wide settings or access global diagnostics.

---

## ⚙️ Feed Scrapers & Rate Limiting

1. **Real-Time Single-Newest-Post Delivery & Rate-Limit Shield**:
   - All feeds (RSS, Atom, Scrapers, Reddit, Free Games, Stream Alerts) deliver **strictly the single newest post** per polling cycle.
   - Older unseen entries within a cycle are drained (marked as sent), preventing channels from being spammed with 10–20 posts at once and completely avoiding Discord channel rate limits.
   - Artificial post-interval floors and once-per-UTC-day restrictions have been eliminated for real-time responsiveness.

2. **Reddit Scrapers**:
   - **Community Home Post Filtering**: Community home posts are automatically detected and ignored because they are persistent static entries that could cause feeds to miss actual new submissions.
   - **Session Cookies**: Reddit requires authenticated session cookies (`cookies.json` or `cookies.txt`) to access subreddit ratings and prevent HTTP 403 blocks.
   - **Image Mode vs RSS Mode**:
     - `Image Mode` (`feedType: 'reddit'`): Automatically strips markdown text body, extracts full-resolution image/gallery/gifv media, and posts as a standalone banner.
     - `Standard RSS Mode` (`feedType: 'rss'`): Preserves post text excerpt, author tags, and comment link footer.

3. **Free Games & Giveaways**:
   - Multi-platform aggregation combines Epic Games Store Promotions API and GamerPower API.
   - Supported platforms: `epic`, `steam`, `gog`, `indiegala`, `humble`, `itchio`, `ubisoft`, `ea`, `prime`, and `battlenet`.
   - Polling Schedule: Polled automatically with deduplication and single-newest-game delivery.

---

## 💾 Database & State Management

1. **Deduplication Engine**:
   - Deduplication uses a multi-factor composite check:
     - Primary: Article GUID / ID.
     - Fallback: Normalized canonical URL.
     - Hash: SHA-256 hash of Title + Published Date + Content.
   - The database maintains an indexed log of processed entries to avoid duplicate notifications even during rapid polling restarts.

2. **Database Support**:
   - **SQLite**: Default and only database engine via native `node:sqlite` (WAL mode). Database file stored at `./data/database.sqlite`.

---

## 🔄 Deployment & Scaling Gotchas

1. **Process Concurrency**:
   - In standard single-node deployments, the bot, API server, and feed watcher run within the same Node.js process.
   - In clustered/multi-replica deployments, ensure only one instance runs the Feed Watcher worker (or use distributed database locking) to prevent duplicated Discord message dispatches.

2. **Proxy Support**:
   - If deploying behind reverse proxies (Nginx, Traefik, Cloudflare), set `PUBLIC_URL` to your external address and configure `TRUST_PROXY=true` in `.env` so the native HTTP server correctly resolves forwarded client IP addresses and headers.