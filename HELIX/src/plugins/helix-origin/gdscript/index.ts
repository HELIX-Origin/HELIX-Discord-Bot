import type { LanguagePlugin, LintOutput, LintResult, ExplainOutput, DocReference } from "../../types.js";

const GD_DOCS: Record<string, DocReference> = {
  nodes: {
    title: "Nodes and Scene Tree in Godot",
    url: "https://docs.godotengine.org/en/stable/tutorials/scripting/nodes_and_scene_instances.html",
    summary: "Godot node lifecycle: _ready(), _process(), _physics_process(), and node tree traversal.",
    codeExamples: ["func _ready() -> void:\n    print(\"Ready!\")"],
  },
  signals: {
    title: "Godot Signals",
    url: "https://docs.godotengine.org/en/stable/tutorials/scripting/signals.html",
    summary: "Observer pattern implementation for emitting and connecting game events.",
    codeExamples: ["signal health_changed(new_health)\n\nfunc take_damage(amount: int) -> void:\n    health_changed.emit(current_health)"],
  },
};

export const gdscriptPlugin: LanguagePlugin = {
  id: "gdscript",
  name: "GDScript",
  version: "1.0.0",
  fileExtensions: [".gd"],
  capabilities: ["lint", "explain", "docs", "fixes", "patterns"],

  async lint(code: string, fileName?: string): Promise<LintOutput> {
    const results: LintResult[] = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();
      if (/^var\s+\w+\s*=/.test(trimmed) && !/:=/.test(trimmed) && !/:\s*\w+/.test(trimmed)) {
        results.push({
          line: lineNum,
          column: line.indexOf("var") + 1,
          severity: "info",
          code: "GD-STATIC-TYPING",
          message: "Consider using static typing (:= or var name: Type) for performance and autocomplete.",
          docLink: "https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/static_typing.html",
        });
      }
    });

    return {
      language: "gdscript",
      fileName,
      results,
      summary: { errors: 0, warnings: 0, info: results.length },
    };
  },

  async explain(code: string): Promise<ExplainOutput> {
    const lines = code.split(/\r?\n/);
    return {
      language: "gdscript",
      summary: `Godot 4 GDScript containing ${lines.length} lines.`,
      explanations: lines.map((l, i) => ({ line: i + 1, code: l.trim(), explanation: "GDScript node logic." })).filter(e => e.code.length > 0),
      docReferences: [GD_DOCS.nodes, GD_DOCS.signals],
    };
  },

  async getDocumentation(topic: string): Promise<DocReference[]> {
    return [GD_DOCS.nodes, GD_DOCS.signals];
  },
};

export default gdscriptPlugin;
