/**
 * src/plugins/plugin-loader.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Plugin discovery, validation, and loading engine.
 *
 * Reads config.json from first-party built-in plugins (helix-origin) on disk
 * and loads custom/community plugins securely from the SQLite database
 * via sandboxed execution with per-guild repository scoping.
 * ──────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { BOT_ROOT_DIR } from '../env.js';
import { loadRepoConfig, validateRepoConfig, type RepoConfig } from './repo-config.js';
import { loadManifest, validateManifest, type PluginManifest } from './manifest.js';
import type { LanguagePlugin } from './types.js';
import { executePluginSandbox } from './sandbox.js';
import { BotDatabase } from '../db/database.js';
import { registerPlugin, registerPlugins } from './registry.js';

/** A fully loaded plugin with its manifest and instance. */
export interface LoadedPlugin {
  manifest: PluginManifest;
  instance: LanguagePlugin;
  repoName: string;
  repoDir?: string;
  pluginDir?: string;
  guildId?: string | null;
}

function getPluginsDir(): string {
  const candidates = [
    path.resolve(BOT_ROOT_DIR, 'src', 'plugins'),
    path.resolve(BOT_ROOT_DIR, '..', 'src', 'plugins'),
    path.resolve(process.cwd(), 'HELIX', 'src', 'plugins'),
    path.resolve(process.cwd(), 'src', 'plugins'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

/** Plugins directory root. */
const PLUGINS_DIR = getPluginsDir();

/** Built-in helix-origin directory. */
const HELIX_ORIGIN_DIR = path.join(PLUGINS_DIR, 'helix-origin');

/**
 * Resolve the absolute path for a plugin entry file from its manifest.
 * Automatically resolves compiled .js equivalents in production.
 */
function resolvePluginEntry(pluginDir: string, entry: string): string {
  const directPath = path.resolve(pluginDir, entry);

  if (entry.endsWith('.ts')) {
    const jsEntry = entry.replace(/\.ts$/, '.js');
    const localJsPath = path.resolve(pluginDir, jsEntry);
    if (fs.existsSync(localJsPath)) {
      return localJsPath;
    }

    // Check compiled dist output
    const distJsPath = directPath
      .replace(/[\\/]src[\\/]plugins[\\/]/, path.sep + path.join('src', 'dist', 'src', 'plugins') + path.sep)
      .replace(/\.ts$/, '.js');
    if (fs.existsSync(distJsPath)) {
      return distJsPath;
    }
  }

  if (fs.existsSync(directPath)) {
    return directPath;
  }

  throw new Error(`Entry file not found: ${directPath}`);
}

/**
 * Load all plugins from a single repo directory on disk (used for first-party built-ins).
 */
export async function loadPluginsFromRepo(repoDir: string): Promise<LoadedPlugin[]> {
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

    if (manifest.id !== entry.id) {
      console.warn(`[PluginLoader] Plugin id mismatch: config says "${entry.id}", manifest says "${manifest.id}" — using manifest`);
    }

    try {
      const entryPath = resolvePluginEntry(pluginDir, manifest.entry);
      const entryUrl = pathToFileURL(entryPath).href;
      const mod = await import(entryUrl);

      let instance: LanguagePlugin | null = null;

      if (mod.default && typeof mod.default === 'object' && typeof mod.default.id === 'string') {
        instance = mod.default as LanguagePlugin;
      } else {
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
        guildId: null,
      });

      console.log(`[PluginLoader] Loaded built-in plugin "${manifest.id}" v${manifest.version} from "${config.name}"`);
    } catch (err) {
      console.error(`[PluginLoader] Failed to load plugin "${manifest.id}":`, err);
    }
  }

  return loaded;
}

/**
 * Load all custom plugins stored in SQLite database.
 */
export async function loadStoredPlugins(): Promise<LoadedPlugin[]> {
  const loaded: LoadedPlugin[] = [];
  const db = BotDatabase.getInstance();
  const records = db.getAllStoredPluginRepositories();

  for (const record of records) {
    if (!record.enabled) continue;
    try {
      const manifest: PluginManifest = JSON.parse(record.manifestJson);
      const instance = executePluginSandbox(record.entrySource, manifest);

      loaded.push({
        manifest,
        instance,
        repoName: record.repoName,
        guildId: record.guildId,
      });

      console.log(`[PluginLoader] Loaded DB plugin "${manifest.id}" v${manifest.version} (guild: ${record.guildId || 'global'})`);
    } catch (err) {
      console.error(`[PluginLoader] Failed to instantiate stored plugin repository "${record.repoName}":`, err);
    }
  }

  return loaded;
}

/**
 * Helper to fetch text with branch fallbacks (main -> master).
 */
async function fetchGithubRaw(repo: string, filePath: string): Promise<string> {
  const branches = ['main', 'master'];
  for (const branch of branches) {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.text();
      }
    } catch {
      // Try next branch
    }
  }
  throw new Error(`Failed to fetch ${filePath} from ${repo} on branches: main, master`);
}

/**
 * Fetch a remote GitHub plugin repository via HTTPS, validate manifests,
 * sandbox-evaluate the entry code, store directly in SQLite, and register into runtime.
 */
export async function fetchAndStorePluginRepo(
  repoName: string,
  guildId?: string | null
): Promise<LoadedPlugin[]> {
  // 1. Fetch config.json
  const configRaw = await fetchGithubRaw(repoName, 'config.json');
  const configJson = JSON.parse(configRaw.replace(/^\uFEFF/, ''));
  const configValidation = validateRepoConfig(configJson);
  if (!configValidation.valid) {
    throw new Error(`Invalid repository config: ${configValidation.errors.join(', ')}`);
  }
  const config = configJson as RepoConfig;

  const loadedPlugins: LoadedPlugin[] = [];
  const db = BotDatabase.getInstance();

  for (const p of config.plugins) {
    const manifestPath = `${p.path}/plugin.json`.replace(/\/+/g, '/');
    const manifestRaw = await fetchGithubRaw(repoName, manifestPath);
    const manifestJson = JSON.parse(manifestRaw.replace(/^\uFEFF/, ''));
    const manifestValidation = validateManifest(manifestJson);
    if (!manifestValidation.valid) {
      throw new Error(`Invalid manifest for ${p.id}: ${manifestValidation.errors.join(', ')}`);
    }
    const manifest = manifestJson as PluginManifest;

    const entryPath = `${p.path}/${manifest.entry}`.replace(/\/+/g, '/');
    const entrySource = await fetchGithubRaw(repoName, entryPath);

    // Sandbox validation & instantiation
    const instance = executePluginSandbox(entrySource, manifest);

    // Persist to database
    db.addPluginRepository({
      repoName,
      guildId: guildId || null,
      configJson: JSON.stringify(config),
      manifestJson: JSON.stringify(manifest),
      entrySource,
      enabled: true,
    });

    const loadedPlugin: LoadedPlugin = {
      manifest,
      instance,
      repoName,
      guildId: guildId || null,
    };

    registerPlugin(loadedPlugin, guildId || null);
    loadedPlugins.push(loadedPlugin);
  }

  return loadedPlugins;
}

/**
 * Load all plugins from helix-origin (built-in) and SQLite database.
 * Main entry point called on bot startup.
 */
export async function loadAllPlugins(): Promise<LoadedPlugin[]> {
  const allLoaded: LoadedPlugin[] = [];

  // 1. Load built-in helix-origin plugins
  if (fs.existsSync(HELIX_ORIGIN_DIR)) {
    const helixPlugins = await loadPluginsFromRepo(HELIX_ORIGIN_DIR);
    allLoaded.push(...helixPlugins);
    registerPlugins(helixPlugins, null);
  } else {
    console.warn('[PluginLoader] helix-origin directory not found — no built-in plugins loaded');
  }

  // 2. Load DB stored plugins
  const dbPlugins = await loadStoredPlugins();
  for (const p of dbPlugins) {
    allLoaded.push(p);
    registerPlugin(p, p.guildId);
  }

  console.log(`[PluginLoader] Total plugins loaded: ${allLoaded.length}`);
  return allLoaded;
}
