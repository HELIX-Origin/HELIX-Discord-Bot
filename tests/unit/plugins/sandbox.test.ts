import { describe, it, expect } from 'vitest';
import { executePluginSandbox } from '../../../HELIX/src/plugins/sandbox.js';
import type { PluginManifest } from '../../../HELIX/src/plugins/manifest.js';

describe('plugins — sandboxed runtime executor', () => {
  const manifest: PluginManifest = {
    id: 'sample-plugin',
    name: 'Sample Plugin',
    version: '1.0.0',
    description: 'A test sandbox plugin',
    author: 'Tester',
    fileExtensions: ['.sample', '.smp'],
    entry: 'index.js',
    capabilities: ['lint', 'explain'],
  };

  it('executes CommonJS exports in a secure sandbox context', async () => {
    const source = `
      module.exports = {
        id: 'sample-plugin',
        name: 'Sample Plugin',
        version: '1.0.0',
        fileExtensions: ['.sample'],
        capabilities: ['lint'],
        async lint(code) {
          return {
            language: 'sample',
            results: code.includes('bad') ? [{ line: 1, column: 1, severity: 'error', code: 'E001', message: 'Bad code' }] : [],
            summary: { errors: code.includes('bad') ? 1 : 0, warnings: 0, info: 0 },
          };
        },
        async explain(code) {
          return { language: 'sample', summary: 'test', explanations: [], docReferences: [] };
        },
        async getDocumentation() {
          return [];
        }
      };
    `;

    const plugin = executePluginSandbox(source, manifest);
    expect(plugin.id).toBe('sample-plugin');
    const result = await plugin.lint('let bad = 1;');
    expect(result.summary.errors).toBe(1);
    expect(result.results[0].message).toBe('Bad code');
  });

  it('executes ES export syntax transpiled for sandbox evaluation', async () => {
    const source = `
      export default {
        id: 'sample-plugin',
        name: 'Sample Plugin',
        version: '1.0.0',
        fileExtensions: ['.sample'],
        capabilities: ['lint'],
        async lint(code) {
          return {
            language: 'sample',
            results: [],
            summary: { errors: 0, warnings: 0, info: 0 },
          };
        },
        async explain() { return { language: 'sample', summary: '', explanations: [], docReferences: [] }; },
        async getDocumentation() { return []; }
      };
    `;

    const plugin = executePluginSandbox(source, manifest);
    expect(plugin.id).toBe('sample-plugin');
    const result = await plugin.lint('hello');
    expect(result.summary.errors).toBe(0);
  });

  it('prohibits external require in sandboxed execution context', () => {
    const source = `
      const fs = require('fs');
      module.exports = { id: 'sample-plugin', lint: () => {} };
    `;

    expect(() => executePluginSandbox(source, manifest)).toThrow(/External require/);
  });

  it('throws error if plugin instance is missing required structure', () => {
    const source = `
      module.exports = { notAPlugin: true };
    `;

    expect(() => executePluginSandbox(source, manifest)).toThrow(/did not export a valid LanguagePlugin instance/);
  });
});
