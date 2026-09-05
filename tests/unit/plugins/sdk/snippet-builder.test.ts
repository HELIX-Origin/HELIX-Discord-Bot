import { describe, it, expect } from 'vitest';
import { buildSnippet } from '../../../../HELIX/src/plugins/sdk/snippet-builder.js';

describe('snippet-builder', () => {
  it('generates a TypeScript model interface with type guard', () => {
    const s = buildSnippet('typescript', 'model', 'user');
    expect(s.language).toBe('typescript');
    expect(s.snippetType).toBe('model');
    expect(s.name).toBe('User');
    expect(s.code).toContain('export interface User');
    expect(s.code).toContain('isUser');
  });

  it('generates a Pydantic model for Python', () => {
    const s = buildSnippet('python', 'model', 'user');
    expect(s.language).toBe('python');
    expect(s.code).toContain('class User(BaseModel)');
    expect(s.dependencies).toContain('pydantic');
  });

  it('generates idiomatic models for Rust, Go, and Java', () => {
    const rs = buildSnippet('rust', 'model', 'tokenizer');
    expect(rs.code).toContain('struct Tokenizer');
    expect(rs.dependencies).toContain('serde');

    const go = buildSnippet('go', 'model', 'account');
    expect(go.code).toContain('type Account struct');

    const java = buildSnippet('java', 'model', 'product');
    expect(java.code).toContain('public record Product');
  });

  it('generates route scaffolding per language', () => {
    const ts = buildSnippet('typescript', 'route', 'user');
    expect(ts.snippetType).toBe('route');
    expect(ts.code).toContain("Router();");

    const py = buildSnippet('python', 'route', 'user');
    expect(py.code).toContain('APIRouter');

    const rs = buildSnippet('rust', 'controller', 'user');
    expect(rs.code).toContain('Router::new()');
  });

  it('generates unit test scaffolding', () => {
    const ts = buildSnippet('typescript', 'test', 'user');
    expect(ts.code).toContain("from 'vitest'");

    const py = buildSnippet('python', 'test', 'user');
    expect(py.code).toContain('import pytest');
    expect(py.name).toBe('test_user');
  });

  it('generates algorithms without a per-repo package', () => {
    const debounce = buildSnippet('typescript', 'algorithm', 'utils');
    expect(debounce.name).toBe('debounce');
    expect(debounce.code).toContain('export function debounce');

    const search = buildSnippet('typescript', 'algorithm', 'utils', { algo: 'binarySearch' });
    expect(search.name).toBe('binarySearch');
    expect(search.code).toContain('binarySearch');
  });

  it('defaults unknown snippet types to a model', () => {
    const s = buildSnippet('typescript', 'mystery', 'thing');
    expect(s.snippetType).toBe('model');
  });

  it('fallback generic model covers unsupported languages', () => {
    const s = buildSnippet('cobol', 'model', 'ledger');
    expect(s.language).toBe('cobol');
    expect(s.code).toContain('Ledger');
  });
});