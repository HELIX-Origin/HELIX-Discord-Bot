# Git Commit & PR Message Guide

Guidelines for clear, human-readable commit messages and PR titles with fitting GitHub emojis for **HELIX Discord Bot**. Follows conventional commits with strict subsystem scoping.

---

## Format Specification

```
<emoji> <type>(<scope>): <subject>

[optional body explaining rationale, architectural changes, or sub-task outcomes]

[optional issue / bug tracking references: Resolves #<issue>, Closes #<issue>]
```

---

## Standard Emoji & Commit Type Matrix

| Emoji | Type | Purpose | Example |
|---|---|---|---|
| ✨ | feat | New features or commands | ✨ feat(command): add modular kick command with lib options |
| 🐛 | fix | Bug fixes and patches | 🐛 fix(thread): enforce single thread per feed in forums |
| 📝 | docs | Documentation and wiki updates | 📝 docs(wiki): update music command reference |
| 🧪 | test | Adding or updating tests | 🧪 test(bot): add unit tests for admin options lib |
| ♻️ | refactor | Code refactoring without behavioral change | ♻️ refactor(options): categorize command options by domain |
| ⚡ | perf | Performance optimizations | ⚡ perf(cache): optimize guild permissions lookup |
| 🔧 | chore | Tooling, config, and maintenance | 🔧 chore(deps): upgrade discord.js to v14.17.3 |
| 🔒 | security | Security enhancements or permission fixes | 🔒 security(admin): verify role hierarchy on moderation actions |
| 🏗️ | build | Build system, packaging, or tsconfig | 🏗️ build(ts): update ESM module resolution |

---

## Subsystem Scopes

Target the exact subsystem:

- **Commands & Options**: `command`, `options`, `admin`, `feeds`, `entertainment`, `utility`, `events`
- **Feed Syndication**: `feed`, `forum`, `threads`, `rss`, `reddit`, `freegames`, `streamalerts`
- **State & Database**: `db`, `schema`, `state`, `repo`, `sqlite`
- **Dashboard & API**: `dashboard`, `auth`, `oauth`, `http`, `routes`
- **Meta & Workflow**: `agents`, `rules`, `wiki`, `docs`, `config`, `deps`

---

## Best Practices

1. **Imperative & Human-Readable**: Present tense, active voice (`✨ feat(command): add play command`, not `added`).
2. **Specific Scopes**: Target the exact module or command category.
3. **Reference GitHub Issues**: Append issue numbers (`Resolves #21`, `Closes #20`).
4. **Roadmap-First (Rule 04)**: Work must align with an active issue roadmap.
5. **Clean Working Tree**: Only stage intended changes; never commit secrets, `.env`, or build artifacts.