import type { LanguagePlugin, LintOutput, LintResult, ExplainOutput, CodeExplanation, DocReference, CodeFix, CodePattern } from "../../types.js";

const PYTHON_DOCS: Record<string, DocReference> = {
  dataclasses: {
    title: "Python Data Classes",
    url: "https://docs.python.org/3/library/dataclasses.html",
    summary: "Decorator and functions for automatically adding generated special methods such as __init__() and __repr__() to user-defined classes.",
    codeExamples: ["from dataclasses import dataclass\n\n@dataclass\nclass Point:\n    x: float\n    y: float"],
  },
  typing: {
    title: "Python Type Hints & Static Typing",
    url: "https://docs.python.org/3/library/typing.html",
    summary: "Type annotations and type hints support: Optional, Union, Any, Callable, TypeVar, and Generic.",
    codeExamples: ["def greeting(name: str) -> str:\n    return 'Hello ' + name"],
  },
  asyncio: {
    title: "Python Asynchronous I/O (asyncio)",
    url: "https://docs.python.org/3/library/asyncio.html",
    summary: "Concurrent code execution using async/await syntax for event-driven networking and coroutines.",
    codeExamples: ["import asyncio\n\nasync def main():\n    await asyncio.sleep(1)\n\nasyncio.run(main())"],
  },
};

export const pythonPlugin: LanguagePlugin = {
  id: "python",
  name: "Python",
  version: "1.0.0",
  fileExtensions: [".py", ".pyw"],
  capabilities: ["lint", "explain", "docs", "fixes", "patterns", "debug", "generate", "refactor", "inspect"],

  async lint(code: string, fileName?: string): Promise<LintOutput> {
    const results: LintResult[] = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // Check for bare except:
      if (/^except\s*:/.test(trimmed)) {
        results.push({
          line: lineNum,
          column: line.indexOf("except") + 1,
          severity: "warning",
          code: "PY-BARE-EXCEPT",
          message: "Do not use bare 'except:'. Catch specific exceptions or 'except Exception:'.",
          docLink: "https://docs.python.org/3/tutorial/errors.html#handling-exceptions",
        });
      }

      // Check for mutable default arguments (def foo(a=[]):)
      if (/def\s+\w+\s*\(.*=\s*(\[\]|\{\})/g.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf("=") + 1,
          severity: "error",
          code: "PY-MUTABLE-DEFAULT-ARG",
          message: "Avoid mutable default arguments (like [] or {}). Use None as default value and initialize inside function.",
          docLink: "https://docs.python.org/3/tutorial/controlflow.html#default-argument-values",
        });
      }

      // Check for eval() or exec()
      if (/\b(eval|exec)\s*\(/.test(line)) {
        results.push({
          line: lineNum,
          column: line.search(/\b(eval|exec)\b/) + 1,
          severity: "error",
          code: "PY-NO-EVAL-EXEC",
          message: "eval() / exec() dynamic evaluation poses critical security risks.",
          docLink: "https://docs.python.org/3/library/functions.html#eval",
        });
      }
    });

    return {
      language: "python",
      fileName,
      results,
      summary: {
        errors: results.filter(r => r.severity === "error").length,
        warnings: results.filter(r => r.severity === "warning").length,
        info: results.filter(r => r.severity === "info").length,
      },
    };
  },

  async explain(code: string): Promise<ExplainOutput> {
    const lines = code.split(/\r?\n/);
    const explanations: CodeExplanation[] = lines.map((line, idx) => {
      const trimmed = line.trim();
      let text = "Python statement.";
      if (/^def\s+/.test(trimmed)) text = "Function or method declaration.";
      else if (/^class\s+/.test(trimmed)) text = "Class definition.";
      else if (/^import\s+|^from\s+/.test(trimmed)) text = "Module dependency import.";
      else if (/^with\s+/.test(trimmed)) text = "Context manager statement managing resource allocation/cleanup.";
      else if (/^async\s+def\s+/.test(trimmed)) text = "Asynchronous coroutine definition.";
      return { line: idx + 1, code: trimmed, explanation: text };
    }).filter(e => e.code.length > 0);

    return {
      language: "python",
      summary: `Python source containing ${lines.length} lines of code.`,
      explanations,
      docReferences: [PYTHON_DOCS.typing, PYTHON_DOCS.dataclasses],
    };
  },

  async getDocumentation(topic: string): Promise<DocReference[]> {
    const lower = topic.toLowerCase();
    const matches = Object.values(PYTHON_DOCS).filter(d => d.title.toLowerCase().includes(lower) || d.summary.toLowerCase().includes(lower));
    return matches.length > 0 ? matches : [PYTHON_DOCS.typing];
  },

  async debug(errorLog: string, codeContext?: string): Promise<any> {
    const { diagnoseError } = await import("../../sdk/stack-trace-parser.js");
    return diagnoseError(errorLog, codeContext);
  },

  async generate(type: string, name: string, options?: Record<string, any>): Promise<any> {
    const { buildSnippet } = await import("../../sdk/snippet-builder.js");
    return buildSnippet("python", type, name, options);
  },

  async refactor(code: string, rule?: string): Promise<any> {
    const { refactorCode } = await import("../../sdk/code-transformer.js");
    return refactorCode(code, "python", rule);
  },

  async inspect(code: string): Promise<any> {
    const { scanSecurity } = await import("../../sdk/security-scanner.js");
    return scanSecurity(code, "python");
  },
};

export default pythonPlugin;
