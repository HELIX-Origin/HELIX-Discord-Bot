import type { LanguagePlugin, LintOutput, LintResult, ExplainOutput, CodeExplanation, DocReference } from "../../types.js";

const GO_DOCS: Record<string, DocReference> = {
  goroutines: {
    title: "Go Concurrency & Goroutines",
    url: "https://go.dev/doc/effective_go#concurrency",
    summary: "Concurrent execution with goroutines and communication via channels (Do not communicate by sharing memory; instead, share memory by communicating).",
    codeExamples: ["go func() {\n    ch <- doWork()\n}()"],
  },
  errors: {
    title: "Go Error Handling",
    url: "https://go.dev/blog/error-handling-and-go",
    summary: "Explicit error returns, error wrapping with %w, and errors.Is / errors.As inspection.",
    codeExamples: ["if err != nil {\n    return fmt.Errorf(\"failed to open: %w\", err)\n}"],
  },
};

export const goPlugin: LanguagePlugin = {
  id: "go",
  name: "Go",
  version: "1.0.0",
  fileExtensions: [".go"],
  capabilities: ["lint", "explain", "docs", "fixes", "patterns"],

  async lint(code: string, fileName?: string): Promise<LintOutput> {
    const results: LintResult[] = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      // Check for ignored errors: _, _ = or _ = fn()
      if (/_\s*,\s*err\s*:=/.test(line) || /_\s*=\s*\w+\(/.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf("_") + 1,
          severity: "warning",
          code: "GO-UNCHECKED-ERROR",
          message: "Potential unhandled error. Check returned error explicitly.",
          docLink: "https://go.dev/blog/error-handling-and-go",
        });
      }
    });

    return {
      language: "go",
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
      let text = "Go statement.";
      if (/^package\s+/.test(trimmed)) text = "Package namespace declaration.";
      else if (/^import\s+/.test(trimmed)) text = "Package import.";
      else if (/^func\s+/.test(trimmed)) text = "Function or method definition.";
      else if (/^type\s+\w+\s+struct\b/.test(trimmed)) text = "Struct type declaration.";
      else if (/^type\s+\w+\s+interface\b/.test(trimmed)) text = "Interface specification.";
      return { line: idx + 1, code: trimmed, explanation: text };
    }).filter(e => e.code.length > 0);

    return {
      language: "go",
      summary: `Go source containing ${lines.length} lines.`,
      explanations,
      docReferences: [GO_DOCS.goroutines, GO_DOCS.errors],
    };
  },

  async getDocumentation(topic: string): Promise<DocReference[]> {
    const lower = topic.toLowerCase();
    const matches = Object.values(GO_DOCS).filter(d => d.title.toLowerCase().includes(lower) || d.summary.toLowerCase().includes(lower));
    return matches.length > 0 ? matches : [GO_DOCS.errors];
  },
};

export default goPlugin;
