/**
 * src/handlers/message-handler.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Centralized message handler for bot responses.
 *
 * Loads messages from messages.json and provides type-safe access
 * with interpolation support. Used by events, errors, and log handlers.
 * ──────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BOT_ROOT_DIR } from '../env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Path to messages.json relative to this file */
const MESSAGES_PATH = path.resolve(BOT_ROOT_DIR, 'src', 'messages.json');

/** The loaded messages object */
let messages: Record<string, any> = {};

/**
 * Load messages from JSON file.
 * Called automatically on first access.
 */
function loadMessages(): void {
  if (Object.keys(messages).length > 0) return;

  try {
    const raw = fs.readFileSync(MESSAGES_PATH, 'utf-8');
    messages = JSON.parse(raw);
    console.log(`[MessageHandler] Loaded messages from ${MESSAGES_PATH}`);
  } catch (err) {
    console.error('[MessageHandler] Failed to load messages.json:', err);
    messages = {};
  }
}

/**
 * Deep get a value from messages using dot notation path.
 * e.g. getMessage('moderation.kick.success')
 */
function getNested(obj: Record<string, any>, path: string): string | null {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

/**
 * Interpolate placeholders in a message string.
 * Placeholders are in the format {key}.
 */
function interpolate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Get a message by path with optional interpolation.
 * Supports {prefix} placeholder that gets replaced with the guild prefix.
 *
 * @param key      Dot-notation path (e.g. 'moderation.kick.success')
 * @param vars     Variables to interpolate (prefix auto-injected)
 * @param prefix   The guild prefix (defaults to '>')
 * @returns        Formatted message string, or a fallback if not found
 */
export function getMessage(key: string, vars?: Record<string, string | number>, prefix?: string): string {
  loadMessages();
  const template = getNested(messages, key);
  if (!template) {
    console.warn(`[MessageHandler] Message not found: ${key}`);
    return `[Missing message: ${key}]`;
  }
  const allVars = { ...vars, prefix: prefix || '>' };
  return interpolate(template, allVars);
}

/**
 * Get a nested message object (for complex structures like embeds).
 */
export function getMessageObject(key: string): Record<string, any> | null {
  loadMessages();
  return getNested(messages, key) ? JSON.parse(JSON.stringify(getNested(messages, key))) : null;
}

/**
 * Check if a message key exists.
 */
export function hasMessage(key: string): boolean {
  loadMessages();
  return getNested(messages, key) !== null;
}

/**
 * Get all messages for a category (e.g. 'moderation.kick').
 */
export function getCategory(category: string): Record<string, string> {
  loadMessages();
  const cat = getNested(messages, category);
  if (!cat || typeof cat !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(cat)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Reload messages from file (useful for development/hot-reload).
 */
export function reloadMessages(): void {
  messages = {};
  loadMessages();
}

// Load immediately on import
loadMessages();

export type { } from '../types/command.js';