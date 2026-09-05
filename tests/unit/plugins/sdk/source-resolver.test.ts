import { describe, it, expect } from 'vitest';
import {
  normalizeLanguage,
  detectLanguageFromPath,
  inferLanguageFromSyntax,
  normalizeRemoteUrl,
  parseMarkdownCodeBlock,
  resolveSourceCode,
  fetchRemoteCode,
} from '../../../../HELIX/src/plugins/sdk/source-resolver.js';
import { getPluginByExtension } from '../../../../HELIX/src/plugins/registry.js';
import { codeSamples } from '../../../fixtures/code-samples.js';

describe('source-resolver — normalizeLanguage', () => {
  it('maps common extensions without plugins loaded', () => {
    expect(normalizeLanguage('ts')).toBe('typescript');
    expect(normalizeLanguage('py')).toBe('python');
    expect(normalizeLanguage('rs')).toBe('rust');
    expect(normalizeLanguage('go')).toBe('go');
  });

  it('strips leading dots from extension aliases', () => {
    expect(normalizeLanguage('.js')).toBe('javascript');
  });

  it('returns the cleaned input when unknown', () => {
    expect(normalizeLanguage('  COBOL ')).toBe('cobol');
    expect(normalizeLanguage(undefined)).toBeUndefined();
  });

  it('delegates to the registry when plugins are present', () => {
    expect(getPluginByExtension('.ts')).toBeNull();
  });
});

describe('source-resolver — language detection', () => {
  it('detects by file extension via fallback map', () => {
    expect(detectLanguageFromPath('src/service.py')).toBe('python');
    expect(detectLanguageFromPath('main.go')).toBe('go');
    expect(detectLanguageFromPath('src/App.tsx')).toBe('typescript');
  });

  it('ignores query strings and fragments', () => {
    expect(detectLanguageFromPath('a/b.ts?v=1#frag')).toBe('typescript');
  });

  it('returns undefined for pathless extensions', () => {
    expect(detectLanguageFromPath('no-extension')).toBeUndefined();
  });

  it('infers languages from syntax signatures', () => {
    expect(inferLanguageFromSyntax(codeSamples.typescript.code)).toBe('typescript');
    expect(inferLanguageFromSyntax(codeSamples.python.code)).toBe('python');
    expect(inferLanguageFromSyntax(codeSamples.rust.code)).toBe('rust');
    expect(inferLanguageFromSyntax(codeSamples.go.code)).toBe('go');
    expect(inferLanguageFromSyntax(codeSamples.java.code)).toBe('java');
    expect(inferLanguageFromSyntax('Plain prose with no code markers')).toBe('text');
    expect(inferLanguageFromSyntax('{"a": 1}')).toBe('json');
  });
});

describe('source-resolver — remote URL normalization', () => {
  it('converts GitHub blob URLs to raw content URLs', () => {
    const res = normalizeRemoteUrl('https://github.com/HELIX-Origin/HELIX-Discord-Bot/blob/main/src/api.ts');
    expect(res?.origin).toBe('github');
    expect(res?.url).toBe('https://raw.githubusercontent.com/HELIX-Origin/HELIX-Discord-Bot/main/src/api.ts');
    expect(res?.label).toContain('HELIX-Origin/HELIX-Discord-Bot');
  });

  it('passes through raw GitHub URLs', () => {
    const url = 'https://raw.githubusercontent.com/owner/repo/main/a.py';
    const res = normalizeRemoteUrl(url);
    expect(res?.url).toBe(url);
    expect(res?.origin).toBe('github');
  });

  it('converts gist URLs to raw gist content', () => {
    const res = normalizeRemoteUrl('https://gist.github.com/jane/a1b2c3d4e5f6a7b8c9d0');
    expect(res?.origin).toBe('gist');
    expect(res?.url).toBe('https://gist.githubusercontent.com/jane/a1b2c3d4e5f6a7b8c9d0/raw');
  });

  it('falls back to a generic URL label for http(s) endpoints', () => {
    const res = normalizeRemoteUrl('https://paste.example.com/code.txt');
    expect(res?.origin).toBe('url');
    expect(res?.url).toBe('https://paste.example.com/code.txt');
    expect(res?.language).toBeUndefined();
  });

  it('returns null for non-URL input', () => {
    expect(normalizeRemoteUrl('not a url')).toBeNull();
  });
});

describe('source-resolver — markdown code blocks', () => {
  it('parses fenced blocks with a language tag', () => {
    const parsed = parseMarkdownCodeBlock('```ts\nconst x: number = 1;\n```');
    expect(parsed.language).toBe('typescript');
    expect(parsed.code).toBe('const x: number = 1;');
  });

  it('parses blocks embedded in larger messages', () => {
    const parsed = parseMarkdownCodeBlock('here you go:\n```py\nx = 1\n```\nbye');
    expect(parsed.language).toBe('python');
  });

  it('parses inline backtick snippets', () => {
    expect(parseMarkdownCodeBlock('`console.log(1)`').code).toBe('console.log(1)');
  });

  it('treats plain input as trimmed code', () => {
    expect(parseMarkdownCodeBlock('  hello   ').code).toBe('hello');
  });
});

describe('source-resolver — resolveSourceCode (offline paths only)', () => {
  it('resolves pasted code with a detected language', async () => {
    const resolved = await resolveSourceCode({ input: codeSamples.python.code });
    expect(resolved.origin).toBe('pasted');
    expect(resolved.sourceName).toBe('Pasted Code');
    expect(resolved.language).toBe('python');
    expect(resolved.sizeBytes).toBe(Buffer.byteLength(codeSamples.python.code, 'utf8'));
  });

  it('honors an explicit language override', async () => {
    const resolved = await resolveSourceCode({ input: 'print("hi")', language: 'python' });
    expect(resolved.language).toBe('python');
  });

  it('resolves markdown code blocks and reports their language', async () => {
    const resolved = await resolveSourceCode({ input: '```rust\nfn main() {}\n```' });
    expect(resolved.origin).toBe('pasted');
    expect(resolved.language).toBe('rust');
  });

  it('rejects remote URLs asynchronously with an explicit language override', async () => {
    const resolved = await resolveSourceCode({
      input: 'https://localhost:1/nothing.js',
      language: 'javascript',
    }).catch(() => null);
    expect(resolved).toBeNull();
  });
});

describe('source-resolver — fetch guards', () => {
  it('propagates fetch failures instead of crashing the resolver', async () => {
    await expect(fetchRemoteCode('https://localhost:1/x.js')).rejects.toThrow();
  });
});