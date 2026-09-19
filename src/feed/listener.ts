import type { AppDeps } from '../app.js';
import { createLogger, type Logger } from '../util/logger.js';
import type { Feed } from '../state/types.js';
import type { IncomingMessage } from 'node:http';

async function readBody(req: Request | IncomingMessage): Promise<string> {
  if ('text' in req && typeof req.text === 'function') {
    return req.text();
  }
  return new Promise((resolve, reject) => {
    let body = '';
    const incoming = req as IncomingMessage;
    incoming.on('data', (chunk: string | Buffer) => {
      body += chunk;
    });
    incoming.on('end', () => resolve(body));
    incoming.on('error', reject);
  });
}

function getHeader(req: Request | IncomingMessage, name: string): string | null {
  if ('headers' in req && typeof req.headers.get === 'function') {
    return req.headers.get(name);
  }
  const key = name.toLowerCase();
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const value = headers[key];
  return Array.isArray(value) ? value[0] : (value ?? null);
}

interface WebhookEvent {
  source: 'youtube' | 'twitch' | 'rss' | 'webSub';
  feedId: number;
  guildId: string;
  payload: unknown;
  receivedAt: Date;
}

interface WebhookVerification {
  success: boolean;
  challenge: string;
}

interface ListenerConfig {
  youtubeHubCallback?: string;
  twitchEventSubCallback?: string;
  webSubHubCallback?: string;
}

export class FeedListener {
  private readonly logger: Logger;
  private readonly deps: AppDeps;
  private readonly config: ListenerConfig;
  private readonly pendingValidations = new Map<string, { feed: Feed; expiresAt: number }>();

  constructor(deps: AppDeps, config: ListenerConfig = {}) {
    this.deps = deps;
    this.logger = createLogger('feed-listener', deps.config.logLevel);
    this.config = config;
  }

  getYoutubeHubCallbackUrl(): string {
    return (
      this.config.youtubeHubCallback ??
      `${this.deps.config.publicBaseUrl ?? this.deps.config.internalUrl}/api/feeds/webhooks/youtube`
    );
  }

  getTwitchEventSubCallbackUrl(): string {
    return (
      this.config.twitchEventSubCallback ??
      `${this.deps.config.publicBaseUrl ?? this.deps.config.internalUrl}/api/feeds/webhooks/twitch`
    );
  }

  getWebSubHubCallbackUrl(): string {
    return (
      this.config.webSubHubCallback ??
      `${this.deps.config.publicBaseUrl ?? this.deps.config.internalUrl}/api/feeds/webhooks/websub`
    );
  }

  async registerYoutubeWebhook(feed: Feed): Promise<boolean> {
    if (!feed.url.includes('youtube.com') && !feed.url.includes('youtu.be')) return false;

    const channelId = this.extractYoutubeChannelId(feed.url);
    if (!channelId) {
      this.logger.warn('Could not extract YouTube channel ID', { feedId: feed.id, url: feed.url });
      return false;
    }

    const hubUrl = 'https://pubsubhubbub.appspot.com/subscribe';
    const callbackUrl = this.getYoutubeHubCallbackUrl();
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

    try {
      const params = new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.topic': topicUrl,
        'hub.callback': callbackUrl,
        'hub.verify': 'async',
        'hub.lease_seconds': '864000', // 10 days
      });

      const res = await fetch(hubUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 202 || res.status === 204) {
        this.logger.info('YouTube PubSubHubbub subscription requested', { feedId: feed.id, channelId });
        return true;
      } else {
        this.logger.warn('YouTube PubSubHubbub subscription failed', { feedId: feed.id, status: res.status });
        return false;
      }
    } catch (err) {
      this.logger.error('YouTube webhook registration error', { feedId: feed.id, err: (err as Error).message });
      return false;
    }
  }

  async registerTwitchEventSub(feed: Feed): Promise<boolean> {
    if (!feed.url.includes('twitch.tv')) return false;
    if (!this.deps.config.twitchClientId || !this.deps.config.twitchClientSecret) {
      this.logger.warn('Twitch credentials not configured, skipping EventSub registration');
      return false;
    }

    const broadcasterId = this.extractTwitchBroadcasterId(feed.url);
    if (!broadcasterId) return false;

    try {
      const token = await this.getTwitchAppAccessToken();
      if (!token) return false;

      const callbackUrl = this.getTwitchEventSubCallbackUrl();
      const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
          'Client-Id': this.deps.config.twitchClientId!,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'stream.online',
          version: '1',
          condition: { broadcaster_user_id: broadcasterId },
          transport: {
            method: 'webhook',
            callback: callbackUrl,
            secret: this.generateWebhookSecret(),
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        this.logger.info('Twitch EventSub subscription created', { feedId: feed.id, broadcasterId });
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        this.logger.warn('Twitch EventSub subscription failed', { feedId: feed.id, status: res.status, err });
        return false;
      }
    } catch (err) {
      this.logger.error('Twitch EventSub registration error', { feedId: feed.id, err: (err as Error).message });
      return false;
    }
  }

  async registerWebSub(feed: Feed): Promise<boolean> {
    const hubUrl = this.discoverHubUrl(feed.url);
    if (!hubUrl) return false;

    const callbackUrl = this.getWebSubHubCallbackUrl();
    const topicUrl = feed.url;

    try {
      const params = new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.topic': topicUrl,
        'hub.callback': callbackUrl,
        'hub.verify': 'async',
        'hub.lease_seconds': '864000',
      });

      const res = await fetch(hubUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 202 || res.status === 204) {
        this.logger.info('WebSub subscription requested', { feedId: feed.id, hub: hubUrl });
        return true;
      } else {
        this.logger.warn('WebSub subscription failed', { feedId: feed.id, status: res.status });
        return false;
      }
    } catch (err) {
      this.logger.error('WebSub registration error', { feedId: feed.id, err: (err as Error).message });
      return false;
    }
  }

  private async getTwitchAppAccessToken(): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        client_id: this.deps.config.twitchClientId!,
        client_secret: this.deps.config.twitchClientSecret!,
        grant_type: 'client_credentials',
      });
      const res = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.access_token;
    } catch {
      return null;
    }
  }

  private generateWebhookSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private extractYoutubeChannelId(url: string): string | null {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private extractTwitchBroadcasterId(url: string): string | null {
    const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : null;
  }

  private discoverHubUrl(_feedUrl: string): string | null {
    // Would need to fetch feed and parse <link rel="hub"> - simplified for now
    return null;
  }

  async handleYoutubeCallback(req: Request): Promise<{ success: boolean; challenge?: string }> {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const topic = url.searchParams.get('hub.topic');
    const challenge = url.searchParams.get('hub.challenge');
    const _leaseSeconds = url.searchParams.get('hub.lease_seconds');

    if (mode === 'subscribe' && challenge && topic) {
      this.logger.info('YouTube PubSubHubbub verification received', { topic });
      this.pendingValidations.set(topic, { feed: null as unknown as Feed, expiresAt: Date.now() + 60000 });
      return { success: true, challenge };
    }
    if (mode === 'unsubscribe' && challenge) {
      return { success: true, challenge };
    }
    if (mode === 'denied') {
      this.logger.warn('YouTube PubSubHubbub subscription denied', {
        topic,
        reason: url.searchParams.get('hub.reason'),
      });
    }
    return { success: false };
  }

  async handleYoutubeNotification(req: Request | IncomingMessage): Promise<WebhookEvent | null> {
    const body = await readBody(req);
    if (!body) return null;

    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(body, 'application/xml');
      const entry = xml.querySelector('entry');
      if (!entry) return null;

      const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent;
      const channelId = entry.querySelector('yt\\:channelId, channelId')?.textContent;
      const published = entry.querySelector('published')?.textContent;
      const title = entry.querySelector('title')?.textContent;
      const link = entry.querySelector('link')?.getAttribute('href');

      if (!videoId || !channelId) return null;

      return {
        source: 'youtube',
        feedId: 0, // Will be resolved by matching channelId
        guildId: '',
        payload: { videoId, channelId, published, title, link },
        receivedAt: new Date(),
      };
    } catch (err) {
      this.logger.error('Failed to parse YouTube notification', { err: (err as Error).message });
      return null;
    }
  }

  async handleTwitchEventSub(req: Request | IncomingMessage): Promise<WebhookEvent | WebhookVerification | null> {
    const messageType = getHeader(req, 'twitch-eventsub-message-type');
    const _signature = getHeader(req, 'twitch-eventsub-message-signature');
    const _timestamp = getHeader(req, 'twitch-eventsub-message-timestamp');
    const body = await readBody(req);

    if (messageType === 'webhook_callback_verification') {
      const data = JSON.parse(body);
      this.logger.info('Twitch EventSub verification', { subscriptionId: data.subscription?.id });
      return { success: true, challenge: data.challenge } as { success: boolean; challenge: string };
    }

    if (messageType === 'notification') {
      const data = JSON.parse(body);
      const event = data.event;
      if (event?.type === 'stream.online') {
        return {
          source: 'twitch',
          feedId: 0,
          guildId: '',
          payload: event,
          receivedAt: new Date(),
        };
      }
    }
    return null;
  }

  async handleWebSubNotification(req: Request | IncomingMessage): Promise<WebhookEvent | null> {
    const body = await readBody(req);
    if (!body) return null;

    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(body, 'application/xml');
      const entries = xml.querySelectorAll('entry');
      const events: WebhookEvent[] = [];

      entries.forEach((entry) => {
        const id = entry.querySelector('id')?.textContent;
        const title = entry.querySelector('title')?.textContent;
        const link = entry.querySelector('link')?.getAttribute('href');
        const published = entry.querySelector('published')?.textContent;
        const author = entry.querySelector('author name')?.textContent;

        if (id) {
          events.push({
            source: 'rss',
            feedId: 0,
            guildId: '',
            payload: { id, title, link, published, author },
            receivedAt: new Date(),
          });
        }
      });

      return events[0] ?? null;
    } catch (err) {
      this.logger.error('Failed to parse WebSub notification', { err: (err as Error).message });
      return null;
    }
  }
}
