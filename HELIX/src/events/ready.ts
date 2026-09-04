import { Events } from 'discord.js';
import { logs } from '../handlers/logs-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const ready: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logs.success(`HELIX is online! Connected as: ${client.user?.tag}`);
    logs.info(`Serving ${client.guilds.cache.size} server(s)`);
    try { client.user?.setActivity('HELIX | >help', { type: 3 }); } catch {}
  },
};
