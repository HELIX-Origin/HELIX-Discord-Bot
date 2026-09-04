# Rule 04: GitHub Issues & Remote Protocol

## Mandatory Invariants
1. **GitHub Issues as Source of Truth**: All bug tracking and phase milestones are tracked as live GitHub Issues on the repository (`HELIX-Origin/HELIX`).
2. **Safe File-Based Issue/Comment Submissions**: Never supply raw inline markdown or emojis directly in Windows PowerShell command-line arguments when calling `gh issue create`, `gh issue comment`, or `gh pr comment`. Always write content to a UTF-8 markdown file and supply via `--body-file <path>` or `gh api -F body=@<path>`.
3. **Multi-Agent Mirror Synchronization**: Whenever a bug is opened, progressed, or resolved on GitHub, sync `.agents/bugs/bug-tracking.md`, `AGENTS.md`, `.copilot/`, `.gemini/`, and `.opencode/` immediately.
