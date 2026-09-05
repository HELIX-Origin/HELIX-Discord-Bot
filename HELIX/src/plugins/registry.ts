/**
 * src/plugins/registry.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Plugin registry with runtime enable/disable and lookup by language.
 *
 * After the loader discovers and instantiates plugins, they are registered
 * here. The registry provides lookup by plugin id, by file extension, and
 * supports runtime enable/disable with per-guild repository scoping.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { LanguagePlugin, SourceProvider, SourceProviderResolution } from './types.js';
import type { LoadedPlugin } from './plugin-loader.js';

/** Registry entry for a loaded plugin. */
interface RegistryEntry {
  plugin: LanguagePlugin;
  repoName: string;
  enabled: boolean;
  guildId?: string | null;
}

/** The scoped plugin registry: key is `${guildId || 'global'}:${pluginId}`. */
const registry = new Map<string, RegistryEntry>();

/** Reverse map: `${guildId || 'global'}:${file extension}` -> plugin id. */
const extensionMap = new Map<string, string>();

/** Pluggable source providers registered by built-in or community plugins. */
const sourceProviders = new Map<string, SourceProvider>();

function scopedKey(id: string, guildId?: string | null): string {
  return `${guildId || 'global'}:${id}`;
}

function scopedExtKey(ext: string, guildId?: string | null): string {
  return `${guildId || 'global'}:${ext.toLowerCase()}`;
}

/**
 * Register a loaded plugin in the registry.
 */
export function registerPlugin(loaded: LoadedPlugin, guildId?: string | null): void {
  const gId = guildId !== undefined ? guildId : loaded.guildId || null;
  const key = scopedKey(loaded.manifest.id, gId);

  registry.set(key, {
    plugin: loaded.instance,
    repoName: loaded.repoName,
    enabled: true,
    guildId: gId,
  });

  // Map file extensions
  for (const ext of loaded.manifest.fileExtensions) {
    extensionMap.set(scopedExtKey(ext, gId), loaded.manifest.id);
  }

  // Register any source providers contributed by this plugin
  if (loaded.instance.sourceProviders) {
    for (const sp of loaded.instance.sourceProviders) {
      registerSourceProvider(sp);
    }
  }
}

/**
 * Register multiple loaded plugins.
 */
export function registerPlugins(loaded: LoadedPlugin[], guildId?: string | null): void {
  for (const p of loaded) {
    registerPlugin(p, guildId);
  }
}

/**
 * Register a standalone or plugin-contributed SourceProvider.
 */
export function registerSourceProvider(provider: SourceProvider): void {
  sourceProviders.set(provider.id, provider);
}

/**
 * Unregister a SourceProvider by its id.
 */
export function unregisterSourceProvider(id: string): boolean {
  return sourceProviders.delete(id);
}

/**
 * Get all registered SourceProviders.
 */
export function getSourceProviders(): SourceProvider[] {
  return Array.from(sourceProviders.values());
}

/**
 * Finds matching registered SourceProvider and resolves a URL dynamically.
 */
export function findSourceProviderForUrl(rawUrl: string): SourceProviderResolution | null {
  try {
    const parsed = new URL(rawUrl);
    for (const provider of sourceProviders.values()) {
      if (provider.matches(rawUrl, parsed)) {
        const res = provider.resolve(rawUrl, parsed);
        if (res) return res;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Get a plugin by its id (guild-scoped with global fallback).
 */
export function getPlugin(id: string, guildId?: string | null): LanguagePlugin | null {
  if (guildId) {
    const guildEntry = registry.get(scopedKey(id, guildId));
    if (guildEntry) {
      return guildEntry.enabled ? guildEntry.plugin : null;
    }
  }

  const globalEntry = registry.get(scopedKey(id, null));
  if (globalEntry && globalEntry.enabled) {
    return globalEntry.plugin;
  }

  return null;
}

/**
 * Get a plugin by file extension (e.g. ".ts", ".py") with guild scoping.
 */
export function getPluginByExtension(ext: string, guildId?: string | null): LanguagePlugin | null {
  const normExt = ext.toLowerCase();

  if (guildId) {
    const guildPluginId = extensionMap.get(scopedExtKey(normExt, guildId));
    if (guildPluginId) {
      const p = getPlugin(guildPluginId, guildId);
      if (p) return p;
    }
  }

  const globalPluginId = extensionMap.get(scopedExtKey(normExt, null));
  if (globalPluginId) {
    return getPlugin(globalPluginId, null);
  }

  return null;
}

/**
 * Auto-detect language from a file extension.
 */
export function detectLanguage(fileName: string, guildId?: string | null): LanguagePlugin | null {
  const ext = fileName.includes('.') ? '.' + fileName.split('.').pop()!.toLowerCase() : '';
  return getPluginByExtension(ext, guildId);
}

/**
 * Enable a plugin by id.
 */
export function enablePlugin(id: string, guildId?: string | null): boolean {
  if (guildId) {
    const guildEntry = registry.get(scopedKey(id, guildId));
    if (guildEntry) {
      guildEntry.enabled = true;
      return true;
    }
  }

  const globalEntry = registry.get(scopedKey(id, null));
  if (globalEntry) {
    globalEntry.enabled = true;
    return true;
  }

  return false;
}

/**
 * Disable a plugin by id.
 */
export function disablePlugin(id: string, guildId?: string | null): boolean {
  if (guildId) {
    const guildEntry = registry.get(scopedKey(id, guildId));
    if (guildEntry) {
      guildEntry.enabled = false;
      return true;
    }
  }

  const globalEntry = registry.get(scopedKey(id, null));
  if (globalEntry) {
    globalEntry.enabled = false;
    return true;
  }

  return false;
}

/**
 * Get all registered plugins (enabled only) accessible in the given scope.
 */
export function getAllPlugins(guildId?: string | null): LanguagePlugin[] {
  const map = new Map<string, LanguagePlugin>();

  // 1. Add global enabled plugins
  for (const entry of registry.values()) {
    if ((!entry.guildId || entry.guildId === 'global') && entry.enabled) {
      map.set(entry.plugin.id, entry.plugin);
    }
  }

  // 2. Overlay guild-specific enabled plugins if guildId provided
  if (guildId) {
    for (const entry of registry.values()) {
      if (entry.guildId === guildId && entry.enabled) {
        map.set(entry.plugin.id, entry.plugin);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Get all registered plugin ids.
 */
export function getAllPluginIds(guildId?: string | null): string[] {
  const set = new Set<string>();
  for (const entry of registry.values()) {
    if (!guildId || !entry.guildId || entry.guildId === guildId) {
      set.add(entry.plugin.id);
    }
  }
  return Array.from(set);
}

/**
 * Get all enabled plugin ids.
 */
export function getEnabledPluginIds(guildId?: string | null): string[] {
  return getAllPlugins(guildId).map((p) => p.id);
}

/**
 * Check if a plugin is registered and enabled.
 */
export function isPluginEnabled(id: string, guildId?: string | null): boolean {
  return getPlugin(id, guildId) !== null;
}

/**
 * Unregister a plugin (e.g. after uninstalling).
 */
export function unregisterPlugin(id: string, guildId?: string | null): boolean {
  let targetKey: string | null = null;
  let targetEntry: RegistryEntry | undefined;

  if (guildId) {
    const k = scopedKey(id, guildId);
    if (registry.has(k)) {
      targetKey = k;
      targetEntry = registry.get(k);
    }
  }

  if (!targetKey) {
    const k = scopedKey(id, null);
    if (registry.has(k)) {
      targetKey = k;
      targetEntry = registry.get(k);
    }
  }

  if (!targetKey || !targetEntry) return false;

  const gId = targetEntry.guildId || null;

  // Remove extension mappings
  for (const [extKey, pluginId] of extensionMap) {
    if (pluginId === id && extKey.startsWith(`${gId || 'global'}:`)) {
      extensionMap.delete(extKey);
    }
  }

  // Remove plugin's source providers if any
  if (targetEntry.plugin.sourceProviders) {
    for (const sp of targetEntry.plugin.sourceProviders) {
      unregisterSourceProvider(sp.id);
    }
  }

  registry.delete(targetKey);
  return true;
}

/**
 * Get registry stats for a scope.
 */
export function getRegistryStats(guildId?: string | null): { total: number; enabled: number; disabled: number } {
  let total = 0;
  let enabled = 0;
  let disabled = 0;

  const counted = new Set<string>();

  if (guildId) {
    for (const entry of registry.values()) {
      if (entry.guildId === guildId) {
        counted.add(entry.plugin.id);
        total++;
        if (entry.enabled) enabled++;
        else disabled++;
      }
    }
  }

  for (const entry of registry.values()) {
    if ((!entry.guildId || entry.guildId === 'global') && !counted.has(entry.plugin.id)) {
      total++;
      if (entry.enabled) enabled++;
      else disabled++;
    }
  }

  return { total, enabled, disabled };
}

/**
 * Clear all registered plugins (primarily for test harness resets).
 */
export function clearRegistry(): void {
  registry.clear();
  extensionMap.clear();
  sourceProviders.clear();
}
