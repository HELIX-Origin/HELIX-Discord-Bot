# Bug Tracking Index

This directory contains tracked bugs and issues for HELIX CLI. Every bug has its own tracking file following the standard template.

## Bug Triage & Lifecycle

```
[Open] ──> [Investigating] ──> [In Progress] ──> [Testing] ──> [Resolved/Closed]
```

## Tracked Bugs

| Bug ID | Title | Priority | Status | Target Phase | GitHub Issue | File |
|--------|-------|----------|--------|--------------|--------------|------|
| **BUG-001** | Cross-platform config path resolution for Copilot and Antigravity | Medium | Resolved | Phase 4 | [#1](https://github.com/HELIX-Origin/HELIX-CLI/issues/1) | [BUG-001-credential-discovery-path.md](file:///d:/Scripts/HELIX%20CLI/.agents/bugs/BUG-001-credential-discovery-path.md) |
| **BUG-002** | Template variable interpolation handling in binary game assets | Low | Resolved | Phase 3 | [#2](https://github.com/HELIX-Origin/HELIX-CLI/issues/2) | [BUG-002-game-engine-template-placeholders.md](file:///d:/Scripts/HELIX%20CLI/.agents/bugs/BUG-002-game-engine-template-placeholders.md) |
| **BUG-003** | Heroku deployment fails to auto-detect dynamic app URLs and bot invite URL | High | Resolved | Phase 6 | [#3](https://github.com/HELIX-Origin/HELIX-CLI/issues/3) | [BUG-003-heroku-deploy-dynamic-url-detection.md](file:///d:/Scripts/HELIX%20CLI/.agents/bugs/BUG-003-heroku-deploy-dynamic-url-detection.md) |
| **BUG-004** | Auto-resolve NEXTAUTH_URL and callback URLs from platform detection | Medium | Resolved | Phase 7 | [#9](https://github.com/HELIX-Origin/HELIX-CLI/issues/9) | [BUG-004-auto-resolve-url-env.md](file:///d:/Scripts/HELIX%20CLI/.agents/bugs/BUG-004-auto-resolve-url-env.md) |
| **BUG-005** | TypeScript strict mode errors after discord.js vanilla migration | High | Resolved | Phase 7 | [#10](https://github.com/HELIX-Origin/HELIX-CLI/issues/10) | [BUG-005-typescript-strict-mode-errors.md](file:///d:/Scripts/HELIX%20CLI/.agents/bugs/BUG-005-typescript-strict-mode-errors.md) |
| **BUG-006** | Centralized Message Formatting Engine & messages.json refactor | High | Resolved | Phase 8 | [#11](https://github.com/HELIX-Origin/HELIX-CLI/issues/11) | [BUG-006-messages-json-formatting-refactor.md](file:///d:/Scripts/HELIX%20CLI/.agents/bugs/BUG-006-messages-json-formatting-refactor.md) |

## Reporting & Tracking a Bug

All bugs are tracked directly via **GitHub Issues** on the repository:

1. **Create GitHub Issue**:
   ```bash
   # Create issue using GitHub CLI and the bug report template
   gh issue create --title "[BUG-XXX] Short description" --body-file ".agents/bugs/template.md" --label "bug"
   ```
2. **Create Local Tracking Mirror**:
   - Copy [template.md](file:///d:/Scripts/HELIX%20CLI/.agents/bugs/template.md) to `BUG-XXX-<slug>.md`.
   - Record the GitHub Issue link and update the table above.
3. **Multi-Agent Sync**:
   - Keep status synchronized across `.agents/`, `.copilot/`, `.gemini/`, and `.opencode/`.

## Remote Issue Protocol
To ensure remote GitHub issue bodies and comments never suffer from Unicode or PowerShell character-escaping errors:
- Review [comment-template.md](file:///d:/Scripts/HELIX%20CLI/.agents/bugs/comment-template.md).
- **MANDATORY**: Always write bodies and comments to a UTF-8 markdown file and submit via `--body-file <file.md>`.
- Never supply unescaped inline markdown or emojis directly in Windows PowerShell arguments.
