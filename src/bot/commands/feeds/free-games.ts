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
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';
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
            { name: 'All Stores & Giveaways', value: 'free_games' },
            { name: 'Epic Games Store', value: 'free_games_epic' },
            { name: 'Steam', value: 'free_games_steam' },
            { name: 'GOG.com', value: 'free_games_gog' },
            { name: 'Prime Gaming', value: 'free_games_prime' },
            { name: 'Ubisoft Connect', value: 'free_games_ubisoft' },
            { name: 'Humble Bundle', value: 'free_games_humble' },
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
      description: 'Check the free games alert status and active channel for this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'disable',
      description: 'Disable free game notifications for this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'check',
      description: 'Trigger an immediate check for active free games and giveaways',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
  ],
};

const PLATFORM_NAMES: Record<string, string> = {
  free_games: 'All Stores & Giveaways',
  free_games_epic: 'Epic Games Store',
  free_games_steam: 'Steam',
  free_games_gog: 'GOG.com',
  free_games_prime: 'Prime Gaming',
  free_games_ubisoft: 'Ubisoft Connect',
  free_games_humble: 'Humble Bundle',
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

    try {
      const roleId = (opts.find((o) => o.name === 'role')?.value as string | undefined) ?? null;
      if (existing) {
        deps.repo.updateFeed(user.id, existing.id, {
          channelId,
          enabled: 1,
          feedType,
          name: `Free Games (${storeName})`,
          roleId,
        });
        deps.repo.logActivity(
          user.id,
          'info',
          'bot',
          `Updated Free Games alert to channel ${channelId} via Discord bot`,
        );
      } else {
        deps.repo.addFeed(
          user.id,
          `Free Games (${storeName})`,
          'https://store.epicgames.com',
          channelId,
          feedType,
          null,
          guildId,
          undefined,
          roleId,
        );
        deps.repo.logActivity(user.id, 'info', 'bot', `Enabled Free Games alerts via Discord bot`);
      }
      if (channelId) {
        await notifyFeedAdded(deps.bot, channelId, `Free Games (${storeName})`).catch(() => {});
      }

      const h = EmbedHandler.for(deps)
        .success()
        .title('Free Games Alerts Enabled', '🎮')
        .description(`Weekly free game alerts are now **active** in this server.`)
        .field('Store / Platform', storeName, true)
        .field('Delivery Channel', channelId ? `<#${channelId}>` : 'Default Channel', true)
        .field('Schedule', 'Weekly on Sundays (UTC)', true);
      if (roleId) {
        h.field('Subscribed Role', `<@&${roleId}>`, true);
      }
      return h.footer(`${appDisplayName(deps)} • Never miss a free game drop`).respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Enable Alerts')
        .description((err as Error).message)
        .respond(true);
    }
  }

  if (subName === 'status') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const freeGameFeeds = allFeeds.filter((f) => f.feedType === 'free_games' || f.feedType.startsWith('free_games'));

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
      .description('Free game drop notifications are currently **active**.');

    for (const f of freeGameFeeds) {
      const storeName = PLATFORM_NAMES[f.feedType] ?? f.name;
      const status = f.enabled ? '🟢 Active' : '⏸️ Paused';
      const target = f.threadChannelId
        ? `<#${f.threadChannelId}> (thread)`
        : f.channelId
          ? `<#${f.channelId}>`
          : 'None';
      const lastCheck = f.lastCheckedAt ? new Date(f.lastCheckedAt).toLocaleDateString() : 'Pending Sunday poll';
      h.field(
        `${storeName} (${status})`,
        `**Channel:** ${target}\n**Schedule:** Every Sunday\n**Last Checked:** ${lastCheck}`,
        true,
      );
    }

    return h.footer(`${appDisplayName(deps)} • /free-games disable to turn off`).respond();
  }

  if (subName === 'disable') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const freeGameFeeds = allFeeds.filter((f) => f.feedType === 'free_games' || f.feedType.startsWith('free_games'));

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
    const freeGamesFeeds = allFeeds.filter((f) => f.feedType === 'free_games' || f.feedType?.startsWith('free_games'));
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

registerCommandMetadata({
  name: 'free-games',
  description: 'Manage weekly free game notifications (Epic Games, Steam, GOG, etc.)',
  category: 'feeds',
  emoji: '🎮',
  usage: '/free-games <enable|status|disable|check>',
  options: freeGamesCommandDef.options,
  examples: [
    '/free-games enable channel:#giveaways',
    '/free-games enable platform:Epic Games Store channel:#freebies',
    '/free-games status',
    '/free-games check',
    '/free-games disable',
  ],
});

export const freeGamesCommand: BotCommand = {
  def: freeGamesCommandDef,
  category: 'feeds',
  isEnabled: (deps) => Boolean(deps.config.features.feedsEnabled),
  execute: handleFreeGamesCommand,
};
