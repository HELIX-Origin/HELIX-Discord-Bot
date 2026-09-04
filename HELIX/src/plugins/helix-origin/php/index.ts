import type { LanguagePlugin, LintOutput, ExplainOutput, DocReference } from "../../types.js";
export const phpPlugin: LanguagePlugin = {
  id: "php", name: "PHP", version: "1.0.0", fileExtensions: [".php"], capabilities: ["lint", "explain", "docs", "fixes", "patterns"],
  async lint(code: string, fileName?: string): Promise<LintOutput> {
    return { language: "php", fileName, results: [], summary: { errors: 0, warnings: 0, info: 0 } };
  },
  async explain(code: string): Promise<ExplainOutput> {
    return { language: "php", summary: "PHP source code.", explanations: [], docReferences: [{ title: "PHP Documentation", url: "https://www.php.net/docs.php", summary: "Official PHP reference." }] };
  },
  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [{ title: "PHP Documentation", url: "https://www.php.net/docs.php", summary: "Official PHP reference." }];
  },
};
export default phpPlugin;
