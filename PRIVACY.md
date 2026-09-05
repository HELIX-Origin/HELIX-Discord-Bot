# Privacy Policy

**Effective Date**: September 4, 2026  
**Last Updated**: September 4, 2026

---

> [!NOTE]
> **Core Privacy Principle**  
> **HELIX** is built on a local-first, zero-telemetry architecture. We do not operate centralized tracking servers, do not collect analytics, and do not sell or monetize developer data. All data generated or utilized remains on your local machine or your private self-hosted infrastructure.

---

## 1. What HELIX Handles

### A. Local SQLite Database (`data/helix-bot.sqlite`)

When you deploy or launch the built-in Discord bot and companion web dashboard, the application initializes a zero-cost, self-contained SQLite database. This database stores:

- **Guild Settings**: Per-server preferences including command prefixes, tickets hub channels, ticket manager roles, moderation log channels, and enabled slash command categories.
- **Support Tickets**: Thread IDs, user IDs, ticket subjects, and status (open/closed) for guild support.
- **Moderation Logs**: Moderation actions (kick, ban, timeout, purge, warn) with moderator IDs, timestamps, and reasons.
- **Warnings**: Per-user infraction records logged by guild moderators.
- **User Sessions**: Discord OAuth2 user IDs and session tokens used exclusively for web dashboard login.
- **Plugin Repositories**: Guild-scoped language plugin repository configurations, manifests, and cache data stored in SQLite.
- **Scaffold History**: Project scaffolding events, template IDs, and project names generated through the bot.

> [!IMPORTANT]
> This SQLite database resides entirely within your local filesystem or mounted container volume (`./data:/app/data`). It is never uploaded to HELIX maintainers or remote telemetry endpoints.

### B. Environment Variables & Credentials

- Credentials stored in `.env` (such as `DISCORD_TOKEN`, `DISCORD_CLIENT_SECRET`, and `NEXTAUTH_SECRET`) are read exclusively at runtime to establish authenticated connections with Discord.
- `.env` files are explicitly excluded by `.gitignore` to prevent accidental commits.

### C. Language Plugin System

- Language plugins (such as TypeScript, Python, JavaScript linters and analyzers) execute 100% locally and in-process using static analysis, AST parsers, and local documentation caches.
- No source code or snippets sent to the bot are forwarded to third-party AI APIs or external inspection servers.

---

## 2. Third-Party Services & APIs

When utilizing HELIX, you interact directly with the following third-party platforms subject to their respective privacy terms:

- **Discord API**: Used by the bot subsystem for gateway events, slash commands, and OAuth2 authorization. Governed by [Discord Privacy Policy](https://discord.com/privacy).
- **GitHub**: Used for optional community plugin installation via `>plugin install <repo>`. Governed by [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
- **Render / Koyeb / Heroku / Railway / Docker**: Used for optional 1-click cloud or container deployment. Governed by their respective privacy policies.

---

## 3. Security of Your Information

> [!TIP]
> **Best Security Practices**
> - Always generate a cryptographically strong `NEXTAUTH_SECRET` (32+ random characters) for production dashboard sessions.
> - Never share your `.env` file or commit sensitive API tokens to public repositories.
> - Restrict Discord bot permissions to only the channels and roles necessary for your server.

- OAuth2 session tokens stored in the SQLite database are accessible only to the local operating system user or Docker container process.
- NextAuth sessions are signed with HMAC SHA-256 using your configured `NEXTAUTH_SECRET`.

---

## 4. User Control & Data Deletion

You retain complete ownership and control over all data:

- **Clear Database Records**: Delete or truncate the `data/helix-bot.sqlite` file to purge all historical sessions, warnings, logs, and settings.
- **Reset Environment**: Remove or update `.env` to invalidate local credentials immediately.

---

## 5. Contact & Questions

If you have any questions, security concerns, or feedback regarding privacy in HELIX:

- Review our [Security Policy](SECURITY.md) for vulnerability disclosure guidelines.
- Open a discussion or inquiry on our [GitHub Discussions](https://github.com/HELIX-Origin/HELIX-Discord-Bot/discussions) or submit a question via [GitHub Issues](https://github.com/HELIX-Origin/HELIX-Discord-Bot/issues).
- Connect with the team in our [Discord Community](https://discord.gg/Ww3XBZC2HV).
