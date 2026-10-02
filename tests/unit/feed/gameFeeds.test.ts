/**
 * tests/unit/feed/gameFeeds.test.ts
 *
 * Unit tests for Game Feeds (Deals & Promotions, Patch Notes) embeds, dispatchers, and categorization.
 */
import { describe, it, expect, vi } from 'vitest';
import { gameDealsEmbed, patchNotesEmbed } from '../../../src/bot/utils/embeds.js';
import { type GameDealItem, fetchGameDeals } from '../../../src/feed/gamedeals.js';
import { type PatchNoteItem, fetchPatchNotes, POPULAR_STEAM_GAMES } from '../../../src/feed/patchnotes.js';
import { feedCategory, rowToFeed } from '../../../src/state/types.js';

describe('Game Deals Embed & Branding', () => {
  it('omits footer from gameDealsEmbed and formats pricing fields', () => {
    const deal: GameDealItem = {
      id: 'deal_cs_123',
      title: 'Cyberpunk 2077: Phantom Liberty',
      description: 'Save 50% on Cyberpunk 2077!',
      dealUrl: 'https://www.cheapshark.com/redirect?dealID=123',
      directUrl: 'https://store.steampowered.com/app/2138330/',
      store: 'Steam',
      storeKey: 'steam',
      salePrice: '14.99',
      normalPrice: '29.99',
      savings: '50%',
      discountPercent: 50,
      imageUrl: 'https://cdn.example.com/cyberpunk.jpg',
      publishedAt: '2026-10-02T12:00:00Z',
    };

    const embed = gameDealsEmbed({
      ...deal,
      url: deal.directUrl,
    });

    // Footer must be completely omitted
    expect(embed.footer).toBeUndefined();

    // Author must represent the store
    expect(embed.author?.name).toBe('🏷️ Steam Deal — 50% OFF');

    // Field checks
    const storeField = embed.fields?.find((f) => f.name.includes('Platform'));
    expect(storeField).toBeDefined();
    expect(storeField?.value).toBe('Steam');

    const salePriceField = embed.fields?.find((f) => f.name.includes('Sale Price'));
    expect(salePriceField).toBeDefined();
    expect(salePriceField?.value).toContain('$14.99');

    const discountField = embed.fields?.find((f) => f.name.includes('Discount'));
    expect(discountField).toBeDefined();
    expect(discountField?.value).toBe('**-50%**');

    const linkField = embed.fields?.find((f) => f.name.includes('Store Page'));
    expect(linkField).toBeDefined();
    expect(linkField?.value).toContain('https://store.steampowered.com/app/2138330/');
  });
});

describe('Patch Notes Embed & Branding', () => {
  it('omits footer from patchNotesEmbed and includes version and summary', () => {
    const patch: PatchNoteItem = {
      id: 'steam_patch_456',
      gameTitle: 'Counter-Strike 2',
      patchTitle: 'Release Notes for 10/2/2026 - Update 1.40.2',
      version: '1.40.2',
      url: 'https://store.steampowered.com/news/app/730/view/456',
      summary: 'Fixed various smoke rendering glitches and optimized network latency.',
      imageUrl: 'https://cdn.example.com/cs2-update.jpg',
      publishedAt: '2026-10-02T12:00:00Z',
    };

    const embed = patchNotesEmbed(patch);

    // Footer must be completely omitted
    expect(embed.footer).toBeUndefined();

    // Author must represent the game
    expect(embed.author?.name).toBe('🛠️ Counter-Strike 2 Patch Notes (v1.40.2)');

    // Fields
    const gameField = embed.fields?.find((f) => f.name.includes('Game'));
    expect(gameField).toBeDefined();
    expect(gameField?.value).toBe('Counter-Strike 2');

    const versionField = embed.fields?.find((f) => f.name.includes('Version'));
    expect(versionField).toBeDefined();
    expect(versionField?.value).toBe('`1.40.2`');

    const readField = embed.fields?.find((f) => f.name.includes('Changelog'));
    expect(readField).toBeDefined();
    expect(readField?.value).toContain('Read Full Patch Notes');
  });
});

describe('Feed Categorization for Game Feeds', () => {
  it('maps game_deals and game_patchnotes feed types to their respective categories', () => {
    expect(feedCategory('free_games')).toBe('freegames');
    expect(feedCategory('free_games_gamerpower')).toBe('freegames');
    expect(feedCategory('free_games_epic')).toBe('freegames');
    expect(feedCategory('game_deals_all')).toBe('gamedeals');
    expect(feedCategory('game_deals_steam')).toBe('gamedeals');
    expect(feedCategory('game_deals_gog')).toBe('gamedeals');
    expect(feedCategory('game_patchnotes_cs2')).toBe('patchnotes');
    expect(feedCategory('game_patchnotes_helldivers2')).toBe('patchnotes');
  });

  it('safely handles null or undefined feed types', () => {
    expect(feedCategory(null as never)).toBeNull();
    expect(feedCategory(undefined as never)).toBeNull();
  });
});

describe('Game Presets & Dispatchers', () => {
  it('contains popular steam games with valid appIds', () => {
    expect(POPULAR_STEAM_GAMES.cs2.appId).toBe('730');
    expect(POPULAR_STEAM_GAMES.dota2.appId).toBe('570');
    expect(POPULAR_STEAM_GAMES.rust.appId).toBe('252490');
    expect(POPULAR_STEAM_GAMES.helldivers2.appId).toBe('553850');
    expect(POPULAR_STEAM_GAMES.apex.appId).toBe('1172470');
  });
});

/**
 * Regression guard: the `FeedType` union and the runtime `isFeedType()` list used
 * to drift apart. `rowToFeed` fell back to `rss` for any type missing from the
 * runtime list, so dashboard-created Deals / Patch Notes feeds were silently
 * coerced and stopped being polled as game feeds.
 */
describe('Game feed types survive database round-trips', () => {
  const baseRow = {
    id: 1,
    user_id: 1,
    name: 'Steam Deals & Sales',
    url: 'gamedeals://steam',
    topic: null,
    channel_id: 'chan-1',
    guild_id: 'guild-100',
    enabled: 1,
    scrape_item: null,
    scrape_title: null,
    scrape_link: null,
    scrape_description: null,
    last_entry_id: null,
    last_checked_at: null,
    last_posted_at: null,
    role_id: null,
    thread_channel_id: null,
    thread_entry_count: 0,
    created_at: '2026-10-02T00:00:00.000Z',
  };

  it.each([
    'game_deals',
    'game_deals_all',
    'game_deals_steam',
    'game_deals_gog',
    'game_deals_epic',
    'game_deals_humble',
    'game_patchnotes',
    'game_patchnotes_cs2',
    'game_patchnotes_dota2',
    'game_patchnotes_rust',
    'game_patchnotes_helldivers2',
    'game_patchnotes_apex',
    'game_patchnotes_cyberpunk',
    'game_patchnotes_bg3',
    'game_patchnotes_terraria',
    'game_patchnotes_dbd',
    'game_patchnotes_warframe',
    'game_patchnotes_nomansky',
    'free_games',
    'free_games_gamerpower',
    'free_games_epic',
  ])('rowToFeed preserves feed_type %s', (feedType) => {
    const feed = rowToFeed({ ...baseRow, feed_type: feedType });
    expect(feed?.feedType).toBe(feedType);
  });

  it('still falls back to rss for genuinely unknown feed types', () => {
    const feed = rowToFeed({ ...baseRow, feed_type: 'not_a_real_feed_type' });
    expect(feed?.feedType).toBe('rss');
  });
});
