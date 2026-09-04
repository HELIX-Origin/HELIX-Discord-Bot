/**
 * src/plugins/sdk/source-providers/pastebin.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Pastebin / Hastebin source provider.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { SourceProvider, SourceProviderResolution } from '../../types.js';

export const pastebinSourceProvider: SourceProvider = {
  id: 'pastebin',
  name: 'Pastebin',
  matches(_url: string, parsedUrl: URL): boolean {
    const host = parsedUrl.hostname.toLowerCase();
    return host === 'pastebin.com' || host === 'hastebin.com';
  },
  resolve(url: string, parsedUrl: URL): SourceProviderResolution | null {
    const host = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;

    if (host === 'pastebin.com') {
      if (pathname.startsWith('/raw/')) {
        return {
          rawUrl: url,
          origin: 'url',
          label: `Pastebin: ${pathname.replace('/raw/', '')}`,
        };
      }
      const id = pathname.replace(/^\//, '');
      if (id && !id.includes('/')) {
        return {
          rawUrl: `https://pastebin.com/raw/${id}`,
          origin: 'url',
          label: `Pastebin: ${id}`,
        };
      }
    }

    if (host === 'hastebin.com') {
      if (pathname.startsWith('/raw/')) {
        return {
          rawUrl: url,
          origin: 'url',
          label: `Hastebin: ${pathname.replace('/raw/', '')}`,
        };
      }
      const id = pathname.replace(/^\//, '');
      if (id && !id.includes('/')) {
        return {
          rawUrl: `https://hastebin.com/raw/${id}`,
          origin: 'url',
          label: `Hastebin: ${id}`,
        };
      }
    }

    return null;
  },
};
