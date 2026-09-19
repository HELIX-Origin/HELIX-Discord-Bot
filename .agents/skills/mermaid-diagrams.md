# Skill: GitHub-Flavored Mermaid Diagrams

## Overview
This skill covers authoring **Mermaid diagrams** for **HELIX Discord Bot** documentation that render correctly on GitHub and stay legible. It applies to every diagram anywhere in the repo — `AGENTS`, `.agents/`, `wiki/`, README, issue bodies, and PR descriptions — per **Rule 09** (`.agents/rules/mermaid-standards`).

## When to Use
- Issue/PR roadmaps and bug reports (Rule 04 requires at least one diagram).
- Architectural, lifecycle, and decision-flow documentation in `wiki/`.
- Agent ecosystem docs (`.agents/`) and `AGENTS`.

## Core Rules

### 1. GitHub-Compatible Syntax
GitHub renders Mermaid v10.x. Write syntax that works there — never assume a newer Mermaid feature exists.

| Construct | Correct | Incorrect |
|---|---|---|
| Node with special chars | `CMD["/reddit add"]` | `CMD[/reddit add]` |
| Subgraph title | `subgraph Caps["Per-Tab Caps"]` | `subgraph Caps [Per-Tab Caps]` |
| Edge label | `A -->|"No"| B` | `A -->|No| B` (if `|`-adjacent specials) |
| Decision | `A{question}` | — |
| Fence | ```` ```mermaid ```` | inline `mermaid` syntax |

### 2. Legibility: One Concern Per Diagram
- Split distinct flows into separate ```` ```mermaid ```` blocks under their own headings.
- Keep each diagram ≤ 8–12 nodes; larger flows get split into multiple diagrams.
- Prefer `flowchart TD`; use `LR` only for short shallow pipelines.

## Workflow
1. Draft the diagram in a ```` ```mermaid ```` block.
2. Quote any label containing `( ) [ ] : # \| " \` / < > & =`.
3. Avoid trapezoid shapes, `%%{init}%%`, math, and reserved-word IDs.
4. Split diagrams that get wide or tall; verify each renders on github.com.
5. Mark the Rule 09 conformity checklist complete.