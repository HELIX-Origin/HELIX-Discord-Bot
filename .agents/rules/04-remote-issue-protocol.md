# Rule 04: GitHub Issues & Remote Protocol

## Mandatory Invariants
1. **GitHub Issues as Source of Truth**: All bugs, architectural refactors, and feature tasks MUST be tracked as live GitHub Issues on the repository (`HELIX-Origin/HELIX-Discord-Bot`).
2. **Mandatory Issue & Sub-Issue Creation**: For EVERY task, bug, or feature request received from the user, the AI assistant MUST immediately create a parent GitHub Issue and 4 decomposed Sub-Issues (Sub-Task 1: Diagnostics/Architecture, Sub-Task 2: Core Patch/Implementation, Sub-Task 3: Vitest Test Suite Expansion, Sub-Task 4: Verification & Documentation Sync) before or in conjunction with resolving the work.
3. **Sub-Issues Management**: Link all Sub-Issues to the parent issue using GitHub task lists (`- [ ] #<number>`) and track them through their lifecycle.
4. **Mermaid Diagrams Integration**: Embed valid Mermaid diagrams (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`) in all issue descriptions, bug reports, and tracking documentation.
5. **Safe File-Based Issue/Comment Submissions**: Never supply raw inline markdown or emojis directly in Windows PowerShell command-line arguments when calling `gh issue create`, `gh issue comment`, or `gh pr comment`. Always write content to a UTF-8 markdown file and supply via `--body-file <path>` or `gh api -F body=@<path>`.
6. **Multi-Agent Mirror Synchronization**: Whenever a bug or issue is opened, updated, or closed on GitHub, sync `.agents/bugs/bug-tracking.md`, `AGENTS.md`, `.copilot/`, `.gemini/`, and `.opencode/` immediately.
