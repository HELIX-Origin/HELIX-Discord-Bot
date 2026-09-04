# Privacy Policy

**Effective Date**: September 4, 2026  
**Last Updated**: September 4, 2026

---

> [!NOTE]
> **Core Privacy Principle**  
> **HELIX CLI** is built on a local-first, zero-telemetry architecture. We do not operate centralized tracking servers, do not collect analytics, and do not sell or monetize developer data. All data generated or utilized remains on your local machine or your private self-hosted infrastructure.

---

## 1. What Data HELIX CLI Handles

### A. Local SQLite Database (`data/helix-bot.sqlite`)
When you deploy or launch the built-in Discord bot and companion web dashboard, the application initializes a zero-cost, self-contained SQLite database. This database stores:
- **Query Logs**: Prompts submitted via `/helix-ai` or `/helix-explain` along with the responding AI provider name, username, user ID, and timestamp.
- **Scaffold History**: Project scaffolding events, template IDs, and project names generated through the bot.
- **User Sessions**: Discord OAuth2 user IDs, usernames, provider identifiers, and optional local session tokens used to authenticate members with local AI tools.
- **Guild Settings**: Per-server preferences including command prefixes, chosen AI provider, and callback URLs.

> [!IMPORTANT]
> This SQLite database resides entirely within your local filesystem or mounted container volume (`./data:/app/data`). It is never uploaded to HELIX CLI maintainers or remote telemetry endpoints.

### B. Environment Variables & Credentials
- Credentials stored in `.env` (such as `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and AI API keys) are read exclusively at runtime to establish authenticated connections.
- `.env` files are explicitly excluded by `.gitignore` to prevent accidental commits.
- When running `helix repo sync-secrets`, values are securely piped via standard input into GitHub Secrets (`gh secret set`) without being saved to temporary disk files or logged to the console.

### C. AI Agent Integrations & Prompts
- AI queries made through `helix ai query`, `helix ai generate`, or Discord slash commands are transmitted **directly** to the designated provider's official endpoint (Google Antigravity, GitHub Copilot, or Open Code).
- HELIX CLI does not operate intermediate proxy servers or inspection relays. Prompts and source code contexts travel solely between your machine/server and the selected AI provider.

---

## 2. Third-Party Services & APIs

When utilizing HELIX CLI, you interact directly with the following third-party platforms subject to their respective privacy terms:

- **Discord API**: Used by the bot subsystem for gateway events, slash commands, and OAuth2 authorization. Governed by [Discord Privacy Policy](https://discord.com/privacy).
- **Google Antigravity / Gemini API**: Used when Antigravity is configured as the active AI provider. Governed by [Google Privacy Policy](https://policies.google.com/privacy).
- **GitHub / GitHub Copilot**: Used for repository automation (`gh`) and Copilot code intelligence. Governed by [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
- **Open Code**: Used when Open Code Go / Zen credentials are provided. Governed by Open Code terms.
- **Heroku / Docker**: Used for optional 1-click cloud or container deployment.

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

> [!IMPORTANT]
> **Revoking Sessions & Deleting Data**
> - **Revoke Active Member Sessions**: Run `/helix-auth` in Discord or click the **Revoke Session** action button in the Web Dashboard (`/api/dashboard/bot/revoke-session`).
> - **Clear Database Records**: Delete or truncate the `data/helix-bot.sqlite` file to purge all historical queries, sessions, and settings.
> - **Reset Environment**: Remove or update `.env` to invalidate local credentials immediately.

---

## 5. Contact & Questions

If you have any questions, security concerns, or feedback regarding privacy in HELIX CLI:
- Review our [Security Policy](SECURITY.md) for vulnerability disclosure guidelines.
- Open a discussion or inquiry on our [GitHub Discussions](https://github.com/HELIX-Origin/HELIX-CLI/discussions) or submit a question via [GitHub Issues](https://github.com/HELIX-Origin/HELIX-CLI/issues).
- Connect with the team in our [Discord Community](https://discord.gg/Ww3XBZC2HV).
