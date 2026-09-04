import { describe, it, expect, vi } from 'vitest';
import {
  parseMarkdownCodeBlock,
  normalizeRemoteUrl,
  detectLanguageFromPath,
  inferLanguageFromSyntax,
  resolveSourceCode,
} from '../../HELIX/src/plugins/sdk/source-resolver.js';

describe('HELIX Multi-Source Code Resolver (Zero AI)', () => {
  describe('Markdown Code Block Parsing', () => {
    it('extracts code and language from fenced code blocks', () => {
      const input = '```typescript\nconst message: string = "Hello HELIX";\nconsole.log(message);\n```';
      const parsed = parseMarkdownCodeBlock(input);
      expect(parsed.language).toBe('typescript');
      expect(parsed.code).toBe('const message: string = "Hello HELIX";\nconsole.log(message);');
    });

    it('handles Python and Rust aliases in code fences', () => {
      const py = '```py\ndef compute():\n    return 42\n```';
      expect(parseMarkdownCodeBlock(py).language).toBe('python');

      const rs = '```rs\nfn main() {}\n```';
      expect(parseMarkdownCodeBlock(rs).language).toBe('rust');
    });

    it('extracts inline backtick code snippets', () => {
      const inline = '`console.log(123)`';
      const parsed = parseMarkdownCodeBlock(inline);
      expect(parsed.code).toBe('console.log(123)');
    });

    it('falls back gracefully to raw plain text', () => {
      const plain = 'var x = 10;\nvar y = 20;';
      const parsed = parseMarkdownCodeBlock(plain);
      expect(parsed.code).toBe(plain);
    });
  });

  describe('Remote URL Normalization (GitHub, GitLab, Bitbucket, Gist, Pastebin)', () => {
    it('translates GitHub blob URLs to raw user content URLs', () => {
      const ghBlob = 'https://github.com/facebook/react/blob/main/packages/react/src/React.js';
      const normalized = normalizeRemoteUrl(ghBlob);

      expect(normalized).not.toBeNull();
      expect(normalized?.origin).toBe('github');
      expect(normalized?.url).toBe('https://raw.githubusercontent.com/facebook/react/main/packages/react/src/React.js');
      expect(normalized?.language).toBe('javascript');
    });

    it('preserves existing GitHub raw URLs', () => {
      const ghRaw = 'https://raw.githubusercontent.com/HELIX-Origin/HELIX/main/HELIX/index.ts';
      const normalized = normalizeRemoteUrl(ghRaw);

      expect(normalized?.origin).toBe('github');
      expect(normalized?.url).toBe(ghRaw);
      expect(normalized?.language).toBe('typescript');
    });

    it('translates GitHub Gist URLs to raw gist endpoints', () => {
      const gistUrl = 'https://gist.github.com/torvalds/1f4963554e29b1d55681c2f1f0a22144';
      const normalized = normalizeRemoteUrl(gistUrl);

      expect(normalized?.origin).toBe('gist');
      expect(normalized?.url).toBe('https://gist.githubusercontent.com/torvalds/1f4963554e29b1d55681c2f1f0a22144/raw');
    });

    it('translates GitLab repository blob and snippet URLs', () => {
      const glBlob = 'https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/models/user.rb';
      const normBlob = normalizeRemoteUrl(glBlob);

      expect(normBlob?.origin).toBe('gitlab');
      expect(normBlob?.url).toBe('https://gitlab.com/gitlab-org/gitlab/-/raw/master/app/models/user.rb');
      expect(normBlob?.language).toBe('ruby');

      const glSnippet = 'https://gitlab.com/-/snippets/2001550';
      const normSnippet = normalizeRemoteUrl(glSnippet);
      expect(normSnippet?.origin).toBe('gitlab');
      expect(normSnippet?.url).toBe('https://gitlab.com/-/snippets/2001550/raw');
    });

    it('translates Bitbucket source URLs to raw URLs', () => {
      const bbSrc = 'https://bitbucket.org/atlassian/aws-sam-cli/src/master/README.md';
      const normBb = normalizeRemoteUrl(bbSrc);

      expect(normBb?.origin).toBe('bitbucket');
      expect(normBb?.url).toBe('https://bitbucket.org/atlassian/aws-sam-cli/raw/master/README.md');
      expect(normBb?.language).toBe('markdown');
    });

    it('translates Pastebin URLs to raw endpoints', () => {
      const pastebin = 'https://pastebin.com/abCD123';
      const normPb = normalizeRemoteUrl(pastebin);

      expect(normPb?.origin).toBe('url');
      expect(normPb?.url).toBe('https://pastebin.com/raw/abCD123');
    });
  });

  describe('Path & Syntax Language Inference', () => {
    it('detects language from diverse file extensions', () => {
      expect(detectLanguageFromPath('src/server.ts')).toBe('typescript');
      expect(detectLanguageFromPath('scripts/deploy.py')).toBe('python');
      expect(detectLanguageFromPath('main.rs')).toBe('rust');
      expect(detectLanguageFromPath('pkg/api.go')).toBe('go');
      expect(detectLanguageFromPath('App.java')).toBe('java');
      expect(detectLanguageFromPath('GameController.cs')).toBe('csharp');
    });

    it('infers language from syntax markers when no extension is present', () => {
      expect(inferLanguageFromSyntax('fn calculate_hash(data: &[u8]) -> u64 { let mut x = 0; }')).toBe('rust');
      expect(inferLanguageFromSyntax('package main\n\nimport "fmt"\n\nfunc main() {}')).toBe('go');
      expect(inferLanguageFromSyntax('def run_service(name: str):\n    if name:\n        return True')).toBe('python');
      expect(inferLanguageFromSyntax('public class OrderManager {\n    public static void main(String[] args) {}\n}')).toBe('java');
      expect(inferLanguageFromSyntax('{"status": "ok", "count": 42}')).toBe('json');
    });
  });

  describe('Universal resolveSourceCode() Pipeline', () => {
    it('resolves directly pasted code blocks', async () => {
      const result = await resolveSourceCode({
        input: '```rust\npub fn hello() -> &\'static str { "HELIX" }\n```',
      });

      expect(result.origin).toBe('pasted');
      expect(result.language).toBe('rust');
      expect(result.code).toContain('pub fn hello()');
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('resolves Discord message attachments', async () => {
      const mockCode = 'console.log("From Discord Attachment");';
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': String(mockCode.length) }),
        text: async () => mockCode,
      });
      globalThis.fetch = fakeFetch as any;

      const mockMessage = {
        attachments: {
          size: 1,
          first: () => ({
            url: 'https://cdn.discordapp.com/attachments/123/456/handler.ts',
            name: 'handler.ts',
          }),
        },
      };

      const result = await resolveSourceCode({
        message: mockMessage,
      });

      expect(result.origin).toBe('attachment');
      expect(result.language).toBe('typescript');
      expect(result.sourceName).toBe('handler.ts');
      expect(result.code).toBe(mockCode);
    });

    it('resolves remote GitHub repository files via raw URL fetch', async () => {
      const mockRemoteCode = 'export const VERSION = "2.0.0";';
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': String(mockRemoteCode.length) }),
        text: async () => mockRemoteCode,
      });
      globalThis.fetch = fakeFetch as any;

      const result = await resolveSourceCode({
        input: 'https://github.com/HELIX-Origin/HELIX/blob/main/src/version.ts',
      });

      expect(result.origin).toBe('github');
      expect(result.language).toBe('typescript');
      expect(result.code).toBe(mockRemoteCode);
      expect(result.sourceName).toContain('HELIX-Origin/HELIX');
    });

    it('dynamically resolves custom languages from registered plugins', async () => {
      const { registerPlugin } = await import('../../HELIX/src/plugins/registry.js');
      
      // Dynamically register a community/custom language plugin
      registerPlugin({
        manifest: {
          id: 'zig',
          name: 'Zig',
          version: '1.0.0',
          description: 'Zig Language Plugin',
          author: 'Community',
          fileExtensions: ['.zig', '.zon'],
          entry: 'index.ts',
          capabilities: ['lint', 'explain'],
        },
        instance: {
          id: 'zig',
          name: 'Zig',
          version: '1.0.0',
          fileExtensions: ['.zig', '.zon'],
          capabilities: ['lint', 'explain'],
          async lint(code: string) {
            return { language: 'zig', results: [], summary: { errors: 0, warnings: 0, info: 0 } };
          },
          async explain(code: string) {
            return { language: 'zig', summary: 'Zig source code', explanations: [], docReferences: [] };
          },
          async getDocumentation() { return []; },
        },
        repoName: 'community-zig',
        repoDir: '/mock/zig',
        pluginDir: '/mock/zig',
      });

      expect(detectLanguageFromPath('src/main.zig')).toBe('zig');
      expect(detectLanguageFromPath('build.zon')).toBe('zig');

      const resolved = await resolveSourceCode({
        input: '```zig\npub fn main() void {}\n```',
      });
      expect(resolved.language).toBe('zig');
    });

    it('dynamically resolves remote code using custom SourceProviders registered by plugins', async () => {
      const { registerPlugin } = await import('../../HELIX/src/plugins/registry.js');

      const mockGiteaCode = 'fn gitea_custom() {}';
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': String(mockGiteaCode.length) }),
        text: async () => mockGiteaCode,
      });
      globalThis.fetch = fakeFetch as any;

      // Register a plugin that contributes a custom SourceProvider
      registerPlugin({
        manifest: {
          id: 'gitea-integration',
          name: 'Gitea Integration',
          version: '1.0.0',
          description: 'Gitea repo source provider',
          author: 'Community',
          fileExtensions: ['.gitea'],
          entry: 'index.ts',
          capabilities: ['docs'],
        },
        instance: {
          id: 'gitea-integration',
          name: 'Gitea Integration',
          version: '1.0.0',
          fileExtensions: ['.gitea'],
          capabilities: ['docs'],
          async lint() { return { language: 'gitea', results: [], summary: { errors: 0, warnings: 0, info: 0 } }; },
          async explain() { return { language: 'gitea', summary: '', explanations: [], docReferences: [] }; },
          async getDocumentation() { return []; },
          sourceProviders: [
            {
              id: 'gitea',
              name: 'Gitea Self-Hosted',
              matches(_url, parsed) {
                return parsed.hostname.includes('gitea');
              },
              resolve(url, parsed) {
                return {
                  rawUrl: `${url}?raw=true`,
                  origin: 'gitea',
                  label: `Gitea: ${parsed.pathname}`,
                  language: 'rust',
                };
              },
            },
          ],
        },
        repoName: 'community-gitea',
        repoDir: '/mock/gitea',
        pluginDir: '/mock/gitea',
      });

      const resolved = await resolveSourceCode({
        input: 'https://gitea.mycompany.org/org/repo/src/branch/main/handler.rs',
      });

      expect(resolved.origin).toBe('gitea');
      expect(resolved.sourceName).toContain('Gitea: /org/repo/src/branch/main/handler.rs');
      expect(resolved.language).toBe('rust');
      expect(resolved.code).toBe(mockGiteaCode);
    });
  });
});
