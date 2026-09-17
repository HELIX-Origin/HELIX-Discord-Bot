# Release Notes Template (`release-notes-template.md`)

Use this template when preparing release notes for GitHub Releases according to **Rule 08 (Semantic Versioning & Release Management Standards)**.

---

```markdown
# <Emoji> HELIX Discord Bot <vX.Y.Z> — <Release Headline>

## ✨ Highlights

A concise, high-level summary (2–3 sentences) capturing the core focus of this release for self-hosters and administrators.

---

## 🚀 Key Improvements & Features

### 🔹 <Feature Area 1>
- **Component / Subsystem**: Detail the improvement, rationale, and runtime impact.
- **Commands / Options**: List any new slash commands or subcommands added.

### 🔹 <Feature Area 2>
- **Dashboard / API**: Describe new routes, view enhancements, or configuration settings.
- **Integration**: Note any changes to external providers (Discord, Lavalink, KLIPY, feeds).

---

## 🛡️ Security, Privacy & Reliability

- **Security Hardening**: Note any authentication, cookie, permission bitfield, or dependency audits.
- **Policy & Data Custody**: Note changes to `SECURITY.md`, `PRIVACY.md`, or `TOS.md`.

---

## 📝 Commits & Pull Requests

- `<hash>` <commit message>
- Resolves / Closes #<issue>

---

## 📦 Upgrading & Deployment

To update an existing installation:

\`\`\`bash
# 1. Fetch latest changes
git pull origin main

# 2. Update dependencies
npm install

# 3. Verify and compile
npm run check
npm run build

# 4. Restart the bot / systemd service
npm start
# or: sudo systemctl restart helix-discord-bot
\`\`\`
```
