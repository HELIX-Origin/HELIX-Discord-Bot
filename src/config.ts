import { resolve } from 'node:path';

import type { LogLevel } from './util/logger.js';

export interface FeatureFlags {
  feedsEnabled: boolean;
  streamAlertsEnabled: boolean;
  threadsEnabled: boolean;
  gifsEnabled: boolean;
  administrationEnabled: boolean;
  nodeLinkEnabled: boolean;
  dashboardEnabled: boolean;
  adminPanelEnabled: boolean;
}

export interface NodeLinkConfig {
  host: string;
  port: number;
  secure: boolean;
  password: string;
  external: boolean;
}

export interface AppConfig {
  host: string;
  port: number;
  internalUrl: string;
  publicBaseUrl: string | null;
  dbUri: string;
  dbPath: string;
  redisUri: string | null;
  pollIntervalMs: number;
  requestTimeoutMs: number;
  sslKey: string | null;
  sslCert: string | null;
  botSslKey: string | null;
  botSslCert: string | null;
  logLevel: LogLevel;
  botToken: string | null;
  botPort: number;
  clientId: string | null;
  clientSecret: string | null;
  redirectUrl: string | null;
  callbackUrl: string | null;
  discordApiBaseUrl: string;
  repoUrl: string;
  userAgent: string;
  defaultTheme: string;
  dashboardColorScheme: string;
  landingPageEnabled: boolean;
  forumChannelIds: string[];
  threadKeepaliveEnabled: boolean;
  threadKeepaliveIntervalMs: number;
  threadKeepaliveGraceMs: number;
  threadMaxMessages: number;
  youtubeApiKey: string | null;
  youtubeClientId: string | null;
  youtubeClientSecret: string | null;
  twitchClientId: string | null;
  twitchClientSecret: string | null;
  features: FeatureFlags;
  nodeLink: NodeLinkConfig;
  nodeLinkExternal: boolean;
  spotifyClientId: string | null;
  spotifyClientSecret: string | null;
  klipyApiKey: string | null;
  appleMediaToken: string | null;
}

export function defaultConfig(): AppConfig {
  const rawInternal = process.env['INTERNAL_URL']?.trim();
  let envHost: string | undefined;
  let envPort: number | undefined;
  if (rawInternal) {
    const internalCandidate = rawInternal.includes('://') ? rawInternal : `http://${rawInternal}`;
    try {
      const u = new URL(internalCandidate);
      envHost = u.hostname;
      if (u.port) envPort = Number(u.port);
    } catch {
      envHost = rawInternal;
    }
  }

  const defaultHost = '127.0.0.1';
  const host = (envHost === 'localhost' ? '0.0.0.0' : envHost) ?? process.env['HOST']?.trim() ?? defaultHost;
  const dataDir = process.env['SQLITE_DATA'] ?? resolve(process.cwd(), 'data');

  // DB_URI: unified connection string for database (SQLite, PostgreSQL, MySQL).
  // Examples:
  //   sqlite://./data/database.sqlite (or sqlite:./data/database.sqlite)
  //   postgresql://user:pass@host:5432/db
  //   mysql://user:pass@host:3306/db
  // Falls back to SQLite file in SQLITE_DATA directory.
  const dbUri = process.env['DB_URI']?.trim() || `sqlite:${resolve(dataDir, 'database.sqlite')}`;

  // REDIS_URI: optional remote Redis connection string for multi-instance
  // coordination (deduplication + locking) across multiple bot processes.
  // Example: rediss://:password@host:port (TLS) or redis://user:pass@host:6379/0.
  // When unset, an in-memory ioredis-mock coordination layer is used instead and
  // no external redis-server binary is required.
  const redisUri = process.env['REDIS_URI']?.trim() || process.env['REDIS_URL']?.trim() || null;

  // Port is derived exclusively from INTERNAL_URL (default 3131). No PORT-style
  // environment variables are used; proxies/tunnels mask ports on PUBLIC_URL.
  const botPort = envPort || 3131;
  const port = botPort;

  // Public URL: optional public URL for the service (behind reverse proxy or native SSL)
  const rawPublic =
    process.env['PUBLIC_URL']?.trim() ||
    process.env['CUSTOM_URL']?.trim() ||
    process.env['CUSTOM_DOMAIN']?.trim() ||
    null;
  let publicBaseUrl: string | null = null;
  if (rawPublic) {
    const clean = rawPublic.replace(/\/+$/, '');
    if (/^https?:\/\//i.test(clean)) {
      publicBaseUrl = clean;
    } else if (/^https?:/i.test(clean)) {
      publicBaseUrl = clean.replace(/^https?:/i, (match) => `${match.toLowerCase()}//`);
    } else {
      publicBaseUrl = `https://${clean}`;
    }
  }

  const sslKey = process.env['SITE_SSL_KEY']?.trim() || null;
  const sslCert = process.env['SITE_SSL_CERT']?.trim() || null;
  const botSslKey = process.env['DISCORD_SSL_KEY']?.trim() || sslKey;
  const botSslCert = process.env['DISCORD_SSL_CERT']?.trim() || sslCert;
  const logLevel = parseLogLevel(process.env['LOG_LEVEL']);
  const botToken = process.env['DISCORD_TOKEN']?.trim() || null;
  const clientId = process.env['DISCORD_CLIENT_ID']?.trim() || null;
  const clientSecret = process.env['DISCORD_CLIENT_SECRET']?.trim() || null;
  const callbackHost = host === '127.0.0.1' || host === '0.0.0.0' ? 'localhost' : host;
  const botProto = botSslKey && botSslCert ? 'https' : 'http';

  // Internal URL is derived from the host and the port
  const internalPingHost = host === '0.0.0.0' ? '127.0.0.1' : host;
  const internalUrl = `${botProto}://${internalPingHost}:${botPort}`;

  // DISCORD_REDIRECT_URL is the Bot Invite / Authorization URL
  const redirectUrl =
    process.env['DISCORD_REDIRECT_URL']?.trim() ||
    (clientId
      ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&permissions=8&integration_type=0&scope=bot+applications.commands`
      : null);

  // DISCORD_CALLBACK_URL is the preferered OAuth Callback URL.
  // When set, it is used verbatim (must match the Redirect URI registered in the
  // Discord Developer Portal). Otherwise the callback is derived from PUBLIC_URL
  // without any port injection - proxies/tunnels mask the port on the public URL.
  let callbackUrl: string;
  if (process.env['DISCORD_CALLBACK_URL']?.trim()) {
    callbackUrl = process.env['DISCORD_CALLBACK_URL']!.trim();
  } else if (publicBaseUrl) {
    try {
      const u = new URL(publicBaseUrl);
      u.pathname = '/api/auth/callback/discord';
      u.search = '';
      u.hash = '';
      callbackUrl = u.toString();
    } catch {
      callbackUrl = `${botProto}://${callbackHost}:${botPort}/api/auth/callback/discord`;
    }
  } else {
    callbackUrl = `${botProto}://${callbackHost}:${botPort}/api/auth/callback/discord`;
  }

  const repoUrl =
    process.env['REPO_URL']?.trim() ||
    process.env['GITHUB_REPO']?.trim() ||
    process.env['REPOSITORY_URL']?.trim() ||
    process.env['PROJECT_URL']?.trim() ||
    '';

  const userAgent =
    process.env['USER_AGENT']?.trim() ||
    process.env['DISCORD_USER_AGENT']?.trim() ||
    (repoUrl ? `DiscordBot (${repoUrl}, 0.1.0)` : 'DiscordBot (0.1.0)');

  const rawTheme =
    process.env['DASHBOARD_THEME']?.trim().toLowerCase() ||
    process.env['DEFAULT_THEME']?.trim().toLowerCase() ||
    process.env['THEME']?.trim().toLowerCase() ||
    'dark';
  const defaultTheme = rawTheme === 'glass' ? 'glassmorphism' : rawTheme;

  const landingPageEnabled =
    process.env['LANDING_PAGE_ENABLED']?.trim().toLowerCase() !== 'false' &&
    process.env['ENABLE_LANDING_PAGE']?.trim().toLowerCase() !== 'false';

  const dashboardColorScheme =
    process.env['DASHBOARD_COLOR_SCHEME']?.trim().toLowerCase() ||
    process.env['COLOR_SCHEME']?.trim().toLowerCase() ||
    process.env['ACCENT_COLOR']?.trim().toLowerCase() ||
    'default';

  const forumChannelIds = parseCsvIds(process.env['FORUM_CHANNEL_IDS'] || process.env['THREAD_FORUM_CHANNEL_IDS']);

  const threadKeepaliveEnabled =
    process.env['THREAD_KEEPALIVE_ENABLED']?.toLowerCase() !== 'false' &&
    process.env['KEEP_THREADS_OPEN']?.toLowerCase() !== 'false';

  const youtubeApiKey = process.env['YOUTUBE_API_KEY']?.trim() || null;
  const youtubeClientId = process.env['YOUTUBE_CLIENT_ID']?.trim() || null;
  const youtubeClientSecret = process.env['YOUTUBE_CLIENT_SECRET']?.trim() || null;
  const twitchClientId = process.env['TWITCH_CLIENT_ID']?.trim() || null;
  const twitchClientSecret = process.env['TWITCH_CLIENT_SECRET']?.trim() || null;

  // Global feature master-switches. Every feature defaults to enabled when the
  // env key is unset. Disabled features are not registered as slash commands,
  // not rendered in the dashboard, and their wiring is not started.
  const features: FeatureFlags = {
    feedsEnabled: parseEnvFlag(process.env['FEEDS_ENABLED'], true),
    streamAlertsEnabled: parseEnvFlag(process.env['STREAM_ALERTS_ENABLED'], true),
    threadsEnabled: parseEnvFlag(process.env['THREADS_ENABLED'], true),
    gifsEnabled: parseEnvFlag(process.env['GIFS_ENABLED'], true),
    administrationEnabled: parseEnvFlag(process.env['ADMINISTRATION_ENABLED'], true),
    nodeLinkEnabled: parseEnvFlag(process.env['NODELINK_ENABLED'], true),
    dashboardEnabled: parseEnvFlag(process.env['DASHBOARD_ENABLED'], true),
    adminPanelEnabled: parseEnvFlag(process.env['ADMIN_PANEL_ENABLED'], true),
  };

  // NodeLink node (public instance or self-hosted). The bot always acts
  // as a client; only the endpoint values change.
  // Public instance: nodelink.triniumhost.indevs.in:443 (SSL) - password: free (NodeLink v3.8.0)
  // Self-hosted fallback: localhost:2333
  const nodeLinkExternal = parseEnvFlag(process.env['NODELINK_EXTERNAL'], false);
  const nodeLink: NodeLinkConfig = {
    host: process.env['NODELINK_HOST']?.trim() || 'nodelink.triniumhost.indevs.in',
    port: parseOptionalInt(process.env['NODELINK_PORT'], 443),
    secure: parseEnvFlag(process.env['NODELINK_SECURE'], true),
    password: process.env['NODELINK_PASSWORD']?.trim() || 'free',
    external: nodeLinkExternal,
  };

  return {
    host,
    port,
    internalUrl,
    publicBaseUrl,
    dbUri,
    dbPath: resolve(dataDir, 'database.sqlite'),
    redisUri,
    pollIntervalMs: 3_600_000,
    requestTimeoutMs: parsePositiveInt(process.env['REQUEST_TIMEOUT_MS'], 15_000),
    sslKey,
    sslCert,
    botSslKey,
    botSslCert,
    logLevel,
    botToken,
    botPort,
    clientId,
    clientSecret,
    redirectUrl,
    callbackUrl,
    discordApiBaseUrl: process.env['DISCORD_API_BASE_URL']?.trim() || 'https://discord.com/api/v10',
    repoUrl,
    userAgent,
    defaultTheme,
    dashboardColorScheme,
    landingPageEnabled,
    forumChannelIds,
    threadKeepaliveEnabled,
    threadKeepaliveIntervalMs: parsePositiveInt(process.env['THREAD_KEEPALIVE_INTERVAL_MS'], 6 * 3600 * 1000),
    threadKeepaliveGraceMs: parsePositiveInt(process.env['THREAD_KEEPALIVE_GRACE_MS'], 24 * 3600 * 1000),
    threadMaxMessages: parsePositiveInt(process.env['THREAD_MAX_MESSAGES'], 100),
    youtubeApiKey,
    youtubeClientId,
    youtubeClientSecret,
    twitchClientId,
    twitchClientSecret,
    features,
    nodeLink,
    nodeLinkExternal,
    spotifyClientId: process.env['SPOTIFY_CLIENT_ID']?.trim() || null,
    spotifyClientSecret: process.env['SPOTIFY_CLIENT_SECRET']?.trim() || null,
    klipyApiKey: process.env['KLIPY_API_KEY']?.trim() || null,
    appleMediaToken: process.env['APPLE_MEDIA_TOKEN']?.trim() || null,
  };
}

function parseCsvIds(raw: string | undefined): string[] {
  if (!raw) return [];
  const ids = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => /^\d{10,25}$/.test(part));
  return Array.from(new Set(ids));
}

function parseLogLevel(raw: string | undefined): LogLevel {
  const value = raw?.toLowerCase();
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') return value;
  return 'info';
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid integer value: ${raw}`);
  }
  return value;
}

function parseOptionalInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid integer value: ${raw}`);
  }
  return value;
}

function parseEnvFlag(raw: string | undefined, defaultEnabled: boolean): boolean {
  if (raw === undefined) return defaultEnabled;
  const v = raw.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}
