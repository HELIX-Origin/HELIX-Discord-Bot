/**
 * Builds throwaway plugin repositories on disk for loader/registry tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createTempDir, removeTempDir, writeText } from '../helpers/temp-dir.js';

export interface BuiltPluginRepo {
  dir: string;
  repoDir: string;
  pluginDir: string;
  configPath: string;
  manifestPath: string;
  entryPath: string;
  cleanup(): void;
}

export const demoPluginIndexTs = `export const demoPlugin = {
  id: 'demo',
  name: 'Demo Language',
  version: '1.0.0',
  fileExtensions: ['.demo'],
  capabilities: ['lint'],
  async lint() {
    return { language: 'demo', results: [], summary: { errors: 0, warnings: 0, info: 0 } };
  },
  async explain() {
    return { language: 'demo', summary: 'ok', explanations: [], docReferences: [] };
  },
  async getDocumentation() {
    return [];
  },
};
`;

export const validDemoManifest = {
  id: 'demo',
  name: 'Demo Language',
  version: '1.0.0',
  description: 'Demo language plugin',
  author: 'tester',
  fileExtensions: ['.demo'],
  entry: 'index.ts',
  capabilities: ['lint'],
};

export const validDemoConfig = {
  repository: 'demo-repo',
  name: 'Demo Repo',
  version: '1.0.0',
  description: 'Demo plugin repository',
  author: 'tester',
  plugins: [{ id: 'demo', path: 'demo' }],
};

export function buildPluginRepo(options: {
  config?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  indexTs?: string;
  pluginDirName?: string;
} = {}): BuiltPluginRepo {
  const dir = createTempDir('helix-plugin-repo-');
  const repoDir = path.join(dir, 'repo');
  const pluginDirName = options.pluginDirName || 'demo';
  const pluginDir = path.join(repoDir, pluginDirName);
  fs.mkdirSync(pluginDir, { recursive: true });

  writeText(
    path.join(repoDir, 'config.json'),
    JSON.stringify(options.config || validDemoConfig, null, 2)
  );
  writeText(
    path.join(pluginDir, 'plugin.json'),
    JSON.stringify(options.manifest || validDemoManifest, null, 2)
  );
  const entryPath = writeText(path.join(pluginDir, 'index.ts'), options.indexTs || demoPluginIndexTs);

  return {
    dir,
    repoDir,
    pluginDir,
    configPath: path.join(repoDir, 'config.json'),
    manifestPath: path.join(pluginDir, 'plugin.json'),
    entryPath,
    cleanup: () => removeTempDir(dir),
  };
}