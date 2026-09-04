/**
 * src/plugins/types.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Core type definitions for the HELIX Language Plugin System.
 *
 * Every language plugin implements LanguagePlugin. The bot discovers plugins
 * via config.json repos, validates their manifests, and calls these methods
 * for linting, explanation, and documentation.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Severity levels for lint diagnostics. */
export type Severity = 'error' | 'warning' | 'info';

/** Capabilities a plugin can declare. */
export type PluginCapability = 'lint' | 'explain' | 'fixes' | 'docs' | 'format' | 'patterns';

/** A single lint diagnostic returned by a plugin. */
export interface LintResult {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: Severity;
  code: string;
  message: string;
  fix?: CodeFix;
  docLink?: string;
}

/** A suggested fix for a lint diagnostic. */
export interface CodeFix {
  description: string;
  replacement: string;
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
}

/** A reference to official documentation for a topic. */
export interface DocReference {
  title: string;
  url: string;
  summary: string;
  codeExamples?: string[];
}

/** A line-by-line explanation of code. */
export interface CodeExplanation {
  line: number;
  code: string;
  explanation: string;
  docLinks?: string[];
}

/** A common pattern or anti-pattern for a language. */
export interface CodePattern {
  name: string;
  description: string;
  good: boolean;
  code: string;
  docLink?: string;
}

/** Result of linting a code snippet. */
export interface LintOutput {
  language: string;
  fileName?: string;
  results: LintResult[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/** Result of explaining a code snippet. */
export interface ExplainOutput {
  language: string;
  summary: string;
  explanations: CodeExplanation[];
  docReferences: DocReference[];
}

/**
 * The interface every language plugin must implement.
 * Plugin files export a const that satisfies this interface.
 */
export interface LanguagePlugin {
  /** Unique identifier (e.g. "typescript", "python"). */
  readonly id: string;

  /** Human-readable name (e.g. "TypeScript"). */
  readonly name: string;

  /** Plugin version. */
  readonly version: string;

  /** File extensions this plugin handles (e.g. [".ts", ".tsx"]). */
  readonly fileExtensions: string[];

  /** Capabilities this plugin provides. */
  readonly capabilities: PluginCapability[];

  /**
   * Lint code and return diagnostics.
   * @param code     The source code to lint.
   * @param fileName Optional file name for context.
   */
  lint(code: string, fileName?: string): Promise<LintOutput>;

  /**
   * Explain code line-by-line using documentation cross-reference.
   * @param code The source code to explain.
   */
  explain(code: string): Promise<ExplainOutput>;

  /**
   * Get official documentation references for a topic.
   * @param topic The topic to look up (e.g. "generic constraints", "list comprehension").
   */
  getDocumentation(topic: string): Promise<DocReference[]>;

  /**
   * Suggest auto-fixes for lint errors.
   * @param errors Lint results to generate fixes for.
   */
  suggestFixes?(errors: LintResult[]): Promise<CodeFix[]>;

  /**
   * Format code (optional).
   * @param code The source code to format.
   */
  format?(code: string): Promise<string>;

  /**
   * Get common patterns and anti-patterns (optional).
   */
  getPatterns?(): Promise<CodePattern[]>;
}
