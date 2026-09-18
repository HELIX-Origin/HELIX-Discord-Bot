import { appDisplayName, type AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';

export const twitchCommandDef: ApplicationCommand = {
  name: 'twitch',
  description: 'Manage Twitch livestream alerts for this server',
  options: [
    {
      name: 'add',
      description: 'Subscribe to livestream alerts for a Twitch streamer',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'streamer',
          description: 'Twitch username or channel URL (e.g. shroud or https://twitch.tv/shroud)',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'channel',
          description: 'Discord channel where notifications should be posted',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [0, 5],
        },
      ],
    },
    {
      name: 'list',
      description: 'List all Twitch streamers subscribed in this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'remove',
      description: 'Remove a Twitch streamer alert subscription',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or streamer username to remove',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
      ],
    },
    {
      name: 'toggle',
      description: 'Enable or pause Twitch livestream alerts',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or streamer username',
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
      description: 'Check Twitch streamer live status immediately',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or streamer username to check (optional, checks all if omitted)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
  ],
};

function normalizeTwitchUser(input: string): { username: string; url: string } {
  const trimmed = input.trim().toLowerCase();
  let username = trimmed;
  if (trimmed.includes('twitch.tv/')) {
    username = trimmed.split('twitch.tv/')[1]?.split(/[/?#]/)[0] ?? trimmed;
  }
  username = username.replace(/^@/, '');
  return {
    username,
    url: `https://twitch.tv/${username}`,
  };
}

export async function handleTwitchCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('Twitch commands can only be used inside a Discord server.')
      .respond(true);
  }

  const user = deps.repo.getOrCreateGuildUser(guildId);
  const subOptions = interaction.data?.options ?? [];
  const sub = subOptions[0];
  const subName = sub?.name;
  const opts = sub?.options ?? [];

  if (subName === 'add') {
    const rawInput = String(opts.find((o) => o.name === 'streamer')?.value ?? '').trim();
    if (!rawInput) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing Streamer Name')
        .description('Please provide a Twitch streamer username or URL.')
        .respond(true);
    }

    const { username, url } = normalizeTwitchUser(rawInput);
    const name = `Twitch (${username})`;
    const channelId =
      (opts.find((o) => o.name === 'channel')?.value as string | undefined) || interaction.channel_id || null;

    try {
      const feed = deps.repo.addFeed(user.id, name, url, channelId, 'twitch', null, guildId);
      deps.repo.logActivity(user.id, 'info', 'bot', `Added Twitch alert for "${username}" via Discord bot`);

      return EmbedHandler.for(deps)
        .success()
        .title('Twitch Alert Added', '🟣')
        .field('Streamer', username, true)
        .field('Feed ID', `#${feed.id}`, true)
        .field('Target Channel', channelId ? `<#${channelId}>` : 'None', true)
        .field('Channel URL', `\`${url}\``, false)
        .footer(`${appDisplayName(deps)} • Twitch Live Alerts`)
        .respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Add Twitch Alert')
        .description((err as Error).message)
        .respond(true);
    }
  }

  if (subName === 'list') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const feeds = allFeeds.filter((f) => f.feedType === 'twitch');

    if (feeds.length === 0) {
      return EmbedHandler.for(deps)
        .info()
        .title('Twitch Alerts', '🟣')
        .description('No Twitch streamers subscribed yet. Use `/twitch add` to set up your first stream alert!')
        .respond();
    }

    const h = EmbedHandler.for(deps)
      .primary()
      .title(`Twitch Stream Alerts (${feeds.length})`, '🟣')
      .footer(`${appDisplayName(deps)} • Use /twitch remove or /twitch toggle`);

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
    const identifier = String(opts.find((o) => o.name === 'id')?.value ?? '')
      .trim()
      .toLowerCase();
    if (!identifier) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing ID')
        .description('Please provide a feed ID or streamer name.')
        .respond(true);
    }

    const allFeeds = deps.repo.listFeeds(user.id);
    const feed = allFeeds.find(
      (f) =>
        f.feedType === 'twitch' &&
        (String(f.id) === identifier ||
          f.name.toLowerCase() === identifier ||
          f.name.toLowerCase().includes(identifier) ||
          f.url.toLowerCase().includes(identifier)),
    );

    if (!feed) {
      return EmbedHandler.for(deps)
        .error()
        .title('Streamer Not Found')
        .description(`Twitch streamer "${identifier}" was not found in this server.`)
        .respond(true);
    }

    deps.repo.deleteFeed(user.id, feed.id);
    deps.repo.logActivity(user.id, 'info', 'bot', `Deleted Twitch alert for "${feed.name}" via Discord bot`);

    return EmbedHandler.for(deps)
      .success()
      .title('Twitch Alert Removed', '🗑️')
      .description(`Removed Twitch alert for **${feed.name}** (\`#${feed.id}\`).`)
      .respond();
  }

  if (subName === 'toggle') {
    const identifier = String(opts.find((o) => o.name === 'id')?.value ?? '')
      .trim()
      .toLowerCase();
    const enabled = Boolean(opts.find((o) => o.name === 'enabled')?.value);

    const allFeeds = deps.repo.listFeeds(user.id);
    const feed = allFeeds.find(
      (f) =>
        f.feedType === 'twitch' &&
        (String(f.id) === identifier ||
          f.name.toLowerCase() === identifier ||
          f.name.toLowerCase().includes(identifier) ||
          f.url.toLowerCase().includes(identifier)),
    );

    if (!feed) {
      return EmbedHandler.for(deps)
        .error()
        .title('Streamer Not Found')
        .description(`Twitch streamer "${identifier}" was not found in this server.`)
        .respond(true);
    }

    deps.repo.updateFeed(user.id, feed.id, { enabled: enabled ? 1 : 0 });
    deps.repo.logActivity(
      user.id,
      'info',
      'bot',
      `${enabled ? 'Enabled' : 'Paused'} Twitch alert "${feed.name}" via Discord bot`,
    );

    return EmbedHandler.for(deps)
      .success()
      .title(enabled ? 'Alert Resumed' : 'Alert Paused', enabled ? '▶️' : '⏸️')
      .description(`Twitch alert for **${feed.name}** (\`#${feed.id}\`) is now **${enabled ? 'enabled' : 'paused'}**.`)
      .respond();
  }

  if (subName === 'check') {
    const rawId = opts.find((o) => o.name === 'id')?.value as string | undefined;
    const allFeeds = deps.repo.listFeeds(user.id);

    if (rawId) {
      const identifier = rawId.trim().toLowerCase();
      const feed = allFeeds.find(
        (f) =>
          f.feedType === 'twitch' &&
          (String(f.id) === identifier ||
            f.name.toLowerCase() === identifier ||
            f.name.toLowerCase().includes(identifier) ||
            f.url.toLowerCase().includes(identifier)),
      );
      if (!feed) {
        return EmbedHandler.for(deps)
          .error()
          .title('Streamer Not Found')
          .description(`Twitch streamer "${identifier}" was not found in this server.`)
          .respond(true);
      }
      try {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
        deps.repo.logActivity(
          user.id,
          'info',
          'bot',
          `Manually checked Twitch streamer "${feed.name}" via Discord bot`,
        );
        return EmbedHandler.for(deps)
          .success()
          .title('Twitch Check Triggered', '🟣')
          .description(`Successfully triggered check for **${feed.name}** (\`#${feed.id}\`).`)
          .footer(`${appDisplayName(deps)} • Twitch Watcher`)
          .respond();
      } catch (err) {
        return EmbedHandler.for(deps)
          .error()
          .title('Check Failed')
          .description((err as Error).message)
          .respond(true);
      }
    }

    const twitchFeeds = allFeeds.filter((f) => f.feedType === 'twitch');
    if (!twitchFeeds.length) {
      return EmbedHandler.for(deps)
        .info()
        .title('No Twitch Streamers')
        .description('No Twitch streamers subscribed in this server. Use `/twitch add` to add one.')
        .respond(true);
    }

    try {
      for (const feed of twitchFeeds) {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
      }
      deps.repo.logActivity(
        user.id,
        'info',
        'bot',
        `Manually checked all ${twitchFeeds.length} Twitch streamers via Discord bot`,
      );
      return EmbedHandler.for(deps)
        .success()
        .title('Twitch Check Complete', '🟣')
        .description(`Triggered an immediate check for **${twitchFeeds.length}** Twitch streamer(s).`)
        .footer(`${appDisplayName(deps)} • Twitch Watcher`)
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
    .title('Twitch Command Usage', '🟣')
    .description('Use `/twitch add`, `/twitch list`, `/twitch remove`, `/twitch toggle`, or `/twitch check`.')
    .respond();
}

registerCommandMetadata({
  name: 'twitch',
  description: 'Manage Twitch livestream alerts for this server',
  category: 'feeds',
  emoji: '🟣',
  usage: '/twitch <add|list|remove|toggle|check>',
  options: twitchCommandDef.options,
  examples: [
    '/twitch add streamer:ninja',
    '/twitch add streamer:https://twitch.tv/shroud',
    '/twitch list',
    '/twitch toggle id:1 enabled:false',
    '/twitch check',
  ],
});

export const twitchCommand: BotCommand = {
  def: twitchCommandDef,
  category: 'feeds',
  isEnabled: (deps) => Boolean(deps.config.features.streamAlertsEnabled),
  execute: handleTwitchCommand,
};
