import { REST, Routes } from 'discord.js';
import { botCommands } from './commands/index.js';
import { logger } from './utils/logger/index.js';

export async function deployBotCommands(options: {
  token: string;
  clientId: string;
  guildId?: string;
  dryRun?: boolean;
}): Promise<{ success: boolean; message: string; count: number }> {
  const { token, clientId, guildId, dryRun } = options;

  const payload = botCommands.map(c => c.data.toJSON());

  if (dryRun) {
    return {
      success: true,
      message: `Dry-run: ${payload.length} slash commands prepared for deployment`,
      count: payload.length,
    };
  }

  if (!token || !clientId) {
    return {
      success: false,
      message: 'Missing DISCORD_TOKEN or DISCORD_CLIENT_ID',
      count: 0,
    };
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: payload });
      return {
        success: true,
        message: `Successfully deployed ${payload.length} guild slash commands to guild: ${guildId}`,
        count: payload.length,
      };
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: payload });
      return {
        success: true,
        message: `Successfully deployed ${payload.length} global slash commands`,
        count: payload.length,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to deploy slash commands to Discord',
      count: 0,
    };
  }
}
