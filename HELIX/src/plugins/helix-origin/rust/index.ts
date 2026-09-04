import type { LanguagePlugin, LintOutput, LintResult, ExplainOutput, CodeExplanation, DocReference } from "../../types.js";

const RUST_DOCS: Record<string, DocReference> = {
  ownership: {
    title: "Understanding Ownership in Rust",
    url: "https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html",
    summary: "Rust ownership rules: each value has an owner, only one owner at a time, and value is dropped when owner goes out of scope.",
    codeExamples: ["let s1 = String::from(\"hello\");\nlet s2 = s1; // s1 moved to s2"],
  },
  borrowing: {
    title: "References and Borrowing",
    url: "https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html",
    summary: "Immutable references (&T) vs mutable references (&mut T), aliasing XOR mutability rules.",
    codeExamples: ["fn calculate_length(s: &String) -> usize { s.len() }"],
  },
  lifetimes: {
    title: "Validating References with Lifetimes",
    url: "https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html",
    summary: "Generic lifetime parameters ('a) ensuring references remain valid for as long as needed.",
    codeExamples: ["fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {\n    if x.len() > y.len() { x } else { y }\n}"],
  },
};

export const rustPlugin: LanguagePlugin = {
  id: "rust",
  name: "Rust",
  version: "1.0.0",
  fileExtensions: [".rs"],
  capabilities: ["lint", "explain", "docs", "fixes", "patterns", "debug", "generate", "refactor", "inspect"],

  async lint(code: string, fileName?: string): Promise<LintOutput> {
    const results: LintResult[] = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // Check for unwrap() in production code
      if (/\.unwrap\(\)/.test(line)) {
        results.push({
          line: lineNum,
          column: line.indexOf(".unwrap()") + 1,
          severity: "warning",
          code: "RUST-UNWRAP",
          message: "Avoid using .unwrap() in production code. Use '?' operator or pattern match with match/if let.",
          docLink: "https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html",
        });
      }

      // Check for unsafe blocks
      if (/\bunsafe\s*\{/.test(trimmed)) {
        results.push({
          line: lineNum,
          column: line.indexOf("unsafe") + 1,
          severity: "warning",
          code: "RUST-UNSAFE-BLOCK",
          message: "Unsafe block detected. Ensure memory safety guarantees and document invariant assumptions.",
          docLink: "https://doc.rust-lang.org/book/ch19-01-unsafe-rust.html",
        });
      }
    });

    return {
      language: "rust",
      fileName,
      results,
      summary: {
        errors: results.filter(r => r.severity === "error").length,
        warnings: results.filter(r => r.severity === "warning").length,
        info: results.filter(r => r.severity === "info").length,
      },
    };
  },

  async explain(code: string): Promise<ExplainOutput> {
    const lines = code.split(/\r?\n/);
    const explanations: CodeExplanation[] = lines.map((line, idx) => {
      const trimmed = line.trim();
      let text = "Rust statement.";
      if (/^fn\s+/.test(trimmed) || /^pub\s+fn\s+/.test(trimmed)) text = "Function definition with explicit types.";
      else if (/^struct\s+|^pub\s+struct\s+/.test(trimmed)) text = "Struct type declaration.";
      else if (/^enum\s+|^pub\s+enum\s+/.test(trimmed)) text = "Enum algebraic data type declaration.";
      else if (/^impl\b/.test(trimmed)) text = "Implementation block for struct/trait.";
      else if (/^use\s+/.test(trimmed)) text = "Module / crate import.";
      return { line: idx + 1, code: trimmed, explanation: text };
    }).filter(e => e.code.length > 0);

    return {
      language: "rust",
      summary: `Rust source containing ${lines.length} lines.`,
      explanations,
      docReferences: [RUST_DOCS.ownership, RUST_DOCS.borrowing],
    };
  },

  async getDocumentation(topic: string): Promise<DocReference[]> {
    const lower = topic.toLowerCase();
    const matches = Object.values(RUST_DOCS).filter(d => d.title.toLowerCase().includes(lower) || d.summary.toLowerCase().includes(lower));
    return matches.length > 0 ? matches : [RUST_DOCS.ownership];
  },

  async debug(errorLog: string, codeContext?: string): Promise<any> {
    const { diagnoseError } = await import("../../sdk/stack-trace-parser.js");
    return diagnoseError(errorLog, codeContext);
  },

  async generate(type: string, name: string, options?: Record<string, any>): Promise<any> {
    const { buildSnippet } = await import("../../sdk/snippet-builder.js");
    return buildSnippet("rust", type, name, options);
  },

  async refactor(code: string, rule?: string): Promise<any> {
    const { refactorCode } = await import("../../sdk/code-transformer.js");
    return refactorCode(code, "rust", rule);
  },

  async inspect(code: string): Promise<any> {
    const { scanSecurity } = await import("../../sdk/security-scanner.js");
    return scanSecurity(code, "rust");
  },
};

export default rustPlugin;
