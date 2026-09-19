# Rule 08: Semantic Versioning & Release Management Standards

## Core Principle: Semantic Versioning & Clear Release Tracking

All version increments and release artifacts for **HELIX Discord Bot** must strictly follow [Semantic Versioning 2.0.0](https://semver.org/) (`MAJOR.MINOR.PATCH`) and provide structured, human-readable GitHub release notes enriched with emojis and formatted code blocks.

---

## 1. Semantic Versioning Specification (`MAJOR.MINOR.PATCH`)

- **MAJOR (`X.0.0`)**: Incompatible API or architectural breaking changes.
  - Examples: Major discord.js upgrade requiring breaking command definition rewrites, backwards-incompatible SQLite schema migration without auto-migration, complete overhaul of configuration environment semantics.
- **MINOR (`0.X.0`)**: New functionality, subsystems, or capabilities introduced in a backwards-compatible manner.
  - Examples: New feature subsystem (e.g. KLIPY entertainment, guild administration commands), new dashboard tabs, new feed syndication types.
- **PATCH (`0.0.X`)**: Backwards-compatible bug fixes, security hardening, documentation synchronizations, and internal refactorings.
  - Examples: Rate limit fixes, embed field truncation edge cases, policy updates, dependency patch security updates.

---

## 2. Version Bump Synchronization Checklist

When bumping a version, the version number must be synchronized across all canonical project metadata files before tagging or creating a release:

1. **`package.json`**: `"version": "X.Y.Z"` (bump via `npm version [major|minor|patch] --no-git-tag-version`).
2. **`package-lock.json`**: Updated automatically by npm.
3. **`CITATION.cff`**: `version: X.Y.Z` and `description` aligned with current repository description.
4. **User-Agent Fallbacks**:
   - `src/config.ts`: `DiscordBot (${repoUrl}, X.Y.Z)` and `DiscordBot (X.Y.Z)`.
   - `src/bot/rest.ts`: `DiscordBot (${repoUrl}, X.Y.Z)` and `DiscordBot (X.Y.Z)`.
   - `src/dashboard/oauth/discord.ts`: `DiscordBot (${repoUrl}, X.Y.Z)` and `DiscordBot (X.Y.Z)`.
   - `src/dashboard/webhooks/router.ts`: `Mozilla/5.0 (compatible; HELIX-Discord-Bot/X.Y.Z)`.
5. **Security Policy**:
   - `SECURITY`: Update supported versions table if a minor/major version boundary has transitioned.
6. **Local Scratchpad (Gitignored)**:
   - `TODO` metadata updated to reflect active version.

---

## 3. Verification Gate Prior to Release

Never tag, commit, or publish a version without passing the full verification gate:

```bash
npm run check    # typecheck, typecheck:test, format:check, lint, test
npm run build    # compile TypeScript to dist/
```

---

## 4. GitHub Release Creation Standards

GitHub Releases serve as human-readable milestones for self-hosters and contributors.

### A. Release Tagging & Title Convention
- **Tag Format**: `vX.Y.Z` (e.g., `v0.4.1`)
- **Release Title**: `vX.Y.Z — <Key Feature or Theme>` (e.g., `v0.4.1 — Policy Pages, Security Disclosure & Repo Hardening`)

### B. Structured Release Notes Format
Release notes must use Markdown with emoji section markers and formatted code blocks:

```markdown
# <Emoji> <Release Title>

## ✨ Highlights
A concise, human-readable summary of the most important capabilities or fixes delivered in this release.

## 🚀 Key Improvements & Features
Detailed bullet points explaining what was added, changed, or improved, referencing specific components and features.

- **Feature / Component Name**: Clear explanation of functionality, rationale, and impact.
- **Subsystem Name**: Bulleted descriptions of enhancements.

## 🛡️ Security & Governance (if applicable)
Details on vulnerability reporting policies, data protection guarantees, or dependency security audits.

## 📄 Changes & Commits
High-level summary of commits, documentation updates, and pull requests included in this version.

## 📦 Quick Start & Upgrading
Clear code snippets showing how self-hosters can update their instance:

\`\`\`bash
git pull origin main
npm install
npm run build
npm start
\`\`\`
```

### C. Release Creation Command
Always prepare release notes in a dedicated UTF-8 Markdown file and publish via the GitHub CLI:

```bash
gh release create vX.Y.Z --title "vX.Y.Z — <Title>" --notes-file "<path-to-notes>"
```
