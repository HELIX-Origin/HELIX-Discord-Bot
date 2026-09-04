import type { LanguagePlugin, LintOutput, ExplainOutput, DocReference } from "../../types.js";
export const htmlCssPlugin: LanguagePlugin = {
  id: "html-css", name: "HTML & CSS", version: "1.0.0", fileExtensions: [".html", ".htm", ".css"], capabilities: ["lint", "explain", "docs", "fixes", "patterns"],
  async lint(code: string, fileName?: string): Promise<LintOutput> {
    return { language: "html-css", fileName, results: [], summary: { errors: 0, warnings: 0, info: 0 } };
  },
  async explain(code: string): Promise<ExplainOutput> {
    return { language: "html-css", summary: "HTML5/CSS3 source.", explanations: [], docReferences: [{ title: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", summary: "Web standards." }] };
  },
  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [{ title: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", summary: "Web standards." }];
  },
};
export default htmlCssPlugin;
