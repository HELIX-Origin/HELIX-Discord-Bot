import { describe, it, expect } from 'vitest';
import { tokenize, checkBalancedDelimiters, extractDeclarations } from '../../../../HELIX/src/plugins/sdk/ast-parser.js';
import { codeSamples } from '../../../fixtures/code-samples.js';

describe('ast-parser — tokenize', () => {
  it('produces typed tokens with positions', () => {
    const tokens = tokenize('const x = 42;');
    const keywords = tokens.filter((t) => t.type === 'keyword');
    const numbers = tokens.filter((t) => t.type === 'number');
    expect(keywords.some((t) => t.value === 'const')).toBe(true);
    expect(numbers.some((t) => t.value === '42')).toBe(true);
    const constTok = tokens.find((t) => t.value === 'const')!;
    expect(constTok.line).toBe(1);
    expect(constTok.column).toBeGreaterThan(0);
  });

  it('classifies strings, comments, and punctuation', () => {
    const tokens = tokenize('// note\nconst s = "hi";\n');
    expect(tokens.some((t) => t.type === 'comment' && t.value.startsWith('// note'))).toBe(true);
    expect(tokens.some((t) => t.type === 'string' && t.value === '"hi"')).toBe(true);
    expect(tokens.some((t) => t.type === 'punctuation' && t.value === ';')).toBe(true);
  });

  it('tracks multi-line positions', () => {
    const tokens = tokenize('let a;\nlet b;');
    const bTok = tokens.find((t) => t.value === 'b')!;
    expect(bTok.line).toBe(2);
  });
});

describe('ast-parser — checkBalancedDelimiters', () => {
  it('accepts balanced code', () => {
    expect(checkBalancedDelimiters(codeSamples.typescript.code).balanced).toBe(true);
    expect(checkBalancedDelimiters('f([1,2], {a: (b) => b})').balanced).toBe(true);
  });

  it('ignores delimiters inside strings and comments', () => {
    expect(checkBalancedDelimiters('const s = "}" ; // {').balanced).toBe(true);
  });

  it('reports an unclosed delimiter with its opening position', () => {
    const res = checkBalancedDelimiters('const x = {');
    expect(res.balanced).toBe(false);
    expect(res.error).toContain('Unclosed');
  });

  it('reports an unmatched closing delimiter', () => {
    const res = checkBalancedDelimiters('(x }');
    expect(res.balanced).toBe(false);
    expect(res.error).toContain('Mismatched delimiter');
  });

  it('reports a stray closing delimiter', () => {
    const res = checkBalancedDelimiters(')');
    expect(res.balanced).toBe(false);
    expect(res.error).toContain('Unmatched closing delimiter');
  });
});

describe('ast-parser — extractDeclarations', () => {
  it('extracts TypeScript functions, classes, and interfaces', () => {
    const decls = extractDeclarations(codeSamples.typescript.code);
    const getUser = decls.find((d) => d.name === 'getUser');
    expect(getUser).toBeDefined();
    expect(getUser?.kind).toBe('function');
    expect(getUser?.export).toBe(true);
    expect(getUser?.async).toBe(true);
    expect(decls.some((d) => d.kind === 'interface' && d.name === 'User' && d.export)).toBe(true);
  });

  it('extracts Python and Go declarations', () => {
    const py = extractDeclarations(codeSamples.python.code);
    expect(py.some((d) => d.kind === 'function' && d.name === 'load_config')).toBe(true);

    const go = extractDeclarations(codeSamples.go.code);
    expect(go.some((d) => d.kind === 'function' && d.name === 'main' && d.export)).toBe(false);
  });

  it('extracts Rust structs and enums', () => {
    const rs = extractDeclarations(codeSamples.rust.code);
    expect(rs.some((d) => d.kind === 'struct' && d.name === 'User' && d.export)).toBe(true);
  });
});