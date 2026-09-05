/**
 * src/plugins/sdk/source-providers/gitlab.ts
 * ──────────────────────────────────────────────────────────────────────────
 * GitLab source provider (repositories, blobs, raw content, and snippets).
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { SourceProvider, SourceProviderResolution } from '../../types.js';
import { detectLanguageFromPath } from '../detect-language.js';

export const gitlabSourceProvider: SourceProvider = {
  id: 'gitlab',
  name: 'GitLab',
  matches(_url: string, parsedUrl: URL): boolean {
    return parsedUrl.hostname.toLowerCase() === 'gitlab.com';
  },
  resolve(url: string, parsedUrl: URL): SourceProviderResolution | null {
    const pathname = parsedUrl.pathname;

    // 1. GitLab Blob -> Raw Content
    // https://gitlab.com/owner/repo/-/blob/branch/path/to/file.ts
    const blobMatch = pathname.match(/^\/([^/]+)\/([^/]+)\/-\/blob\/([^/]+)\/(.+)$/);
    if (blobMatch) {
      const [, owner, repo, branch, filePath] = blobMatch;
      const rawUrl = `https://gitlab.com/${owner}/${repo}/-/raw/${branch}/${filePath}`;
      return {
        rawUrl,
        origin: 'gitlab',
        label: `GitLab: ${owner}/${repo} (${filePath})`,
        language: detectLanguageFromPath(filePath),
      };
    }

    // 2. GitLab Snippets
    // https://gitlab.com/-/snippets/12345
    const snippetMatch = pathname.match(/^\/-\/snippets\/(\d+)(?:\/raw)?$/);
    if (snippetMatch) {
      const snippetId = snippetMatch[1];
      const rawUrl = `https://gitlab.com/-/snippets/${snippetId}/raw`;
      return {
        rawUrl,
        origin: 'gitlab',
        label: `GitLab Snippet #${snippetId}`,
        language: undefined,
      };
    }

    // 3. GitLab Direct Raw
    if (pathname.includes('/-/raw/')) {
      return {
        rawUrl: url,
        origin: 'gitlab',
        label: `GitLab Raw: ${pathname}`,
        language: detectLanguageFromPath(pathname),
      };
    }

    return null;
  },
};
