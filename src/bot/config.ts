/**
 * src/bot/config.ts
 *
 * Bot configuration & export handler.
 * Provides bot-level settings, Gateway intent configurations,
 * feature flag checkers, and re-exports for the bot subsystem.
 */

import { GatewayIntentBits } from 'discord.js';

/** Default Gateway intents required by HELIX Discord Bot. */
export const BOT_DEFAULT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
] as const;
