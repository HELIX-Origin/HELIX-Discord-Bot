# Rule 05: Documentation Standards & Wiki Synchronization

## Mandatory Standards

1. **Documentation Resides in `wiki/`**:
   - Technical documentation is hosted in the `wiki/` directory.
   - `wiki/Home.md` and `wiki/_Sidebar.md` serve as the central table of contents and navigation index. Every documentation article must be linked from `_Sidebar.md`.
   - Do NOT create a separate `docs/` directory.

2. **Agent Documentation Synchronization**:
   - Any architectural, command, or schema changes must be synchronized with:
     - `AGENTS.md` (root operating manual)
     - Relevant index files: `.agents/rules/index.md`, `.agents/agents/index.md`, `.agents/skills/index.md`, `.agents/templates/index.md`
     - Matching articles in `wiki/` (e.g. `wiki/Discord-Bot.md`, `wiki/Configuration.md`).

3. **Markdown Conventions**:
   - Standard GitHub-Flavored Markdown.
   - Headings must follow `#` hierarchy (H1 -> H2 -> H3).
   - Use Mermaid diagrams (`flowchart TD`, `sequenceDiagram`) for architectural flows and lifecycle sequences.
   - Fenced code blocks with language identifiers.

4. **Secrets in Documentation**:
   - Documentation must reference `.env.example` placeholders only.
   - Never commit real tokens, API keys, webhook URLs, or passwords in documentation or examples.

5. **Commit Message Standards**:
   - Follow `.agents/templates/commit-message-guide.md` (emoji type, scope, imperative mood).