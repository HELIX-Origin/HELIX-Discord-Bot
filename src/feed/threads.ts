import type { AppConfig } from '../config.js';
import type { Repository } from '../db/repository.js';
import type { DiscordChannelSnapshot } from '../bot/rest.js';
import { type Feed } from '../state/types.js';
import { createLogger, type LogLevel } from '../util/logger.js';

export interface ThreadSender {
  sendChannelMessage(channelId: string, payload: { content?: string; embeds?: unknown[] }): Promise<void>;
  getChannel(channelId: string): Promise<DiscordChannelSnapshot>;
  createThread(
    channelId: string,
    payload: { name: string; autoArchiveDuration?: number },
  ): Promise<{ id: string; name: string; type: number }>;
  archiveThread(threadId: string): Promise<void>;
  unarchiveThread?(threadId: string): Promise<void>;
  getGuildsWithChannels?(): Promise<
    Array<{
      id: string;
      name: string;
      icon: string | null;
      channels: Array<{ id: string; name: string; type: number; position?: number }>;
    }>
  >;
}

export interface ThreadDeliveryOutcome {
  delivered: boolean;
  mode: 'thread' | 'channel';
  threadId?: string;
  fallbackReason?: string;
}

/** Largest allowed auto-archive window Discord accepts (7 days). */
const MAX_AUTO_ARCHIVE_MINUTES = 10080;

/**
 * Coordinates per-feed thread delivery.
 *
 * - One dedicated thread per feed, auto-created in the feed's own delivery
 *   channel (`feeds.channel_id`) when thread delivery is enabled for the guild.
 * - Threads are polled periodically and "kept open" with keepalive messages
 *   right before Discord would auto-archive them.
 * - When a feed thread reaches `threadMaxMessages` entries it is archived and
 *   a fresh thread is opened in its place.
 * - Applies only to feeds whose guild has thread delivery enabled
 *   (`discord_guilds.threads_enabled`). Otherwise feeds keep delivering
 *   directly to their channel.
 */
export class FeedThreadManager {
  private readonly logger;

  constructor(
    private readonly repo: Repository,
    private readonly bot: ThreadSender | null,
    private readonly config: AppConfig,
    logLevel?: LogLevel,
  ) {
    this.logger = createLogger('threads', logLevel);
  }

  /** Whether thread delivery is enabled for the guild a feed belongs to. */
  private async guildThreadsEnabled(feed: Feed): Promise<boolean> {
    const guildId = feed.guildId ?? (await this.resolveFeedGuild(feed));
    if (!guildId) return false;
    const binding = this.repo.getGuildBinding(guildId);
    return Boolean(binding && binding.threadsEnabled === 1);
  }

  /** Resolves the guild a feed belongs to (persisted guildId or the guild of its channel). */
  private async resolveFeedGuild(feed: Feed): Promise<string | null> {
    if (feed.guildId) return feed.guildId;
    if (!this.bot || !this.bot.getGuildsWithChannels) return null;
    try {
      const guilds = await this.bot.getGuildsWithChannels().catch(() => null);
      if (!guilds) return null;
      for (const guild of guilds) {
        if (guild.channels.some((c) => c.id === feed.channelId)) return guild.id;
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Delivers an entry into the feed's dedicated thread, or falls back to the
   * feed's regular channel when thread delivery is not configured/enabled.
   */
  async deliver(feed: Feed, payload: { content?: string; embeds?: unknown[] }): Promise<ThreadDeliveryOutcome> {
    if (!feed.channelId) {
      this.logger.warn('Feed has no delivery channel; skipping thread delivery', {
        feedId: feed.id,
        feedName: feed.name,
      });
      return { delivered: false, mode: 'channel', fallbackReason: 'feed has no delivery channel' };
    }

    if (!this.config.features.threadsEnabled) {
      return { delivered: false, mode: 'channel', fallbackReason: 'thread delivery disabled globally' };
    }

    if (!(await this.guildThreadsEnabled(feed))) {
      return { delivered: false, mode: 'channel', fallbackReason: 'thread delivery disabled for guild' };
    }

    if (!this.bot) {
      this.logger.warn('Discord bot is offline; skipping thread delivery', {
        feedId: feed.id,
        feedName: feed.name,
      });
      return { delivered: false, mode: 'thread', fallbackReason: 'bot offline' };
    }

    try {
      const currentThreadId = feed.threadChannelId || this.repo.getFeed(feed.userId, feed.id)?.threadChannelId || null;
      if (!currentThreadId) {
        const threadId = await this.createThread(feed, feed.channelId, payload);
        return { delivered: true, mode: 'thread', threadId };
      }

      // Check whether the tracked thread is still open before posting.
      let snapshot: DiscordChannelSnapshot;
      try {
        snapshot = await this.bot.getChannel(currentThreadId);
      } catch (channelErr) {
        const msg = channelErr instanceof Error ? channelErr.message : String(channelErr);
        // Only open a replacement if the thread was deleted / not found (HTTP 404 / Unknown Channel)
        if (msg.includes('404') || msg.includes('10003') || msg.toLowerCase().includes('unknown channel')) {
          this.logger.info('Feed thread was deleted; opening a replacement', {
            feedId: feed.id,
            feedName: feed.name,
            threadId: currentThreadId,
          });
          const threadId = await this.createThread(feed, feed.channelId, payload);
          return { delivered: true, mode: 'thread', threadId, fallbackReason: 'previous thread deleted' };
        }
        throw channelErr;
      }

      // If thread is archived, unarchive it so we can keep delivering into the same thread
      if (snapshot.thread_metadata?.archived && this.bot.unarchiveThread) {
        try {
          await this.bot.unarchiveThread(currentThreadId);
          this.logger.info('Unarchived feed thread for new entry', {
            feedId: feed.id,
            threadId: currentThreadId,
          });
        } catch (unarchiveErr) {
          this.logger.warn('Failed to unarchive feed thread; attempting delivery anyway', {
            feedId: feed.id,
            threadId: currentThreadId,
            error: unarchiveErr instanceof Error ? unarchiveErr.message : String(unarchiveErr),
          });
        }
      }

      await this.bot.sendChannelMessage(currentThreadId, payload);

      const entryCount = (feed.threadEntryCount || 0) + 1;
      feed.threadChannelId = currentThreadId;
      feed.threadEntryCount = entryCount;
      if (entryCount >= this.config.threadMaxMessages) {
        await this.rotate(feed, currentThreadId, feed.channelId, entryCount);
        return {
          delivered: true,
          mode: 'thread',
          threadId: feed.threadChannelId ?? currentThreadId,
          fallbackReason: 'rotated',
        };
      }
      this.repo.setFeedThread(feed.userId, feed.id, currentThreadId, entryCount);
      return { delivered: true, mode: 'thread', threadId: currentThreadId };
    } catch (err) {
      this.logger.warn('Thread delivery failed for feed entry', {
        feedId: feed.id,
        feedName: feed.name,
        error: err instanceof Error ? err.message : String(err),
      });
      return { delivered: false, mode: 'thread', fallbackReason: err instanceof Error ? err.message : String(err) };
    }
  }

  private async createThread(
    feed: Feed,
    channelId: string,
    payload: { content?: string; embeds?: unknown[] },
  ): Promise<string> {
    const name = feed.name.trim().slice(0, 100) || 'Feed updates';
    try {
      const thread = await this.bot!.createThread(channelId, {
        name,
        autoArchiveDuration: MAX_AUTO_ARCHIVE_MINUTES,
      });
      await this.bot!.sendChannelMessage(thread.id, payload);
      feed.threadChannelId = thread.id;
      feed.threadEntryCount = 1;
      this.repo.setFeedThread(feed.userId, feed.id, thread.id, 1);
      this.repo.logActivity(feed.userId, 'info', 'threads', `Opened thread "${name}" for feed "${feed.name}".`);
      return thread.id;
    } catch (err) {
      this.logger.warn('Thread creation failed; retrying without archive override', {
        feedId: feed.id,
        error: err instanceof Error ? err.message : String(err),
      });
      const thread = await this.bot!.createThread(channelId, { name });
      await this.bot!.sendChannelMessage(thread.id, payload);
      feed.threadChannelId = thread.id;
      feed.threadEntryCount = 1;
      this.repo.setFeedThread(feed.userId, feed.id, thread.id, 1);
      this.repo.logActivity(feed.userId, 'info', 'threads', `Opened thread "${name}" for feed "${feed.name}".`);
      return thread.id;
    }
  }

  private async rotate(feed: Feed, oldThreadId: string, channelId: string, entryCount: number): Promise<void> {
    try {
      await this.bot!.archiveThread(oldThreadId);
      this.logger.info('Archived large feed thread; opening a replacement', {
        feedId: feed.id,
        feedName: feed.name,
        entries: entryCount,
      });
      this.repo.logActivity(
        feed.userId,
        'info',
        'threads',
        `Feed "${feed.name}" reached ${entryCount} posts — archived thread and opened a new one.`,
      );
    } catch (err) {
      this.logger.warn('Failed to archive feed thread during rotation', {
        feedId: feed.id,
        threadId: oldThreadId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const intro = {
      content: `🗂️ **New thread started.** Previous thread for **${feed.name}** was archived after ${entryCount} posts.`,
    };
    try {
      const thread = await this.bot!.createThread(channelId, {
        name: (feed.name.trim() || 'Feed updates').slice(0, 100),
        autoArchiveDuration: MAX_AUTO_ARCHIVE_MINUTES,
      });
      await this.bot!.sendChannelMessage(thread.id, intro);
      feed.threadChannelId = thread.id;
      feed.threadEntryCount = 0;
      this.repo.setFeedThread(feed.userId, feed.id, thread.id, 0);
    } catch (err) {
      this.logger.warn('Failed to open replacement thread during rotation', {
        feedId: feed.id,
        error: err instanceof Error ? err.message : String(err),
      });
      feed.threadChannelId = null;
      feed.threadEntryCount = 0;
      this.repo.setFeedThread(feed.userId, feed.id, null, 0);
    }
  }

  /** Keepalive pass — keeps actively tracked feed threads from auto-archiving. */
  async keepAliveAll(): Promise<void> {
    if (!this.bot || !this.config.threadKeepaliveEnabled) return;
    const feeds = this.repo.listFeedsForAllUsers().filter((f) => f.threadChannelId);
    await Promise.all(
      feeds.map(async (feed) => {
        try {
          const threadId = feed.threadChannelId!;
          let snapshot: DiscordChannelSnapshot;
          try {
            snapshot = await this.bot!.getChannel(threadId);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('404') || msg.includes('10003') || msg.toLowerCase().includes('unknown channel')) {
              this.repo.setFeedThread(feed.userId, feed.id, null, 0);
            }
            return;
          }

          if (snapshot.thread_metadata?.archived) {
            if (this.bot!.unarchiveThread) {
              await this.bot!.unarchiveThread(threadId).catch(() => {});
            }
            return;
          }
          const archiveTs = snapshot.thread_metadata?.archive_timestamp;
          if (!archiveTs) return;
          const archiveTime = new Date(archiveTs).getTime();
          const now = Date.now();
          if (Number.isNaN(archiveTime) || archiveTime - now > this.config.threadKeepaliveGraceMs) return;

          await this.bot!.sendChannelMessage(threadId, {
            content: '📡 Thread keep-alive — prevents auto-archive.',
          });
          this.logger.debug('Posted keep-alive to feed thread', { feedId: feed.id, threadId });
        } catch (err) {
          this.logger.debug('Could not run keep-alive for feed thread', {
            feedId: feed.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }),
    );
  }
}
