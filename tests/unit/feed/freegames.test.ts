/**
 * tests/unit/feed/freegames.test.ts
 *
 * Unit tests for Free Game Alerts embed generation and platform branding.
 */
import { describe, it, expect } from 'vitest';
import { freeGameEmbed } from '../../../src/bot/utils/embeds.js';
import {
  PLATFORM_BRANDING,
  type FreeGameItem,
  resolveDirectGiveawayUrl,
  detectStorePlatform,
} from '../../../src/feed/freegames.js';

describe('Free Games Embed & Branding', () => {
  it('omits footer from freeGameEmbed to avoid incorrect or confusing metadata', () => {
    const item: FreeGameItem = {
      id: 'steam:12345',
      title: 'Portal 2',
      description: 'A puzzle-platform game.',
      platform: 'Steam',
      platformKey: 'steam',
      url: 'https://store.steampowered.com/app/620/Portal_2/',
      worth: '$9.99 (100% OFF)',
      imageUrl: 'https://cdn.example.com/banner.jpg',
      thumbnailUrl: PLATFORM_BRANDING.steam.iconUrl,
      endDate: 'Sun, Oct 11',
      publishedAt: '2026-10-02T12:00:00Z',
    };

    const embed = freeGameEmbed(item, 'GamerPower Free Game Alerts');

    // Footer must be completely absent
    expect(embed.footer).toBeUndefined();

    // Author must represent the platform
    expect(embed.author?.name).toBe('Steam · Free Game');
    expect(embed.author?.icon_url).toBe(PLATFORM_BRANDING.steam.iconUrl);

    // Platform must be present as a field
    const platformField = embed.fields?.find((f) => f.name.includes('Platform'));
    expect(platformField).toBeDefined();
    expect(platformField?.value).toBe('Steam');

    // Value and claim link must be present
    const valueField = embed.fields?.find((f) => f.name.includes('Value'));
    expect(valueField?.value).toBe('$9.99 (100% OFF)');

    const claimField = embed.fields?.find((f) => f.name.includes('Claim Game'));
    expect(claimField?.value).toContain('Claim Free on Steam');
  });

  it('provides platform branding for gamerpower and all platforms', () => {
    expect(PLATFORM_BRANDING.gamerpower).toBeDefined();
    expect(PLATFORM_BRANDING.gamerpower.name).toBe('GamerPower');
    expect(PLATFORM_BRANDING.gamerpower.iconUrl).toContain('gamerpower.com');

    expect(PLATFORM_BRANDING.all).toBeDefined();
    expect(PLATFORM_BRANDING.all.name).toBe('GamerPower Free Game Alerts');
    expect(PLATFORM_BRANDING.all.iconUrl).toContain('gamerpower.com');
  });

  it('renders correct embed author and fields for Epic Games giveaway', () => {
    const item: FreeGameItem = {
      id: 'epic:sample-game',
      title: 'Sample Adventure',
      description: 'An epic adventure game.',
      platform: 'Epic Games Store',
      platformKey: 'epic',
      url: 'https://store.epicgames.com/p/sample-adventure',
      worth: 'Free to Keep',
      imageUrl: 'https://cdn.example.com/epic.jpg',
      thumbnailUrl: PLATFORM_BRANDING.epic.iconUrl,
      endDate: 'Thu, Oct 15',
      publishedAt: null,
    };

    const embed = freeGameEmbed(item);
    expect(embed.footer).toBeUndefined();
    expect(embed.author?.name).toBe('Epic Games Store · Free Game');
    expect(embed.author?.icon_url).toBe(PLATFORM_BRANDING.epic.iconUrl);

    const platformField = embed.fields?.find((f) => f.name.includes('Platform'));
    expect(platformField?.value).toBe('Epic Games Store');
  });

  it('provides platform branding for stove storefront', () => {
    expect(PLATFORM_BRANDING.stove).toBeDefined();
    expect(PLATFORM_BRANDING.stove.name).toBe('Stove');
    expect(PLATFORM_BRANDING.stove.color).toBe(0xff6b00);
    expect(PLATFORM_BRANDING.stove.iconUrl).toContain('onstove.com');
  });
});

describe('Storefront Platform Detection', () => {
  it('detects GOG from title or direct url', () => {
    const res1 = detectStorePlatform({ title: 'Bounty Train (GOG) Giveaway', platforms: 'PC, DRM-Free' });
    expect(res1.platform).toBe('GOG');
    expect(res1.platformKey).toBe('gog');

    const res2 = detectStorePlatform(
      { title: 'Bounty Train Giveaway', platforms: 'PC' },
      'https://www.gog.com/en/game/bounty_train',
    );
    expect(res2.platform).toBe('GOG');
    expect(res2.platformKey).toBe('gog');
  });

  it('detects IndieGala from direct freebies url or title', () => {
    const res1 = detectStorePlatform({ title: 'Battle Ram (IndieGala) Giveaway', platforms: 'PC, DRM-Free' });
    expect(res1.platform).toBe('IndieGala');
    expect(res1.platformKey).toBe('indiegala');

    const res2 = detectStorePlatform(
      { title: 'Battle Ram Giveaway', platforms: 'PC, DRM-Free' },
      'https://freebies.indiegala.com/battle-ram',
    );
    expect(res2.platform).toBe('IndieGala');
    expect(res2.platformKey).toBe('indiegala');
  });

  it('detects Stove from onstove.com url or title', () => {
    const res1 = detectStorePlatform({ title: 'GigaBash (Stove) Giveaway', platforms: 'PC' });
    expect(res1.platform).toBe('Stove');
    expect(res1.platformKey).toBe('stove');

    const res2 = detectStorePlatform(
      { title: 'Rush Rush Red Shoes Giveaway', platforms: 'PC' },
      'https://store.onstove.com/en/games/100200',
    );
    expect(res2.platform).toBe('Stove');
    expect(res2.platformKey).toBe('stove');
  });

  it('detects Steam from store url or partner key giveaways', () => {
    const res1 = detectStorePlatform({
      title: 'Dwarven Realms (Steam) Key Giveaway',
      platforms: 'PC, Steam',
      open_giveaway_url: 'https://na.alienwarearena.com/ucf/show/2175676/dwarven-realms-steam-game-key-giveaway',
    });
    expect(res1.platform).toBe('Steam');
    expect(res1.platformKey).toBe('steam');

    const res2 = detectStorePlatform(
      { title: 'Free Game', platforms: 'PC' },
      'https://store.steampowered.com/app/12345/Game/',
    );
    expect(res2.platform).toBe('Steam');
    expect(res2.platformKey).toBe('steam');
  });

  it('detects Itch.io and Epic Games Store accurately', () => {
    const itch = detectStorePlatform(
      { title: 'Express No. 6 Giveaway', platforms: 'PC, DRM-Free' },
      'https://askgames.itch.io/express-no6',
    );
    expect(itch.platform).toBe('Itch.io');
    expect(itch.platformKey).toBe('itchio');

    const epic = detectStorePlatform(
      { title: 'BURIED STARS Giveaway', platforms: 'PC, Epic Games Store' },
      'https://store.epicgames.com/p/buried-stars-d7c88c',
    );
    expect(epic.platform).toBe('Epic Games Store');
    expect(epic.platformKey).toBe('epic');
  });
});

describe('Direct Giveaway URL Resolution', () => {
  it('returns rawUrl untouched if invalid or not http', async () => {
    expect(await resolveDirectGiveawayUrl('')).toBe('');
    expect(await resolveDirectGiveawayUrl('steam://run/123')).toBe('steam://run/123');
  });

  it('follows HTTP 301/302 redirects to destination store URL', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: string | URL | Request) => {
        const u = String(url);
        if (u.includes('gamerpower.com/open/sample-gog')) {
          return new Response(null, {
            status: 301,
            headers: { location: 'https://www.gog.com/en/game/sample_game' },
          });
        }
        return new Response('OK', { status: 200 });
      }) as typeof fetch;

      const direct = await resolveDirectGiveawayUrl('https://www.gamerpower.com/open/sample-gog');
      expect(direct).toBe('https://www.gog.com/en/game/sample_game');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('resolves relative location headers in redirects', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: string | URL | Request) => {
        const u = String(url);
        if (u === 'https://example.com/start') {
          return new Response(null, {
            status: 302,
            headers: { location: '/dest/page' },
          });
        }
        return new Response('OK', { status: 200 });
      }) as typeof fetch;

      const direct = await resolveDirectGiveawayUrl('https://example.com/start');
      expect(direct).toBe('https://example.com/dest/page');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('gracefully returns best URL on network error or timeout', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => {
        throw new Error('Network timeout');
      }) as typeof fetch;

      const direct = await resolveDirectGiveawayUrl('https://example.com/timeout');
      expect(direct).toBe('https://example.com/timeout');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
