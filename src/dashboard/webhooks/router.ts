import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppDeps } from '../../app.js';
import { createLogger, type LogLevel } from '../../util/logger.js';
import type { Feed, FeedType } from '../../state/types.js';
import { parseFeed, type FeedEntry } from '../../feed/parser.js';
import { resolveFeedTargets } from '../../feed/targets.js';
import type { FeedThreadManager } from '../../feed/threads.js';
import type { DiscordBot } from '../../bot/bot.js';
import { streamAlertEmbed, feedEmbed } from '../../bot/utils/embeds.js';
import { isRedditCommunityHomePost } from '../../feed/reddit.js';

interface WebhookSubscription {
  userId: number;
  feedId: number;
  topic: string;
  callbackUrl: string;
  secret: string;
  expiresAt: number;
  verified: boolean;
}

export class WebhookRouter {
  private readonly logger;
  private subscriptions = new Map<string, WebhookSubscription>();
  private readonly youtubeChannelIdCache = new Map<string, string>();
  private readonly deps: AppDeps;
  private readonly baseUrl: string;
  private bot: DiscordBot | null = null;
  private threads: FeedThreadManager | null = null;

  constructor(deps: AppDeps, logLevel?: LogLevel) {
    this.logger = createLogger('webhook', logLevel);
    this.deps = deps;
    this.baseUrl = deps.config.publicBaseUrl || deps.config.internalUrl;
  }

  setBot(bot: DiscordBot | null): void {
    this.bot = bot;
  }

  setThreads(threads: FeedThreadManager | null): void {
    this.threads = threads;
  }

  async handleVerification(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const mode = url.searchParams.get('hub.mode');
    const challenge = url.searchParams.get('hub.challenge');
    const topic = url.searchParams.get('hub.topic');
    const leaseSeconds = url.searchParams.get('hub.lease_seconds');

    if (mode === 'subscribe' && challenge && topic) {
      const subscription = this.subscriptions.get(topic);
      if (subscription && !subscription.verified) {
        subscription.verified = true;
        subscription.expiresAt = Date.now() + parseInt(leaseSeconds || '86400') * 1000;

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge);
        this.logger.info('PubSubHubbub subscription verified', { topic });
        return true;
      }
    } else if (mode === 'unsubscribe' && challenge && topic) {
      const subscription = this.subscriptions.get(topic);
      if (subscription) {
        subscription.verified = false;
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge);
        this.logger.info('PubSubHubbub subscription unsubscribed', { topic });
        return true;
      }
    }
    return false;
  }

  async handleNotification(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const topic = this.extractNotificationTopic(req);
    if (!topic) {
      this.logger.warn('Webhook notification without a recognizable topic');
      res.writeHead(400);
      res.end();
      return false;
    }

    const subscription = this.subscriptions.get(topic);
    if (!subscription) {
      this.logger.warn('Webhook notification for unknown topic', { topic });
      res.writeHead(404);
      res.end();
      return false;
    }

    if (!subscription.verified) {
      this.logger.warn('Webhook notification for unverified subscription', { topic });
      res.writeHead(400);
      res.end();
      return false;
    }

    const sigHeader = req.headers['x-hub-signature-256'] ?? req.headers['x-hub-signature'];
    const signature = Array.isArray(sigHeader) ? sigHeader[0] : (sigHeader ?? '');
    const body = await this.readBody(req);

    if (!this.verifySignature(subscription.secret, body, signature)) {
      this.logger.warn('Invalid webhook signature', { topic });
      res.writeHead(401);
      res.end();
      return false;
    }

    try {
      const feed = this.deps.repo.getFeed(subscription.userId, subscription.feedId);
      if (!feed) {
        this.logger.warn('Feed not found for webhook subscription', { feedId: subscription.feedId, topic });
        res.writeHead(404);
        res.end();
        return false;
      }

      const entries = await this.parseFeedContent(body, feed.feedType);
      const isReddit = feed.feedType === 'reddit' || feed.url.toLowerCase().includes('reddit.com');
      const validEntries = isReddit ? entries.filter((e) => !isRedditCommunityHomePost(e)) : entries;

      const unposted = validEntries.filter((e) => {
        const guid = e.id || e.link;
        return guid && !this.deps.repo.isEntrySent(feed.id, guid);
      });
      if (unposted.length > 0) {
        const newest = unposted[0];
        await this.processEntry(feed, newest);
        for (let i = 1; i < unposted.length; i++) {
          const olderGuid = unposted[i].id || unposted[i].link;
          if (olderGuid) {
            this.deps.repo.markEntrySent(feed.id, olderGuid);
          }
        }
      }

      res.writeHead(200);
      res.end();
      return true;
    } catch (err) {
      this.logger.error('Error processing webhook notification', { topic, error: (err as Error).message });
      res.writeHead(500);
      res.end();
      return false;
    }
  }

  private extractNotificationTopic(req: IncomingMessage): string {
    const linkHeader = req.headers['link'];
    if (linkHeader) {
      const links = Array.isArray(linkHeader) ? linkHeader.join(',') : linkHeader;
      const selfLink = links.split(',').find((part) => /rel\s*=\s*"?self"?/i.test(part));
      const match = selfLink ? /<([^>]+)>/.exec(selfLink) : null;
      if (match?.[1]) return match[1];
    }
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    return url.searchParams.get('hub.topic') || '';
  }

  private async readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  private verifySignature(secret: string, body: string, signature: string): boolean {
    if (!signature.startsWith('sha256=')) return false;
    const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== signatureBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  private async parseFeedContent(body: string, feedType: FeedType): Promise<FeedEntry[]> {
    switch (feedType) {
      case 'youtube': {
        return this.parseYouTubeContent(body);
      }
      case 'twitch': {
        return this.parseTwitchContent(body);
      }
      case 'rss':
      case 'scrape':
      case 'reddit':
      default: {
        const parsed = parseFeed(body);
        return parsed.entries;
      }
    }
  }

  private parseYouTubeContent(body: string): FeedEntry[] {
    // Google's hub pushes the channel's Atom feed (XML), not JSON. The atom
    // parser extracts title/link/author/date; normalize the <yt:video:ID> id
    // to the bare video id so webhook delivery dedupes against polling.
    try {
      const parsed = parseFeed(body);
      return parsed.entries.map((e) => ({ ...e, id: e.id.replace(/^yt:video:/, '') }));
    } catch {
      return [];
    }
  }

  private parseTwitchContent(body: string): FeedEntry[] {
    try {
      const data = JSON.parse(body);
      const entries: FeedEntry[] = [];

      if (data.data) {
        for (const stream of data.data) {
          entries.push({
            id: stream.id,
            title: `${stream.user_name} is live: ${stream.title}`,
            link: `https://twitch.tv/${stream.user_login}`,
            publishedAt: stream.started_at,
            author: stream.user_name,
            description: stream.title,
            imageUrl: stream.thumbnail_url?.replace('{width}', '1280').replace('{height}', '720'),
          });
        }
      }
      return entries;
    } catch {
      return [];
    }
  }

  private async processEntry(feed: Feed, entry: FeedEntry): Promise<void> {
    const guid = entry.id || entry.link;
    if (!guid) return;

    const isDuplicate = this.deps.repo.isEntrySent(feed.id, guid);
    if (isDuplicate) return;

    const embed =
      feed.feedType === 'youtube' || feed.feedType === 'twitch'
        ? streamAlertEmbed({
            title: entry.title,
            url: entry.link,
            description: entry.description,
            author: entry.author,
            publishedAt: entry.publishedAt,
            feedTitle: feed.name,
            color: feed.feedType === 'twitch' ? 0x9146ff : feed.feedType === 'youtube' ? 0xff0000 : 0x06b6d4,
            imageUrl: entry.imageUrl,
            feedType: feed.feedType,
            brandIconUrl: null,
          })
        : feedEmbed({
            title: entry.title,
            url: entry.link,
            description: entry.description,
            author: entry.author,
            publishedAt: entry.publishedAt,
            feedTitle: feed.name,
            imageUrl: entry.imageUrl,
            feedType: feed.feedType,
            brandIconUrl: null,
          });

    const delivered = await this.deliverToTargets(feed, embed);
    if (delivered) {
      this.deps.repo.markEntrySent(feed.id, guid);
      this.deps.repo.setFeedPosted(feed.userId, feed.id);
    } else {
      this.logger.warn('Delivery failed for webhook entry', { feedId: feed.id, guid });
    }
  }

  private async deliverToTargets(feed: Feed, embed: unknown): Promise<boolean> {
    const payload = { embeds: [embed] };

    if (this.threads && feed.channelId) {
      const outcome = await this.threads.deliver(feed, payload);
      if (outcome.mode === 'thread') {
        if (outcome.delivered && outcome.threadId) {
          feed.threadChannelId = outcome.threadId;
        }
        if (!outcome.delivered) {
          this.logger.warn('Thread delivery failed for webhook entry', {
            feedId: feed.id,
            fallbackReason: outcome.fallbackReason,
          });
        }
        return outcome.delivered;
      }
    }

    const { channelId } = resolveFeedTargets(feed);
    if (!this.bot || !channelId) {
      this.logger.warn('No Discord bot or channel target for webhook entry', { feedId: feed.id });
      return false;
    }

    try {
      await this.bot.sendChannelMessage(channelId, payload);
      return true;
    } catch (err) {
      this.logger.error('Failed to deliver webhook entry', { feedId: feed.id, error: (err as Error).message });
      return false;
    }
  }

  async subscribeToFeed(feed: Feed): Promise<boolean> {
    const topic = await this.getTopicForFeed(feed);
    if (!topic) return false;

    const existing = this.subscriptions.get(topic);
    if (existing && existing.verified && existing.expiresAt > Date.now()) {
      return true;
    }

    const callbackUrl = `${this.baseUrl}/webhook/callback`;
    const secret = this.generateSecret();

    const subscription: WebhookSubscription = {
      userId: feed.userId,
      feedId: feed.id,
      topic,
      callbackUrl,
      secret,
      expiresAt: Date.now() + 86400000,
      verified: false,
    };

    this.subscriptions.set(topic, subscription);

    const hubUrl = await this.getHubUrl(feed);
    if (!hubUrl) return false;

    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.topic': topic,
      'hub.callback': callbackUrl,
      'hub.secret': subscription.secret,
      'hub.verify': 'async',
    });

    try {
      const res = await fetch(hubUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (res.ok) {
        this.logger.info('Subscribed to feed', { feedId: feed.id, hub: hubUrl });
        return true;
      } else {
        this.logger.warn('Failed to subscribe to feed', { feedId: feed.id, status: res.status });
        return false;
      }
    } catch (err) {
      this.logger.error('Error subscribing to feed', { feedId: feed.id, error: (err as Error).message });
      return false;
    }
  }

  private async getTopicForFeed(feed: Feed): Promise<string | null> {
    if (feed.feedType === 'youtube') {
      // Google's PubSubHubbub only accepts youtube/xml feed topics whose
      // channel_id is a real channel ID (UC...). Handles/custom names never
      // work, so resolve the ID from the channel page (cached per URL).
      const channelId = await this.resolveYouTubeChannelId(feed.url);
      if (!channelId) return null;
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    }
    if (feed.feedType === 'twitch') {
      // Twitch uses EventSub, not PubSubHubbub; covered by polling fallback.
      return null;
    }
    if (feed.feedType === 'rss' || feed.feedType === 'scrape' || feed.feedType === 'reddit') {
      return feed.url;
    }
    return null;
  }

  private async resolveYouTubeChannelId(url: string): Promise<string | null> {
    const direct = /(?:^|\/)(?:channel|c)\/(UC[\w-]+)/i.exec(url);
    if (direct?.[1]) return direct[1];
    const feedMatch = /feeds\/videos\.xml\?channel_id=(UC[\w-]+)/i.exec(url);
    if (feedMatch?.[1]) return feedMatch[1];
    const cached = this.youtubeChannelIdCache.get(url);
    if (cached) return cached;

    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; HELIX-Discord-Bot/0.5.0)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const html = await res.text();
      const match = /channel_id=(UC[\w-]+)/.exec(html) ?? /"externalId"\s*:\s*"(UC[\w-]+)"/.exec(html);
      if (!match?.[1]) return null;
      this.youtubeChannelIdCache.set(url, match[1]);
      return match[1];
    } catch {
      return null;
    }
  }

  private async getHubUrl(feed: Feed): Promise<string | null> {
    if (feed.feedType === 'youtube') {
      return 'https://pubsubhubbub.appspot.com';
    }
    if (feed.feedType === 'twitch') {
      // Twitch uses webhooks/EventSub, not PubSubHubbub.
      return null;
    }
    try {
      const res = await fetch(feed.url, {
        headers: { accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml' },
      });
      if (!res.ok) return null;
      const text = await res.text();
      const hubLink =
        /<link[^>]+rel\s*=\s*["']hub["'][^>]*href\s*=\s*["']([^"']+)["']/i.exec(text) ||
        /<link[^>]+href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']hub["']/i.exec(text);
      return hubLink?.[1] ?? null;
    } catch {
      return null;
    }
  }

  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  async subscribeToAllFeeds(): Promise<void> {
    const feeds = this.deps.repo.listFeedsForAllUsers();
    for (const feed of feeds) {
      if (feed.enabled) {
        await this.subscribeToFeed(feed);
      }
    }
  }
}
