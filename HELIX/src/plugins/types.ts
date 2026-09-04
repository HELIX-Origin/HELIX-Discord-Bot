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
export type PluginCapability =
  | 'lint'
  | 'explain'
  | 'fixes'
  | 'docs'
  | 'format'
  | 'patterns'
  | 'debug'
  | 'generate'
  | 'refactor'
  | 'inspect';

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

/** Result of error diagnosis & stack trace analysis. */
export interface DebugDiagnostic {
  language: string;
  errorType: string;
  errorMessage: string;
  failingLocation?: {
    file?: string;
    line?: number;
    column?: number;
  };
  rootCause: string;
  suggestedFix: string;
  fixCode?: {
    original: string;
    fixed: string;
  };
  docLink?: string;
}

/** Result of code snippet generation. */
export interface SnippetGeneration {
  language: string;
  snippetType: string;
  name: string;
  code: string;
  description: string;
  dependencies?: string[];
}

/** Result of code refactoring. */
export interface RefactorOutput {
  language: string;
  originalCode: string;
  refactoredCode: string;
  transformations: string[];
  diffSummary: string;
}

/** A detected security risk or code smell. */
export interface SecurityFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  ruleId: string;
  title: string;
  description: string;
  line: number;
  snippet: string;
  recommendation: string;
  cwe?: string;
}

/** Result of static security & anti-pattern inspection. */
export interface SecurityAuditResult {
  language: string;
  findings: SecurityFinding[];
  score: number; // 0 - 100
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
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

  /**
   * Diagnose runtime error logs and stack traces (optional).
   */
  debug?(errorLog: string, codeContext?: string): Promise<DebugDiagnostic>;

  /**
   * Generate parameterized code snippets (optional).
   */
  generate?(type: string, name: string, options?: Record<string, any>): Promise<SnippetGeneration>;

  /**
   * Refactor and modernize source code (optional).
   */
  refactor?(code: string, rule?: string): Promise<RefactorOutput>;

  /**
   * Inspect code for security vulnerabilities and anti-patterns (optional).
   */
  inspect?(code: string): Promise<SecurityAuditResult>;

  /**
   * Optional custom source / repository providers contributed by this plugin.
   */
  sourceProviders?: SourceProvider[];
}

/** Origin source type for code ingestion. */
export type SourceOrigin =
  | 'pasted'
  | 'attachment'
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'gist'
  | 'url'
  | string;

/** Result of resolving a URL through a SourceProvider. */
export interface SourceProviderResolution {
  rawUrl: string;
  origin: SourceOrigin;
  label: string;
  language?: string;
}

/** A pluggable source provider for resolving URLs, repositories, or pastebins. */
export interface SourceProvider {
  /** Unique id of the source provider (e.g. "github", "gitlab", "bitbucket", "gitea"). */
  id: string;
  /** Human-readable provider name. */
  name: string;
  /** Tests if this provider can handle the given URL. */
  matches(url: string, parsedUrl: URL): boolean;
  /** Resolves the given URL to raw code content URL, label, and detected language/origin. */
  resolve(url: string, parsedUrl: URL): SourceProviderResolution | null;
}

/** Result of resolving source code from pasted text, attachments, or remote repositories. */
export interface ResolvedSource {
  code: string;
  language?: string;
  sourceName: string;
  origin: SourceOrigin;
  sizeBytes: number;
  url?: string;
}

/** Options for resolving source code across diverse input mediums. */
export interface SourceResolveOptions {
  input?: string;
  language?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  message?: any;
  interaction?: any;
}
