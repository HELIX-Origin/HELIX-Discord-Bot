import { Events, Guild } from 'discord.js';
import { logs } from '../handlers/logs-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const guildCreate: BotEvent = {
  name: Events.GuildCreate,
  execute(guild: Guild) {
    logs.info(`Joined: ${guild.name} (${guild.id}) — ${guild.memberCount} members`);
  },
};
