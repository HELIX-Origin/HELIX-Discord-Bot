import { describe, it, expect } from 'vitest';
import { refactorCode, TRANSFORM_RULES } from '../../../../HELIX/src/plugins/sdk/code-transformer.js';

describe('code-transformer — built-in rules', () => {
  it('exposes a prioritized rule set', () => {
    expect(TRANSFORM_RULES.length).toBeGreaterThanOrEqual(5);
    expect(TRANSFORM_RULES[0].id).toBe('modernize-var');
  });

  it('modernizes var declarations to const', () => {
    const out = refactorCode('var count = 1;\nvar name = "x";');
    expect(out.refactoredCode).toContain('const count = 1;');
    expect(out.refactoredCode).toContain('const name = "x";');
    expect(out.transformations.some((t) => t.includes('var'))).toBe(true);
    expect(out.diffSummary).toContain('transformation(s)');
  });

  it('removes standalone debugger statements', () => {
    const out = refactorCode('function a() {\n  debugger;\n  return 1;\n}');
    expect(out.refactoredCode).not.toContain('debugger;');
    expect(out.transformations.some((t) => t.includes('debugger'))).toBe(true);
  });

  it('reports no-op runs for modern code', () => {
    const out = refactorCode('const fn = () => 1;\n');
    expect(out.refactoredCode).toBe('const fn = () => 1;\n');
    expect(out.transformations).toEqual(['No refactoring needed.']);
    expect(out.diffSummary).toContain('already modern');
  });

  it('supports running a single rule by id', () => {
    const out = refactorCode('var x = 1;', 'typescript', 'modernize-var');
    expect(out.refactoredCode).toBe('const x = 1;');
    expect(out.transformations).toHaveLength(1);

    const noop = refactorCode('var x = 1;', 'typescript', 'remove-debugger');
    expect(noop.transformations).toEqual(['No refactoring needed.']);
    expect(noop.originalCode).toBe(noop.refactoredCode);
  });

  it('chains rule application across variables and strings', () => {
    const out = refactorCode('var message = "Hello" + name + "!";');
    expect(out.refactoredCode).toContain('const message =');
    expect(out.refactoredCode).toContain('`Hello${name}!`');
  });

  it('records language metadata on the result', () => {
    const out = refactorCode('const a = 1;', 'go');
    expect(out.language).toBe('go');
  });
});