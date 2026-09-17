# Privacy Policy for HELIX Discord Bot

**Last Updated**: September 17, 2026

Welcome to **HELIX Discord Bot**. This Privacy Policy explains how our self-hosted Discord bot, management dashboard, and associated services handle information when you deploy, host, or interact with the software.

---

## 1. Core Principle: Self-Hosted & Zero Telemetry

HELIX Discord Bot is an open-source, self-hosted application.
- **No Central Tracking**: We do not collect, harvest, monetize, sell, or analyze your personal information.
- **No Analytics or Telemetry**: The application contains zero tracking cookies, remote analytics beacons, phone-home telemetry, or centralized diagnostic pingbacks.
- **Local Data Custody**: All database records (feed subscriptions, alert monitors, server configurations, moderation logs, user accounts, and cached delivery entries) reside exclusively on the server, container, or filesystem managed by the instance administrator.

---

## 2. Information Handled by the Service

When operating an instance of HELIX Discord Bot, the software stores and processes data locally within an embedded SQLite database (`database.sqlite`):

### A. Discord Account & OAuth2 Data
- **Discord User ID, Username, and Avatar**: Used to identify guild members, verify permissions, and authenticate dashboard sessions.
- **Guild (Server) and Channel IDs**: Used to identify delivery targets for RSS/Atom posts, live stream notifications, giveaway alerts, and moderation audit logs.
- **OAuth Access Tokens**: Stored locally in secured session storage solely to manage authenticated sessions with the Discord API. Tokens are never transmitted to external third parties.

### B. Feed & Source Configurations
- **Feed URLs & Subscriptions**: Target RSS/Atom feeds, Reddit subreddit feeds, and free-game store monitors configured by server administrators.
- **Stream Alerts**: Twitch channels and YouTube channels monitored for upload and live status notifications.
- **Delivery Preferences**: Designated guild delivery channels, forum thread targets, ping role IDs, and filter options.
- **Sent Entry Cache**: Unique post GUIDs, article IDs, and URLs stored locally to deduplicate entries and prevent repeat notifications.

### C. Guild Administration & Moderation Logs
- **Audit Records**: Moderation actions executed through administrative commands (`/warn`, `/kick`, `/ban`, `/purge`, `/lock`, `/slowmode`, etc.) record the target user ID, moderator user ID, timestamp, and specified reason within local SQLite storage for audit review.
- **Role & Voice Configurations**: Guild DJ roles, administrative roles, and mod-log channel designations.

### D. Entertainment & Audio Playback
- **Music Queue State**: Track metadata, song titles, audio URLs, and queue positions for playback via an external Lavalink v4 audio server.
- **Reaction GIFs**: Search keywords processed via public API integrations (such as KLIPY) solely to return relevant GIF assets. No personal identifiers are attached to search queries.

### E. Local Dashboard Accounts (Optional)
- If local dashboard account registration is explicitly enabled by the administrator, securely salted and hashed passwords (utilizing Node.js native cryptographic primitives) and email addresses are stored strictly in the local SQLite database.

---

## 3. External Network Interactions

To deliver its core capabilities, an active HELIX Discord Bot instance communicates directly with:
1. **Discord Gateway & REST API (`discord.com`)**:
   - Deliver rich embeds, forum thread updates, and announcements to designated guild channels.
   - Register and dispatch discrete slash commands (e.g., `/rss`, `/reddit`, `/free-games`, `/youtube`, `/twitch`, `/play`, `/admin`, `/role`, `/voice`, `/gif`, `/about`, `/help`).
   - Authenticate users via Discord OAuth2.
2. **Configured Content Providers**:
   - Periodically poll public RSS/Atom feeds, Reddit endpoints, and Epic Games/giveaway APIs configured by server administrators.
   - Query YouTube or Twitch alert endpoints for live-stream and video upload status.
3. **External Audio Server (Lavalink v4)**:
   - Stream audio WebSocket signals and voice update state to external Lavalink v4 servers configured by the host administrator in `.env`.
4. **Entertainment API (KLIPY)**:
   - Query public reaction and anime GIF endpoints on-demand when users run entertainment commands.

---

## 4. Data Retention & Erasure

Because HELIX Discord Bot operates on a self-hosted architecture:
- **Feed & Alert Removal**: Deleting a feed or alert subscription from the web dashboard or slash command immediately purges its subscription record and associated delivery cache from the local database.
- **Audit Log Deletion**: Instance administrators can purge moderation history or audit records through the dashboard or direct SQLite administration.
- **Complete Erasure**: Deleting the local `data/database.sqlite` file completely and irreversibly removes all stored records, sessions, and configurations.

---

## 5. Security Architecture

- **Native Cryptography**: Password hashing, token validation, and session signatures utilize native Node.js cryptographic primitives with zero untrusted dependencies.
- **Session Protection**: Dashboard cookies enforce `HttpOnly` and `SameSite=Lax` attributes. Production deployments should serve the dashboard behind a reverse proxy terminating HTTPS to enable browser `Secure` cookie enforcement.
- **Permission Bitfield Verification**: Discord native permissions and guild role hierarchies are validated before permitting access to sensitive administrative commands and dashboard settings.

---

## 6. Community & Contact

For questions regarding this policy, security questions, or open-source inquiries:
- **GitHub Repository**: [https://github.com/HELIX-Origin/HELIX-Discord-Bot](https://github.com/HELIX-Origin/HELIX-Discord-Bot)
- **Discord Community**: [HELIX Origin Discord](https://discord.gg/Ww3XBZC2HV)
- **Security Policy**: [SECURITY.md](SECURITY.md)
