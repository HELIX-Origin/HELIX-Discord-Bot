/**
 * src/plugins/manifest.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Individual plugin manifest (plugin.json) schema and validation.
 *
 * Each plugin folder contains a plugin.json that describes the plugin's
 * metadata, capabilities, entry point, and file extensions.
 * ──────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import type { PluginCapability } from './types.js';

/** The plugin.json schema. */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  fileExtensions: string[];
  docUrl?: string;
  entry: string;
  capabilities: PluginCapability[];
  dependencies?: string[];
  repository?: string;
}

/** Validation result for a plugin manifest. */
export interface ManifestValidation {
  valid: boolean;
  errors: string[];
}

const VALID_CAPABILITIES: PluginCapability[] = ['lint', 'explain', 'fixes', 'docs', 'format', 'patterns'];

/**
 * Validate a plugin manifest object.
 */
export function validateManifest(manifest: unknown): ManifestValidation {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest is not an object'] };
  }

  const m = manifest as Record<string, unknown>;

  if (!m.id || typeof m.id !== 'string') {
    errors.push('Missing or invalid "id" field');
  }
  if (!m.name || typeof m.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  }
  if (!m.version || typeof m.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }
  if (!m.description || typeof m.description !== 'string') {
    errors.push('Missing or invalid "description" field');
  }
  if (!m.author || typeof m.author !== 'string') {
    errors.push('Missing or invalid "author" field');
  }
  if (!Array.isArray(m.fileExtensions) || m.fileExtensions.length === 0) {
    errors.push('Missing or empty "fileExtensions" array');
  }
  if (!m.entry || typeof m.entry !== 'string') {
    errors.push('Missing or invalid "entry" field');
  }
  if (!Array.isArray(m.capabilities) || m.capabilities.length === 0) {
    errors.push('Missing or empty "capabilities" array');
  } else {
    for (const cap of m.capabilities) {
      if (!VALID_CAPABILITIES.includes(cap as PluginCapability)) {
        errors.push(`Invalid capability "${cap}". Valid: ${VALID_CAPABILITIES.join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Load and validate a plugin.json from a directory.
 * Returns the parsed manifest or null if invalid/missing.
 */
export function loadManifest(pluginDir: string): PluginManifest | null {
  const manifestPath = path.join(pluginDir, 'plugin.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(raw);
    const validation = validateManifest(parsed);
    if (!validation.valid) {
      console.error(`[PluginLoader] Invalid plugin.json in ${pluginDir}:`, validation.errors);
      return null;
    }
    return parsed as PluginManifest;
  } catch (err) {
    console.error(`[PluginLoader] Failed to read plugin.json in ${pluginDir}:`, err);
    return null;
  }
}
