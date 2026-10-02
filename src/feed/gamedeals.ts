import { fetchRaw } from './fetch.js';
import { resolveDirectGiveawayUrl, detectStorePlatform, PLATFORM_BRANDING } from './freegames.js';
import { decodeHtmlEntities, stripHtml } from './parser.js';

export interface GameDealItem {
  id: string;
  title: string;
  description: string;
  dealUrl: string;
  directUrl: string;
  store: string;
  storeKey: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  discountPercent: number;
  imageUrl: string | null;
  publishedAt: string;
}

const CHEAPSHARK_STORE_MAP: Record<string, { name: string; key: string }> = {
  '1': { name: 'Steam', key: 'steam' },
  '2': { name: 'GamersGate', key: 'gamersgate' },
  '3': { name: 'GreenManGaming', key: 'greenmangaming' },
  '7': { name: 'GOG', key: 'gog' },
  '11': { name: 'Humble Bundle', key: 'humble' },
  '15': { name: 'Fanatical', key: 'fanatical' },
  '25': { name: 'Epic Games Store', key: 'epic' },
  '31': { name: 'Blizzard Battle.net', key: 'battlenet' },
  '35': { name: 'Stove', key: 'stove' },
};

/**
 * Fetches top PC game deals and promotions from CheapShark API.
 */
async function fetchCheapSharkDeals(storeId?: string): Promise<GameDealItem[]> {
  const storeParam = storeId ? `&storeID=${encodeURIComponent(storeId)}` : '';
  const url = `https://www.cheapshark.com/api/1.0/deals?sortBy=Savings&pageSize=20${storeParam}`;

  try {
    const res = await fetchRaw(url, { timeoutMs: 10_000 });
    if (res.status < 200 || res.status >= 300 || !res.text) {
      return [];
    }

    const data = JSON.parse(res.text) as Array<{
      dealID: string;
      title: string;
      storeID: string;
      gameID: string;
      salePrice: string;
      normalPrice: string;
      savings: string;
      metacriticScore: string;
      steamRatingText?: string;
      thumb?: string;
      lastChange?: number;
    }>;

    if (!Array.isArray(data)) return [];

    const deals: GameDealItem[] = [];

    for (const item of data) {
      const discount = Math.round(parseFloat(item.savings) || 0);
      if (discount <= 0) continue;

      const storeInfo = CHEAPSHARK_STORE_MAP[item.storeID] ?? { name: 'PC Store', key: 'pc' };
      const rawDealUrl = `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(item.dealID)}`;

      // Resolve redirect to actual storefront page
      const directUrl = await resolveDirectGiveawayUrl(rawDealUrl);
      const { platform: detectedPlatform } = detectStorePlatform({ title: item.title }, directUrl ?? undefined);

      deals.push({
        id: `deal_cs_${item.dealID}`,
        title: decodeHtmlEntities(item.title),
        description: `Save ${discount}% on ${item.title}! On sale for $${item.salePrice} (regularly $${item.normalPrice}).`,
        dealUrl: rawDealUrl,
        directUrl: directUrl || rawDealUrl,
        store: detectedPlatform !== 'PC' ? detectedPlatform : storeInfo.name,
        storeKey: storeInfo.key,
        salePrice: item.salePrice,
        normalPrice: item.normalPrice,
        savings: `${discount}%`,
        discountPercent: discount,
        imageUrl: item.thumb || null,
        publishedAt: item.lastChange ? new Date(item.lastChange * 1000).toISOString() : new Date().toISOString(),
      });
    }

    return deals;
  } catch {
    return [];
  }
}

/**
 * Main game deals dispatcher.
 */
export async function fetchGameDeals(feedUrl: string): Promise<GameDealItem[]> {
  const clean = feedUrl.replace(/^gamedeals:\/\//i, '').trim().toLowerCase();
  if (clean === 'steam') {
    return fetchCheapSharkDeals('1');
  }
  if (clean === 'gog') {
    return fetchCheapSharkDeals('7');
  }
  if (clean === 'epic') {
    return fetchCheapSharkDeals('25');
  }
  if (clean === 'humble') {
    return fetchCheapSharkDeals('11');
  }
  return fetchCheapSharkDeals();
}
