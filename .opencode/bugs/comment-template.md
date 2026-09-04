# Issue Comment Template & Safe Remote Posting Protocol

This document defines the standardized templates and protocols for publishing issue comments, status reports, and bug resolution notices on GitHub remote issues for **HELIX**.

---

## Safe Remote Posting Protocol (Unicode & Character Preservation)

> [!IMPORTANT]
> **Windows PowerShell Escaping Rules**:
> 1. In Windows PowerShell, the backtick character (\`) is a reserved escape character.
> 2. Passing inline arguments containing backticks or UTF-8 emojis directly to commands like `gh issue comment --body "..."` causes PowerShell to parse backticks as escape sequences, stripping letters or mangling markdown formatting.
> 3. **MANDATORY**: Always write the comment body into a UTF-8 markdown file (e.g. `scratch/comment.md` or `.agents/bugs/comments/`), and supply it using the file flag:
>    ```bash
>    # Posting a new comment:
>    gh issue comment <issue-number> --body-file path/to/comment.md
>
>    # Updating an existing comment:
>    gh api -X PATCH repos/:owner/:repo/issues/comments/<comment-id> -F body=@path/to/comment.md
>    ```

---

## 1. Architectural & Plan Update Template

```markdown
### 🔄 Update: [Title]

**Context**:
[Describe requirement or design refinement]

**Key Changes**:
- **[Component 1]**: [Details with `inline_code`]
- **[Component 2]**: [Details with `inline_code`]

**Next Steps**:
- [ ] Task 1
- [ ] Task 2
```

---

## 2. Bug Resolution Template

```markdown
### ✅ Resolved: [BUG-XXX] [Title]

**Root Cause**:
[Why the defect occurred]

**Remediation**:
- Modified `[filepath]` to [fix summary]

**Verification**:
- Automated test: `tests/...test.ts` passed
- Zero regressions
```

---

## 3. Progress Check-in Template

```markdown
### 🚀 Progress Update: [Milestone]

- [x] [Completed task 1]
- [x] [Completed task 2]
- [ ] [Pending task 3]

**Verification Status**:
- `npm run test`: Passed (X/X tests)
- `npm run build`: Clean build
```
