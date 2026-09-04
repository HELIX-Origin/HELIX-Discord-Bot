import type {
  LanguagePlugin,
  LintOutput,
  LintResult,
  ExplainOutput,
  CodeExplanation,
  DocReference,
  CodeFix,
  CodePattern,
} from "../../types.js";

const TS_DOCS: Record<string, DocReference> = {
  types: {
    title: "TypeScript Everyday Types",
    url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
    summary: "Primitive types (string, number, boolean), arrays, any, and type annotations for variables and functions.",
    codeExamples: [
      "let count: number = 42;",
      "function greet(name: string): string { return `Hello ${name}`; }",
    ],
  },
  interfaces: {
    title: "TypeScript Interfaces",
    url: "https://www.typescriptlang.org/docs/handbook/2/objects.html",
    summary: "Object types, property modifiers (optional ?, readonly), extending interfaces, and index signatures.",
    codeExamples: [
      "interface User {\n  id: string;\n  name: string;\n  age?: number;\n  readonly created: Date;\n}",
    ],
  },
  generics: {
    title: "TypeScript Generics",
    url: "https://www.typescriptlang.org/docs/handbook/2/generics.html",
    summary: "Generic functions, interfaces, classes, generic constraints (extends), and keyof type operators.",
    codeExamples: [
      "function identity<T>(arg: T): T { return arg; }",
      "interface KeyValuePair<K, V> { key: K; value: V; }",
    ],
  },
  unions: {
    title: "Union and Intersection Types",
    url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
    summary: "Narrowing types using typeof, instanceof, in operator, equality narrowing, and discriminated unions.",
    codeExamples: [
      "type Status = 'open' | 'closed' | 'pending';",
      "type AdminUser = User & { permissions: string[] };",
    ],
  },
  utility: {
    title: "TypeScript Utility Types",
    url: "https://www.typescriptlang.org/docs/handbook/utility-types.html",
    summary: "Standard utility types: Partial<T>, Required<T>, Readonly<T>, Record<K, T>, Pick<T, K>, Omit<T, K>, ReturnType<T>.",
    codeExamples: [
      "type PartialUser = Partial<User>;",
      "type UserSummary = Pick<User, 'id' | 'name'>;",
    ],
  },
};

export const typescriptPlugin: LanguagePlugin = {
  id: "typescript",
  name: "TypeScript",
  version: "1.0.0",
  fileExtensions: [".ts", ".tsx"],
  capabilities: ["lint", "explain", "docs", "fixes", "patterns"],

  async lint(code: string, fileName?: string): Promise<LintOutput> {
    const results: LintResult[] = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Check for explicit 'any'
      if (/: any\b/.test(line) || /<any>/.test(line) || /\bas any\b/.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf("any") + 1,
          severity: "warning",
          code: "TS-NO-EXPLICIT-ANY",
          message: "Unexpected 'any' type. Consider using 'unknown' or a specific interface/type.",
          docLink: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any",
          fix: {
            description: "Replace 'any' with 'unknown'",
            replacement: line.replace(/\bany\b/, "unknown"),
            startLine: lineNum,
            startCol: line.indexOf("any") + 1,
            endLine: lineNum,
            endCol: line.indexOf("any") + 4,
          },
        });
      }

      // Check for 'var' usage
      if (/\bvar\s+[a-zA-Z_$]/.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf("var") + 1,
          severity: "error",
          code: "TS-NO-VAR",
          message: "Use 'const' or 'let' instead of 'var'.",
          docLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let",
          fix: {
            description: "Convert 'var' to 'const'",
            replacement: line.replace(/\bvar\b/, "const"),
            startLine: lineNum,
            startCol: line.indexOf("var") + 1,
            endLine: lineNum,
            endCol: line.indexOf("var") + 4,
          },
        });
      }

      // Check for loose equality == or !=
      if (/[^!=]==[^=]/.test(line) || /!=[^=]/.test(line)) {
        results.push({
          line: lineNum,
          column: line.search(/==|!=/) + 1,
          severity: "warning",
          code: "TS-STRICT-EQUALITY",
          message: "Expected '===' or '!==' instead of loose equality.",
          docLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality",
        });
      }

      // Check for eval()
      if (/\beval\s*\(/.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf("eval") + 1,
          severity: "error",
          code: "TS-NO-EVAL",
          message: "Direct 'eval()' is forbidden due to critical security risks.",
          docLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!",
        });
      }

      // Check for empty block statement
      if (/\{\s*\}/.test(trimmed) && !/^\s*(interface|type|class)\b/.test(trimmed)) {
        results.push({
          line: lineNum,
          column: line.indexOf("{") + 1,
          severity: "info",
          code: "TS-NO-EMPTY-BLOCK",
          message: "Empty block statement detected. Add implementation or comment.",
        });
      }
    });

    return {
      language: "typescript",
      fileName,
      results,
      summary: {
        errors: results.filter((r) => r.severity === "error").length,
        warnings: results.filter((r) => r.severity === "warning").length,
        info: results.filter((r) => r.severity === "info").length,
      },
    };
  },

  async explain(code: string): Promise<ExplainOutput> {
    const lines = code.split(/\r?\n/);
    const explanations: CodeExplanation[] = [];
    const docReferences: DocReference[] = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      if (!trimmed) return;

      let explanation = "Statement execution.";
      const docLinks: string[] = [];

      if (/^import\s+/.test(trimmed)) {
        explanation = "Imports module dependencies or TypeScript type definitions.";
        docLinks.push("https://www.typescriptlang.org/docs/handbook/2/modules.html");
      } else if (/^(interface|type)\s+/.test(trimmed)) {
        explanation = "Declares a TypeScript type or object interface contract.";
        docLinks.push(TS_DOCS.interfaces.url);
      } else if (/^(const|let)\s+/.test(trimmed)) {
        explanation = "Defines a scoped variable binding with optional type annotation.";
      } else if (/^(async\s+)?function\b/.test(trimmed) || /=>\s*\{?/.test(trimmed)) {
        explanation = "Function definition with typed parameters and return value.";
      } else if (/^class\s+/.test(trimmed)) {
        explanation = "Class definition with member fields, constructor, or methods.";
        docLinks.push("https://www.typescriptlang.org/docs/handbook/2/classes.html");
      } else if (/^return\b/.test(trimmed)) {
        explanation = "Returns value from function execution.";
      }

      explanations.push({ line: lineNum, code: trimmed, explanation, docLinks });
    });

    if (code.includes("interface") || code.includes("type")) {
      docReferences.push(TS_DOCS.interfaces);
    }
    if (code.includes("<") && code.includes(">")) {
      docReferences.push(TS_DOCS.generics);
    }

    return {
      language: "typescript",
      summary: `TypeScript source with ${lines.length} lines of structured static typing.`,
      explanations,
      docReferences,
    };
  },

  async getDocumentation(topic: string): Promise<DocReference[]> {
    const lower = topic.toLowerCase();
    const matches: DocReference[] = [];

    for (const [key, doc] of Object.entries(TS_DOCS)) {
      if (key.includes(lower) || doc.title.toLowerCase().includes(lower) || doc.summary.toLowerCase().includes(lower)) {
        matches.push(doc);
      }
    }

    if (matches.length === 0) {
      matches.push(TS_DOCS.types);
    }

    return matches;
  },

  async suggestFixes(errors: LintResult[]): Promise<CodeFix[]> {
    return errors.filter((e) => e.fix !== undefined).map((e) => e.fix!);
  },

  async getPatterns(): Promise<CodePattern[]> {
    return [
      {
        name: "Type Narrowing with Discriminated Unions",
        description: "Use a shared discriminant literal field to safely narrow union types.",
        good: true,
        code: "type Result = { success: true; data: string } | { success: false; error: Error };\nif (res.success) { console.log(res.data); }",
        docLink: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions",
      },
      {
        name: "Avoid 'any' Casting",
        description: "Avoid casting to 'any' to bypass compiler type checks; use 'unknown' and type guards.",
        good: false,
        code: "const data = (response as any).user;",
      },
    ];
  },
};

export default typescriptPlugin;
