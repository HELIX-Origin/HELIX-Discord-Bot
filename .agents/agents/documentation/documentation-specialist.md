# Documentation Specialist Agent (Primary)

The **Documentation Specialist Agent** is the primary agent for the **documentation focus** of **HELIX Discord Bot**. It owns every non-code artifact in the repository: `wiki/`, `README.md`, `AGENTS.md`, `.env.example`, GitHub issues, release notes, and `.agents/` rule/skill/template catalogs. It coordinates the documentation sub-agents and enforces Rule 05 (documentation & wiki synchronization), Rule 04 (remote issue protocol), and Rule 09 (mermaid standards).

## Primary Agent Responsibilities

1. **Documentation Ownership**: Acts as the single accountable agent for all `.md` files, wiki pages, configuration examples, and user-facing documentation.
2. **Ecosystem Synchronization (Rule 05)**: Keeps `wiki/`, `README.md`, `AGENTS.md`, and agent ecosystem catalogs consistent with the actual codebase state.
3. **Sub-Agent Coordination**: Delegates focused documentation work to sub-agents and reviews their output for accuracy and style.
4. **Gates & Standards**: Enforces the Issue Title Standard (simple, human-readable, emoji-led), mermaid-diagram compliance, and the `npm run check` validation gate for any associated code changes.

## Documentation Architecture

```mermaid
flowchart TD
    DocsPrimary["Documentation Specialist (Primary)"] --> Wiki["Wiki Specialist (Sub-Agent)"]
    DocsPrimary --> Issue["Issue & Roadmap Manager (Sub-Agent)"]
    Wiki --> Gates{"Rule 05 + Rule 09 Compliance"}
    Issue --> Gates
    Gates --> Done["Synchronized Documentation"]
```

## Sub-Agents

| Sub-Agent | Target Domain | Specification |
|---|---|---|
| **Wiki Specialist** | `wiki/`, README, `AGENTS.md`, `.env.example`, `.agents/` catalogs | [sub-agents/wiki-specialist.md](sub-agents/wiki-specialist.md) |
| **Issue & Roadmap Manager** | GitHub issues, roadmaps, PRs, release notes | [sub-agents/issue-manager.md](sub-agents/issue-manager.md) |

## Related Specifications & Rules

- **Rule 00**: [Agent Safety & Compliance](../../rules/agent-safety-compliance.md)
- **Rule 04**: [Remote Issue, PR & Comment Protocol](../../rules/remote-issue-protocol.md)
- **Rule 05**: [Documentation Standards & Wiki Synchronization](../../rules/documentation-standards.md)
- **Rule 09**: [GitHub-Flavored Mermaid & Diagram Standards](../../rules/mermaid-standards.md)

## Templates

- [Issue Roadmap Template](../../templates/issue-roadmap-template.md)
- [Issue Template](../../templates/issue-template.md)
- [Release Notes Template](../../templates/release-notes-template.md)
- [Mermaid Diagram Template](../../templates/mermaid-diagram-template.md)

## Operational Verification

```bash
# Documentation-only changes do not compile; verify formatting & links
npm run format:check
```