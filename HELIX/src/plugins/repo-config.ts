/**
 * src/plugins/repo-config.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Repository config (config.json) schema and validation.
 *
 * Both built-in (helix-origin) and community plugin repos have a root
 * config.json that the bot reads first to discover all plugins in the repo.
 * ──────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';

/** A single plugin entry in the repo config. */
export interface RepoPluginEntry {
  id: string;
  path: string;
}

/** The root config.json schema for a plugin repository. */
export interface RepoConfig {
  repository: string;
  name: string;
  version: string;
  description: string;
  author: string;
  plugins: RepoPluginEntry[];
}

/** Validation result for a repo config. */
export interface RepoConfigValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a repo config object.
 */
export function validateRepoConfig(config: unknown): RepoConfigValidation {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config is not an object'] };
  }

  const c = config as Record<string, unknown>;

  if (!c.repository || typeof c.repository !== 'string') {
    errors.push('Missing or invalid "repository" field');
  }
  if (!c.name || typeof c.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  }
  if (!c.version || typeof c.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }
  if (!c.description || typeof c.description !== 'string') {
    errors.push('Missing or invalid "description" field');
  }
  if (!c.author || typeof c.author !== 'string') {
    errors.push('Missing or invalid "author" field');
  }
  if (!Array.isArray(c.plugins) || c.plugins.length === 0) {
    errors.push('Missing or empty "plugins" array');
  } else {
    for (let i = 0; i < c.plugins.length; i++) {
      const p = c.plugins[i] as Record<string, unknown>;
      if (!p || typeof p !== 'object') {
        errors.push(`plugins[${i}] is not an object`);
        continue;
      }
      if (!p.id || typeof p.id !== 'string') {
        errors.push(`plugins[${i}] missing or invalid "id"`);
      }
      if (!p.path || typeof p.path !== 'string') {
        errors.push(`plugins[${i}] missing or invalid "path"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Load and validate a config.json from a directory.
 * Returns the parsed config or null if invalid/missing.
 */
export function loadRepoConfig(repoDir: string): RepoConfig | null {
  const configPath = path.join(repoDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validation = validateRepoConfig(parsed);
    if (!validation.valid) {
      console.error(`[PluginLoader] Invalid config.json in ${repoDir}:`, validation.errors);
      return null;
    }
    return parsed as RepoConfig;
  } catch (err) {
    console.error(`[PluginLoader] Failed to read config.json in ${repoDir}:`, err);
    return null;
  }
}
