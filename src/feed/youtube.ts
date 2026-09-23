import { fetchRaw } from './fetch.js';
import { parseFeed, type FeedEntry } from './parser.js';

export interface YouTubeVideoEntry {
  id: string;
  title: string;
  link: string;
  publishedAt: string;
  author?: string;
  description?: string;
  imageUrl?: string;
}

const channelIdCache = new Map<string, string>();

/**
 * Resolves a YouTube channel input (bare UC ID, @handle, channel URL, or feed URL)
 * into a canonical 24-character YouTube channel ID (UC...).
 */
export async function resolveYouTubeChannelId(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct 24-character channel ID (UC...)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Query param ?channel_id=UC...
  const queryMatch = /[?&]channel_id=(UC[a-zA-Z0-9_-]{22})/i.exec(trimmed);
  if (queryMatch?.[1]) {
    return queryMatch[1];
  }

  // 3. /channel/UC... or /c/UC...
  const pathMatch = /(?:^|\/)(?:channel|c)\/(UC[a-zA-Z0-9_-]{22})/i.exec(trimmed);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  // 4. Check cache for resolved handle/custom URL
  const cached = channelIdCache.get(trimmed);
  if (cached) return cached;

  // 5. Scrape channel page HTML to extract channelId
  let targetUrl = trimmed;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = targetUrl.startsWith('@')
      ? `https://www.youtube.com/${targetUrl}`
      : `https://www.youtube.com/@${targetUrl}`;
  }

  try {
    const res = await fetchRaw(targetUrl, {
      timeoutMs: 10_000,
    });
    if (res.status >= 200 && res.status < 300 && res.text) {
      const match =
        /channel_id=(UC[\w-]{22})/.exec(res.text) ??
        /"externalId"\s*:\s*"(UC[\w-]{22})"/.exec(res.text) ??
        /<meta\s+itemprop="channelId"\s+content="(UC[\w-]{22})"/i.exec(res.text);
      if (match?.[1]) {
        channelIdCache.set(trimmed, match[1]);
        return match[1];
      }
    }
  } catch {
    // Best-effort handle resolution
  }

  return null;
}

/**
 * Normalizes any YouTube URL or handle into the canonical public Atom XML feed URL.
 */
export async function resolveYouTubeXmlUrl(input: string): Promise<string> {
  const channelId = await resolveYouTubeChannelId(input);
  if (channelId) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }
  return input.trim();
}

/**
 * Parses a YouTube public Atom XML feed string into standardized YouTubeVideoEntry objects.
 */
export function parseYouTubeAtomXml(xml: string): YouTubeVideoEntry[] {
  const parsed = parseFeed(xml);
  return parsed.entries.map((entry: FeedEntry) => {
    const videoId = entry.id.replace(/^yt:video:/, '') || (entry.link.match(/v=([a-zA-Z0-9_-]+)/)?.[1] ?? '');
    return {
      id: videoId || entry.id,
      title: entry.title,
      link: entry.link || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''),
      publishedAt: entry.publishedAt || new Date().toISOString(),
      author: entry.author || parsed.title,
      description: entry.description || undefined,
      imageUrl: entry.imageUrl || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined),
    };
  });
}
