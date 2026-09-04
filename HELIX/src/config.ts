/**
 * src/config.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Centralized internal configuration manager for HELIX bot.
 *
 * This is NOT for environment variables — it centralizes bot-internal
 * constants, defaults, limits, and feature flags in one place.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ─── Bot Identity ──────────────────────────────────────────────────────────────
export const BOT_NAME = 'HELIX';
export const BOT_VERSION = '0.1.0';
export const BOT_DESCRIPTION = 'Developer Discord bot with code intelligence, moderation, and ticketing';

// ─── Command System ────────────────────────────────────────────────────────────
export const DEFAULT_PREFIX = '>';
export const MAX_PREFIX_LENGTH = 5;

export const COMMAND_CATEGORIES = [
  'moderation',
  'utility',
  'plugins',
  'info',
  'project',
  'config',
] as const;

export type CommandCategory = typeof COMMAND_CATEGORIES[number];

// ─── Discord Limits ────────────────────────────────────────────────────────────
export const DISCORD_LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_EMBED_FIELD_NAME: 256,
  MAX_EMBED_FIELD_VALUE: 1024,
  MAX_EMBED_FIELDS: 25,
  MAX_EMBED_DESCRIPTION: 4096,
  MAX_EMBED_TITLE: 256,
  MAX_EMBED_FOOTER: 2048,
  MAX_EMBED_AUTHOR_NAME: 256,
  MAX_EMBED_TOTAL: 6000,
  MAX_THREAD_NAME: 100,
  MAX_THREAD_ARCHIVE_DURATION: 10080,
  MAX_REACTIONS: 20,
} as const;

// ─── Rate Limiting ────────────────────────────────────────────────────────────
export const RATE_LIMITS = {
  DEFAULT_COOLDOWN_MS: 3000,
  MOD_COOLDOWN_MS: 1000,
  OWNER_COOLDOWN_MS: 0,
  MAX_COMMANDS_PER_MINUTE: 30,
} as const;

// ─── Moderation ───────────────────────────────────────────────────────────────
export const MODERATION = {
  MAX_PURGE_MESSAGES: 100,
  MIN_PURGE_MESSAGES: 1,
  DEFAULT_TIMEOUT_MINUTES: 10,
  MAX_TIMEOUT_DAYS: 28,
  MAX_WARN_REASON_LENGTH: 512,
  MAX_BAN_REASON_LENGTH: 512,
} as const;

// ─── Ticketing ────────────────────────────────────────────────────────────────
export const TICKETING = {
  MAX_SUBJECT_LENGTH: 100,
  MAX_DETAILS_LENGTH: 2000,
  AUTO_CLOSE_HOURS: 168, // 7 days
  TRANSCRIPT_MAX_MESSAGES: 500,
} as const;

// ─── Scaffolding ──────────────────────────────────────────────────────────────
export const SCAFFOLDING = {
  DEFAULT_OUTPUT_DIR: 'scaffolds',
  MAX_PROJECT_NAME_LENGTH: 50,
  TEMPLATE_CACHE_TTL_MS: 3600000, // 1 hour
} as const;

// ─── Plugin System ────────────────────────────────────────────────────────────
export const PLUGINS = {
  BUILTIN_REPO: 'helix-origin',
  COMMUNITY_DIR: 'community',
  CONFIG_FILENAME: 'config.json',
  MANIFEST_FILENAME: 'plugin.json',
  MAX_PLUGIN_COUNT: 50,
} as const;

// ─── Logging ──────────────────────────────────────────────────────────────────
export const LOGGING = {
  DEFAULT_LEVEL: 'info' as const,
  LEVELS: ['debug', 'info', 'warn', 'error'] as const,
  MAX_LOG_HISTORY: 1000,
} as const;

// ─── Colors (Discord Embed) ───────────────────────────────────────────────────
export const COLORS = {
  PRIMARY: 0x00d2ff,
  SUCCESS: 0x00ff88,
  WARNING: 0xffaa00,
  ERROR: 0xff3333,
  INFO: 0x3399ff,
  MODERATION: 0xff6600,
  TICKET: 0x9966ff,
  PLUGIN: 0xcc44ff,
  NEUTRAL: 0x777777,
} as const;

// ─── Emoji (Discord) ──────────────────────────────────────────────────────────
export const EMOJI = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  BOT: '🤖',
  MODERATION: '🛡️',
  TICKET: '🎫',
  PLUGIN: '🧩',
  CODE: '💻',
  SETTINGS: '⚙️',
  SEARCH: '🔍',
  LINK: '🔗',
} as const;

// ─── Feature Flags ────────────────────────────────────────────────────────────
export const FEATURES = {
  ENABLE_TICKETS: true,
  ENABLE_MODERATION: true,
  ENABLE_SCAFFOLDING: true,
  ENABLE_PLUGINS: true,
  ENABLE_DASHBOARD: true,
  ENABLE_WELCOME: true,
} as const;

// ─── Database ──────────────────────────────────────────────────────────────────
export const DATABASE = {
  DEFAULT_FILENAME: 'helix-bot.sqlite',
  WAL_MODE: true,
  BUSY_TIMEOUT_MS: 5000,
} as const;

// ─── HTTP Server ───────────────────────────────────────────────────────────────
export const HTTP_SERVER = {
  DEFAULT_PORT: 5000,
  MAX_REQUEST_SIZE_MB: 10,
  REQUEST_TIMEOUT_MS: 30000,
  CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:5000'],
} as const;

// ─── GitHub ────────────────────────────────────────────────────────────────────
export const GITHUB = {
  API_BASE: 'https://api.github.com',
  RAW_BASE: 'https://raw.githubusercontent.com',
  DEFAULT_BRANCH: 'main',
  REPO_OWNER: 'HELIX-Origin',
  REPO_NAME: 'HELIX-CLI',
} as const;

// ─── Help Registry ────────────────────────────────────────────────────────────
export const HELP = {
  COMMANDS_PER_PAGE: 10,
  SHOW_USAGE_EXAMPLES: true,
  SHOW_PERMISSIONS: true,
  SHOW_ALIASES: true,
} as const;

// ─── Regex Patterns ────────────────────────────────────────────────────────────
export const PATTERNS = {
  SNOWFLAKE: /^\d{17,19}$/,
  HEX_COLOR: /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i,
  URL: /^https?:\/\/.+/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ─── Freeze all config objects ─────────────────────────────────────────────────
Object.freeze(BOT_NAME);
Object.freeze(BOT_VERSION);
Object.freeze(BOT_DESCRIPTION);
Object.freeze(DEFAULT_PREFIX);
Object.freeze(COMMAND_CATEGORIES);
Object.freeze(DISCORD_LIMITS);
Object.freeze(RATE_LIMITS);
Object.freeze(MODERATION);
Object.freeze(TICKETING);
Object.freeze(SCAFFOLDING);
Object.freeze(PLUGINS);
Object.freeze(LOGGING);
Object.freeze(COLORS);
Object.freeze(EMOJI);
Object.freeze(FEATURES);
Object.freeze(DATABASE);
Object.freeze(HTTP_SERVER);
Object.freeze(GITHUB);
Object.freeze(HELP);
Object.freeze(PATTERNS);