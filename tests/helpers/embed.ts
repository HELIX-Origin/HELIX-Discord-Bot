/**
 * tests/helpers/embed.ts
 *
 * Shared factory helpers for embed-related tests.
 * Keeps individual test files lean — just import what you need.
 */

import { EmbedHandler } from '../../src/bot/lib/embeds/builder.js';
import type { DiscordEmbed } from '../../src/bot/utils/types.js';

/**
 * Returns a bare EmbedHandler with no branding (null deps).
 * Use this when testing the builder's output shape without AppDeps.
 */
export function bareHandler(): EmbedHandler {
  return new EmbedHandler(null);
}

/**
 * Convenience: build and return the DiscordEmbed directly.
 */
export function buildEmbed(fn: (h: EmbedHandler) => EmbedHandler): DiscordEmbed {
  return fn(bareHandler()).build();
}
