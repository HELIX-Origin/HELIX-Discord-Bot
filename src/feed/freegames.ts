import { fetchRaw } from './fetch.js';
import { decodeHtmlEntities, stripHtml } from './parser.js';

export type FreeGamePlatformKey =
  | 'gamerpower'
  | 'epic'
  | 'steam'
  | 'gog'
  | 'indiegala'
  | 'humble'
  | 'itchio'
  | 'ubisoft'
  | 'ea'
  | 'prime'
  | 'battlenet'
  | 'stove'
  | 'all';

export interface FreeGameItem {
  id: string;
  title: string;
  description: string;
  platform:
    | 'Epic Games Store'
    | 'Steam'
    | 'GOG'
    | 'IndieGala'
    | 'Humble Bundle'
    | 'Itch.io'
    | 'Ubisoft'
    | 'EA App'
    | 'Prime Gaming'
    | 'Battle.net'
    | 'Stove'
    | 'PC';
  platformKey: FreeGamePlatformKey;
  url: string;
  worth: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  endDate: string | null;
  publishedAt: string | null;
}

export const PLATFORM_BRANDING: Record<string, { name: string; color: number; iconUrl: string; tag: string }> = {
  epic: {
    name: 'Epic Games Store',
    color: 0x0078f2, // Epic blue
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@main/png/epic-games.png',
    tag: 'Epic Games',
  },
  steam: {
    name: 'Steam',
    color: 0x1b2838, // Steam navy
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@main/png/steam.png',
    tag: 'Steam',
  },
  gog: {
    name: 'GOG',
    color: 0x86328a, // GOG purple
    iconUrl:
      'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/2e/GOG.com_logo.svg&w=128&h=128&output=png',
    tag: 'GOG',
  },
  indiegala: {
    name: 'IndieGala',
    color: 0xe52534, // IndieGala red
    iconUrl: 'https://images.weserv.nl/?url=https://indiegala.com/favicon.ico&w=128&h=128&output=png',
    tag: 'IndieGala',
  },
  humble: {
    name: 'Humble Bundle',
    color: 0xcc292b, // Humble red
    iconUrl: 'https://cdn.jsdelivr.net/gh/selfhst/icons@main/png/humble-bundle.png',
    tag: 'Humble',
  },
  itchio: {
    name: 'Itch.io',
    color: 0xfa5c5c, // Itch red
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@main/png/itch.png',
    tag: 'Itch.io',
  },
  ubisoft: {
    name: 'Ubisoft',
    color: 0x0070ff, // Ubisoft blue
    iconUrl:
      'https://images.weserv.nl/?url=raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/ubisoft.svg&w=128&h=128&output=png',
    tag: 'Ubisoft',
  },
  ea: {
    name: 'EA App',
    color: 0xff4747, // EA red
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@main/png/origin.png',
    tag: 'EA',
  },
  prime: {
    name: 'Prime Gaming',
    color: 0x9146ff, // Twitch purple
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@main/png/amazon-prime.png',
    tag: 'Prime Gaming',
  },
  battlenet: {
    name: 'Battle.net',
    color: 0x00aeff, // Blizzard blue
    iconUrl:
      'https://images.weserv.nl/?url=raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/battledotnet.svg&w=128&h=128&output=png',
    tag: 'Battle.net',
  },
  stove: {
    name: 'Stove',
    color: 0xff6b00, // Stove orange
    iconUrl: 'https://images.weserv.nl/?url=page.onstove.com/favicon.ico&w=128&h=128&output=png',
    tag: 'Stove',
  },
  gamerpower: {
    name: 'GamerPower',
    color: 0x10b981,
    iconUrl: 'https://images.weserv.nl/?url=www.gamerpower.com/favicon.ico&w=128&h=128&output=png',
    tag: 'GamerPower',
  },
  all: {
    name: 'GamerPower Free Game Alerts',
    color: 0x10b981,
    iconUrl: 'https://images.weserv.nl/?url=www.gamerpower.com/favicon.ico&w=128&h=128&output=png',
    tag: 'All Platforms',
  },
};

/**
 * Fetch official free game promotions from Epic Games Store
 */
async function fetchEpicGamesPromotions(): Promise<FreeGameItem[]> {
  const url =
    'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US';
  try {
    const res = await fetchRaw(url);
    if (res.status >= 400 || !res.text) return [];

    const data = JSON.parse(res.text);
    const elements = data?.data?.Catalog?.searchStore?.elements;
    if (!Array.isArray(elements)) return [];

    const now = Date.now();
    const items: FreeGameItem[] = [];

    for (const el of elements) {
      // Find active 100% off promotions
      const promoOffers = el.promotions?.promotionalOffers?.[0]?.promotionalOffers;
      if (!Array.isArray(promoOffers) || promoOffers.length === 0) continue;

      const activeOffer = promoOffers.find(
        (offer: { startDate?: string; endDate?: string; discountSetting?: { discountPercentage?: number } }) => {
          if (!offer.startDate || !offer.endDate) return false;
          const start = new Date(offer.startDate).getTime();
          const end = new Date(offer.endDate).getTime();
          const is100Off = offer.discountSetting?.discountPercentage === 0;
          return now >= start && now < end && is100Off;
        },
      );

      if (!activeOffer) continue;

      const title = decodeHtmlEntities(el.title || 'Free Game on Epic Games Store');
      const desc = stripHtml(el.description || 'Claim this game for free on the Epic Games Store.') || '';

      // Determine product slug / URL
      let slug = el.productSlug || el.urlSlug;
      if (!slug && Array.isArray(el.catalogNs?.mappings) && el.catalogNs.mappings.length > 0) {
        slug = el.catalogNs.mappings[0].pageSlug;
      }
      if (!slug && Array.isArray(el.offerMappings) && el.offerMappings.length > 0) {
        slug = el.offerMappings[0].pageSlug;
      }
      const storeUrl = slug
        ? `https://store.epicgames.com/p/${slug.replace(/\/home$/, '')}`
        : 'https://store.epicgames.com/free-games';

      // Pick best banner image
      let imageUrl: string | null = null;
      if (Array.isArray(el.keyImages)) {
        const wide = el.keyImages.find(
          (img: { type?: string; url?: string }) =>
            img.url &&
            (img.type === 'OfferImageWide' ||
              img.type === 'DieselStoreFrontWide' ||
              img.type === 'featuredMedia' ||
              img.type === 'Thumbnail'),
        );
        imageUrl = wide?.url || el.keyImages[0]?.url || null;
      }

      // Format price/worth
      const origPrice = el.price?.totalPrice?.originalPrice;
      const fmtPrice = el.price?.totalPrice?.fmtPrice?.originalPrice;
      const worth = fmtPrice || (origPrice ? `$${(origPrice / 100).toFixed(2)}` : 'Free to Keep');

      // Format end date
      let endDateStr: string | null = null;
      if (activeOffer.endDate) {
        try {
          const d = new Date(activeOffer.endDate);
          endDateStr = d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
          });
        } catch {
          endDateStr = activeOffer.endDate;
        }
      }

      items.push({
        id: `epic:${el.id || slug || title}`,
        title,
        description: desc,
        platform: 'Epic Games Store',
        platformKey: 'epic',
        url: storeUrl,
        worth: worth.includes('Free') ? worth : `${worth} (100% OFF)`,
        imageUrl,
        thumbnailUrl: PLATFORM_BRANDING.epic.iconUrl,
        endDate: endDateStr,
        publishedAt: activeOffer.startDate || el.effectiveDate || null,
      });
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Resolves any redirect or aggregator URLs to the direct destination store page of the free game.
 * Follows HTTP 3xx redirects (up to maxHops) with manual redirect handling and timeout protection.
 */
export async function resolveDirectGiveawayUrl(rawUrl: string, maxHops = 5, timeoutMs = 5000): Promise<string> {
  if (!rawUrl || !rawUrl.startsWith('http')) return rawUrl;
  let currentUrl = rawUrl;

  for (let hop = 0; hop < maxHops; hop++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timer);

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return currentUrl;
}

/**
 * Accurately detects the storefront platform and key from the direct giveaway URL,
 * platform metadata, title, instructions, and description.
 */
export function detectStorePlatform(
  item: {
    platforms?: string;
    open_giveaway_url?: string;
    gamerpower_url?: string;
    title?: string;
    instructions?: string;
    description?: string;
  },
  directUrl?: string,
): { platform: FreeGameItem['platform']; platformKey: FreeGamePlatformKey } {
  const platformsStr = (item.platforms || '').toLowerCase();
  const titleStr = (item.title || '').toLowerCase();
  const instrStr = (item.instructions || '').toLowerCase();
  const descStr = (item.description || '').toLowerCase();
  const urlStr = (directUrl || item.open_giveaway_url || item.gamerpower_url || '').toLowerCase();

  // 1. Epic Games Store
  if (
    urlStr.includes('epicgames.com') ||
    platformsStr.includes('epic') ||
    titleStr.includes('(epic') ||
    titleStr.includes('[epic') ||
    titleStr.includes('epic games')
  ) {
    return { platform: 'Epic Games Store', platformKey: 'epic' };
  }

  // 2. GOG
  if (
    urlStr.includes('gog.com') ||
    platformsStr.includes('gog') ||
    titleStr.includes('(gog') ||
    titleStr.includes('[gog') ||
    titleStr.includes(' gog ')
  ) {
    return { platform: 'GOG', platformKey: 'gog' };
  }

  // 3. Stove
  if (
    urlStr.includes('onstove.com') ||
    platformsStr.includes('stove') ||
    titleStr.includes('(stove') ||
    titleStr.includes('[stove') ||
    titleStr.includes('stove')
  ) {
    return { platform: 'Stove', platformKey: 'stove' };
  }

  // 4. IndieGala
  if (
    urlStr.includes('indiegala.com') ||
    platformsStr.includes('indiegala') ||
    titleStr.includes('(indiegala') ||
    titleStr.includes('[indiegala') ||
    titleStr.includes('indiegala')
  ) {
    return { platform: 'IndieGala', platformKey: 'indiegala' };
  }

  // 5. Itch.io
  if (
    urlStr.includes('itch.io') ||
    platformsStr.includes('itch') ||
    titleStr.includes('(itch') ||
    titleStr.includes('[itch') ||
    titleStr.includes('itch.io')
  ) {
    return { platform: 'Itch.io', platformKey: 'itchio' };
  }

  // 6. Humble Bundle
  if (
    urlStr.includes('humblebundle.com') ||
    platformsStr.includes('humble') ||
    titleStr.includes('(humble') ||
    titleStr.includes('[humble') ||
    titleStr.includes('humble')
  ) {
    return { platform: 'Humble Bundle', platformKey: 'humble' };
  }

  // 7. Ubisoft
  if (
    urlStr.includes('ubisoft.com') ||
    platformsStr.includes('ubisoft') ||
    platformsStr.includes('uplay') ||
    titleStr.includes('ubisoft') ||
    titleStr.includes('uplay')
  ) {
    return { platform: 'Ubisoft', platformKey: 'ubisoft' };
  }

  // 8. EA App / Origin
  if (
    urlStr.includes('ea.com') ||
    urlStr.includes('origin.com') ||
    platformsStr.includes('origin') ||
    platformsStr.includes('ea app') ||
    titleStr.includes('ea app') ||
    titleStr.includes('origin')
  ) {
    return { platform: 'EA App', platformKey: 'ea' };
  }

  // 9. Prime Gaming
  if (
    urlStr.includes('gaming.amazon.com') ||
    urlStr.includes('amazon.com') ||
    platformsStr.includes('prime') ||
    platformsStr.includes('twitch prime') ||
    titleStr.includes('prime gaming')
  ) {
    return { platform: 'Prime Gaming', platformKey: 'prime' };
  }

  // 10. Battle.net
  if (
    urlStr.includes('battle.net') ||
    urlStr.includes('blizzard.com') ||
    platformsStr.includes('battlenet') ||
    platformsStr.includes('blizzard') ||
    titleStr.includes('battle.net')
  ) {
    return { platform: 'Battle.net', platformKey: 'battlenet' };
  }

  // 11. Steam (including Steam key giveaways on partner sites like Alienware Arena)
  if (
    urlStr.includes('steampowered.com') ||
    urlStr.includes('steamcommunity.com') ||
    urlStr.includes('steam') ||
    platformsStr.includes('steam') ||
    titleStr.includes('steam') ||
    instrStr.includes('steam') ||
    descStr.includes('steam')
  ) {
    return { platform: 'Steam', platformKey: 'steam' };
  }

  // 12. Fallback: PC DRM-Free / GamerPower
  return { platform: 'PC', platformKey: 'gamerpower' };
}

/**
 * Fetch giveaways from GamerPower API covering all PC storefronts
 */
async function fetchGamerPowerGiveaways(platformKey: FreeGamePlatformKey = 'all'): Promise<FreeGameItem[]> {
  // Always query GamerPower with type=game to retrieve all active game giveaways in a single call.
  // Upstream GamerPower returns 404 on individual platform queries like indiegala, humble, prime, etc.
  const url = 'https://www.gamerpower.com/api/giveaways?type=game';
  try {
    const res = await fetchRaw(url);
    if (res.status >= 400 || !res.text) return [];

    const data = JSON.parse(res.text);
    if (!Array.isArray(data)) return [];

    const activeData = data.filter((item) => item.status === 'Active');

    // Concurrently resolve direct giveaway URLs and assign accurate store platforms
    const resolvedItems = await Promise.all(
      activeData.map(async (item) => {
        const rawUrl = item.open_giveaway_url || item.gamerpower_url || '';
        const directUrl = await resolveDirectGiveawayUrl(rawUrl);
        const { platform: detectedPlatform, platformKey: detectedKey } = detectStorePlatform(item, directUrl);

        if (platformKey !== 'all' && platformKey !== 'gamerpower' && detectedKey !== platformKey) {
          return null;
        }

        const branding =
          PLATFORM_BRANDING[detectedKey] || PLATFORM_BRANDING['gamerpower'] || PLATFORM_BRANDING['steam'];
        const title = decodeHtmlEntities(item.title || 'Free Game Giveaway');
        const desc = stripHtml(item.description || item.instructions || '') || '';
        const worth = item.worth && item.worth !== 'N/A' ? `${item.worth} (100% OFF)` : 'Free to Keep';

        let endDateStr: string | null = null;
        if (item.end_date && item.end_date !== 'N/A') {
          try {
            const d = new Date(item.end_date);
            endDateStr = d.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
          } catch {
            endDateStr = item.end_date;
          }
        }

        return {
          id: `${detectedKey}:${item.id || title}`,
          title,
          description: desc,
          platform: detectedPlatform,
          platformKey: detectedKey,
          url: directUrl || rawUrl,
          worth,
          imageUrl: item.image || item.thumbnail || null,
          thumbnailUrl: branding.iconUrl,
          endDate: endDateStr,
          publishedAt: item.published_date || null,
        } as FreeGameItem;
      }),
    );

    return resolvedItems.filter((item): item is FreeGameItem => item !== null);
  } catch {
    return [];
  }
}

/**
 * Normalizes game titles by stripping store tags, parenthetical platforms, and giveaway suffixes.
 */
function normalizeGameTitle(title: string): string {
  let cleaned = decodeHtmlEntities(title);
  cleaned = cleaned.replace(/\s*[-–—]\s*(?:Steam|Epic|GOG|Ubisoft|PC|Stove).*$/i, '');
  cleaned = cleaned.replace(
    /\s*\([^)]*(?:epic|steam|gog|ubisoft|origin|ea|indie|humble|itch|prime|blizzard|battle\.net|pc|stove|giveaway|free)[^)]*\)/gi,
    '',
  );
  cleaned = cleaned.replace(
    /\s*\[[^\]]*(?:epic|steam|gog|ubisoft|origin|ea|indie|humble|itch|prime|blizzard|battle\.net|pc|stove|giveaway|free)[^\]]*\]/gi,
    '',
  );
  cleaned = cleaned.replace(/\b(?:giveaway|free to keep|free key|key giveaway|free)\b/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned || title.trim();
}

/**
 * Fetch unified free games list for any requested platform
 */
export async function fetchFreeGames(platform: FreeGamePlatformKey = 'gamerpower'): Promise<FreeGameItem[]> {
  const fetchers: Array<Promise<FreeGameItem[]>> = [];

  if (platform === 'epic' || platform === 'all') {
    fetchers.push(fetchEpicGamesPromotions());
  }

  if (platform === 'gamerpower' || platform === 'all') {
    fetchers.push(fetchGamerPowerGiveaways('all'));
  } else if (platform !== 'epic') {
    fetchers.push(fetchGamerPowerGiveaways(platform));
  }

  const results = await Promise.all(fetchers);
  const allItems = results.flat();

  // Deduplicate by clean normalized title + platformKey
  const seen = new Set<string>();
  const uniqueItems: FreeGameItem[] = [];

  for (const item of allItems) {
    const normTitle = normalizeGameTitle(item.title);
    const cleanKey = `${item.platformKey}:${normTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (seen.has(cleanKey)) continue;
    seen.add(cleanKey);
    if (normTitle && normTitle.length >= 2) {
      item.title = normTitle;
    }
    uniqueItems.push(item);
  }

  // Universal Redirect Rule: every giveaway url MUST link to the actual store page
  await Promise.all(
    uniqueItems.map(async (item) => {
      if (
        item.url &&
        (item.url.includes('gamerpower.com/open') || item.url.includes('bit.ly') || item.url.includes('t.co'))
      ) {
        item.url = await resolveDirectGiveawayUrl(item.url);
      }
    }),
  );

  return uniqueItems;
}
