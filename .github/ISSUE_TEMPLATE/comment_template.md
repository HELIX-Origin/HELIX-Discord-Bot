# GitHub Issue Comment Guidelines & Templates

This document defines the standardized templates and execution protocols for posting issue comments, progress updates, and resolution reports on GitHub for the **HELIX** project.

---

## ⚠️ Safe Remote Posting Protocol (Preventing Unicode & Escaping Errors)

When posting or updating comments on GitHub from terminal environments (especially Windows PowerShell):

1. **NEVER pass inline markdown strings containing backticks or Unicode directly via CLI arguments**:
   ```bash
   # ❌ WRONG: PowerShell treats backticks (`) as escape characters and strips or mangles characters
   gh issue comment 4 --body "Using `model` with 🔄 emoji"
   ```

2. **ALWAYS author comments in a clean UTF-8 markdown file and pass via `--body-file` or `@file`**:
   ```bash
   # ✅ CORRECT: Preserves all UTF-8 characters, emojis, and inline code formatting perfectly
   gh issue comment <issue-number> --body-file path/to/comment.md

   # ✅ CORRECT FOR UPDATING EXISTING COMMENTS:
   gh api -X PATCH repos/:owner/:repo/issues/comments/<comment-id> -F body=@path/to/comment.md
   ```

3. **Verify encoding**: Ensure the temporary `.md` file is explicitly encoded in UTF-8 without BOM.

---

## Standard Comment Templates

### Template A: Architectural / Plan Update

```markdown
### 🔄 Update: [Brief Descriptive Title]

**Context & Motivation**:
[Explain what design or requirement changed and why]

**Key Changes**:
- **[Component / Area 1]**: [Details with `inline_code` formatting]
- **[Component / Area 2]**: [Details with `inline_code` formatting]

**Impact on Scope & Milestones**:
- [x] Documented in Phase plan: `[phase-file.md]`
- [x] Automated test expectations updated
- [x] Documentation synchronized
```

---

### Template B: Implementation Progress & Verification

```markdown
### 🚀 Progress Update: [Feature / Milestone Title]

**Completed Deliverables**:
- [x] **[Deliverable 1]**: [Description with file link `path/to/file.ts`]
- [x] **[Deliverable 2]**: [Description with file link `path/to/file.ts`]

**Test Results & Quality Verification**:
- Unit Tests: `X passed, 0 failed` across `Y` test suites (`npm run test`)
- TypeScript Compilation: `npx tsc --noEmit` passed with 0 errors
- Build Bundle: `npm run build` compiled clean standalone bundle

**Next Planned Steps**:
1. [Next step 1]
2. [Next step 2]
```

---

### Template C: Bug Resolution Report

```markdown
### ✅ Resolved: [BUG-XXX] [Bug Title]

**Root Cause**:
[Concise technical description of why the bug occurred]

**Fix Applied**:
- Modified `[filename]` to [describe specific technical change]
- Preserved backward compatibility and security boundaries

**Verification**:
- Automated test added/updated: `[test-file.test.ts]`
- Verified across target operating systems (Windows, macOS, Linux)
- Commit: `[commit-hash]`
```
