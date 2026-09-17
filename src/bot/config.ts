/**
 * src/bot/config.ts
 *
 * Bot configuration & export handler.
 * Provides bot-level settings, Gateway intent configurations,
 * feature flag checkers, and re-exports for the bot subsystem.
 */

import { GatewayIntentBits } from 'discord.js';
import type { AppConfig, FeatureFlags } from '../config.js';
import type { AppDeps } from '../app.js';

/** Default Gateway intents required by HELIX Discord Bot. */
export const BOT_DEFAULT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
] as const;

/** Extracted bot runtime options derived from global AppConfig. */
export interface BotRuntimeConfig {
  token: string;
  clientId: string | null;
  redirectUrl: string | null;
  callbackUrl: string | null;
  port: number;
  host: string;
  features: FeatureFlags;
}

/** Extracts the bot runtime options from global AppConfig. */
export function extractBotConfig(config: AppConfig): BotRuntimeConfig {
  return {
    token: config.botToken || '',
    clientId: config.clientId,
    redirectUrl: config.redirectUrl,
    callbackUrl: config.callbackUrl,
    port: config.botPort,
    host: config.host,
    features: config.features,
  };
}

/** Checks whether a specific feature flag is enabled in the current application configuration. */
export function isBotFeatureEnabled(deps: AppDeps, feature: keyof FeatureFlags): boolean {
  return Boolean(deps.config.features[feature]);
}
