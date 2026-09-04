/**
 * src/handlers/message-handler.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Centralized formatting engine for bot messages, embeds, logs, and errors.
 *
 * Loads formatting schemas from messages.json and produces standardized,
 * rich Discord embeds, formatted messages, and console logs.
 * ──────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder } from 'discord.js';
import { BOT_ROOT_DIR } from '../env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Candidate paths to messages.json */
const CANDIDATE_PATHS = [
  path.resolve(__dirname, '..', 'messages.json'),
  path.resolve(BOT_ROOT_DIR, 'HELIX', 'src', 'messages.json'),
  path.resolve(BOT_ROOT_DIR, 'src', 'messages.json'),
];

/** The loaded messages schema object */
let messages: Record<string, any> = {};

/**
 * Load messages schema from JSON file.
 * Called automatically on access.
 */
function loadMessages(): void {
  if (Object.keys(messages).length > 0) return;

  for (const p of CANDIDATE_PATHS) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8').replace(/^\uFEFF/, '');
        messages = JSON.parse(raw);
        return;
      } catch (err) {
        console.error('[MessageHandler] Failed to parse messages.json:', err);
      }
    }
  }
}

/**
 * Deep get a value from messages using dot notation path.
 * e.g. getNested(messages, 'moderation.ban.embed')
 */
function getNested(obj: Record<string, any>, pathStr: string): any {
  const parts = pathStr.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}

/**
 * Interpolate placeholders in a template string.
 * Placeholders format: {key}
 */
export function interpolateString(template: string, vars: Record<string, any>): string {
  if (!template || typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Recursively interpolate strings in an object or array.
 */
function interpolateDeep(target: any, vars: Record<string, any>): any {
  if (typeof target === 'string') {
    return interpolateString(target, vars);
  }
  if (Array.isArray(target)) {
    return target.map(item => interpolateDeep(item, vars));
  }
  if (target && typeof target === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(target)) {
      result[k] = interpolateDeep(v, vars);
    }
    return result;
  }
  return target;
}

/**
 * Convert color string (e.g. "#00d2ff", "0x00d2ff", "cyan") to integer for Discord.
 */
function parseColor(color: string | number | undefined): number {
  if (typeof color === 'number') return color;
  if (!color || typeof color !== 'string') return 0x00d2ff;
  if (color.startsWith('#')) return parseInt(color.slice(1), 16);
  if (color.startsWith('0x')) return parseInt(color, 16);
  const namedColors: Record<string, number> = {
    primary: 0x00d2ff,
    success: 0x00e676,
    error: 0xff1744,
    warning: 0xffab00,
    info: 0x2979ff,
    moderation: 0xff5252,
    tickets: 0x7c4dff,
    plugins: 0x00e5ff,
    scaffolding: 0x651fff,
  };
  return namedColors[color.toLowerCase()] || 0x00d2ff;
}

/**
 * Get a formatted string by dot-notation key.
 * Supports {prefix} and variable interpolation.
 */
export function getMessage(key: string, vars?: Record<string, any>, prefix?: string, fallback?: string): string {
  loadMessages();
  const allVars = { ...vars, prefix: prefix || '>' };
  const raw = getNested(messages, key);

  if (typeof raw === 'string') {
    return interpolateString(raw, allVars);
  }

  if (raw && typeof raw === 'object' && typeof raw.description === 'string') {
    return interpolateString(raw.description, allVars);
  }

  return fallback !== undefined ? interpolateString(fallback, allVars) : `[Missing message: ${key}]`;
}

/**
 * Get raw nested message object.
 */
export function getMessageObject(key: string): Record<string, any> | null {
  loadMessages();
  const val = getNested(messages, key);
  return val ? JSON.parse(JSON.stringify(val)) : null;
}

/**
 * Check if a message key exists.
 */
export function hasMessage(key: string): boolean {
  loadMessages();
  return getNested(messages, key) !== null;
}

/**
 * Build a rich EmbedBuilder dynamically from messages.json formatting schema.
 *
 * @param key   Dot-notation key pointing to an embed schema object (or string for basic embed)
 * @param vars  Variables to interpolate into title, description, fields, footer
 * @param prefix Guild prefix (defaults to '>')
 */
export function createEmbed(key: string, vars?: Record<string, any>, prefix?: string): EmbedBuilder {
  loadMessages();
  const allVars = { ...vars, prefix: prefix || '>' };
  const raw = getNested(messages, key);

  const embed = new EmbedBuilder();

  if (raw && typeof raw === 'object') {
    const interpolated = interpolateDeep(raw, allVars);

    if (interpolated.title) embed.setTitle(interpolated.title);
    if (interpolated.description) embed.setDescription(interpolated.description);
    if (interpolated.color) embed.setColor(parseColor(interpolated.color));
    else embed.setColor(0x00d2ff);

    if (interpolated.url) embed.setURL(interpolated.url);
    if (interpolated.thumbnail) embed.setThumbnail(interpolated.thumbnail);
    if (interpolated.image) embed.setImage(interpolated.image);

    if (interpolated.author) {
      if (typeof interpolated.author === 'string') embed.setAuthor({ name: interpolated.author });
      else if (interpolated.author.name) embed.setAuthor(interpolated.author);
    }

    if (interpolated.fields && Array.isArray(interpolated.fields)) {
      for (const f of interpolated.fields) {
        if (f.name && f.value) {
          embed.addFields({
            name: String(f.name),
            value: String(f.value),
            inline: Boolean(f.inline),
          });
        }
      }
    }

    if (interpolated.footer) {
      if (typeof interpolated.footer === 'string') embed.setFooter({ text: interpolated.footer });
      else if (interpolated.footer.text) embed.setFooter(interpolated.footer);
    }

    if (interpolated.timestamp !== false) {
      embed.setTimestamp();
    }

    return embed;
  }

  // Fallback: raw was a string or not found
  const text = typeof raw === 'string' ? interpolateString(raw, allVars) : key;
  embed.setDescription(text).setColor(0x00d2ff).setTimestamp();
  return embed;
}

/**
 * Format a standardized error embed.
 */
export function formatError(keyOrMsg: string, vars?: Record<string, any>, prefix?: string): EmbedBuilder {
  loadMessages();
  const allVars = { ...vars, prefix: prefix || '>' };
  let errorText: string;

  if (hasMessage(keyOrMsg)) {
    errorText = getMessage(keyOrMsg, allVars, prefix);
  } else if (hasMessage(`errors.${keyOrMsg}`)) {
    errorText = getMessage(`errors.${keyOrMsg}`, allVars, prefix);
  } else {
    errorText = interpolateString(keyOrMsg, allVars);
  }

  return new EmbedBuilder()
    .setTitle('❌ Error')
    .setDescription(errorText)
    .setColor(0xff1744)
    .setTimestamp();
}

/**
 * Format a standardized success embed.
 */
export function formatSuccess(title: string, description: string, vars?: Record<string, any>): EmbedBuilder {
  const allVars = vars || {};
  return new EmbedBuilder()
    .setTitle(interpolateString(title, allVars))
    .setDescription(interpolateString(description, allVars))
    .setColor(0x00e676)
    .setTimestamp();
}

/**
 * Get all messages for a category.
 */
export function getCategory(category: string): Record<string, any> {
  loadMessages();
  const cat = getNested(messages, category);
  if (!cat || typeof cat !== 'object') return {};
  return JSON.parse(JSON.stringify(cat));
}

/**
 * Reload messages from file (for live testing).
 */
export function reloadMessages(): void {
  messages = {};
  loadMessages();
}

// Initial load
loadMessages();
