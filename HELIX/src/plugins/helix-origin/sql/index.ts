import type { LanguagePlugin, LintOutput, ExplainOutput, DocReference } from "../../types.js";
export const sqlPlugin: LanguagePlugin = {
  id: "sql", name: "SQL", version: "1.0.0", fileExtensions: [".sql"], capabilities: ["lint", "explain", "docs", "fixes", "patterns"],
  async lint(code: string, fileName?: string): Promise<LintOutput> {
    return { language: "sql", fileName, results: [], summary: { errors: 0, warnings: 0, info: 0 } };
  },
  async explain(code: string): Promise<ExplainOutput> {
    return { language: "sql", summary: "SQL query statement.", explanations: [], docReferences: [{ title: "SQL Standards Reference", url: "https://www.sqlite.org/lang.html", summary: "SQL reference." }] };
  },
  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [{ title: "SQL Reference", url: "https://www.sqlite.org/lang.html", summary: "SQL reference." }];
  },
};
export default sqlPlugin;
