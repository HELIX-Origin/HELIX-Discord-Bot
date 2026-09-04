/**
 * src/plugins/plugin-loader.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Plugin discovery, validation, and loading engine.
 *
 * Reads config.json from plugin repos (helix-origin + community),
 * validates each plugin's manifest, dynamically imports the entry file,
 * and returns loaded LanguagePlugin instances.
 * ──────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { BOT_ROOT_DIR } from '../env.js';
import { loadRepoConfig, type RepoConfig } from './repo-config.js';
import { loadManifest, type PluginManifest } from './manifest.js';
import type { LanguagePlugin } from './types.js';

/** A fully loaded plugin with its manifest and instance. */
export interface LoadedPlugin {
  manifest: PluginManifest;
  instance: LanguagePlugin;
  repoName: string;
  repoDir: string;
  pluginDir: string;
}

/** Plugins directory root. */
const PLUGINS_DIR = path.resolve(BOT_ROOT_DIR, 'src', 'plugins');

/** Community plugins directory. */
const COMMUNITY_DIR = path.join(PLUGINS_DIR, 'community');

/** Built-in helix-origin directory. */
const HELIX_ORIGIN_DIR = path.join(PLUGINS_DIR, 'helix-origin');

/**
 * Resolve the absolute path for a plugin entry file from its manifest.
 */
function resolvePluginEntry(pluginDir: string, entry: string): string {
  const resolved = path.resolve(pluginDir, entry);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Entry file not found: ${resolved}`);
  }
  return resolved;
}

/**
 * Load all plugins from a single repo directory.
 * Reads config.json, then iterates each plugin entry.
 */
async function loadPluginsFromRepo(repoDir: string): Promise<LoadedPlugin[]> {
  const loaded: LoadedPlugin[] = [];

  const config = loadRepoConfig(repoDir);
  if (!config) {
    console.error(`[PluginLoader] Skipping ${repoDir} — no valid config.json`);
    return loaded;
  }

  console.log(`[PluginLoader] Loading repo "${config.name}" (${config.plugins.length} plugins)`);

  for (const entry of config.plugins) {
    const pluginDir = path.resolve(repoDir, entry.path);

    if (!fs.existsSync(pluginDir)) {
      console.warn(`[PluginLoader] Plugin directory not found: ${pluginDir} — skipping`);
      continue;
    }

    const manifest = loadManifest(pluginDir);
    if (!manifest) {
      console.warn(`[PluginLoader] Skipping plugin "${entry.id}" — no valid plugin.json`);
      continue;
    }

    // Verify manifest id matches config entry id
    if (manifest.id !== entry.id) {
      console.warn(`[PluginLoader] Plugin id mismatch: config says "${entry.id}", manifest says "${manifest.id}" — using manifest`);
    }

    try {
      const entryPath = resolvePluginEntry(pluginDir, manifest.entry);
      const entryUrl = pathToFileURL(entryPath).href;
      const mod = await import(entryUrl);

      // Find the LanguagePlugin instance — look for a default export or a named export matching the plugin id
      let instance: LanguagePlugin | null = null;

      if (mod.default && typeof mod.default === 'object' && typeof mod.default.id === 'string') {
        instance = mod.default as LanguagePlugin;
      } else {
        // Search named exports for a LanguagePlugin
        for (const key of Object.keys(mod)) {
          const exp = mod[key];
          if (exp && typeof exp === 'object' && typeof (exp as LanguagePlugin).id === 'string' && typeof (exp as LanguagePlugin).lint === 'function') {
            instance = exp as LanguagePlugin;
            break;
          }
        }
      }

      if (!instance) {
        console.warn(`[PluginLoader] Plugin "${manifest.id}" does not export a LanguagePlugin instance — skipping`);
        continue;
      }

      loaded.push({
        manifest,
        instance,
        repoName: config.repository,
        repoDir,
        pluginDir,
      });

      console.log(`[PluginLoader] Loaded plugin "${manifest.id}" v${manifest.version} from "${config.name}"`);
    } catch (err) {
      console.error(`[PluginLoader] Failed to load plugin "${manifest.id}":`, err);
    }
  }

  return loaded;
}

/**
 * Load all plugins from helix-origin (built-in) and community repos.
 * This is the main entry point called on bot startup.
 */
export async function loadAllPlugins(): Promise<LoadedPlugin[]> {
  const allLoaded: LoadedPlugin[] = [];

  // Load built-in helix-origin plugins
  if (fs.existsSync(HELIX_ORIGIN_DIR)) {
    const helixPlugins = await loadPluginsFromRepo(HELIX_ORIGIN_DIR);
    allLoaded.push(...helixPlugins);
  } else {
    console.warn('[PluginLoader] helix-origin directory not found — no built-in plugins loaded');
  }

  // Load community plugins
  if (fs.existsSync(COMMUNITY_DIR)) {
    const repos = fs.readdirSync(COMMUNITY_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(COMMUNITY_DIR, d.name));

    for (const repoDir of repos) {
      const communityPlugins = await loadPluginsFromRepo(repoDir);
      allLoaded.push(...communityPlugins);
    }
  }

  console.log(`[PluginLoader] Total plugins loaded: ${allLoaded.length}`);
  return allLoaded;
}

/**
 * Load plugins from a single community repo directory.
 * Used by the installer after cloning a new repo.
 */
export async function loadCommunityPlugins(repoDir: string): Promise<LoadedPlugin[]> {
  return loadPluginsFromRepo(repoDir);
}
