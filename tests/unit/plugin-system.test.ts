import { describe, it, expect, beforeEach } from 'vitest';
import { validateManifest } from '../../HELIX/src/plugins/manifest.js';
import { validateRepoConfig } from '../../HELIX/src/plugins/repo-config.js';
import {
  registerPlugin,
  getPlugin,
  getPluginByExtension,
  detectLanguage,
  enablePlugin,
  disablePlugin,
  isPluginEnabled,
  getRegistryStats,
  unregisterPlugin,
} from '../../HELIX/src/plugins/registry.js';
import type { LanguagePlugin } from '../../HELIX/src/plugins/types.js';

describe('Language Plugin System', () => {
  describe('Plugin Manifest Validation', () => {
    it('validates a correct plugin manifest', () => {
      const valid = {
        id: 'typescript',
        name: 'TypeScript',
        version: '1.0.0',
        description: 'TypeScript plugin',
        author: 'HELIX',
        fileExtensions: ['.ts', '.tsx'],
        entry: 'linter.ts',
        capabilities: ['lint', 'explain', 'docs'],
      };

      const result = validateManifest(valid);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects an invalid plugin manifest missing required fields', () => {
      const invalid = {
        id: 'broken',
      };

      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid capability strings', () => {
      const invalid = {
        id: 'bad-cap',
        name: 'Bad Cap',
        version: '1.0.0',
        description: 'Bad capability test',
        author: 'Tester',
        fileExtensions: ['.xyz'],
        entry: 'index.ts',
        capabilities: ['invalid_capability_name'],
      };

      const result = validateManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid capability'))).toBe(true);
    });
  });

  describe('Repository Config Validation', () => {
    it('validates a valid repo config.json', () => {
      const config = {
        repository: 'HELIX-Origin/helix-origin',
        name: 'HELIX Built-in Plugins',
        version: '1.0.0',
        description: 'Official language plugins for HELIX',
        author: 'HELIX-Origin',
        plugins: [
          { id: 'typescript', path: './typescript' },
          { id: 'python', path: './python' },
        ],
      };

      const result = validateRepoConfig(config);
      expect(result.valid).toBe(true);
    });

    it('rejects an empty plugins array in repo config', () => {
      const config = {
        repository: 'empty/repo',
        name: 'Empty Repo',
        version: '1.0.0',
        description: 'Empty plugins list',
        author: 'Tester',
        plugins: [],
      };

      const result = validateRepoConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('Plugin Registry', () => {
    const mockPlugin: LanguagePlugin = {
      id: 'test-lang',
      name: 'Test Language',
      version: '1.0.0',
      fileExtensions: ['.testlang', '.tl'],
      capabilities: ['lint', 'explain'],
      async lint(_code: string) {
        return {
          language: 'test-lang',
          results: [],
          summary: { errors: 0, warnings: 0, info: 0 },
        };
      },
      async explain(_code: string) {
        return {
          language: 'test-lang',
          summary: 'A test explanation',
          explanations: [],
          docReferences: [],
        };
      },
      async getDocumentation(_topic: string) {
        return [];
      },
    };

    beforeEach(() => {
      registerPlugin({
        manifest: {
          id: 'test-lang',
          name: 'Test Language',
          version: '1.0.0',
          description: 'A mock language plugin',
          author: 'Test',
          fileExtensions: ['.testlang', '.tl'],
          entry: 'mock.ts',
          capabilities: ['lint', 'explain'],
        },
        instance: mockPlugin,
        repoName: 'test-repo',
        repoDir: '/mock/repo',
        pluginDir: '/mock/repo/test-lang',
      });
    });

    it('registers and retrieves a plugin by id', () => {
      const retrieved = getPlugin('test-lang');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Test Language');
    });

    it('looks up a plugin by file extension', () => {
      const byExt = getPluginByExtension('.testlang');
      expect(byExt).not.toBeNull();
      expect(byExt?.id).toBe('test-lang');

      const bySecondExt = getPluginByExtension('.tl');
      expect(bySecondExt).not.toBeNull();
      expect(bySecondExt?.id).toBe('test-lang');
    });

    it('auto-detects language from file name', () => {
      const detected = detectLanguage('main.testlang');
      expect(detected).not.toBeNull();
      expect(detected?.id).toBe('test-lang');
    });

    it('enables and disables plugins dynamically', () => {
      expect(isPluginEnabled('test-lang')).toBe(true);

      disablePlugin('test-lang');
      expect(isPluginEnabled('test-lang')).toBe(false);
      expect(getPlugin('test-lang')).toBeNull();

      enablePlugin('test-lang');
      expect(isPluginEnabled('test-lang')).toBe(true);
      expect(getPlugin('test-lang')).not.toBeNull();
    });

    it('reports accurate registry statistics', () => {
      const stats = getRegistryStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.enabled).toBeGreaterThan(0);
    });

    it('unregisters a plugin cleanly', () => {
      unregisterPlugin('test-lang');
      expect(getPlugin('test-lang')).toBeNull();
      expect(getPluginByExtension('.testlang')).toBeNull();
    });
  });

  describe('Built-in Language Plugins', () => {
    it('executes typescript plugin linting and explanation', async () => {
      const { typescriptPlugin } = await import('../../HELIX/src/plugins/helix-origin/typescript/index.js');
      expect(typescriptPlugin.id).toBe('typescript');

      const lintResult = await typescriptPlugin.lint('var x = 10;\nlet y: any = "test";\nconsole.log(x);');
      expect(lintResult.results.length).toBeGreaterThan(0);
      expect(lintResult.summary.warnings).toBeGreaterThan(0);

      const explainResult = await typescriptPlugin.explain('interface User { name: string; }\nconst u: User = { name: "test" };');
      expect(explainResult.explanations.length).toBeGreaterThan(0);

      const docs = await typescriptPlugin.getDocumentation('generics');
      expect(docs.length).toBeGreaterThan(0);
      expect(docs[0].title).toContain('Generics');
    });

    it('executes python plugin linting and explanation', async () => {
      const { pythonPlugin } = await import('../../HELIX/src/plugins/helix-origin/python/index.js');
      expect(pythonPlugin.id).toBe('python');

      const lintResult = await pythonPlugin.lint('import os\nfrom math import *\ntry:\n    pass\nexcept:\n    pass');
      expect(lintResult.results.length).toBeGreaterThan(0);

      const explainResult = await pythonPlugin.explain('def greet(name: str) -> str:\n    return f"Hello, {name}"');
      expect(explainResult.explanations.length).toBeGreaterThan(0);

      const docs = await pythonPlugin.getDocumentation('async');
      expect(docs.length).toBeGreaterThan(0);
    });

    it('executes rust plugin linting and explanation', async () => {
      const { rustPlugin } = await import('../../HELIX/src/plugins/helix-origin/rust/index.js');
      expect(rustPlugin.id).toBe('rust');

      const lintResult = await rustPlugin.lint('fn main() {\n    let mut x = 5;\n    let y = x.unwrap();\n}');
      expect(lintResult.results.length).toBeGreaterThan(0);

      const explainResult = await rustPlugin.explain('fn main() {\n    println!("Hello, world!");\n}');
      expect(explainResult.explanations.length).toBeGreaterThan(0);

      const docs = await rustPlugin.getDocumentation('ownership');
      expect(docs.length).toBeGreaterThan(0);
    });
  });
});

