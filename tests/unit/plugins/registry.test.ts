import { describe, it, expect, afterEach } from 'vitest';
import type { LanguagePlugin, SourceProvider } from '../../../HELIX/src/plugins/types.js';
import type { LoadedPlugin } from '../../../HELIX/src/plugins/plugin-loader.js';
import {
  registerPlugin,
  registerPlugins,
  registerSourceProvider,
  unregisterSourceProvider,
  getSourceProviders,
  findSourceProviderForUrl,
  getPlugin,
  getPluginByExtension,
  detectLanguage,
  enablePlugin,
  disablePlugin,
  getAllPlugins,
  getAllPluginIds,
  getEnabledPluginIds,
  isPluginEnabled,
  unregisterPlugin,
  getRegistryStats,
} from '../../../HELIX/src/plugins/registry.js';

const TEST_PLUGIN_IDS: string[] = [];

function makePlugin(id: string, extensions: string[]): LoadedPlugin {
  TEST_PLUGIN_IDS.push(id);
  const instance: LanguagePlugin = {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    version: '1.0.0',
    fileExtensions: extensions,
    capabilities: ['lint'],
    async lint() {
      return { language: id, results: [], summary: { errors: 0, warnings: 0, info: 0 } };
    },
    async explain() {
      return { language: id, summary: 'ok', explanations: [], docReferences: [] };
    },
    async getDocumentation() {
      return [] as any;
    },
  };
  return {
    manifest: {
      id,
      name: instance.name,
      version: '1.0.0',
      description: `Plugin for ${id}`,
      author: 'tester',
      fileExtensions: extensions,
      entry: 'index.ts',
      capabilities: ['lint'],
    },
    instance,
    repoName: 'test-repo',
    repoDir: '/tmp/test-repo',
    pluginDir: `/tmp/test-repo/${id}`,
  };
}

function cleanupRegisteredPlugins(): void {
  for (const id of TEST_PLUGIN_IDS.splice(0)) {
    unregisterPlugin(id);
  }
}

afterEach(() => {
  cleanupRegisteredPlugins();
});

describe('registry — plugin lifecycle', () => {
  it('registers a plugin as enabled by default', () => {
    registerPlugin(makePlugin('alpha', ['.alpha']));
    expect(getAllPluginIds()).toContain('alpha');
    expect(isPluginEnabled('alpha')).toBe(true);
    expect(getRegistryStats()).toEqual({ total: 1, enabled: 1, disabled: 0 });
  });

  it('looks plugins up by id, extension, and auto-detects from paths', () => {
    registerPlugin(makePlugin('beta', ['.beta', '.b']));

    const byExt = getPluginByExtension('.beta');
    expect(byExt?.id).toBe('beta');
    expect(detectLanguage('file.BETA')).toBe(byExt);
    expect(getPlugin('beta')?.id).toBe('beta');

    expect(getPluginByExtension('.missing')).toBeNull();
    expect(detectLanguage('no-extension')).toBeNull();
  });

  it('enable/disable only removes disabled plugins from lookups', () => {
    registerPlugin(makePlugin('gamma', ['.gamma']));
    expect(disablePlugin('gamma')).toBe(true);
    expect(isPluginEnabled('gamma')).toBe(false);
    expect(getPlugin('gamma')).toBeNull();
    expect(getPluginByExtension('.gamma')).toBeNull();
    expect(getEnabledPluginIds()).not.toContain('gamma');
    expect(getRegistryStats().disabled).toBe(1);

    expect(enablePlugin('gamma')).toBe(true);
    expect(getPlugin('gamma')?.id).toBe('gamma');
    expect(getRegistryStats().enabled).toBe(1);

    expect(disablePlugin('never-existed')).toBe(false);
  });

  it('unregisters a plugin and its extension mappings', () => {
    registerPlugin(makePlugin('delta', ['.delta']));
    expect(unregisterPlugin('delta')).toBe(true);
    expect(getAllPluginIds()).not.toContain('delta');
    expect(getPluginByExtension('.delta')).toBeNull();

    expect(unregisterPlugin('already-gone')).toBe(false);
  });

  it('registers multiple plugins via registerPlugins', () => {
    registerPlugins([makePlugin('p1', ['.p1']), makePlugin('p2', ['.p2'])]);
    expect(getAllPlugins()).toHaveLength(2);
    expect(getAllPluginIds().sort()).toEqual(['p1', 'p2']);
  });
});

describe('registry — source providers', () => {
  it('registers, lists, and unregisters providers', () => {
    const provider: SourceProvider = {
      id: 'custom-vcs',
      name: 'Custom VCS',
      matches: (url, parsed) => parsed.hostname.endsWith('vcs.example'),
      resolve: (url) => ({ rawUrl: url, origin: 'url', label: 'custom' }),
    };
    registerSourceProvider(provider);
    expect(getSourceProviders().some((p) => p.id === 'custom-vcs')).toBe(true);
    expect(unregisterSourceProvider('custom-vcs')).toBe(true);
    expect(unregisterSourceProvider('custom-vcs')).toBe(false);
  });

  it('routes matching URLs through registered providers', () => {
    const provider: SourceProvider = {
      id: 'faux-gh',
      name: 'Faux GitHub',
      matches: (_, parsed) => parsed.hostname === 'foo.example',
      resolve: (_url, parsed) => ({
        rawUrl: `https://raw.example${parsed.pathname}`,
        origin: 'github',
        label: `Faux: ${parsed.pathname}`,
      }),
    };
    registerSourceProvider(provider);
    const resolved = findSourceProviderForUrl('https://foo.example/owner/repo/blob/main/a.ts');
    expect(resolved?.rawUrl).toBe('https://raw.example/owner/repo/blob/main/a.ts');
    expect(resolved?.origin).toBe('github');
    unregisterSourceProvider('faux-gh');
  });

  it('returns null for unmatched or malformed URLs', () => {
    expect(findSourceProviderForUrl('https://unknown-host.example/x')).toBeNull();
    expect(findSourceProviderForUrl('not a url')).toBeNull();
  });
});

describe('registry — guild repository scoping', () => {
  it('supports registering and overriding plugins per guild with global fallback', () => {
    const globalPlugin = makePlugin('custom-lang', ['.custom']);
    registerPlugin(globalPlugin, null);

    const guildPlugin = makePlugin('custom-lang', ['.custom']);
    (guildPlugin.instance as any).version = '2.0.0-guild';
    registerPlugin(guildPlugin, 'guild-42');

    // Guild-scoped lookup gets guild override
    const inGuild = getPlugin('custom-lang', 'guild-42');
    expect(inGuild?.version).toBe('2.0.0-guild');

    // Other guild gets global version
    const inOtherGuild = getPlugin('custom-lang', 'guild-99');
    expect(inOtherGuild?.version).toBe('1.0.0');

    // Extension lookup respects guild scope
    expect(getPluginByExtension('.custom', 'guild-42')?.version).toBe('2.0.0-guild');
    expect(getPluginByExtension('.custom', 'guild-99')?.version).toBe('1.0.0');

    // Disabling in guild disables only in that guild
    disablePlugin('custom-lang', 'guild-42');
    expect(getPlugin('custom-lang', 'guild-42')).toBeNull();
    expect(getPlugin('custom-lang', 'guild-99')?.version).toBe('1.0.0');

    unregisterPlugin('custom-lang', 'guild-42');
    unregisterPlugin('custom-lang', null);
  });
});