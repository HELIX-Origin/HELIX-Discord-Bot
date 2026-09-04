import type { LanguagePlugin, LintOutput, LintResult, ExplainOutput, DocReference } from "../../types.js";

const CS_DOCS: Record<string, DocReference> = {
  async: {
    title: "Asynchronous Programming in C#",
    url: "https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/",
    summary: "Task-based asynchronous pattern (TAP) using async and await keywords.",
    codeExamples: ["public async Task<string> FetchDataAsync() { await Task.Delay(100); return \"data\"; }"],
  },
  linq: {
    title: "LINQ (Language Integrated Query)",
    url: "https://learn.microsoft.com/en-us/dotnet/csharp/linq/",
    summary: "Declarative data querying across collections, databases, and XML.",
    codeExamples: ["var results = users.Where(u => u.IsActive).Select(u => u.Name);"],
  },
};

export const csharpPlugin: LanguagePlugin = {
  id: "csharp",
  name: "C#",
  version: "1.0.0",
  fileExtensions: [".cs"],
  capabilities: ["lint", "explain", "docs", "fixes", "patterns"],

  async lint(code: string, fileName?: string): Promise<LintOutput> {
    const results: LintResult[] = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (/\.Result\b/.test(line) && !/Task\.Result/.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf(".Result") + 1,
          severity: "warning",
          code: "CS-SYNC-OVER-ASYNC",
          message: "Avoid blocking on async code via '.Result'. Use 'await' instead.",
          docLink: "https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/",
        });
      }
    });

    return {
      language: "csharp",
      fileName,
      results,
      summary: { errors: 0, warnings: results.length, info: 0 },
    };
  },

  async explain(code: string): Promise<ExplainOutput> {
    const lines = code.split(/\r?\n/);
    return {
      language: "csharp",
      summary: `C# .NET source containing ${lines.length} lines.`,
      explanations: lines.map((l, i) => ({ line: i + 1, code: l.trim(), explanation: "C# statement." })).filter(e => e.code.length > 0),
      docReferences: [CS_DOCS.async, CS_DOCS.linq],
    };
  },

  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [CS_DOCS.async, CS_DOCS.linq];
  },
};

export default csharpPlugin;
