/**
 * src/plugins/registry.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Plugin registry with runtime enable/disable and lookup by language.
 *
 * After the loader discovers and instantiates plugins, they are registered
 * here. The registry provides lookup by plugin id, by file extension, and
 * supports runtime enable/disable without reloading.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { LanguagePlugin, SourceProvider, SourceProviderResolution } from './types.js';
import type { LoadedPlugin } from './plugin-loader.js';

/** Registry entry for a loaded plugin. */
interface RegistryEntry {
  plugin: LanguagePlugin;
  repoName: string;
  enabled: boolean;
}

/** The global plugin registry. */
const registry = new Map<string, RegistryEntry>();

/** Reverse map: file extension → plugin id. */
const extensionMap = new Map<string, string>();

/** Pluggable source providers registered by built-in or community plugins. */
const sourceProviders = new Map<string, SourceProvider>();

/**
 * Register a loaded plugin in the registry.
 */
export function registerPlugin(loaded: LoadedPlugin): void {
  registry.set(loaded.manifest.id, {
    plugin: loaded.instance,
    repoName: loaded.repoName,
    enabled: true,
  });

  // Map file extensions
  for (const ext of loaded.manifest.fileExtensions) {
    extensionMap.set(ext.toLowerCase(), loaded.manifest.id);
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
export function registerPlugins(loaded: LoadedPlugin[]): void {
  for (const p of loaded) {
    registerPlugin(p);
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
 * Get a plugin by its id.
 */
export function getPlugin(id: string): LanguagePlugin | null {
  const entry = registry.get(id);
  if (!entry || !entry.enabled) return null;
  return entry.plugin;
}

/**
 * Get a plugin by file extension (e.g. ".ts", ".py").
 */
export function getPluginByExtension(ext: string): LanguagePlugin | null {
  const id = extensionMap.get(ext.toLowerCase());
  if (!id) return null;
  return getPlugin(id);
}

/**
 * Auto-detect language from a file extension.
 */
export function detectLanguage(fileName: string): LanguagePlugin | null {
  const ext = fileName.includes('.') ? '.' + fileName.split('.').pop()!.toLowerCase() : '';
  return getPluginByExtension(ext);
}

/**
 * Enable a plugin by id.
 */
export function enablePlugin(id: string): boolean {
  const entry = registry.get(id);
  if (!entry) return false;
  entry.enabled = true;
  return true;
}

/**
 * Disable a plugin by id.
 */
export function disablePlugin(id: string): boolean {
  const entry = registry.get(id);
  if (!entry) return false;
  entry.enabled = false;
  return true;
}

/**
 * Get all registered plugins (enabled only).
 */
export function getAllPlugins(): LanguagePlugin[] {
  const result: LanguagePlugin[] = [];
  for (const entry of registry.values()) {
    if (entry.enabled) result.push(entry.plugin);
  }
  return result;
}

/**
 * Get all registered plugin ids.
 */
export function getAllPluginIds(): string[] {
  return Array.from(registry.keys());
}

/**
 * Get all enabled plugin ids.
 */
export function getEnabledPluginIds(): string[] {
  const result: string[] = [];
  for (const [id, entry] of registry) {
    if (entry.enabled) result.push(id);
  }
  return result;
}

/**
 * Check if a plugin is registered and enabled.
 */
export function isPluginEnabled(id: string): boolean {
  const entry = registry.get(id);
  return !!entry && entry.enabled;
}

/**
 * Unregister a plugin (e.g. after uninstalling).
 */
export function unregisterPlugin(id: string): boolean {
  const entry = registry.get(id);
  if (!entry) return false;

  // Remove extension mappings
  for (const [ext, pluginId] of extensionMap) {
    if (pluginId === id) extensionMap.delete(ext);
  }

  // Remove plugin's source providers if any
  if (entry.plugin.sourceProviders) {
    for (const sp of entry.plugin.sourceProviders) {
      unregisterSourceProvider(sp.id);
    }
  }

  registry.delete(id);
  return true;
}

/**
 * Get registry stats.
 */
export function getRegistryStats(): { total: number; enabled: number; disabled: number } {
  let enabled = 0;
  let disabled = 0;
  for (const entry of registry.values()) {
    if (entry.enabled) enabled++;
    else disabled++;
  }
  return { total: registry.size, enabled, disabled };
}
