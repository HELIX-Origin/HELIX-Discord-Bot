# Plugin Authoring Guide

This guide walks through creating, testing, and distributing language plugins and source providers for the HELIX Discord bot.

---

## 1. Core Principles

1. **Deterministic & Local**: HELIX plugins do not require external AI APIs or remote subscriptions. They execute locally using AST parsers, regex engines, rule matrices, and cached knowledge bases.
2. **Pluggable Intelligence**: All language-specific operations (`lint`, `explain`, `debug`, `generate`, `refactor`, `inspect`, `docs`) and custom URL resolvers (`SourceProvider`) are supplied dynamically by plugins.
3. **Multi-Source Code Ingestion**: HELIX automatically handles pasted codeblocks, file attachments, and repository URLs and dispatches them directly to your plugin.

---

## 2. Repository Structure

> For complete JSON schemas, capability matrices, and TypeScript type contracts, see [Plugin Repository Structural Specification](plugin-repository-structure.md).

A plugin repository contains a root manifest (`config.json`) and one or more plugin folders:

```
my-plugin-repo/
├── config.json              # Repository manifest
├── README.md                # Description and installation instructions
└── lua/                     # Plugin directory
    ├── plugin.json          # Plugin metadata & capabilities
    ├── index.ts             # Entry point exporting LanguagePlugin
    ├── linter.ts            # Static analysis & diagnostics
    ├── docs.ts              # Built-in reference & documentation
    └── tests/
        └── plugin.test.ts   # Vitest unit tests
```

### Root Manifest (`config.json`)

```json
{
  "repository": "yourusername/helix-lua-plugin",
  "name": "HELIX Lua Language Plugin",
  "version": "1.0.0",
  "description": "Lua language intelligence, linting, and documentation for HELIX",
  "author": "YourName",
  "plugins": [
    {
      "id": "lua",
      "path": "./lua"
    }
  ]
}
```

### Plugin Manifest (`lua/plugin.json`)

```json
{
  "id": "lua",
  "name": "Lua",
  "version": "1.0.0",
  "description": "Lua linting, syntax checking, debugging, and code generation",
  "author": "YourName",
  "fileExtensions": [".lua"],
  "entry": "index.ts",
  "capabilities": [
    "lint",
    "explain",
    "docs",
    "debug",
    "generate",
    "refactor",
    "inspect"
  ],
  "dependencies": [],
  "repository": "https://github.com/yourusername/helix-lua-plugin"
}
```

---

## 3. Implementing `LanguagePlugin`

Create `lua/index.ts` conforming to the `LanguagePlugin` interface:

```typescript
import {
  LanguagePlugin,
  PluginCapability,
  LintOutput,
  ExplainOutput,
  DocReference,
  DebugDiagnostic,
  SnippetGeneration,
  RefactorOutput,
  SecurityAuditResult,
} from './types';

export class LuaPlugin implements LanguagePlugin {
  public readonly id = 'lua';
  public readonly name = 'Lua';
  public readonly version = '1.0.0';
  public readonly fileExtensions = ['.lua'];
  public readonly capabilities: PluginCapability[] = [
    'lint',
    'explain',
    'docs',
    'debug',
    'generate',
    'refactor',
    'inspect',
  ];

  public async lint(code: string, fileName = 'code.lua'): Promise<LintOutput> {
    const lines = code.split('\n');
    const results = [];

    lines.forEach((line, index) => {
      // Example: Detect global variable leakage without 'local'
      if (/^[a-zA-Z_]\w*\s*=/.test(line.trim())) {
        results.push({
          line: index + 1,
          column: 1,
          message: 'Global variable assignment. Prefer "local" to avoid polluting global scope.',
          severity: 'warning' as const,
          rule: 'lua/no-implicit-global',
        });
      }
    });

    return {
      fileName,
      language: this.name,
      results,
      errorCount: results.filter((r) => r.severity === 'error').length,
      warningCount: results.filter((r) => r.severity === 'warning').length,
      durationMs: 1,
    };
  }

  public async explain(code: string): Promise<ExplainOutput> {
    return {
      summary: 'Lua script with function definitions and table operations.',
      concepts: ['Tables', 'Metatables', 'Coroutines'],
      complexity: 'Low',
      sections: [
        {
          title: 'Structure',
          description: 'Defines modular tables and local closures.',
        },
      ],
    };
  }

  public async getDocumentation(topic: string): Promise<DocReference[]> {
    const docs: Record<string, DocReference> = {
      tables: {
        title: 'Lua Tables',
        url: 'https://www.lua.org/pil/2.5.html',
        summary: 'Tables are the main data structuring mechanism in Lua.',
        syntax: 'local t = { key = "value" }',
      },
    };

    const match = docs[topic.toLowerCase()];
    return match ? [match] : [];
  }

  public async debug(errorLog: string, codeContext?: string): Promise<DebugDiagnostic> {
    if (errorLog.includes('attempt to index a nil value')) {
      return {
        errorType: 'NilIndexError',
        summary: 'Attempted to access a property on a nil table or variable.',
        cause: 'Variable was not initialized or table key is missing.',
        fixes: [
          'Verify variable initialization before property access: if tbl then ... end',
          'Use safe navigation or table default initializers.',
        ],
        codeSample: 'if tbl and tbl.property then\n  print(tbl.property)\nend',
      };
    }

    return {
      errorType: 'RuntimeError',
      summary: 'Unknown runtime error.',
      cause: 'Error stack trace does not match known patterns.',
      fixes: ['Inspect stack trace and check variable types with type(var).'],
    };
  }

  public async generate(type: string, name: string): Promise<SnippetGeneration> {
    if (type.toLowerCase() === 'module') {
      return {
        fileName: `${name}.lua`,
        description: `Lua module export template for ${name}`,
        code: `local ${name} = {}\n\nfunction ${name}.init()\n  -- Initializer\nend\n\nreturn ${name}\n`,
      };
    }

    return {
      fileName: `${name}.lua`,
      description: `Basic Lua script: ${name}`,
      code: `local function main()\n  print("Hello from ${name}!")\nend\n\nmain()\n`,
    };
  }

  public async refactor(code: string, rule?: string): Promise<RefactorOutput> {
    // Example: Convert global functions to local functions
    const refactored = code.replace(/function\s+([a-zA-Z_]\w*)\s*\(/g, 'local function $1(');
    return {
      description: 'Convert global functions to local scope closures',
      changes: ['Prefixed top-level function declarations with "local"'],
      refactoredCode: refactored,
    };
  }

  public async inspect(code: string): Promise<SecurityAuditResult> {
    const issues = [];
    if (code.includes('loadstring(') || code.includes('load(')) {
      issues.push({
        severity: 'high' as const,
        description: 'Dynamic code execution via loadstring() / load().',
        recommendation: 'Avoid dynamic string execution with unvalidated user inputs.',
      });
    }

    return {
      score: issues.length === 0 ? 100 : 60,
      issues,
      passed: issues.length === 0,
    };
  }
}
```

---

## 4. Registering Custom Source Providers

If your plugin works with a custom code hosting service, company repository, or pastebin, register a `SourceProvider`:

```typescript
import { SourceProvider, SourceProviderResolution } from './types';

export const internalPasteProvider: SourceProvider = {
  id: 'internal-paste',
  name: 'Internal Paste Service',
  domains: ['paste.mycompany.internal'],
  canHandle(url: URL): boolean {
    return url.hostname === 'paste.mycompany.internal';
  },
  resolve(url: URL): SourceProviderResolution {
    return {
      rawFetchUrl: `https://${url.hostname}/raw${url.pathname}`,
      origin: 'internal-paste',
      label: `Internal Paste (${url.pathname})`,
      detectedLanguage: 'lua',
    };
  },
};
```

---

## 5. Testing with Vitest

Write unit tests for your plugin:

```typescript
import { describe, it, expect } from 'vitest';
import { LuaPlugin } from '../index';

describe('LuaPlugin', () => {
  const plugin = new LuaPlugin();

  it('detects un-scoped global variables', async () => {
    const output = await plugin.lint('globalVar = 42\n');
    expect(output.warningCount).toBe(1);
    expect(output.results[0].rule).toBe('lua/no-implicit-global');
  });

  it('debugs nil index errors', async () => {
    const diag = await plugin.debug("lua: script.lua:2: attempt to index a nil value (global 'tbl')");
    expect(diag.errorType).toBe('NilIndexError');
    expect(diag.fixes.length).toBeGreaterThan(0);
  });
});
```

---

## 6. Installing in Discord

Once your repository is pushed to GitHub:

```
>plugin install yourusername/helix-lua-plugin
```

The HELIX bot will fetch `config.json`, validate the manifest against the schema, register the language plugin, and enable `>lint`, `>explain`, `>debug`, `>refactor`, `>generate`, `>inspect`, and `>docs` for `.lua` files.
