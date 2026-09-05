import { describe, it, expect } from 'vitest';
import type { SourceProvider } from '../../../../HELIX/src/plugins/types.js';
import '../../../../HELIX/src/plugins/sdk/source-resolver.js';
import {
  getSourceProviders,
  findSourceProviderForUrl,
} from '../../../../HELIX/src/plugins/registry.js';

function provider(id: string): SourceProvider {
  const p = getSourceProviders().find((sp) => sp.id === id);
  if (!p) throw new Error(`source provider '${id}' is not registered`);
  return p;
}

describe('source-providers — built-in registration', () => {
  it('registers the four built-in providers through source-resolver', () => {
    const ids = getSourceProviders().map((p) => p.id);
    expect(ids).toContain('github');
    expect(ids).toContain('gitlab');
    expect(ids).toContain('bitbucket');
    expect(ids).toContain('pastebin');
    expect(ids[0]).toBe('github');
  });

  it('exposes providers with unique ids and the expected surface', () => {
    const providers = getSourceProviders();
    const ids = providers.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(provider('gitlab').name).toBe('GitLab');
    expect(provider('bitbucket').name).toBe('Bitbucket');
    expect(provider('pastebin').name).toBe('Pastebin');
    for (const p of providers) {
      expect(typeof p.matches).toBe('function');
      expect(typeof p.resolve).toBe('function');
    }
  });
});

describe('source-providers — github', () => {
  const cases: Array<{ url: string; origin: string; expectsRawContain: string }> = [
    {
      url: 'https://github.com/a/b/blob/main/src/index.ts',
      origin: 'github',
      expectsRawContain: 'https://raw.githubusercontent.com/a/b/main/src/index.ts',
    },
    {
      url: 'https://gist.github.com/jane/a1b2c3d4e5f6a7b8c9d0',
      origin: 'gist',
      expectsRawContain: 'https://gist.githubusercontent.com/jane/a1b2c3d4e5f6a7b8c9d0/raw',
    },
    {
      url: 'https://raw.githubusercontent.com/a/b/main/README.md',
      origin: 'github',
      expectsRawContain: 'raw.githubusercontent.com/a/b/main/README.md',
    },
  ];

  it('rejects URLs that are not GitHub', () => {
    const parsed = new URL('https://example.github.net/x');
    expect(provider('github').matches('https://example.github.net/x', parsed)).toBe(false);
  });

  it('resolves repo, gist, and raw URLs', () => {
    for (const c of cases) {
      const parsed = new URL(c.url);
      expect(provider('github').matches(c.url, parsed)).toBe(true);
      const res = provider('github').resolve(c.url, parsed);
      expect(res?.origin).toBe(c.origin);
      expect(res?.rawUrl).toContain(c.expectsRawContain);
    }
  });

  it('routes end-to-end through the registry', () => {
    const resolved = findSourceProviderForUrl(cases[0].url);
    expect(resolved?.rawUrl).toBe(cases[0].expectsRawContain);
    expect(resolved?.origin).toBe('github');
    expect(resolved?.label).toContain('a/b');
  });
});