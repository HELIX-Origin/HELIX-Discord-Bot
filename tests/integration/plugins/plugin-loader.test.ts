import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRepoConfig } from '../../../HELIX/src/plugins/repo-config.js';
import { loadManifest } from '../../../HELIX/src/plugins/manifest.js';
import {
  registerPlugins,
  unregisterPlugin,
  getAllPlugins,
  getPlugin,
  getPluginByExtension,
  detectLanguage,
  getRegistryStats,
  isPluginEnabled,
  disablePlugin,
  enablePlugin,
} from '../../../HELIX/src/plugins/registry.js';
import type { LoadedPlugin } from '../../../HELIX/src/plugins/plugin-loader.js';

const __filename = fileURLToPath(import.meta.url);
const TEST_DIR = path.dirname(__filename);
const HELIX_ORIGIN_DIR = path.resolve(TEST_DIR, '..', '..', '..', 'HELIX', 'src', 'plugins', 'helix-origin');

function moduleSpecifier(file: string): string {
  const rel = path.relative(TEST_DIR, file).replaceAll('\\', '/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function findLanguagePlugin(mod: any, id: string): any | null {
  if (mod.default && typeof mod.default === 'object' && typeof mod.default.id === 'string') {
    return mod.default;
  }
  for (const key of Object.keys(mod)) {
    const exp = mod[key];
    if (exp && typeof exp === 'object' && typeof exp.id === 'string' && typeof exp.lint === 'function') {
      return exp;
    }
  }
  return null;
}

let loaded: LoadedPlugin[] = [];

beforeAll(async () => {
  const config = loadRepoConfig(HELIX_ORIGIN_DIR);
  expect(config).not.toBeNull();
  expect(config!.plugins.length).toBeGreaterThan(10);

  const instances: LoadedPlugin[] = [];
  for (const entry of config!.plugins) {
    const pluginDir = path.resolve(HELIX_ORIGIN_DIR, entry.path);
    const manifest = loadManifest(pluginDir);
    expect(manifest, `manifest for ${entry.id}`).not.toBeNull();
    expect(manifest!.entry).toBe('index.ts');

    const mod: any = await import(moduleSpecifier(path.join(pluginDir, manifest!.entry)));
    const instance = findLanguagePlugin(mod, entry.id);
    expect(instance, `instance for ${entry.id}`).not.toBeNull();

    instances.push({
      manifest: manifest!,
      instance,
      repoName: config!.repository,
      repoDir: HELIX_ORIGIN_DIR,
      pluginDir,
    });
  }
  loaded = instances;
  registerPlugins(loaded);
});

afterAll(() => {
  for (const p of loaded) {
    unregisterPlugin(p.manifest.id);
  }
});

describe('integration — built-in plugin ecosystem', () => {
  it('loads every helix-origin plugin from its repo config', () => {
    expect(loaded.length).toBeGreaterThan(10);
    expect(loaded.map((p) => p.manifest.id).sort()).toEqual(
      ['csharp', 'flutter-dart', 'gdscript', 'go', 'html-css', 'java', 'javascript', 'lua', 'php', 'python', 'rust', 'sql', 'typescript']
    );
  });

  it('validates manifest ↔ instance consistency for every plugin', () => {
    for (const p of loaded) {
      expect(p.instance.id, `${p.manifest.id} instance id`).toBe(p.manifest.id);
      expect(typeof p.instance.lint, `${p.manifest.id} lint`).toBe('function');
      expect(typeof p.instance.explain, `${p.manifest.id} explain`).toBe('function');
      expect(Array.isArray(p.instance.fileExtensions)).toBe(true);
      expect(p.instance.fileExtensions.length, `${p.manifest.id} extensions`).toBeGreaterThan(0);

      const manifestExts = p.manifest.fileExtensions.map((e: string) => e.toLowerCase()).sort();
      const instanceExts = p.instance.fileExtensions.map((e: string) => e.toLowerCase()).sort();
      expect(instanceExts.includes(manifestExts[0])).toBe(true);
    }
  });

  it('registers all plugins into the registry with unique ids', () => {
    const ids = getAllPlugins().map((p) => p.id).sort();
    expect(ids).toEqual(loaded.map((p) => p.manifest.id).sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(getRegistryStats()).toEqual({ total: loaded.length, enabled: loaded.length, disabled: 0 });
  });

  it('looks up plugins by extension and detects languages', () => {
    expect(getPlugin('rust')?.id).toBe('rust');
    expect(getPluginByExtension('.ts')?.id).toBe('typescript');
    expect(getPluginByExtension('.PY')?.id).toBe('python');
    expect(detectLanguage('src/main.py')?.id).toBe('python');
    expect(detectLanguage('script.lua')?.id).toBe('lua');
    expect(detectLanguage('ending.zzz')).toBeNull();
  });

  it('supports runtime enable/disable without reloading', () => {
    expect(isPluginEnabled('go')).toBe(true);
    expect(disablePlugin('go')).toBe(true);
    expect(isPluginEnabled('go')).toBe(false);
    expect(getPlugin('go')).toBeNull();
    expect(getRegistryStats().disabled).toBe(1);
    expect(getRegistryStats().enabled).toBe(loaded.length - 1);
    expect(enablePlugin('go')).toBe(true);
    expect(getPlugin('go')?.id).toBe('go');
    expect(getRegistryStats().disabled).toBe(0);
  });

  it('runs real lint analysis through a loaded plugin', async () => {
    const rust = getPlugin('rust')!;
    const out = await rust.lint('fn main() {\n    let x = Result::unwrap;\n}\n');
    expect(out.language).toBe('rust');
    expect(Array.isArray(out.results)).toBe(true);
    expect(typeof out.summary).toBe('object');

    const java = getPlugin('java')!;
    const jout = await java.lint('public class A {\n    int x = null;\n}\n');
    expect(jout.language).toBe('java');
  });
});