import { Events, Guild } from 'discord.js';
import { logs } from '../handlers/logs-handler.js';
import { getMessage } from '../handlers/message-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const guildCreate: BotEvent = {
  name: Events.GuildCreate,
  execute(guild: Guild) {
    logs.info(getMessage('events.guild_create', {
      name: guild.name,
      id: guild.id,
      memberCount: String(guild.memberCount),
    }));
  },
};
