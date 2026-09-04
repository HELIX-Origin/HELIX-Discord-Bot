import type { LanguagePlugin, LintOutput, ExplainOutput, DocReference } from "../../types.js";
export const javaPlugin: LanguagePlugin = {
  id: "java", name: "Java", version: "1.0.0", fileExtensions: [".java"], capabilities: ["lint", "explain", "docs", "fixes", "patterns"],
  async lint(code: string, fileName?: string): Promise<LintOutput> {
    return { language: "java", fileName, results: [], summary: { errors: 0, warnings: 0, info: 0 } };
  },
  async explain(code: string): Promise<ExplainOutput> {
    return { language: "java", summary: "Java source code.", explanations: [], docReferences: [{ title: "Java Standard Library", url: "https://docs.oracle.com/en/java/", summary: "Java documentation." }] };
  },
  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [{ title: "Java Standard Library", url: "https://docs.oracle.com/en/java/", summary: "Official Java documentation." }];
  },
};
export default javaPlugin;
