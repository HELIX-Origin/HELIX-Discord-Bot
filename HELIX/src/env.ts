/**
 * bot/src/env.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Central environment handler for the HELIX Discord Bot subsystem.
 *
 * All bot and dashboard files import their env keys from here instead of
 * reading process.env directly. This gives us:
 *   • Typed, defaulted accessors — no more `process.env.X || 'default'` scatter
 *   • A single place to add validation or change key names
 *   • saveBotEnvValue() for writing config back to .env at runtime
 *
 * Load order (same as CLI's src/utils/env/index.ts):
 *   <project>/.env  →  ~/.helix/.env  →  ~/.env  →  dotenv CWD fallback
 * ──────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Resolve project root from bot/src/ (two levels up)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
export const BOT_ROOT_DIR = path.resolve(__dirname, '..', '..');

// ─── Bootstrap ───────────────────────────────────────────────────────────────

let _loaded = false;

/**
 * Load all .env files in priority order.
 * Called automatically on first import of this module.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function loadBotEnv(): void {
  if (_loaded) return;
  _loaded = true;

  const candidates: string[] = [
    path.resolve(BOT_ROOT_DIR, '.env'),
    path.resolve(os.homedir(), '.helix', '.env'),
    path.resolve(os.homedir(), '.env'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) dotenv.config({ path: p });
  }
  // Standard dotenv CWD lookup as final fallback
  dotenv.config();
}

// Load immediately on import
loadBotEnv();

// ─── Typed Accessors ─────────────────────────────────────────────────────────

/** Discord Bot Token — required for gateway connection. */
export function getBotToken(): string {
  let token = (
    process.env.DISCORD_TOKEN ||
    process.env.DISCORD_BOT_TOKEN ||
    process.env.BOT_TOKEN ||
    process.env.TOKEN ||
    ''
  ).trim();
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  if (token.startsWith('Bot ')) {
    token = token.slice(4).trim();
  }
  return token;
}

/** Discord Application Client ID — required for OAuth2 and slash commands. */
export function getClientId(): string {
  let id = (
    process.env.DISCORD_CLIENT_ID ||
    process.env.CLIENT_ID ||
    process.env.DISCORD_APP_ID ||
    process.env.APPLICATION_ID ||
    process.env.APP_ID ||
    ''
  ).trim();
  if (
    (id.startsWith('"') && id.endsWith('"')) ||
    (id.startsWith("'") && id.endsWith("'"))
  ) {
    id = id.slice(1, -1).trim();
  }
  return id;
}

/** Discord Application Client Secret — required for the dashboard OAuth2 flow. */
export function getClientSecret(): string {
  let secret = (
    process.env.DISCORD_CLIENT_SECRET ||
    process.env.CLIENT_SECRET ||
    process.env.DISCORD_SECRET ||
    ''
  ).trim();
  if (
    (secret.startsWith('"') && secret.endsWith('"')) ||
    (secret.startsWith("'") && secret.endsWith("'"))
  ) {
    secret = secret.slice(1, -1).trim();
  }
  return secret;
}

/**
 * Detects the public Heroku application domain if running on Heroku.
 * Checks HEROKU_APP_DEFAULT_DOMAIN_NAME, HEROKU_APP_NAME, or DYNO metadata.
 */
export function getHerokuAppUrl(): string | null {
  const domain = process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME;
  if (domain && domain.trim()) {
    return `https://${domain.trim().replace(/\/$/, '')}`;
  }
  const appName = process.env.HEROKU_APP_NAME;
  if (appName && appName.trim()) {
    const cleanName = appName.trim().replace(/\/$/, '');
    return cleanName.includes('.') ? `https://${cleanName}` : `https://${cleanName}.herokuapp.com`;
  }
  return null;
}

/**
 * Detects the public application URL from platform environment variables.
 * Checks Render, Koyeb, Railway, Heroku, and custom DOMAIN in order.
 * Returns null if no platform is detected.
 */
export function detectPlatformUrl(): string | null {
  // Render.com
  const render = (process.env.RENDER_EXTERNAL_URL || '').trim();
  if (render) return render.replace(/\/$/, '');

  // Koyeb
  const koyebDomain = (process.env.KOYEB_PUBLIC_DOMAIN || '').trim();
  if (koyebDomain) {
    const url = koyebDomain.includes('://') ? koyebDomain : `https://${koyebDomain}`;
    return url.replace(/\/$/, '');
  }
  const koyebApp = (process.env.KOYEB_APP_NAME || '').trim();
  if (koyebApp) {
    return `https://${koyebApp}.koyeb.app`;
  }

  // Railway
  const railway = (process.env.RAILWAY_STATIC_URL || '').trim();
  if (railway) return railway.replace(/\/$/, '');

  // Heroku
  const heroku = getHerokuAppUrl();
  if (heroku) return heroku;

  // Custom domain
  const domain = (process.env.DOMAIN || '').trim();
  if (domain) {
    const url = domain.includes('://') ? domain : `https://${domain}`;
    return url.replace(/\/$/, '');
  }

  return null;
}

/**
 * Builds standard Discord OAuth2 bot invite URL.
 */
function formatBotInviteUrl(
  clientId: string,
  permissions: number = 8,
  callbackBaseUrl?: string
): string {
  let url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
  if (callbackBaseUrl) {
    const redirectUri = `${callbackBaseUrl.replace(/\/$/, '')}/api/auth/callback/discord`;
    url += `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  }
  return url;
}

/**
 * Normalizes a callback URL to its BASE URL form.
 * Accepts either a bare base (`https://app.example.com`) or the full callback
 * path pasted from the Discord developer portal
 * (`https://app.example.com/api/auth/callback/discord`) and strips any trailing
 * auth/callback path so callers can safely append `/api/auth/callback/discord`
 * again without doubling it.
 */
export function normalizeCallbackBaseUrl(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  const marker = lower.indexOf('/api/auth/callback/');
  const base = marker !== -1 ? trimmed.slice(0, marker) : trimmed;
  return base.replace(/\/+$/, '');
}

/**
 * Base OAuth2 callback URL (no trailing slash).
 * The server appends `/api/auth/callback/discord` internally.
 * Automatically resolves from platform env vars (Heroku, Render, Railway, DOMAIN)
 * if not explicitly configured. Falls back to `http://localhost:<PORT>`.
 *
 * @example 'http://localhost:5000' | 'https://myapp.herokuapp.com'
 */
export function getCallbackUrl(): string {
  const explicit = normalizeCallbackBaseUrl(process.env.DISCORD_CALLBACK_URL || '');
  if (explicit && !explicit.includes('localhost') && !explicit.includes('127.0.0.1')) {
    return explicit;
  }
  const platformUrl = detectPlatformUrl();
  if (platformUrl) {
    return platformUrl;
  }
  return (explicit || `http://localhost:${getPort()}`);
}

/**
 * Pre-built administrator bot invite URL.
 * Surrounding quotes from shell assignment are stripped automatically.
 * Automatically resolves using client ID without requiring pre-configured OAuth redirect URI.
 */
export function getInviteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_INVITE_URL || '').trim();
  let invite = raw;
  if (
    (invite.startsWith('"') && invite.endsWith('"')) ||
    (invite.startsWith("'") && invite.endsWith("'"))
  ) {
    invite = invite.slice(1, -1).trim();
  }
  if (!invite) {
    const clientId = getClientId();
    if (clientId && clientId !== 'yourclientid') {
      return formatBotInviteUrl(clientId, 8);
    }
  }
  return invite;
}

/** HTTP port the dashboard and OAuth2 server listens on. Defaults to 5000. */
export function getPort(): number {
  const raw = process.env.PORT;
  if (raw) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) return n;
  }
  return 5000;
}

/**
 * Public-facing NextAuth URL (e.g. your Heroku app URL).
 * Automatically resolves from platform env vars (Heroku, Render, Railway, DOMAIN).
 * Falls back to `http://localhost:<PORT>` when running locally.
 */
export function getNextAuthUrl(): string {
  const port = getPort();
  const explicit = (process.env.NEXTAUTH_URL || '').trim();
  if (explicit && !explicit.includes('localhost') && !explicit.includes('127.0.0.1')) {
    return explicit.replace(/\/$/, '');
  }
  const platformUrl = detectPlatformUrl();
  if (platformUrl) {
    return platformUrl;
  }
  const callbackUrl = getCallbackUrl();
  const callbackIsLocal =
    callbackUrl.includes('localhost') || callbackUrl.includes('127.0.0.1');
  const raw = (explicit || (callbackIsLocal ? `http://localhost:${port}` : callbackUrl)).replace(/\/$/, '');
  try {
    const u = new URL(raw.includes('://') ? raw : `http://${raw}`);
    if (!u.port && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      u.port = String(port);
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return `http://localhost:${port}`;
  }
}

/**
 * Internal URL NextAuth uses for server-side self-requests.
 * Defaults to `http://localhost:<port>`.
 */
export function getNextAuthInternalUrl(): string {
  const port = getPort();
  const raw = (process.env.NEXTAUTH_INTERNAL_URL || 'http://localhost').replace(/\/$/, '');
  try {
    const u = new URL(raw.includes('://') ? raw : `http://${raw}`);
    if (!u.port) u.port = String(port);
    return u.toString().replace(/\/$/, '');
  } catch {
    return `http://localhost:${port}`;
  }
}

/**
 * HMAC secret for signing NextAuth session tokens.
 * Must be a 32+ character random string in production.
 */
export function getNextAuthSecret(): string {
  return process.env.NEXTAUTH_SECRET || 'helix_bot_dashboard_secret_key_32_bytes_min';
}

/**
 * Absolute path to the SQLite database file.
 * Automatically detected and managed by the bot and dashboard (defaults to `<root>/data/bot.sqlite`).
 */
export function getDbPath(): string {
  const defaultDir = path.resolve(BOT_ROOT_DIR, 'data');
  if (!fs.existsSync(defaultDir)) {
    try {
      fs.mkdirSync(defaultDir, { recursive: true });
    } catch {}
  }
  return process.env.DISCORD_DB_PATH || path.resolve(defaultDir, 'helix-bot.sqlite');
}

// ─── Convenience snapshot ────────────────────────────────────────────────────

export interface BotEnvConfig {
  botToken: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  inviteUrl: string;
  port: number;
  nextAuthUrl: string;
  nextAuthInternalUrl: string;
  nextAuthSecret: string;
  dbPath: string;
}

/**
 * Returns a snapshot of all bot env values at the moment of calling.
 * Useful when you need multiple values from a single destructure.
 */
export function getBotEnv(): BotEnvConfig {
  return {
    botToken:            getBotToken(),
    clientId:            getClientId(),
    clientSecret:        getClientSecret(),
    callbackUrl:         getCallbackUrl(),
    inviteUrl:           getInviteUrl(),
    port:                getPort(),
    nextAuthUrl:         getNextAuthUrl(),
    nextAuthInternalUrl: getNextAuthInternalUrl(),
    nextAuthSecret:      getNextAuthSecret(),
    dbPath:              getDbPath(),
  };
}

// ─── Write helper ─────────────────────────────────────────────────────────────

/**
 * Write or update a single key in the project `.env` file.
 * Also sets `process.env[key]` immediately so the running process reflects
 * the new value without a restart.
 *
 * @param key       The env variable name (e.g. 'DISCORD_TOKEN')
 * @param value     The value to write
 * @param envPath   Optional override path; defaults to `<root>/.env`
 * @returns         The resolved path of the file that was written
 */
export function saveBotEnvValue(key: string, value: string, envPath?: string): string {
  const target = envPath || path.resolve(BOT_ROOT_DIR, '.env');
  let content = fs.existsSync(target) ? fs.readFileSync(target, 'utf-8') : '';

  const regex = new RegExp(`^${key}=.*$`, 'm');
  content = regex.test(content)
    ? content.replace(regex, `${key}=${value}`)
    : `${content.trimEnd()}\n${key}=${value}\n`;

  fs.writeFileSync(target, content, 'utf-8');
  process.env[key] = value;
  return target;
}
