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

// Resolve project root from source (HELIX/src/) or compiled artifact (HELIX/dist/src/)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export function resolveBotRootDir(): string {
  // Check upwards from __dirname and process.cwd() for root package.json or .env
  const probes = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    __dirname,
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '..', '..'),
    path.resolve(__dirname, '..', '..', '..'),
  ];
  for (const dir of probes) {
    if (fs.existsSync(path.join(dir, 'HELIX')) && fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    if (fs.existsSync(path.join(dir, '.env')) && !dir.endsWith('dist') && !dir.endsWith('src')) {
      return dir;
    }
  }
  return path.resolve(__dirname, '..', '..');
}

export const BOT_ROOT_DIR = resolveBotRootDir();

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
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
    path.resolve(__dirname, '..', '..', '..', '.env'),
    path.resolve(os.homedir(), '.helix', '.env'),
    path.resolve(os.homedir(), '.env'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
    }
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
 * Builds standard Discord OAuth2 bot invite URL.
 */
function formatBotInviteUrl(clientId: string, permissions: number = 8): string {
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
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
 * Public-facing NextAuth / Dashboard URL (e.g. `https://bot.example.com`).
 * Explicitly configured via `NEXTAUTH_URL` for public deployments.
 * Defaults to `http://localhost:<PORT>` when running locally.
 */
export function getNextAuthUrl(): string {
  const port = getPort();
  const explicit = (process.env.NEXTAUTH_URL || '').trim();
  if (explicit) {
    const clean = explicit.replace(/\/+$/, '');
    const url = clean.includes('://') ? clean : (clean.includes('localhost') || clean.includes('127.0.0.1') ? `http://${clean}` : `https://${clean}`);
    try {
      const u = new URL(url);
      if (!u.port && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
        u.port = String(port);
      }
      return u.toString().replace(/\/+$/, '');
    } catch {
      return url;
    }
  }

  const explicitCallback = normalizeCallbackBaseUrl(process.env.DISCORD_CALLBACK_URL || '');
  if (explicitCallback) {
    return explicitCallback;
  }

  return `http://localhost:${port}`;
}

/**
 * Internal URL NextAuth uses for server-side self-requests.
 * Explicitly configured via `NEXTAUTH_INTERNAL_URL` (defaults to `http://localhost:<port>`).
 */
export function getNextAuthInternalUrl(): string {
  const port = getPort();
  const raw = (process.env.NEXTAUTH_INTERNAL_URL || 'http://localhost').trim().replace(/\/+$/, '');
  try {
    const u = new URL(raw.includes('://') ? raw : `http://${raw}`);
    if (!u.port) u.port = String(port);
    return u.toString().replace(/\/+$/, '');
  } catch {
    return `http://localhost:${port}`;
  }
}

/**
 * Base OAuth2 callback URL (no trailing slash).
 * Returns `DISCORD_CALLBACK_URL` if set, otherwise defaults to `getNextAuthUrl()`.
 */
export function getCallbackUrl(): string {
  const explicit = normalizeCallbackBaseUrl(process.env.DISCORD_CALLBACK_URL || '');
  if (explicit) {
    return explicit;
  }
  return getNextAuthUrl();
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

/**
 * HMAC secret for signing NextAuth session tokens.
 * Must be a 32+ character random string in production.
 */
export function getNextAuthSecret(): string {
  return process.env.NEXTAUTH_SECRET || 'helix_bot_dashboard_secret_key_32_bytes_min';
}

/**
 * Autonomous Keep-Alive self-pinger configuration.
 */
export interface SelfPingConfig {
  enabled: boolean;
  targetUrl: string | null;
  intervalMs: number;
}

/**
 * Returns configuration for the autonomous Keep-Alive Self-Pinger.
 * Activates when `HELIX_SELF_PING=true` is set, or when `NEXTAUTH_URL` is set to a public URL.
 */
export function getSelfPingConfig(): SelfPingConfig {
  const explicit = (process.env.HELIX_SELF_PING || '').trim().toLowerCase();
  const intervalRaw = parseInt(process.env.HELIX_SELF_PING_INTERVAL_MS || '600000', 10);
  const intervalMs = (!isNaN(intervalRaw) && intervalRaw >= 60000) ? intervalRaw : 600000;

  const publicUrl = getNextAuthUrl();
  let targetUrl: string | null = null;
  if (publicUrl && !publicUrl.includes('localhost') && !publicUrl.includes('127.0.0.1')) {
    targetUrl = `${publicUrl.replace(/\/+$/, '')}/api/health`;
  }

  // Explicit disable
  if (explicit === 'false' || explicit === '0' || explicit === 'off') {
    return { enabled: false, targetUrl, intervalMs };
  }

  const enabled = explicit === 'true' || explicit === '1' || explicit === 'on' || Boolean(targetUrl);

  return {
    enabled: Boolean(enabled && targetUrl),
    targetUrl,
    intervalMs,
  };
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
  selfPing: SelfPingConfig;
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
    selfPing:            getSelfPingConfig(),
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
