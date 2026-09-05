import { describe, it, expect } from 'vitest';

const PROVIDERS_ENTRY = '../../../../HELIX/src/plugins/sdk/source-providers/index.js';
const RESOLVER_ENTRY = '../../../../HELIX/src/plugins/sdk/source-resolver.js';
const REGISTRY_ENTRY = '../../../../HELIX/src/plugins/registry.js';

describe('SDK entry-order resilience (BUG-009)', () => {
  it('importing source-providers/index first never throws (cycle edge)', async () => {
    const providers = await import(PROVIDERS_ENTRY);
    expect(typeof providers.registerBuiltInSourceProviders).toBe('function');
    expect(providers.builtInSourceProviders).toHaveLength(4);
  });

  it('source-resolver still auto-registers built-ins after provider-first entry', async () => {
    await import(PROVIDERS_ENTRY);
    const resolver = await import(RESOLVER_ENTRY);
    expect(typeof resolver.detectLanguageFromPath).toBe('function');

    const { getSourceProviders, findSourceProviderForUrl } = await import(REGISTRY_ENTRY);
    const ids = getSourceProviders().map((p: { id: string }) => p.id);
    expect(ids).toEqual(expect.arrayContaining(['github', 'gitlab', 'bitbucket', 'pastebin']));

    const resolved = findSourceProviderForUrl(
      'https://github.com/a/b/blob/main/src/index.ts'
    );
    expect(resolved?.rawUrl).toBe(
      'https://raw.githubusercontent.com/a/b/main/src/index.ts'
    );
  });

  it('source-resolver-first entry is unaffected', async () => {
    await import(RESOLVER_ENTRY);
    const { getSourceProviders } = await import(REGISTRY_ENTRY);
    expect(getSourceProviders().map((p: { id: string }) => p.id)).toContain('github');
  });
});