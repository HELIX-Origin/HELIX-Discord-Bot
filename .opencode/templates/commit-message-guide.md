# Git Commit & PR Message Guide

Guidelines for crafting clear, human-readable commit messages and PR titles with fitting GitHub emojis across all AI coding assistants and contributors.

---

## Format Specification

`
<emoji> <type>(<scope>): <subject>

[optional body explaining rationale, architectural changes, or sub-task outcomes]

[optional issue / bug tracking references: Resolves #<issue>, Closes #<issue>]
`

---

## Standard Emoji & Commit Type Matrix

| Emoji | Type | Purpose | Example |
|---|---|---|---|
| ✨ | eat | New features or capabilities | ✨ feat(plugins): add database-backed repository loader |
| 🐛 | ix | Bug fixes and patches | 🐛 fix(auth): resolve NEXTAUTH_URL detection in production |
| 📝 | docs | Documentation and plan updates | 📝 docs(agents): sync multi-agent bug tracking mirrors |
| 🧪 | 	est | Adding, updating, or fixing tests | 🧪 test(db): add unit test suite for plugin_repositories table |
| ♻️ | efactor | Code refactoring without behavioral change | ♻️ refactor(messages): centralize embed builder engine |
| ⚡ | perf | Performance optimizations | ⚡ perf(resolver): optimize URL pattern matching lookup |
| 🔧 | chore | Tooling, config, and maintenance | 🔧 chore(deps): upgrade discord.js dependencies |
| 🔒 | security | Security enhancements or fixes | 🔒 security(sandbox): isolate plugin vm execution context |
| 📦 | uild | Build system, packaging, Docker | 📦 build(docker): optimize multi-stage image layers |
| 🚀 | deploy | Deployment configuration | 🚀 deploy(heroku): add Koyeb and Render build specifications |

---

## Best Practices

1. **Imperative & Human-Readable**: Use present tense, active voice (e.g., ✨ feat(plugins): implement sandbox executor rather than implemented).
2. **Specific Scopes**: Target the exact subsystem (core, plugins, db, uth, dashboard, events, commands, scaffold, docs).
3. **Reference GitHub Issues**: Always append resolved issue or bug numbers (e.g., Resolves #13, Closes #14).
4. **Multi-Agent Persistent Sync**: When writing commits from automated agent workflows, ensure commits are clean, descriptive, and adhere to this emoji standard.
