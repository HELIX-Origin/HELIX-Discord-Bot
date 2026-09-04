# Language Plugin System

HELIX uses GitHub-hosted plugin repositories for code intelligence. No AI APIs. No external services at runtime.

> **Status:** Plugin infrastructure, 13 built-in language plugins (`HELIX-Origin/helix-origin`), and Discord commands `/lint`, `/explain`, and `/docs` are fully implemented (Phase 8).

---

## Plugin Repository Structure

Both the built-in `helix-origin` repo and community repos use the same layout:

```
my-plugin-repo/
├── config.json          # Repo manifest — required entry point
├── typescript/
│   ├── plugin.json      # Plugin manifest
│   ├── linter.ts        # Main entry (declared in plugin.json "entry")
│   ├── patterns.ts
│   ├── docs-cache.ts
│   └── examples/
└── python/
    └── ...
```

### `config.json` — Repo Manifest

```json
{
  "repository": "HELIX-Origin/helix-origin",
  "name": "HELIX Official Language Plugins",
  "version": "1.0.0",
  "author": "HELIX-Origin",
  "plugins": [
    { "id": "typescript", "path": "./typescript" },
    { "id": "python",     "path": "./python" },
    { "id": "javascript", "path": "./javascript" }
  ]
}
```

### `plugin.json` — Plugin Manifest

```json
{
  "id": "typescript",
  "name": "TypeScript",
  "version": "1.0.0",
  "description": "TypeScript linting, documentation, and code analysis",
  "author": "HELIX-Origin",
  "fileExtensions": [".ts", ".tsx"],
  "entry": "linter.ts",
  "capabilities": ["lint", "explain", "fixes", "docs", "format"],
  "repository": "https://github.com/HELIX-Origin/helix-origin"
}
```

**Valid capabilities:** `lint` · `explain` · `fixes` · `docs` · `format` · `patterns` · `debug` · `generate` · `refactor` · `inspect`

---

## Plugin Interface

Every plugin entry file exports a `LanguagePlugin`:

```typescript
interface LanguagePlugin {
  id: string;
  name: string;
  version: string;
  fileExtensions: string[];
  capabilities: PluginCapability[];

  lint(code: string, fileName?: string): Promise<LintOutput>;
  explain(code: string): Promise<ExplainOutput>;
  getDocumentation(topic: string): Promise<DocReference[]>;
  suggestFixes?(errors: LintResult[]): Promise<CodeFix[]>;
  format?(code: string): Promise<string>;
  getPatterns?(): Promise<CodePattern[]>;
  debug?(errorLog: string, codeContext?: string): Promise<DebugDiagnostic>;
  generate?(type: string, name: string, options?: Record<string, any>): Promise<SnippetGeneration>;
  refactor?(code: string, rule?: string): Promise<RefactorOutput>;
  inspect?(code: string): Promise<SecurityAuditResult>;
}
```

---

## Multi-Source Code Ingestion Engine

Plugins and bot commands seamlessly accept code from diverse sources without manual conversion:
1. **Pasted Code & Codeblocks**: Direct arguments, inline code, or fenced Markdown (```` ```lang ... ``` ````).
2. **Discord Attachments**: Attached source files and logs (`.ts`, `.py`, `.rs`, `.go`, `.java`, `.cs`, etc.).
3. **Remote Repositories & Gists**:
   - **GitHub**: Blob (`github.com/.../blob/...`) and Raw URLs (`raw.githubusercontent.com/...`)
   - **GitHub Gists**: Gist links (`gist.github.com/...`)
   - **GitLab**: Blob (`gitlab.com/.../-/blob/...`), Raw, and Snippets (`gitlab.com/-/snippets/...`)
   - **Bitbucket**: Source (`bitbucket.org/.../src/...`), Raw, and Snippets
   - **Pastebins**: Raw text pastes

---

## Installing Community Plugins

```
>plugin install username/my-plugin-repo
```

HELIX clones the repo into `HELIX/src/plugins/community/<repo-name>/`, reads `config.json`, validates each `plugin.json`, and registers all plugins in the runtime registry.

---

## Built-in Plugin Scope (Phase 8)

| Language | Lint Strategy | Docs Source |
|----------|--------------|-------------|
| TypeScript | TS Compiler API | typescriptlang.org |
| JavaScript | ESLint-compatible rules | developer.mozilla.org |
| Python | AST pattern matching | docs.python.org |
| C# | Roslyn-style diagnostics | learn.microsoft.com |
| GDScript | Godot docs cross-ref | docs.godotengine.org |
| Rust | rustc warning patterns | doc.rust-lang.org |
| Go | go vet patterns | go.dev/doc |
| Java | Checkstyle-style rules | docs.oracle.com |
| PHP | PHPDoc + pattern rules | php.net |
| SQL | Syntax validation | ANSI standard |
| HTML/CSS | W3C validation patterns | developer.mozilla.org |
| Flutter/Dart | dart analyzer patterns | dart.dev |
| Lua | luacheck patterns | lua.org |
