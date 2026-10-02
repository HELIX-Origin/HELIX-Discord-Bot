/**
 * tests/unit/feed/freegames.test.ts
 *
 * Unit tests for Free Game Alerts embed generation and platform branding.
 */
import { describe, it, expect } from 'vitest';
import { freeGameEmbed } from '../../../src/bot/utils/embeds.js';
import { PLATFORM_BRANDING, type FreeGameItem } from '../../../src/feed/freegames.js';

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
});
