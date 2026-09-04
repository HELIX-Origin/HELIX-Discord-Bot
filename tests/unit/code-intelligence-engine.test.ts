import { describe, it, expect } from 'vitest';
import {
  tokenize,
  checkBalancedDelimiters,
  extractDeclarations,
  diagnoseError,
  buildSnippet,
  refactorCode,
  scanSecurity,
} from '../../HELIX/src/plugins/sdk/index.js';

describe('HELIX Code Intelligence Engine (CIE - Zero AI)', () => {
  describe('AST & Lexical Parser', () => {
    it('tokenizes code into keywords, strings, numbers, and identifiers', () => {
      const code = 'const count = 42;\nfunction greet(name) { return "Hello " + name; }';
      const tokens = tokenize(code);

      expect(tokens.length).toBeGreaterThan(5);
      expect(tokens.some((t) => t.type === 'keyword' && t.value === 'const')).toBe(true);
      expect(tokens.some((t) => t.type === 'number' && t.value === '42')).toBe(true);
      expect(tokens.some((t) => t.type === 'string' && t.value === '"Hello "')).toBe(true);
    });

    it('detects balanced and unbalanced delimiters correctly', () => {
      const balanced = 'function test() { const arr = [1, 2, 3]; if (arr.length) { return arr[0]; } }';
      expect(checkBalancedDelimiters(balanced).balanced).toBe(true);

      const unclosed = 'function test() { const arr = [1, 2, 3; }';
      const resultUnclosed = checkBalancedDelimiters(unclosed);
      expect(resultUnclosed.balanced).toBe(false);
      expect(resultUnclosed.error).toBeDefined();

      const mismatched = 'const x = (1 + 2];';
      const resultMismatched = checkBalancedDelimiters(mismatched);
      expect(resultMismatched.balanced).toBe(false);
      expect(resultMismatched.error).toContain('Mismatched delimiter');
    });

    it('extracts top-level declarations across multiple languages', () => {
      const tsCode = 'export function calculateTotal() {}\nexport interface UserConfig {}\nclass AppEngine {}';
      const tsDecls = extractDeclarations(tsCode);
      expect(tsDecls.length).toBe(3);
      expect(tsDecls.map((d) => d.name)).toEqual(['calculateTotal', 'UserConfig', 'AppEngine']);

      const pyCode = 'def process_items():\n    pass\n\nasync def fetch_async():\n    pass';
      const pyDecls = extractDeclarations(pyCode);
      expect(pyDecls.length).toBe(2);
      expect(pyDecls[1].async).toBe(true);
    });
  });

  describe('Stack Trace & Error Diagnostic Engine', () => {
    it('diagnoses V8 TypeError with failing property and recommends optional chaining', () => {
      const stack = `TypeError: Cannot read properties of undefined (reading 'profile')
    at getUserProfile (/app/src/user.ts:42:15)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

      const diag = diagnoseError(stack);
      expect(diag.language).toBe('javascript');
      expect(diag.errorType).toBe('TypeError');
      expect(diag.failingLocation?.line).toBe(42);
      expect(diag.rootCause).toContain('profile');
      expect(diag.suggestedFix).toContain('optional chaining');
      expect(diag.fixCode).toBeDefined();
    });

    it('diagnoses Python AttributeError on NoneType', () => {
      const traceback = `Traceback (most recent call last):
  File "main.py", line 18, in run_task
    result = handler.execute()
AttributeError: 'NoneType' object has no attribute 'execute'`;

      const diag = diagnoseError(traceback);
      expect(diag.language).toBe('python');
      expect(diag.errorType).toBe('AttributeError');
      expect(diag.failingLocation?.line).toBe(18);
      expect(diag.rootCause).toContain('None');
    });

    it('diagnoses Rust compiler error E0382 (use of moved value)', () => {
      const rustError = `error[E0382]: use of moved value: 'data'
 --> src/main.rs:12:18
  |
9 | let data = vec![1, 2, 3];
  |     ---- move occurs because 'data' has type 'Vec<i32>'
10| process(data);
  |         ---- value moved here
11|
12| println!("{:?}", data);
  |                  ^^^^ value borrowed here after move`;

      const diag = diagnoseError(rustError);
      expect(diag.language).toBe('rust');
      expect(diag.errorType).toBe('error[E0382]');
      expect(diag.failingLocation?.line).toBe(12);
      expect(diag.suggestedFix).toContain('clone');
    });

    it('diagnoses Java NullPointerException', () => {
      const javaError = `java.lang.NullPointerException: Cannot invoke "String.length()" because "str" is null
    at com.helix.Service.compute(Service.java:35)
    at com.helix.Application.main(Application.java:12)`;

      const diag = diagnoseError(javaError);
      expect(diag.language).toBe('java');
      expect(diag.errorType).toBe('NullPointerException');
      expect(diag.failingLocation?.line).toBe(35);
    });
  });

  describe('Parameterized Code Generator', () => {
    it('generates TypeScript, Python, Rust, and Go models', () => {
      const tsModel = buildSnippet('typescript', 'model', 'User');
      expect(tsModel.code).toContain('export interface User');
      expect(tsModel.code).toContain('export function isUser');

      const pyModel = buildSnippet('python', 'model', 'Customer');
      expect(pyModel.code).toContain('class Customer(BaseModel):');

      const rsModel = buildSnippet('rust', 'model', 'Order');
      expect(rsModel.code).toContain('pub struct Order');
      expect(rsModel.code).toContain('#[derive(Debug, Clone, Serialize, Deserialize)]');

      const goModel = buildSnippet('go', 'model', 'Product');
      expect(goModel.code).toContain('type Product struct');
    });

    it('generates CRUD routes and test suites', () => {
      const tsRoute = buildSnippet('typescript', 'route', 'Account');
      expect(tsRoute.code).toContain("router.get('/accounts'");

      const tsTest = buildSnippet('typescript', 'test', 'Account');
      expect(tsTest.code).toContain("describe('Account Service'");
    });

    it('generates standard algorithm snippets', () => {
      const debounce = buildSnippet('typescript', 'algorithm', 'debounce', { algo: 'debounce' });
      expect(debounce.code).toContain('export function debounce');

      const binarySearch = buildSnippet('typescript', 'algorithm', 'search', { algo: 'binarySearch' });
      expect(binarySearch.code).toContain('export function binarySearch');
    });
  });

  describe('Code Refactoring Engine', () => {
    it('modernizes legacy var to const', () => {
      const legacy = 'var count = 10;\nvar name = "helix";';
      const output = refactorCode(legacy, 'typescript');

      expect(output.refactoredCode).toContain('const count = 10;');
      expect(output.refactoredCode).toContain('const name = "helix";');
      expect(output.transformations.length).toBeGreaterThan(0);
    });

    it('simplifies guard clauses with optional chaining', () => {
      const code = 'if (user && user.profile) { return user.profile; }';
      const output = refactorCode(code, 'typescript');

      expect(output.refactoredCode).toContain('user?.profile');
    });
  });

  describe('Security & Anti-Pattern Inspector', () => {
    it('detects SQL injection vulnerabilities', () => {
      const vulnerable = 'const query = "SELECT * FROM users WHERE id = " + userId;';
      const audit = scanSecurity(vulnerable, 'javascript');

      expect(audit.findings.some((f) => f.ruleId === 'SEC-001')).toBe(true);
      expect(audit.summary.critical).toBeGreaterThan(0);
      expect(audit.score).toBeLessThan(100);
    });

    it('detects hardcoded secrets and high-entropy API keys', () => {
      const secret = 'const api_key = "AKIAIOSFODNN7EXAMPLE123456";';
      const audit = scanSecurity(secret, 'typescript');

      expect(audit.findings.some((f) => f.ruleId === 'SEC-002')).toBe(true);
    });

    it('detects XSS risks via innerHTML', () => {
      const xss = 'document.getElementById("output").innerHTML = userInput;';
      const audit = scanSecurity(xss, 'javascript');

      expect(audit.findings.some((f) => f.ruleId === 'SEC-003')).toBe(true);
      expect(audit.summary.high).toBeGreaterThan(0);
    });

    it('returns clean score for secure code', () => {
      const clean = 'const safeUser = { id: "1", name: "Safe" };\nconsole.log(safeUser.name);';
      const audit = scanSecurity(clean, 'typescript');

      expect(audit.findings).toHaveLength(0);
      expect(audit.score).toBe(100);
    });
  });
});
