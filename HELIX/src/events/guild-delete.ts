import { Events, Guild } from 'discord.js';
import { logs } from '../handlers/logs-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const guildDelete: BotEvent = {
  name: Events.GuildDelete,
  execute(guild: Guild) {
    logs.info(`Left: ${guild.name} (${guild.id})`);
  },
};
