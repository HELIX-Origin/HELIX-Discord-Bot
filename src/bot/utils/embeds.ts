import { appDisplayName, type AppDeps } from '../../app.js';
import { decodeHtmlEntities, extractImageFromHtml, isTrackingPixel, normalizeImageUrl } from '../../feed/parser.js';
import { PLATFORM_BRANDING, type FreeGameItem } from '../../feed/freegames.js';
import type { DiscordEmbed, DiscordEmbedField } from './types.js';

export type Embed = DiscordEmbed;

interface EmbedColors {
  readonly PRIMARY: number;
  readonly SUCCESS: number;
  readonly WARNING: number;
  readonly ERROR: number;
  readonly INFO: number;
  readonly DISCORD: number;
}

export const EMBED_COLORS: EmbedColors = {
  PRIMARY: 0x06b6d4,
  SUCCESS: 0x10b981,
  WARNING: 0xf59e0b,
  ERROR: 0xef4444,
  INFO: 0x3b82f6,
  DISCORD: 0x5865f2,
};

const STANDARD_EMBED_COLOR = EMBED_COLORS.PRIMARY;
const REDDIT_EMBED_COLOR = 0xff4500;

export function createEmbed(overrides: Partial<DiscordEmbed> = {}): DiscordEmbed {
  return {
    color: EMBED_COLORS.PRIMARY,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'HELIX Discord Bot',
      icon_url: undefined,
    },
    ...overrides,
  };
}

export function successEmbed(title: string, description?: string, fields?: DiscordEmbedField[]): DiscordEmbed {
  return createEmbed({
    color: EMBED_COLORS.SUCCESS,
    title: `✅ ${title}`,
    description,
    fields,
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export interface AppBranding {
  appName: string;
  iconUrl: string | null;
}

export function appBranding(deps: AppDeps): AppBranding {
  return {
    appName: appDisplayName(deps),
    iconUrl: deps.bot?.getAppIconUrl() ?? null,
  };
}

export function brandAuthor(branding: AppBranding): { name: string; icon_url?: string } {
  const author: { name: string; icon_url?: string } = { name: branding.appName };
  if (branding.iconUrl) {
    author.icon_url = branding.iconUrl;
  }
  return author;
}

const MAX_TITLE_LENGTH = 200;
const STANDARD_DESC_LENGTH = 400;

export function formatReadableUrlLabel(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./i, '');
    let path = parsed.pathname.replace(/\/+$/, '');
    if (!path || path === '/') {
      return host;
    }
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 2) {
      path = `/${segments[0]}/.../${segments[segments.length - 1]}`;
    }
    const combined = `${host}${path}`;
    return combined.length > 36 ? `${combined.slice(0, 33)}...` : combined;
  } catch {
    return 'Link';
  }
}

export function cleanTitle(title: string, maxLength = MAX_TITLE_LENGTH): string {
  if (!title) return 'Untitled';
  let t = title.replace(/<[^>]+>/g, ' ');
  t = decodeHtmlEntities(t);
  t = t.replace(/\s+/g, ' ').trim();
  if (t.length > maxLength) {
    const cutoff = t.lastIndexOf(' ', maxLength);
    t = `${t.slice(0, cutoff > maxLength * 0.7 ? cutoff : maxLength).trimEnd()}...`;
  }
  return t || 'Untitled';
}

export function isValidEmbedImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('1x1') ||
    lower.includes('pixel.gif') ||
    lower.includes('spacer.gif') ||
    lower.includes('feedburner.com') ||
    lower.includes('feedsportal.com') ||
    lower.includes('statcounter.com') ||
    lower.includes('gravatar.com/avatar/default') ||
    lower.includes('data:image') ||
    lower.endsWith('.svg')
  ) {
    return false;
  }
  return true;
}

interface ExtractedLink {
  label: string;
  url: string;
}

export function extractDescriptionAndLinks(
  raw: string | null,
  targetLength = STANDARD_DESC_LENGTH,
): { description: string | null; links: ExtractedLink[] } {
  if (!raw) return { description: null, links: [] };

  const links: ExtractedLink[] = [];
  const seenUrls = new Set<string>();

  let text = raw
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<audio[\s\S]*?<\/audio>/gi, '')
    .replace(/<video[\s\S]*?<\/video>/gi, '');

  text = text.replace(/<img[^>]*?(?:width=["']1["']|height=["']1["']|tracking|feedburner)[^>]*>/gi, '');

  text = text.replace(
    /<a\s+[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, inner: string) => {
      const cleanUrl = href.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) return '';

      const cleanInner = inner
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const decodedInner = decodeHtmlEntities(cleanInner);

      const lowerInner = decodedInner.toLowerCase();
      const isBoilerplate =
        lowerInner === '[link]' ||
        lowerInner === '[comments]' ||
        lowerInner === 'link' ||
        lowerInner === 'comments' ||
        lowerInner === 'read more' ||
        lowerInner === 'continue reading' ||
        lowerInner.startsWith('http://') ||
        lowerInner.startsWith('https://');

      let label = isBoilerplate || !decodedInner ? formatReadableUrlLabel(cleanUrl) : decodedInner;
      if (label.length > 45) {
        label = `${label.slice(0, 42).trimEnd()}...`;
      }

      if (!seenUrls.has(cleanUrl) && !isTrackingPixel(cleanUrl)) {
        seenUrls.add(cleanUrl);
        links.push({ label, url: cleanUrl });
      }

      return isBoilerplate ? ' ' : decodedInner;
    },
  );

  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n');

  text = text.replace(/<[^>]+>/g, ' ');

  text = decodeHtmlEntities(text);

  text = text.replace(/https?:\/\/[^\s<>)\]]+/gi, (rawUrl) => {
    let cleanUrl = rawUrl;
    const punctMatch = cleanUrl.match(/[.,;:!?)]+$/);
    if (punctMatch) {
      cleanUrl = cleanUrl.slice(0, -punctMatch[0].length);
    }
    if (!seenUrls.has(cleanUrl) && !isTrackingPixel(cleanUrl)) {
      seenUrls.add(cleanUrl);
      links.push({ label: formatReadableUrlLabel(cleanUrl), url: cleanUrl });
    }
    return '';
  });

  text = text
    .replace(/\bThe post .* appeared first on .*\.?/gi, '')
    .replace(/\bRead more at .*\.?/gi, '')
    .replace(/\[\s*&#8230;\s*\]/g, '…')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) return { description: null, links };

  if (text.length > targetLength) {
    const cutoff = text.lastIndexOf(' ', targetLength);
    text = `${text.slice(0, cutoff > targetLength * 0.6 ? cutoff : targetLength).trimEnd()}…`;
  }

  return { description: text || null, links };
}

export function feedEmbed(args: {
  title: string;
  url: string;
  description?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  feedTitle: string;
  color?: number;
  imageUrl?: string | null;
  feedType?: string;
  brandIconUrl?: string | null;
}): DiscordEmbed {
  const { title, url, description, author, publishedAt, feedTitle, imageUrl, feedType, brandIconUrl } = args;
  const isRedditImageFeed = feedType === 'reddit';
  const isRedditDomain = /reddit\.com\/(?:r|user)\//i.test(url);
  const color = args.color ?? (isRedditImageFeed || isRedditDomain ? REDDIT_EMBED_COLOR : STANDARD_EMBED_COLOR);
  const cleanT = cleanTitle(title);
  const embedIcon = brandIconUrl ?? null;

  const embed: DiscordEmbed = {
    title: cleanT,
    url,
    color,
  };

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (!isRedditImageFeed) {
    const { description: cleanDesc, links } = extractDescriptionAndLinks(description ?? null, STANDARD_DESC_LENGTH);
    if (cleanDesc) {
      embed.description = cleanDesc;
    }

    if (url && isRedditDomain) {
      fields.push({
        name: '💬 Discussion',
        value: `[View on Reddit 💬](${url})`,
        inline: true,
      });
    }

    const extraLinks = links.filter((l) => l.url !== url && !url.includes(l.url) && !l.url.includes(url)).slice(0, 3);
    if (extraLinks.length > 0) {
      fields.push({
        name: '📎 Related Links',
        value: extraLinks.map((l) => `• [${l.label}](${l.url})`).join('\n'),
        inline: extraLinks.length === 1,
      });
    }

    if (embedIcon) {
      embed.thumbnail = { url: embedIcon };
    }
  }

  if (fields.length > 0) {
    embed.fields = fields;
  }

  if (author) {
    let authorName = cleanTitle(author, 100);
    if (isRedditImageFeed || isRedditDomain) {
      authorName = authorName.replace(/^(\/?u\/)+/i, '');
      authorName = `u/${authorName}`;
    }
    embed.author = { name: authorName };
    if (embedIcon) {
      embed.author.icon_url = embedIcon;
    }
  }

  embed.footer = { text: feedTitle };

  if (publishedAt) {
    embed.timestamp = normalizeTimestamp(publishedAt);
  }

  const rawImage = imageUrl ?? extractImageFromHtml(description ?? null);
  const primaryImage = normalizeImageUrl(rawImage);
  if (primaryImage && isValidEmbedImageUrl(primaryImage)) {
    embed.image = { url: primaryImage.trim() };
  }

  return embed;
}

export function freeGameEmbed(game: FreeGameItem, feedTitle = 'Free Games'): DiscordEmbed {
  const branding = PLATFORM_BRANDING[game.platformKey] ||
    PLATFORM_BRANDING['epic'] || {
      name: game.platform,
      color: 0x10b981,
      iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@main/png/epic-games.png',
    };

  const cleanT = cleanTitle(game.title);
  const embed: DiscordEmbed = {
    title: cleanT,
    url: game.url,
    color: branding.color,
    author: {
      name: `${branding.name} · Free Game`,
      icon_url: branding.iconUrl,
    },
    footer: {
      text: `${feedTitle} · Weekly Free Games`,
    },
  };

  if (branding.iconUrl) {
    embed.thumbnail = { url: branding.iconUrl };
  }

  const { description: cleanDesc } = extractDescriptionAndLinks(game.description, STANDARD_DESC_LENGTH);
  if (cleanDesc) {
    embed.description = cleanDesc;
  }

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '🏷️ Platform',
      value: game.platform,
      inline: true,
    },
    {
      name: '💰 Value',
      value: game.worth || 'Free to Keep',
      inline: true,
    },
  ];

  if (game.endDate) {
    fields.push({
      name: '⏰ Availability',
      value: game.endDate,
      inline: true,
    });
  }

  if (game.url) {
    fields.push({
      name: '🔗 Claim Game',
      value: `[Claim Free on ${game.platform} ↗](${game.url})`,
      inline: true,
    });
  }

  embed.fields = fields;

  if (game.publishedAt) {
    embed.timestamp = normalizeTimestamp(game.publishedAt);
  }

  const primaryImage = normalizeImageUrl(game.imageUrl);
  if (primaryImage && isValidEmbedImageUrl(primaryImage)) {
    embed.image = { url: primaryImage.trim() };
  }

  return embed;
}

function normalizeTimestamp(value: string): string | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function streamAlertEmbed(args: {
  title: string;
  url: string;
  description?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  feedTitle: string;
  color?: number;
  imageUrl?: string | null;
  feedType?: string;
  brandIconUrl?: string | null;
  game?: string | null;
  viewers?: number | null;
}): DiscordEmbed {
  const { title, url, description, author, publishedAt, feedTitle, imageUrl, feedType, brandIconUrl, game, viewers } =
    args;
  const isYouTube = feedType === 'youtube';
  const isTwitch = feedType === 'twitch';
  const color = isTwitch ? 0x9146ff : isYouTube ? 0xff0000 : 0x06b6d4;
  const cleanT = cleanTitle(title);
  const embedIcon = brandIconUrl ?? null;

  const embed: DiscordEmbed = {
    title: cleanT,
    url,
    color,
  };

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (isTwitch) {
    fields.push(
      { name: '🎮 Category', value: game || description || 'Live Streaming', inline: true },
      { name: '👥 Viewers', value: viewers != null ? `${viewers.toLocaleString()} viewers` : 'Live', inline: true },
    );
  } else if (isYouTube) {
    fields.push({ name: '▶️ Type', value: publishedAt?.includes('T') ? 'Video Upload' : 'Video', inline: true });
  }

  const { description: cleanDesc, links } = extractDescriptionAndLinks(description ?? null, STANDARD_DESC_LENGTH);
  if (cleanDesc) {
    embed.description = cleanDesc;
  }

  if (links.length > 0) {
    fields.push({
      name: '🔗 Links',
      value: links.map((l) => `• [${l.label}](${l.url})`).join('\n'),
      inline: false,
    });
  }

  const extraLinks = links.filter((l) => l.url !== url && !url.includes(l.url) && !l.url.includes(url)).slice(0, 3);
  if (extraLinks.length > 0) {
    fields.push({
      name: '📎 Related Links',
      value: extraLinks.map((l) => `• [${l.label}](${l.url})`).join('\n'),
      inline: extraLinks.length === 1,
    });
  }

  if (fields.length > 0) {
    embed.fields = fields;
  }

  if (author) {
    let authorName = cleanTitle(author, 100);
    if (isYouTube) {
      authorName = `📺 ${authorName}`;
    } else if (isTwitch) {
      authorName = `🟣 ${authorName}`;
    }
    embed.author = { name: authorName };
    if (embedIcon) {
      embed.author.icon_url = embedIcon;
    }
  }

  embed.footer = { text: feedTitle };

  if (publishedAt) {
    embed.timestamp = normalizeTimestamp(publishedAt);
  }

  const rawImage = imageUrl ?? extractImageFromHtml(description ?? null);
  const primaryImage = normalizeImageUrl(rawImage);
  if (primaryImage && isValidEmbedImageUrl(primaryImage)) {
    embed.image = { url: primaryImage.trim() };
  }

  return embed;
}
