/**
 * src/plugins/sdk/source-providers/github.ts
 * ──────────────────────────────────────────────────────────────────────────
 * GitHub source provider (repositories, blobs, raw content, and gists).
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { SourceProvider, SourceProviderResolution } from '../../types.js';
import { detectLanguageFromPath } from '../source-resolver.js';

export const githubSourceProvider: SourceProvider = {
  id: 'github',
  name: 'GitHub',
  matches(_url: string, parsedUrl: URL): boolean {
    const host = parsedUrl.hostname.toLowerCase();
    return (
      host === 'github.com' ||
      host === 'raw.githubusercontent.com' ||
      host === 'gist.github.com' ||
      host === 'gist.githubusercontent.com'
    );
  },
  resolve(url: string, parsedUrl: URL): SourceProviderResolution | null {
    const host = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;

    // 1. GitHub Blob -> Raw Content
    // https://github.com/owner/repo/blob/branch/path/to/file.ts
    if (host === 'github.com' && !pathname.startsWith('/gist/')) {
      const match = pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
      if (match) {
        const [, owner, repo, branch, filePath] = match;
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        return {
          rawUrl,
          origin: 'github',
          label: `GitHub: ${owner}/${repo} (${filePath})`,
          language: detectLanguageFromPath(filePath),
        };
      }
    }

    // 2. GitHub Raw URL Direct
    if (host === 'raw.githubusercontent.com') {
      const match = pathname.match(/^\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
      const label = match ? `GitHub: ${match[1]}/${match[2]} (${match[4]})` : `GitHub Raw: ${pathname}`;
      return {
        rawUrl: url,
        origin: 'github',
        label,
        language: detectLanguageFromPath(pathname),
      };
    }

    // 3. GitHub Gist
    // https://gist.github.com/owner/gist_id or https://gist.githubusercontent.com/owner/gist_id/raw
    if (host === 'gist.github.com') {
      const match = pathname.match(/^\/([^/]+)\/([a-f0-9]+)(?:\/raw)?$/i);
      if (match) {
        const [, owner, gistId] = match;
        const rawUrl = `https://gist.githubusercontent.com/${owner}/${gistId}/raw`;
        return {
          rawUrl,
          origin: 'gist',
          label: `GitHub Gist: ${owner}/${gistId}`,
          language: detectLanguageFromPath(pathname),
        };
      }
    }

    if (host === 'gist.githubusercontent.com') {
      return {
        rawUrl: url,
        origin: 'gist',
        label: `GitHub Gist: ${pathname}`,
        language: detectLanguageFromPath(pathname),
      };
    }

    return null;
  },
};
