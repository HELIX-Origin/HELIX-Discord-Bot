import { appDisplayName, type AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { createRedditFeeds } from '../../../feed/reddit.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';

export const redditCommandDef: ApplicationCommand = {
  name: 'reddit',
  description: 'Manage Reddit subreddit feeds and image posts for this server',
  options: [
    {
      name: 'add',
      description: 'Subscribe to a subreddit feed',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'subreddit',
          description: 'Subreddit name (e.g. memes, wallpapers) or URL (e.g. https://reddit.com/r/memes)',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'name',
          description: 'Display name for the feed (optional, defaults to r/subreddit)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'channel',
          description: 'Discord channel where new posts should be published',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [0, 5],
        },
      ],
    },
    {
      name: 'list',
      description: 'List all Reddit feeds subscribed in this server',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'remove',
      description: 'Remove a Reddit feed subscription',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or subreddit name to remove',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
      ],
    },
    {
      name: 'toggle',
      description: 'Enable or pause a Reddit feed',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or subreddit name',
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
      description: 'Check for new Reddit posts immediately',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'id',
          description: 'The numeric feed ID or subreddit name to poll (optional, polls all if omitted)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
  ],
};

function normalizeSubreddit(input: string): { name: string; url: string } {
  let sub = input.trim();
  if (sub.includes('reddit.com/r/')) {
    sub = sub.split('reddit.com/r/')[1]?.split(/[/?#]/)[0] ?? sub;
  }
  sub = sub.replace(/^[rR]\//, '').replace(/^\//, '');
  return {
    name: `r/${sub}`,
    url: `https://www.reddit.com/r/${sub}/.rss`,
  };
}

export async function handleRedditCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('Reddit commands can only be used inside a Discord server.')
      .respond(true);
  }

  const user = deps.repo.getOrCreateGuildUser(guildId);
  const subOptions = interaction.data?.options ?? [];
  const sub = subOptions[0];
  const subName = sub?.name;
  const opts = sub?.options ?? [];

  if (subName === 'add') {
    const rawSub = String(opts.find((o) => o.name === 'subreddit')?.value ?? '').trim();
    if (!rawSub) {
      return EmbedHandler.for(deps)
        .error()
        .title('Missing Subreddit')
        .description('Please provide a subreddit name (e.g. `memes`, `wallpapers`) or URL.')
        .respond(true);
    }

    const { name: defaultName, url } = normalizeSubreddit(rawSub);
    const customName = String(opts.find((o) => o.name === 'name')?.value ?? '').trim();
    const name = customName || defaultName;
    const channelId =
      (opts.find((o) => o.name === 'channel')?.value as string | undefined) || interaction.channel_id || null;

    try {
      const reddit = deps.reddit ?? createRedditFeeds();
      if (!reddit.available()) {
        return EmbedHandler.for(deps)
          .error()
          .title('Reddit Feeds Disabled')
          .description(
            'Reddit feeds are disabled: a cookies.json (or cookies.txt) file with a logged-in Reddit session is required at the repo root (or set REDDIT_COOKIES_FILE). See wiki/Reddit-Feeds.md.',
          )
          .respond(true);
      }

      let targetNsfw = false;
      if (channelId && deps.bot) {
        try {
          const snapshot = await deps.bot.getChannel(channelId);
          targetNsfw = Boolean(snapshot.nsfw);
        } catch {
          targetNsfw = false;
        }
      }
      const sub = reddit.subredditFromUrlOrName(rawSub) ?? normalizeSubreddit(rawSub).name.replace(/^r\//i, '');
      await reddit.assertTargetAllowed(sub, targetNsfw);

      const feed = deps.repo.addFeed(user.id, name, url, channelId, 'reddit', null, guildId);
      deps.repo.logActivity(user.id, 'info', 'bot', `Added Reddit feed "${name}" via Discord bot`);

      return EmbedHandler.for(deps)
        .success()
        .title('Reddit Feed Added', '👽')
        .field('Subreddit', feed.name, true)
        .field('Feed ID', `#${feed.id}`, true)
        .field('Target Channel', channelId ? `<#${channelId}>` : 'None', true)
        .field('RSS Feed URL', `\`${feed.url}\``, false)
        .footer(`${appDisplayName(deps)} • Reddit Direct Delivery`)
        .respond();
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Add Reddit Feed')
        .description((err as Error).message)
        .respond(true);
    }
  }

  if (subName === 'list') {
    const allFeeds = deps.repo.listFeeds(user.id);
    const feeds = allFeeds.filter((f) => f.feedType === 'reddit');

    if (feeds.length === 0) {
      return EmbedHandler.for(deps)
        .info()
        .title('Reddit Feeds', '👽')
        .description('No Reddit feeds configured yet. Use `/reddit add` to subscribe to your first subreddit!')
        .respond();
    }

    const h = EmbedHandler.for(deps)
      .primary()
      .title(`Reddit Feeds (${feeds.length})`, '👽')
      .footer(`${appDisplayName(deps)} • Use /reddit remove or /reddit toggle`);

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
        .description('Please provide a feed ID or subreddit name.')
        .respond(true);
    }

    const allFeeds = deps.repo.listFeeds(user.id);
    const feed = allFeeds.find(
      (f) =>
        f.feedType === 'reddit' &&
        (String(f.id) === identifier ||
          f.name.toLowerCase() === identifier ||
          f.name.toLowerCase() === `r/${identifier}` ||
          f.url.toLowerCase().includes(`/r/${identifier}/`)),
    );

    if (!feed) {
      return EmbedHandler.for(deps)
        .error()
        .title('Feed Not Found')
        .description(`Reddit feed "${identifier}" was not found in this server.`)
        .respond(true);
    }

    deps.repo.deleteFeed(user.id, feed.id);
    deps.repo.logActivity(user.id, 'info', 'bot', `Deleted Reddit feed "${feed.name}" via Discord bot`);

    return EmbedHandler.for(deps)
      .success()
      .title('Reddit Feed Removed', '🗑️')
      .description(`Removed Reddit feed **${feed.name}** (\`#${feed.id}\`).`)
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
        f.feedType === 'reddit' &&
        (String(f.id) === identifier ||
          f.name.toLowerCase() === identifier ||
          f.name.toLowerCase() === `r/${identifier}` ||
          f.url.toLowerCase().includes(`/r/${identifier}/`)),
    );

    if (!feed) {
      return EmbedHandler.for(deps)
        .error()
        .title('Feed Not Found')
        .description(`Reddit feed "${identifier}" was not found in this server.`)
        .respond(true);
    }

    deps.repo.updateFeed(user.id, feed.id, { enabled: enabled ? 1 : 0 });
    deps.repo.logActivity(
      user.id,
      'info',
      'bot',
      `${enabled ? 'Enabled' : 'Paused'} Reddit feed "${feed.name}" via Discord bot`,
    );

    return EmbedHandler.for(deps)
      .success()
      .title(enabled ? 'Feed Resumed' : 'Feed Paused', enabled ? '▶️' : '⏸️')
      .description(`Reddit feed **${feed.name}** (\`#${feed.id}\`) is now **${enabled ? 'enabled' : 'paused'}**.`)
      .respond();
  }

  if (subName === 'poll') {
    const rawId = opts.find((o) => o.name === 'id')?.value as string | undefined;
    const allFeeds = deps.repo.listFeeds(user.id);

    if (rawId) {
      const identifier = rawId.trim().toLowerCase();
      const feed = allFeeds.find(
        (f) =>
          f.feedType === 'reddit' &&
          (String(f.id) === identifier ||
            f.name.toLowerCase() === identifier ||
            f.name.toLowerCase() === `r/${identifier}` ||
            f.url.toLowerCase().includes(`/r/${identifier}/`)),
      );
      if (!feed) {
        return EmbedHandler.for(deps)
          .error()
          .title('Feed Not Found')
          .description(`Reddit feed "${identifier}" was not found in this server.`)
          .respond(true);
      }
      try {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
        deps.repo.logActivity(user.id, 'info', 'bot', `Manually polled Reddit feed "${feed.name}" via Discord bot`);
        return EmbedHandler.for(deps)
          .success()
          .title('Reddit Check Complete', '👽')
          .description(`Successfully triggered check for **${feed.name}** (\`#${feed.id}\`).`)
          .footer(`${appDisplayName(deps)} • Reddit Watcher`)
          .respond();
      } catch (err) {
        return EmbedHandler.for(deps)
          .error()
          .title('Poll Failed')
          .description((err as Error).message)
          .respond(true);
      }
    }

    const redditFeeds = allFeeds.filter((f) => f.feedType === 'reddit');
    if (!redditFeeds.length) {
      return EmbedHandler.for(deps)
        .info()
        .title('No Reddit Feeds')
        .description('No Reddit feeds configured in this server. Use `/reddit add` to add one.')
        .respond(true);
    }

    try {
      for (const feed of redditFeeds) {
        await deps.feeds?.pollFeed(user.id, feed.id, true);
      }
      deps.repo.logActivity(
        user.id,
        'info',
        'bot',
        `Manually polled all ${redditFeeds.length} Reddit feeds via Discord bot`,
      );
      return EmbedHandler.for(deps)
        .success()
        .title('Reddit Check Triggered', '👽')
        .description(`Triggered an immediate check for **${redditFeeds.length}** Reddit feed(s).`)
        .footer(`${appDisplayName(deps)} • Reddit Watcher`)
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
    .title('Reddit Command Usage', '👽')
    .description('Use `/reddit add`, `/reddit list`, `/reddit remove`, `/reddit toggle`, or `/reddit poll`.')
    .respond();
}

registerCommandMetadata({
  name: 'reddit',
  description: 'Manage Reddit subreddit feeds and image posts for this server',
  category: 'feeds',
  emoji: '👽',
  usage: '/reddit <add|list|remove|toggle|poll>',
  options: redditCommandDef.options,
  examples: [
    '/reddit add subreddit:memes',
    '/reddit add subreddit:wallpapers channel:#wallpapers',
    '/reddit list',
    '/reddit toggle id:1 enabled:false',
    '/reddit poll',
  ],
});

export const redditCommand: BotCommand = {
  def: redditCommandDef,
  category: 'feeds',
  isEnabled: (deps) => Boolean(deps.config.features.feedsEnabled) && (deps.reddit ?? createRedditFeeds()).available(),
  execute: handleRedditCommand,
};
