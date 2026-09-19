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

export const rssCommandDef: ApplicationCommand = {
  name: 'rss',
  description: 'Manage RSS, Atom, and web scraper feeds for this server',
  options: [
    {
      name: 'add',
      description: 'Subscribe to a new RSS/Atom feed or web scraper',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'url',
          description: 'The RSS/Atom XML feed URL or webpage URL to scrape',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'name',
          description: 'Display name for the feed',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'channel',
          description: 'Discord channel where updates should be posted',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [0, 5],
        },
        {
          name: 'type',
          description: 'Feed format (default: RSS/Atom)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
          choices: [
            { name: 'RSS / Atom XML', value: 'rss' },
            { name: 'Webpage Scraper', value: 'scrape' },
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
      name: 'list',
      description: 'List all RSS/Atom and scraper feeds subscribed in this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'remove',
      description: 'Remove an RSS/Atom or scraper feed subscription',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric ID or exact name of the feed to remove',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
      ],
    },
    {
      name: 'toggle',
      description: 'Enable or pause an RSS/Atom or scraper feed',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric ID or exact name of the feed',
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
      name: 'poll',
      description: 'Trigger an immediate check for new RSS/Atom feed entries',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric ID or exact name of the feed to poll (optional, defaults to all)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
  ],
};

export async function handleRssCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('RSS commands can only be used inside a Discord server.')
      .respond(true);
  }

  const user = deps.repo.getOrCreateGuildUser(guildId);
  const subOptions = interaction.data?.options ?? [];
  const sub = subOptions[0];
  const subName = sub?.name;
  const opts = sub?.options ?? [];

  if (subName === 'add') {
    const url = String(opts.find((o) => o.name === 'url')?.value ?? '').trim();
    const name = String(opts.find((o) => o.name === 'name')?.value ?? '').trim();
    const channelId =
      (opts.find((o) => o.name === 'channel')?.value as string | undefined) || interaction.channel_id || null;
    const rawType = String(opts.find((o) => o.name === 'type')?.value ?? 'rss');
    const feedType: FeedType = rawType === 'scrape' ? 'scrape' : 'rss';

    if (!url || !name) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing Required Fields')
        .description('Both `url` and `name` are required when adding an RSS feed.')
        .respond(true);
    }

    try {
      const roleId = (opts.find((o) => o.name === 'role')?.value as string | undefined) ?? null;
      const feed = deps.repo.addFeed(user.id, name, url, channelId, feedType, null, guildId, undefined, roleId);
      deps.repo.logActivity(user.id, 'info', 'bot', `Added RSS feed "${name}" via Discord bot`);
      if (channelId) {
        await notifyFeedAdded(deps.bot, channelId, name).catch(() => {});
      }

      const h = EmbedHandler.for(deps)
        .success()
        .title('RSS Feed Added', '📰')
        .field('Name', feed.name, true)
        .field('Feed ID', `#${feed.id}`, true)
        .field('Type', feed.feedType.toUpperCase(), true)
        .field('Target Channel', channelId ? `<#${channelId}>` : 'None', true)
        .field('URL', `\`${feed.url}\``, false);
      if (feed.roleId) {
        h.field('Subscribed Role', `<@&${feed.roleId}>`, true);
      }
      return h.footer(`${appDisplayName(deps)} • Direct Bot Delivery`).respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Add Feed')
        .description((err as Error).message)
        .respond(true);
    }
  }

  if (subName === 'list') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const feeds = allFeeds.filter((f) => f.feedType === 'rss' || f.feedType === 'scrape');

    if (feeds.length === 0) {
      return EmbedHandler.for(deps)
        .info()
        .title('RSS Feeds', '📰')
        .description('No RSS/Atom feeds configured yet. Use `/rss add` to subscribe to your first feed!')
        .respond();
    }

    const h = EmbedHandler.for(deps)
      .primary()
      .title(`RSS & Scraper Feeds (${feeds.length})`, '📰')
      .footer(`${appDisplayName(deps)} • Use /rss remove or /rss toggle`);

    for (const f of feeds.slice(0, 25)) {
      const status = f.enabled ? '🟢 Enabled' : '⏸️ Paused';
      const lastChecked = f.lastCheckedAt ? new Date(f.lastCheckedAt).toLocaleString() : 'Never';
      const target = f.threadChannelId
        ? `<#${f.threadChannelId}> (thread)`
        : f.channelId
          ? `<#${f.channelId}>`
          : 'None';
      h.field(
        `#${f.id} — ${f.name} (${status})`,
        `**Type:** ${f.feedType.toUpperCase()}\n**Channel:** ${target}\n**Checked:** ${lastChecked}\n**URL:** \`${f.url}\``,
        false,
      );
    }

    return h.respond();
  }

  if (subName === 'remove') {
    const identifier = String(opts.find((o) => o.name === 'id')?.value ?? '').trim();
    if (!identifier) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing ID')
        .description('Please provide a feed ID or name.')
        .respond(true);
    }

    const allFeeds = deps.repo.listFeeds(user.id);
    const feed = allFeeds.find(
      (f) =>
        (f.feedType === 'rss' || f.feedType === 'scrape') &&
        (String(f.id) === identifier || f.name.toLowerCase() === identifier.toLowerCase()),
    );

    if (!feed) {
      return EmbedHandler.for(deps)
        .error()
        .title('Feed Not Found')
        .description(`RSS feed "${identifier}" was not found in this server.`)
        .respond(true);
    }

    deps.repo.deleteFeed(user.id, feed.id);
    deps.repo.logActivity(user.id, 'info', 'bot', `Deleted RSS feed "${feed.name}" via Discord bot`);

    return EmbedHandler.for(deps)
      .success()
      .title('RSS Feed Removed', '🗑️')
      .description(`Removed feed **${feed.name}** (\`#${feed.id}\`).`)
      .respond();
  }

  if (subName === 'toggle') {
    const identifier = String(opts.find((o) => o.name === 'id')?.value ?? '').trim();
    const enabled = Boolean(opts.find((o) => o.name === 'enabled')?.value);

    const allFeeds = deps.repo.listFeeds(user.id);
    const feed = allFeeds.find(
      (f) =>
        (f.feedType === 'rss' || f.feedType === 'scrape') &&
        (String(f.id) === identifier || f.name.toLowerCase() === identifier.toLowerCase()),
    );

    if (!feed) {
      return EmbedHandler.for(deps)
        .error()
        .title('Feed Not Found')
        .description(`RSS feed "${identifier}" was not found in this server.`)
        .respond(true);
    }

    deps.repo.updateFeed(user.id, feed.id, { enabled: enabled ? 1 : 0 });
    deps.repo.logActivity(
      user.id,
      'info',
      'bot',
      `${enabled ? 'Enabled' : 'Paused'} RSS feed "${feed.name}" via Discord bot`,
    );

    return EmbedHandler.for(deps)
      .success()
      .title(enabled ? 'Feed Enabled' : 'Feed Paused', enabled ? '▶️' : '⏸️')
      .description(`RSS feed **${feed.name}** (\`#${feed.id}\`) is now **${enabled ? 'enabled' : 'paused'}**.`)
      .respond();
  }

  if (subName === 'poll') {
    const rawId = opts.find((o) => o.name === 'id')?.value as string | undefined;
    const allFeeds = deps.repo.listFeeds(user.id);

    if (rawId) {
      const feed = allFeeds.find(
        (f) => String(f.id) === rawId.trim() || f.name.toLowerCase() === rawId.trim().toLowerCase(),
      );
      if (!feed) {
        return EmbedHandler.for(deps)
          .error()
          .title('Feed Not Found')
          .description(`No feed found with ID or name matching "${rawId}".`)
          .respond(true);
      }
      try {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
        deps.repo.logActivity(user.id, 'info', 'bot', `Manually polled feed "${feed.name}" via Discord bot`);
        return EmbedHandler.for(deps)
          .success()
          .title('Feed Check Complete', '📰')
          .description(`Successfully triggered check for **${feed.name}** (\`#${feed.id}\`).`)
          .footer(`${appDisplayName(deps)} • Feed Poller`)
          .respond();
      } catch (err) {
        return EmbedHandler.for(deps)
          .error()
          .title('Poll Failed')
          .description((err as Error).message)
          .respond(true);
      }
    }

    const rssFeeds = allFeeds.filter((f) => f.feedType === 'rss' || f.feedType === 'scrape');
    if (!rssFeeds.length) {
      return EmbedHandler.for(deps)
        .info()
        .title('No Feeds Found')
        .description('There are no RSS/Atom feeds configured in this server. Use `/rss add` to add one.')
        .respond(true);
    }

    try {
      for (const feed of rssFeeds) {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
      }
      deps.repo.logActivity(user.id, 'info', 'bot', `Manually polled all ${rssFeeds.length} feeds via Discord bot`);
      return EmbedHandler.for(deps)
        .success()
        .title('Feeds Check Triggered', '📰')
        .description(`Triggered an immediate check for **${rssFeeds.length}** RSS/scraper feed(s).`)
        .footer(`${appDisplayName(deps)} • Feed Poller`)
        .respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Poll Failed')
        .description((err as Error).message)
        .respond(true);
    }
  }

  return EmbedHandler.for(deps)
    .info()
    .title('RSS Command Usage', '📰')
    .description('Use `/rss add`, `/rss list`, `/rss poll`, `/rss remove`, or `/rss toggle`.')
    .respond();
}

registerCommandMetadata({
  name: 'rss',
  description: 'Manage RSS, Atom, and web scraper feeds for this server',
  category: 'feeds',
  emoji: '📰',
  usage: '/rss <add|list|poll|remove|toggle>',
  options: rssCommandDef.options,
  examples: [
    '/rss add url:https://news.ycombinator.com/rss name:"Hacker News"',
    '/rss list',
    '/rss poll',
    '/rss poll id:1',
    '/rss toggle id:1 enabled:false',
    '/rss remove id:1',
  ],
});

export const rssCommand: BotCommand = {
  def: rssCommandDef,
  category: 'feeds',
  isEnabled: (deps) => Boolean(deps.config.features.feedsEnabled),
  execute: handleRssCommand,
};
