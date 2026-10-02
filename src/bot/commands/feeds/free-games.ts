import { appDisplayName, type AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { notifyFeedAdded } from '../../lib/feeds/notify.js';
import type { FeedType } from '../../../state/types.js';

export const freeGamesCommandDef: ApplicationCommand = {
  name: 'free-games',
  description: 'Manage weekly free game notifications (Epic Games, Steam, GOG, etc.)',
  options: [
    {
      name: 'enable',
      description: 'Enable weekly free game drop notifications for this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'channel',
          description: 'Discord channel where free games should be posted',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [0, 5],
        },
        {
          name: 'platform',
          description: 'Game storefront to track (default: All Stores)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
          choices: [
            { name: 'GamerPower Free Game Alerts', value: 'free_games_gamerpower' },
            { name: 'Epic Games Store Official', value: 'free_games_epic' },
            { name: 'All Free Game Drops', value: 'free_games' },
            { name: 'All Top PC Game Deals', value: 'game_deals_all' },
            { name: 'Steam Deals & Sales', value: 'game_deals_steam' },
            { name: 'Counter-Strike 2 Patch Notes', value: 'game_patchnotes_cs2' },
            { name: 'Helldivers 2 Patch Notes', value: 'game_patchnotes_helldivers2' },
          ],
        },
        {
          name: 'role',
          description: 'Role to auto-subscribe to the feed thread (optional)',
          type: ApplicationCommandOptionType.ROLE,
          required: false,
        },
      ],
    },
    {
      name: 'status',
      description: 'Check the game alert status and active channels for this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'disable',
      description: 'Disable game notifications for this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'check',
      description: 'Trigger an immediate check for active free games, deals, and patch notes',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
  ],
};

const PLATFORM_NAMES: Record<string, string> = {
  free_games: 'All Free Game Drops',
  free_games_gamerpower: 'GamerPower Free Game Alerts',
  free_games_epic: 'Epic Games Store Official Free Games',
  game_deals_all: 'All Top PC Game Deals',
  game_deals_steam: 'Steam Deals & Sales',
  game_deals_gog: 'GOG Discounts',
  game_deals_epic: 'Epic Games Store Deals',
  game_deals_humble: 'Humble Store Deals',
  game_patchnotes_cs2: 'Counter-Strike 2 Patch Notes',
  game_patchnotes_dota2: 'Dota 2 Update Notes',
  game_patchnotes_rust: 'Rust Changelogs',
  game_patchnotes_helldivers2: 'Helldivers 2 Patch Notes',
  game_patchnotes_apex: 'Apex Legends Updates',
  game_patchnotes_cyberpunk: 'Cyberpunk 2077 Patch Notes',
  game_patchnotes_bg3: "Baldur's Gate 3 Updates",
  game_patchnotes_warframe: 'Warframe Update Notes',
};

export async function handleFreeGamesCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('Free Games commands can only be used inside a Discord server.')
      .respond(true);
  }

  const user = deps.repo.getOrCreateGuildUser(guildId);
  const subOptions = interaction.data?.options ?? [];
  const sub = subOptions[0];
  const subName = sub?.name;
  const opts = sub?.options ?? [];

  if (subName === 'enable') {
    const channelId =
      (opts.find((o) => o.name === 'channel')?.value as string | undefined) || interaction.channel_id || null;
    const rawPlatform = String(opts.find((o) => o.name === 'platform')?.value ?? 'free_games');
    const feedType: FeedType = (rawPlatform as FeedType) || 'free_games';
    const storeName = PLATFORM_NAMES[feedType] ?? 'Free Games';

    const allFeeds = deps.repo.listFeeds(user.id);
    const existing = allFeeds.find((f) => f.feedType === feedType || f.feedType.startsWith('free_games'));

    const defaultUrl = feedType.startsWith('game_deals')
      ? `gamedeals://${feedType.replace('game_deals_', '')}`
      : feedType.startsWith('game_patchnotes')
        ? `patchnotes://${feedType.replace('game_patchnotes_', '')}`
        : `freegames://${feedType.replace('free_games_', '')}`;

    try {
      const roleId = (opts.find((o) => o.name === 'role')?.value as string | undefined) ?? null;
      if (existing) {
        deps.repo.updateFeed(user.id, existing.id, {
          channelId,
          enabled: 1,
          feedType,
          name: storeName,
          roleId,
          url: defaultUrl,
        });
        deps.repo.logActivity(
          user.id,
          'info',
          'bot',
          `Updated Game Feed alert to channel ${channelId} via Discord bot`,
        );
      } else {
        deps.repo.addFeed(user.id, storeName, defaultUrl, channelId, feedType, null, guildId, undefined, roleId);
        deps.repo.logActivity(user.id, 'info', 'bot', `Enabled Game Feed alerts via Discord bot`);
      }
      if (channelId) {
        await notifyFeedAdded(deps.bot, channelId, storeName).catch(() => {});
      }

      const h = EmbedHandler.for(deps)
        .success()
        .title('Free Games Alerts Enabled', '🎮')
        .description(`Free game and deal alerts are now **active** in this server.`)
        .field('Store / Platform', storeName, true)
        .field('Delivery Channel', channelId ? `<#${channelId}>` : 'Default Channel', true)
        .field('Schedule', 'Hourly / Polled', true);
      if (roleId) {
        h.field('Subscribed Role', `<@&${roleId}>`, true);
      }
      return h.footer(`${appDisplayName(deps)} • Never miss a free game or deal`).respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Enable Alerts')
        .description((err as Error).message)
        .respond(true);
    }
  }

  const isGameFeed = (f: { feedType: string }) =>
    f.feedType === 'free_games' ||
    f.feedType.startsWith('free_games') ||
    f.feedType.startsWith('game_deals') ||
    f.feedType.startsWith('game_patchnotes');

  if (subName === 'status') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const freeGameFeeds = allFeeds.filter(isGameFeed);

    if (freeGameFeeds.length === 0 || !freeGameFeeds.some((f) => f.enabled)) {
      return EmbedHandler.for(deps)
        .info()
        .title('Free Games Status', '🎮')
        .description(
          'Free game alerts are currently **disabled** in this server. Use `/free-games enable` to turn them on!',
        )
        .respond();
    }

    const h = EmbedHandler.for(deps)
      .primary()
      .title('Free Games Alerts Status', '🎮')
      .description('Free game and deal notifications are currently **active**.');

    for (const f of freeGameFeeds) {
      const storeName = PLATFORM_NAMES[f.feedType] ?? f.name;
      const status = f.enabled ? '🟢 Active' : '⏸️ Paused';
      const target = f.threadChannelId
        ? `<#${f.threadChannelId}> (thread)`
        : f.channelId
          ? `<#${f.channelId}>`
          : 'None';
      const lastCheck = f.lastCheckedAt ? new Date(f.lastCheckedAt).toLocaleDateString() : 'Pending poll';
      h.field(
        `${storeName} (${status})`,
        `**Channel:** ${target}\n**Schedule:** Every Sunday / Polled\n**Last Checked:** ${lastCheck}`,
        true,
      );
    }

    return h.footer(`${appDisplayName(deps)} • /free-games disable to turn off`).respond();
  }

  if (subName === 'disable') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const freeGameFeeds = allFeeds.filter(isGameFeed);

    if (freeGameFeeds.length === 0) {
      return EmbedHandler.for(deps)
        .info()
        .title('Free Games Status', '🎮')
        .description('Free game alerts are not configured for this server.')
        .respond(true);
    }

    for (const f of freeGameFeeds) {
      deps.repo.updateFeed(user.id, f.id, { enabled: 0 });
    }

    deps.repo.logActivity(user.id, 'info', 'bot', `Disabled Free Games alerts via Discord bot`);

    return EmbedHandler.for(deps)
      .success()
      .title('Free Games Alerts Disabled', '⏸️')
      .description(
        'Free game drop notifications have been paused for this server. Use `/free-games enable` anytime to re-enable them.',
      )
      .respond();
  }

  if (subName === 'check') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const freeGamesFeeds = allFeeds.filter(isGameFeed);
    if (!freeGamesFeeds.length) {
      return EmbedHandler.for(deps)
        .info()
        .title('No Free Games Alerts Configured', '🎮')
        .description('There are no active free game feeds configured for this server. Use `/free-games enable` first.')
        .respond(true);
    }

    try {
      for (const feed of freeGamesFeeds) {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
      }
      deps.repo.logActivity(user.id, 'info', 'bot', `Manual Free Games check triggered via Discord bot`);
      return EmbedHandler.for(deps)
        .success()
        .title('Free Games Check Triggered', '🎮')
        .description(
          `Triggered an immediate check for **${freeGamesFeeds.length}** free game feed(s). Any new active giveaways will deliver to their configured channels.`,
        )
        .footer(`${appDisplayName(deps)} • Free Games Alert Engine`)
        .respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Trigger Free Games Check')
        .description((err as Error).message)
        .respond(true);
    }
  }

  return EmbedHandler.for(deps)
    .info()
    .title('Free Games Command Usage', '🎮')
    .description(
      'Use `/free-games enable [channel]`, `/free-games status`, `/free-games check`, or `/free-games disable`.',
    )
    .respond();
}

// Slash command registration removed — Free Games alerts are configured exclusively via Web Dashboard
