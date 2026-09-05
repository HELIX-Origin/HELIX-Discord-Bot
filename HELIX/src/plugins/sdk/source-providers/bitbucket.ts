/**
 * src/plugins/sdk/source-providers/bitbucket.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Bitbucket source provider (repositories, source blobs, raw, and snippets).
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { SourceProvider, SourceProviderResolution } from '../../types.js';
import { detectLanguageFromPath } from '../detect-language.js';

export const bitbucketSourceProvider: SourceProvider = {
  id: 'bitbucket',
  name: 'Bitbucket',
  matches(_url: string, parsedUrl: URL): boolean {
    return parsedUrl.hostname.toLowerCase() === 'bitbucket.org';
  },
  resolve(url: string, parsedUrl: URL): SourceProviderResolution | null {
    const pathname = parsedUrl.pathname;

    // 1. Bitbucket Source Blob -> Raw Content
    // https://bitbucket.org/owner/repo/src/branch/path/to/file.ts
    const srcMatch = pathname.match(/^\/([^/]+)\/([^/]+)\/src\/([^/]+)\/(.+)$/);
    if (srcMatch) {
      const [, owner, repo, branch, filePath] = srcMatch;
      const rawUrl = `https://bitbucket.org/${owner}/${repo}/raw/${branch}/${filePath}`;
      return {
        rawUrl,
        origin: 'bitbucket',
        label: `Bitbucket: ${owner}/${repo} (${filePath})`,
        language: detectLanguageFromPath(filePath),
      };
    }

    // 2. Bitbucket Snippets
    // https://bitbucket.org/snippets/owner/id
    const snippetMatch = pathname.match(/^\/snippets\/([^/]+)\/([^/]+)$/);
    if (snippetMatch) {
      const [, owner, snippetId] = snippetMatch;
      const rawUrl = `https://bitbucket.org/snippets/${owner}/${snippetId}/raw`;
      return {
        rawUrl,
        origin: 'bitbucket',
        label: `Bitbucket Snippet: ${owner}/${snippetId}`,
        language: undefined,
      };
    }

    // 3. Bitbucket Direct Raw
    if (pathname.includes('/raw/')) {
      return {
        rawUrl: url,
        origin: 'bitbucket',
        label: `Bitbucket Raw: ${pathname}`,
        language: detectLanguageFromPath(pathname),
      };
    }

    return null;
  },
};
