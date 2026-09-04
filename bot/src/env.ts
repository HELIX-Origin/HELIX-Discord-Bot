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
  return process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || '';
}

/** Discord Application Client ID — required for OAuth2 and slash commands. */
export function getClientId(): string {
  return process.env.DISCORD_CLIENT_ID || '';
}

/** Discord Application Client Secret — required for the dashboard OAuth2 flow. */
export function getClientSecret(): string {
  return process.env.DISCORD_CLIENT_SECRET || '';
}

/**
 * Base OAuth2 callback URL (no trailing slash).
 * The server appends `/api/auth/callback/discord` internally.
 *
 * @example 'http://localhost:5000' | 'https://myapp.herokuapp.com'
 */
export function getCallbackUrl(): string {
  return (process.env.DISCORD_CALLBACK_URL || 'http://localhost:5000').replace(/\/$/, '');
}

/**
 * Pre-built administrator bot invite URL.
 * Surrounding quotes from shell assignment are stripped automatically.
 */
export function getInviteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_INVITE_URL || '').trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
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
 * When running on localhost without an explicit port, the bot port is appended
 * automatically so NextAuth doesn't try to reach the wrong port.
 */
export function getNextAuthUrl(customPort?: number): string {
  const port = customPort ?? getPort();
  const raw = (process.env.NEXTAUTH_URL || getCallbackUrl()).replace(/\/$/, '');
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
export function getNextAuthInternalUrl(customPort?: number): string {
  const port = customPort ?? getPort();
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
 * Override with `DISCORD_DB_PATH` env var; defaults to `<root>/data/helix-bot.sqlite`.
 */
export function getDbPath(): string {
  return process.env.DISCORD_DB_PATH || path.resolve(BOT_ROOT_DIR, 'data', 'helix-bot.sqlite');
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
 * @param key       The env variable name (e.g. 'DISCORD_BOT_TOKEN')
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
