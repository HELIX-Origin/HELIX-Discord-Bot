import { Events } from 'discord.js';
import { logs } from '../handlers/logs-handler.js';
import { getMessage } from '../handlers/message-handler.js';
import { getBotToken, getClientId } from '../env.js';
import { purgeGlobalSlashCommands, reconcileAllGuildSlashCommands } from '../handlers/slash-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const ready: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logs.success(getMessage('events.ready', {
      tag: client.user?.tag || 'HELIX',
      id: client.user?.id || '',
      guildCount: String(client.guilds.cache.size),
    }));
    try { client.user?.setActivity('HELIX | >help', { type: 3 }); } catch {}

    const token = getBotToken();
    const clientId = getClientId() || client.user?.id || '';
    if (token && clientId) {
      try {
        await purgeGlobalSlashCommands(token, clientId);
        const guildIds: string[] = Array.from(client.guilds.cache.keys());
        if (guildIds.length > 0) {
          await reconcileAllGuildSlashCommands(token, clientId, guildIds);
        }
      } catch (err: any) {
        logs.warn(`Slash command startup reconciliation warning: ${err.message}`);
      }
    }
  },
};
