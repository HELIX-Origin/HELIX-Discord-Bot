import type { LanguagePlugin, LintOutput, ExplainOutput, DocReference } from "../../types.js";

export const javaPlugin: LanguagePlugin = {
  id: "java",
  name: "Java",
  version: "1.0.0",
  fileExtensions: [".java"],
  capabilities: ["lint", "explain", "docs", "fixes", "patterns", "debug", "generate", "refactor", "inspect"],

  async lint(code: string, fileName?: string): Promise<LintOutput> {
    return { language: "java", fileName, results: [], summary: { errors: 0, warnings: 0, info: 0 } };
  },

  async explain(code: string): Promise<ExplainOutput> {
    return {
      language: "java",
      summary: "Java source code.",
      explanations: [],
      docReferences: [{ title: "Java Standard Library", url: "https://docs.oracle.com/en/java/", summary: "Java documentation." }],
    };
  },

  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [{ title: "Java Standard Library", url: "https://docs.oracle.com/en/java/", summary: "Official Java documentation." }];
  },

  async debug(errorLog: string, codeContext?: string): Promise<any> {
    const { diagnoseError } = await import("../../sdk/stack-trace-parser.js");
    return diagnoseError(errorLog, codeContext);
  },

  async generate(type: string, name: string, options?: Record<string, any>): Promise<any> {
    const { buildSnippet } = await import("../../sdk/snippet-builder.js");
    return buildSnippet("java", type, name, options);
  },

  async refactor(code: string, rule?: string): Promise<any> {
    const { refactorCode } = await import("../../sdk/code-transformer.js");
    return refactorCode(code, "java", rule);
  },

  async inspect(code: string): Promise<any> {
    const { scanSecurity } = await import("../../sdk/security-scanner.js");
    return scanSecurity(code, "java");
  },
};

export default javaPlugin;
