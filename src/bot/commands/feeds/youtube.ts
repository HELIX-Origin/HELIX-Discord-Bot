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

export const youtubeCommandDef: ApplicationCommand = {
  name: 'youtube',
  description: 'Manage YouTube upload and livestream alerts for this server',
  options: [
    {
      name: 'add',
      description: 'Subscribe to alerts for a YouTube channel',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'channel_id',
          description: 'YouTube Channel ID (e.g. UC...), handle (@name), or full channel URL',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'name',
          description: 'Display name for the YouTube channel (optional)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'channel',
          description: 'Discord channel where notifications should be posted',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [0, 5],
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
      name: 'list',
      description: 'List all YouTube channels subscribed in this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'remove',
      description: 'Remove a YouTube channel alert subscription',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or channel name to remove',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
      ],
    },
    {
      name: 'toggle',
      description: 'Enable or pause YouTube alerts',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or channel name',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'enabled',
          description: 'Enable (True) or Pause (False)',
          type: ApplicationCommandOptionType.BOOLEAN,
          required: true,
        },
      ],
    },
    {
      name: 'check',
      description: 'Check for new YouTube uploads or livestreams immediately',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or channel name to check (optional, checks all if omitted)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
  ],
};

function normalizeYouTubeUrl(input: string): { url: string; fallbackName: string } {
  const trimmed = input.trim();
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return {
      url: `https://www.youtube.com/feeds/videos.xml?channel_id=${trimmed}`,
      fallbackName: `YouTube Channel (${trimmed})`,
    };
  }
  if (trimmed.startsWith('@')) {
    return {
      url: `https://www.youtube.com/${trimmed}`,
      fallbackName: `YouTube ${trimmed}`,
    };
  }
  if (trimmed.includes('youtube.com/channel/')) {
    const channelId = trimmed.split('youtube.com/channel/')[1]?.split(/[/?#]/)[0];
    if (channelId) {
      return {
        url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
        fallbackName: `YouTube Channel (${channelId})`,
      };
    }
  }
  return { url: trimmed, fallbackName: 'YouTube Channel' };
}

export async function handleYouTubeCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('YouTube commands can only be used inside a Discord server.')
      .respond(true);
  }

  const user = deps.repo.getOrCreateGuildUser(guildId);
  const subOptions = interaction.data?.options ?? [];
  const sub = subOptions[0];
  const subName = sub?.name;
  const opts = sub?.options ?? [];

  if (subName === 'add') {
    const rawInput = String(opts.find((o) => o.name === 'channel_id')?.value ?? '').trim();
    if (!rawInput) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing Channel ID')
        .description('Please provide a YouTube channel ID, handle (@channel), or URL.')
        .respond(true);
    }

    const { url, fallbackName } = normalizeYouTubeUrl(rawInput);
    const customName = String(opts.find((o) => o.name === 'name')?.value ?? '').trim();
    const name = customName || fallbackName;
    const channelId =
      (opts.find((o) => o.name === 'channel')?.value as string | undefined) || interaction.channel_id || null;

    try {
      const roleId = (opts.find((o) => o.name === 'role')?.value as string | undefined) ?? null;
      const feed = deps.repo.addFeed(user.id, name, url, channelId, 'youtube', null, guildId, undefined, roleId);
      deps.repo.logActivity(user.id, 'info', 'bot', `Added YouTube feed "${name}" via Discord bot`);
      if (channelId) {
        await notifyFeedAdded(deps.bot, channelId, name).catch(() => {});
      }

      const h = EmbedHandler.for(deps)
        .success()
        .title('YouTube Alert Added', '▶️')
        .field('Channel', feed.name, true)
        .field('Feed ID', `#${feed.id}`, true)
        .field('Target Channel', channelId ? `<#${channelId}>` : 'None', true)
        .field('Feed URL', `\`${feed.url}\``, false);
      if (feed.roleId) {
        h.field('Subscribed Role', `<@&${feed.roleId}>`, true);
      }
      return h.footer(`${appDisplayName(deps)} • YouTube Stream & Upload Alerts`).respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Add YouTube Alert')
        .description((err as Error).message)
        .respond(true);
    }
  }

  if (subName === 'list') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const feeds = allFeeds.filter((f) => f.feedType === 'youtube');

    if (feeds.length === 0) {
      return EmbedHandler.for(deps)
        .info()
        .title('YouTube Alerts', '▶️')
        .description('No YouTube channels subscribed yet. Use `/youtube add` to set up your first alert!')
        .respond();
    }

    const h = EmbedHandler.for(deps)
      .primary()
      .title(`YouTube Alerts (${feeds.length})`, '▶️')
      .footer(`${appDisplayName(deps)} • Use /youtube remove or /youtube toggle`);

    for (const f of feeds.slice(0, 25)) {
      const status = f.enabled ? '🟢 Enabled' : '⏸️ Paused';
      const target = f.threadChannelId
        ? `<#${f.threadChannelId}> (thread)`
        : f.channelId
          ? `<#${f.channelId}>`
          : 'None';
      h.field(`#${f.id} — ${f.name} (${status})`, `**Channel:** ${target}\n**URL:** \`${f.url}\``, false);
    }

    return h.respond();
  }

  if (subName === 'remove') {
    const identifier = String(opts.find((o) => o.name === 'id')?.value ?? '').trim();
    if (!identifier) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing ID')
        .description('Please provide a feed ID or channel name.')
        .respond(true);
    }

    const allFeeds = deps.repo.listFeeds(user.id);
    const feed = allFeeds.find(
      (f) =>
        f.feedType === 'youtube' && (String(f.id) === identifier || f.name.toLowerCase() === identifier.toLowerCase()),
    );

    if (!feed) {
      return EmbedHandler.for(deps)
        .error()
        .title('Channel Not Found')
        .description(`YouTube channel "${identifier}" was not found in this server.`)
        .respond(true);
    }

    deps.repo.deleteFeed(user.id, feed.id);
    deps.repo.logActivity(user.id, 'info', 'bot', `Deleted YouTube feed "${feed.name}" via Discord bot`);

    return EmbedHandler.for(deps)
      .success()
      .title('YouTube Alert Removed', '🗑️')
      .description(`Removed YouTube alert for **${feed.name}** (\`#${feed.id}\`).`)
      .respond();
  }

  if (subName === 'toggle') {
    const identifier = String(opts.find((o) => o.name === 'id')?.value ?? '').trim();
    const enabled = Boolean(opts.find((o) => o.name === 'enabled')?.value);

    const allFeeds = deps.repo.listFeeds(user.id);
    const feed = allFeeds.find(
      (f) =>
        f.feedType === 'youtube' && (String(f.id) === identifier || f.name.toLowerCase() === identifier.toLowerCase()),
    );

    if (!feed) {
      return EmbedHandler.for(deps)
        .error()
        .title('Channel Not Found')
        .description(`YouTube channel "${identifier}" was not found in this server.`)
        .respond(true);
    }

    deps.repo.updateFeed(user.id, feed.id, { enabled: enabled ? 1 : 0 });
    deps.repo.logActivity(
      user.id,
      'info',
      'bot',
      `${enabled ? 'Enabled' : 'Paused'} YouTube alert "${feed.name}" via Discord bot`,
    );

    return EmbedHandler.for(deps)
      .success()
      .title(enabled ? 'Alert Resumed' : 'Alert Paused', enabled ? '▶️' : '⏸️')
      .description(`YouTube alert for **${feed.name}** (\`#${feed.id}\`) is now **${enabled ? 'enabled' : 'paused'}**.`)
      .respond();
  }

  if (subName === 'check') {
    const rawId = opts.find((o) => o.name === 'id')?.value as string | undefined;
    const allFeeds = deps.repo.listFeeds(user.id);

    if (rawId) {
      const identifier = rawId.trim();
      const feed = allFeeds.find(
        (f) =>
          f.feedType === 'youtube' &&
          (String(f.id) === identifier ||
            f.name.toLowerCase() === identifier.toLowerCase() ||
            f.url.toLowerCase().includes(identifier.toLowerCase())),
      );
      if (!feed) {
        return EmbedHandler.for(deps)
          .error()
          .title('Channel Not Found')
          .description(`YouTube channel "${identifier}" was not found in this server.`)
          .respond(true);
      }
      try {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
        deps.repo.logActivity(
          user.id,
          'info',
          'bot',
          `Manually checked YouTube channel "${feed.name}" via Discord bot`,
        );
        return EmbedHandler.for(deps)
          .success()
          .title('YouTube Check Triggered', '▶️')
          .description(`Successfully triggered check for **${feed.name}** (\`#${feed.id}\`).`)
          .footer(`${appDisplayName(deps)} • YouTube Watcher`)
          .respond();
      } catch (err) {
        return EmbedHandler.for(deps)
          .error()
          .title('Check Failed')
          .description((err as Error).message)
          .respond(true);
      }
    }

    const ytFeeds = allFeeds.filter((f) => f.feedType === 'youtube');
    if (!ytFeeds.length) {
      return EmbedHandler.for(deps)
        .info()
        .title('No YouTube Channels')
        .description('No YouTube channels subscribed in this server. Use `/youtube add` to add one.')
        .respond(true);
    }

    try {
      for (const feed of ytFeeds) {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
      }
      deps.repo.logActivity(
        user.id,
        'info',
        'bot',
        `Manually checked all ${ytFeeds.length} YouTube channels via Discord bot`,
      );
      return EmbedHandler.for(deps)
        .success()
        .title('YouTube Check Complete', '▶️')
        .description(`Triggered an immediate check for **${ytFeeds.length}** YouTube channel(s).`)
        .footer(`${appDisplayName(deps)} • YouTube Watcher`)
        .respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Check Failed')
        .description((err as Error).message)
        .respond(true);
    }
  }

  return EmbedHandler.for(deps)
    .info()
    .title('YouTube Command Usage', '▶️')
    .description('Use `/youtube add`, `/youtube list`, `/youtube remove`, `/youtube toggle`, or `/youtube check`.')
    .respond();
}

registerCommandMetadata({
  name: 'youtube',
  description: 'Manage YouTube upload and livestream alerts for this server',
  category: 'feeds',
  emoji: '▶️',
  usage: '/youtube <add|list|remove|toggle|check>',
  options: youtubeCommandDef.options,
  examples: [
    '/youtube add channel_id:@veritasium',
    '/youtube add channel_id:UCsXVk37bltHxD1rDPwtNM8Q name:"Kurzgesagt"',
    '/youtube list',
    '/youtube toggle id:1 enabled:false',
    '/youtube check',
  ],
});

export const youtubeCommand: BotCommand = {
  def: youtubeCommandDef,
  category: 'feeds',
  isEnabled: (deps) => Boolean(deps.config.features.streamAlertsEnabled),
  execute: handleYouTubeCommand,
};
