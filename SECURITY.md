# Security Policy for HELIX Discord Bot

The HELIX team and community take the security and integrity of HELIX Discord Bot seriously. This document outlines our supported versions, reporting guidelines, vulnerability response procedure, and core architectural security principles.

---

## 1. Supported Versions

We release patches and security fixes for the latest active release branch. Self-hosted administrators should ensure their deployments are updated regularly to receive security hardening and bug fixes.

| Version | Supported          | Security Status |
| :--- | :--- | :--- |
| `0.5.x` | :white_check_mark: | Currently Supported (Active) |
| `< 0.5.0` | :x: | Unsupported (End-of-Life) |

---

## 2. Reporting a Vulnerability

**Please do not disclose security vulnerabilities through public GitHub issues, public pull requests, or community Discord channels.**

If you believe you have discovered a vulnerability or security issue affecting HELIX Discord Bot:

1. **GitHub Security Advisories (Preferred)**:
   Submit a private advisory via [GitHub Security Advisories](https://github.com/HELIX-Origin/HELIX-Discord-Bot/security/advisories/new).
2. **Community Contact**:
   Reach out directly to the core maintainers through the official [HELIX Origin Discord Server](https://discord.gg/Ww3XBZC2HV) via private message or direct ticket.

### What to Include in Your Report

To help us investigate, triage, and resolve the issue efficiently, please include:
- A clear description of the vulnerability and its potential impact.
- Exact steps to reproduce the issue (including any sample payloads, curl commands, or script snippets).
- Affected components (e.g., dashboard routes, OAuth handler, SQLite query layer, Lavalink audio gateway, Discord interaction handler).
- Node.js runtime version, operating system environment, and commit hash / tag version tested.
- Any suggested mitigations or patches, if known.

---

## 3. Vulnerability Response Timeline

Upon receiving a private vulnerability disclosure, our team commits to the following workflow:

1. **Acknowledgment**: We aim to acknowledge receipt of your disclosure within **48 hours**.
2. **Assessment & Triage**: We will confirm the issue, reproduce the vulnerability in a controlled environment, and determine severity and blast radius within **5 business days**.
3. **Remediation & Patching**: A candidate patch will be developed, verified against our automated test suite (`npm run check`), and prepared for release.
4. **Coordinated Disclosure**: Once a patch is merged and released, we will publish a security advisory with credit to the reporter (unless the reporter requests anonymity).

---

## 4. Architectural Security Principles

HELIX Discord Bot follows a defensive, self-hosted architecture designed to safeguard both user privacy and host system integrity:

### A. Zero Telemetry & Local Data Custody
- **Zero Third-Party Call-Home**: HELIX transmits no telemetry, tracking cookies, analytics pings, or diagnostic metrics to any remote server or central tracking system.
- **Local SQLite Custody**: All guild settings, feed catalogs, user sessions, activity logs, and delivery caches reside in the local SQLite database (`data/database.sqlite`). Host administrators retain 100% custody of their data.

### B. Secrets & Credential Management
- **Environment Isolation**: Discord bot tokens, client secrets, session secrets, and Lavalink passwords are read strictly from environment variables (`.env`).
- **Never Committed to Version Control**: `.env` and SQLite database files are strictly ignored by `.gitignore`.
- **Zero Credential Echoing**: Sensitive configuration variables are redacted from logs, diagnostic endpoints, and dashboard view payloads.

### C. Authentication & Session Security
- **Discord OAuth2**: Authentication delegates entirely to Discord's official OAuth2 provider.
- **Secure Cookie Attributes**: Session cookies enforce `HttpOnly`, `SameSite=Lax`, and standard browser security primitives to mitigate Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF).
- **Session Signing & Invalidation**: In-memory and SQLite-backed session stores validate cookie integrity on every incoming request.

### D. Authorization & Role-Based Access Control (RBAC)
- **Discord Native Permissions**: Slash commands check native member permissions (`default_member_permissions`), guild role hierarchy, and Discord bitfields before executing sensitive administrative or moderation actions.
- **Dashboard Guild Permission Gates**: Access to guild configuration, feeds, alerts, and music controls requires the authenticated user to hold Discord `MANAGE_GUILD` (or `ADMINISTRATOR`) permissions for the targeted guild.
- **Instance Owner Separation**: Host-level administrative tools (e.g., system logs, runtime diagnostic metrics, slash command synchronization) are restricted exclusively to the bot application owner or authorized developer team members.

### E. Server-Side Rendering (SSR) & Minimal Dependency Footprint
- **Zero Third-Party Frontend Dependencies**: The management dashboard is rendered via native Node.js string templates. There are no client-side npm packages, runtime bundlers, or remote CDN scripts that could introduce supply chain risks.
- **Minimal Runtime Dependencies**: The core runtime relies on standard Node.js built-ins (`node:http`, `node:sqlite`, `node:crypto`), eliminating heavy third-party framework vulnerabilities.

### F. Reverse Proxy SSL / TLS Termination
- HELIX Discord Bot binds to standard local HTTP/loopback interfaces and recommends reverse-proxy SSL termination (via Nginx, Caddy, Cloudflare Tunnel, or PaaS ingress) for production HTTPS traffic, ensuring TLS certificates and cipher suites are managed by robust, dedicated proxy daemons.

---

## 5. Security Best Practices for Host Administrators

When self-hosting HELIX Discord Bot, we advise operators to observe the following operational security practices:

- **Run as a Non-Root User**: Never execute the bot or systemd service as the `root` superuser. Always create a dedicated unprivileged system account (e.g., `helix`).
- **Secure File Permissions**: Ensure your `.env` file and `data/` directory have strict file permissions (e.g., `chmod 600 .env` and `chmod 700 data`).
- **Use Reverse Proxy HTTPS**: When exposing the web dashboard to the internet, terminate HTTPS through a trusted reverse proxy with valid TLS certificates.
- **Regular Backups**: Regularly snapshot or backup the SQLite database (`data/database.sqlite`) to prevent data loss.
- **Keep Node.js Updated**: Run on maintained Active LTS or Maintenance LTS releases of Node.js (Node.js 22+ recommended).
