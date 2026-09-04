# Rule 04: GitHub Issues & Remote Protocol

## Mandatory Invariants
1. **GitHub Issues as Source of Truth**: All bug tracking and phase milestones are tracked as live GitHub Issues on the repository (`HELIX-Origin/HELIX`).
2. **Sub-Issues Management**: For any non-trivial bug, refactor, or phase feature, decompose the issue into tracked Sub-Issues (e.g., Diagnostics, Core Fix, Test Suite, Verification/Docs) and link them using GitHub task lists (`- [ ] #<number>` / sub-issue relationships).
3. **Mermaid Diagrams Integration**: Wherever visual architecture, reproduction flows, triage state transitions, component dataflow, or call sequences are beneficial, embed valid Mermaid diagrams (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`) in the issue descriptions, bug reports, and progress comments.
4. **Safe File-Based Issue/Comment Submissions**: Never supply raw inline markdown or emojis directly in Windows PowerShell command-line arguments when calling `gh issue create`, `gh issue comment`, or `gh pr comment`. Always write content to a UTF-8 markdown file and supply via `--body-file <path>` or `gh api -F body=@<path>`.
5. **Multi-Agent Mirror Synchronization**: Whenever a bug or issue is opened, updated, or closed on GitHub, sync `.agents/bugs/bug-tracking.md`, `AGENTS.md`, `.copilot/`, `.gemini/`, and `.opencode/` immediately.
