// discordx handles slash command registration via client.initApplicationCommands()
// This file is kept for reference but is no longer used by the bot entry point.
import { REST, Routes } from 'discord.js';
import { logs as logger } from './handlers/logs-handler.js';

export async function deployBotCommands(options: {
  token: string;
  clientId: string;
  guildId?: string;
  dryRun?: boolean;
}): Promise<{ success: boolean; message: string; count: number }> {
  const { token, clientId, guildId, dryRun } = options;

  if (dryRun) {
    return {
      success: true,
      message: 'Dry-run: discordx handles command registration via client.initApplicationCommands()',
      count: 0,
    };
  }

  if (!token || !clientId) {
    return {
      success: false,
      message: 'Missing DISCORD_TOKEN or DISCORD_CLIENT_ID',
      count: 0,
    };
  }

  logger.warn('deployBotCommands() is deprecated — discordx handles registration automatically.');
  return {
    success: true,
    message: 'discordx manages slash command registration. Use client.initApplicationCommands() instead.',
    count: 0,
  };
}
