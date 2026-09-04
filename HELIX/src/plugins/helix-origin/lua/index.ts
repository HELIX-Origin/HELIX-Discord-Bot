import type { LanguagePlugin, LintOutput, ExplainOutput, DocReference } from "../../types.js";
export const luaPlugin: LanguagePlugin = {
  id: "lua", name: "Lua", version: "1.0.0", fileExtensions: [".lua"], capabilities: ["lint", "explain", "docs", "fixes", "patterns"],
  async lint(code: string, fileName?: string): Promise<LintOutput> {
    return { language: "lua", fileName, results: [], summary: { errors: 0, warnings: 0, info: 0 } };
  },
  async explain(code: string): Promise<ExplainOutput> {
    return { language: "lua", summary: "Lua script source.", explanations: [], docReferences: [{ title: "Lua Reference Manual", url: "https://www.lua.org/manual/5.4/", summary: "Lua 5.4 reference." }] };
  },
  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [{ title: "Lua Reference Manual", url: "https://www.lua.org/manual/5.4/", summary: "Lua documentation." }];
  },
};
export default luaPlugin;
