import type { LanguagePlugin, LintOutput, ExplainOutput, DocReference } from "../../types.js";
export const flutterDartPlugin: LanguagePlugin = {
  id: "flutter-dart", name: "Flutter & Dart", version: "1.0.0", fileExtensions: [".dart"], capabilities: ["lint", "explain", "docs", "fixes", "patterns"],
  async lint(code: string, fileName?: string): Promise<LintOutput> {
    return { language: "flutter-dart", fileName, results: [], summary: { errors: 0, warnings: 0, info: 0 } };
  },
  async explain(code: string): Promise<ExplainOutput> {
    return { language: "flutter-dart", summary: "Dart / Flutter source code.", explanations: [], docReferences: [{ title: "Dart Documentation", url: "https://dart.dev/guides", summary: "Dart guides." }] };
  },
  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [{ title: "Dart & Flutter Docs", url: "https://dart.dev/guides", summary: "Official documentation." }];
  },
};
export default flutterDartPlugin;
