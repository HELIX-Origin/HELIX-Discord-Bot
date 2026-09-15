# ⚠️ Important Guidelines & Operational Boundaries

This document outlines critical operational requirements, security practices, architecture decisions, and troubleshooting gotchas for running and maintaining **Discord-RSS**.

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

1. **Reddit Scrapers**:
   - **Custom User-Agent**: Reddit requires unique User-Agents for RSS polling. Configure a descriptive `REDDIT_USER_AGENT` in `.env` to prevent `429 Too Many Requests`.
   - **Image Mode vs RSS Mode**:
     - `Image Mode` (`feedType: 'reddit'`): Automatically strips markdown text body, extracts full-resolution image/gallery/gifv media, and posts as a standalone banner.
     - `Standard RSS Mode` (`feedType: 'rss'`): Preserves post text excerpt, author tags, and comment link footer.

2. **Free Games & Giveaways**:
   - Multi-platform aggregation combines Epic Games Store Promotions API and GamerPower API.
   - Supported platforms: `epic`, `steam`, `gog`, `indiegala`, `humble`, `itchio`, `ubisoft`, `ea`, `prime`, and `battlenet`.
   - Polling Schedule: Runs automatically every **Monday at 00:00 UTC** (aligning with global giveaway cycles) with manual poll capability via `POST /api/feeds/freegames/poll`.

3. **Social Media Fallbacks**:
   - **YouTube**: Direct XML channel feeds (`https://www.youtube.com/feeds/videos.xml?channel_id=...`) with optional YouTube Data API v3 fallback for video details.
   - **TikTok & Bluesky**: Uses specialized headless extractors and open syndication endpoints.

---

## 💾 Database & State Management

1. **Deduplication Engine**:
   - Deduplication uses a multi-factor composite check:
     - Primary: Article GUID / ID.
     - Fallback: Normalized canonical URL.
     - Hash: SHA-256 hash of Title + Published Date + Content.
   - The database maintains an indexed log of processed entries to avoid duplicate notifications even during rapid polling restarts.

2. **Database Support**:
   - **SQLite**: Default for lightweight single-node deployments. Database file stored at `./data/database.sqlite`.
   - **PostgreSQL**: Recommended for high-volume clusters or enterprise deployments. Configured via `DATABASE_URL=postgres://...`.

---

## 🔄 Deployment & Scaling Gotchas

1. **Process Concurrency**:
   - In standard single-node deployments, the bot, API server, and feed watcher run within the same Node.js process.
   - In clustered/multi-replica deployments, ensure only one instance runs the Feed Watcher worker (or use distributed database locking) to prevent duplicated Discord message dispatches.

2. **Proxy Support**:
   - If deploying behind reverse proxies (Nginx, Traefik, Cloudflare), ensure `TRUST_PROXY=true` is set in `.env` so Express correctly resolves client IP addresses for rate limiting and secure cookie transmission.