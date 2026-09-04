import type { LanguagePlugin, LintOutput, LintResult, ExplainOutput, CodeExplanation, DocReference, CodeFix, CodePattern } from "../../types.js";

const JS_DOCS: Record<string, DocReference> = {
  promises: {
    title: "JavaScript Promises & Async/Await",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
    summary: "Asynchronous computations, Promise chaining, and async/await syntax for non-blocking I/O.",
    codeExamples: ["const res = await fetch(url);\nconst data = await res.json();"],
  },
  arrays: {
    title: "JavaScript Array Methods",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
    summary: "Functional array manipulation: map, filter, reduce, find, some, every, flatMap, and slice.",
    codeExamples: ["const evens = numbers.filter(n => n % 2 === 0);"],
  },
  modules: {
    title: "JavaScript ES Modules",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
    summary: "Static module imports/exports, dynamic imports, default exports, and named exports.",
    codeExamples: ["import { useState } from 'react';\nexport const helper = () => {};"],
  },
};

export const javascriptPlugin: LanguagePlugin = {
  id: "javascript",
  name: "JavaScript",
  version: "1.0.0",
  fileExtensions: [".js", ".mjs", ".cjs", ".jsx"],
  capabilities: ["lint", "explain", "docs", "fixes", "patterns"],

  async lint(code: string, fileName?: string): Promise<LintOutput> {
    const results: LintResult[] = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (/\bvar\s+/.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf("var") + 1,
          severity: "error",
          code: "JS-NO-VAR",
          message: "Avoid 'var' declarations. Use 'const' for constants and 'let' for reassignable variables.",
          docLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let",
        });
      }
      if (/[^!=]==[^=]/.test(line) || /!=[^=]/.test(line)) {
        results.push({
          line: lineNum,
          column: line.search(/==|!=/) + 1,
          severity: "warning",
          code: "JS-EQEQEQ",
          message: "Expected '===' or '!==' instead of loose equality.",
          docLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality",
        });
      }
      if (/\beval\s*\(/.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf("eval") + 1,
          severity: "error",
          code: "JS-NO-EVAL",
          message: "eval() can lead to arbitrary code execution vulnerabilities.",
          docLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval",
        });
      }
    });

    return {
      language: "javascript",
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
    const explanations: CodeExplanation[] = lines.map((line, idx) => ({
      line: idx + 1,
      code: line.trim(),
      explanation: line.includes("=>") ? "Arrow function expression." : line.startsWith("import") ? "Module import statement." : "JavaScript statement.",
    })).filter(e => e.code.length > 0);

    return {
      language: "javascript",
      summary: `JavaScript source code containing ${lines.length} lines.`,
      explanations,
      docReferences: [JS_DOCS.promises, JS_DOCS.arrays],
    };
  },

  async getDocumentation(topic: string): Promise<DocReference[]> {
    const lower = topic.toLowerCase();
    const matches = Object.values(JS_DOCS).filter(d => d.title.toLowerCase().includes(lower) || d.summary.toLowerCase().includes(lower));
    return matches.length > 0 ? matches : [JS_DOCS.promises];
  },
};

export default javascriptPlugin;
