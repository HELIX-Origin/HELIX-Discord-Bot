import { Events } from 'discord.js';
import { logs } from '../handlers/logs-handler.js';
import { getMessage } from '../handlers/message-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const ready: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logs.success(getMessage('events.ready', {
      tag: client.user?.tag || 'HELIX',
      id: client.user?.id || '',
      guildCount: String(client.guilds.cache.size),
    }));
    try { client.user?.setActivity('HELIX | >help', { type: 3 }); } catch {}
  },
};
