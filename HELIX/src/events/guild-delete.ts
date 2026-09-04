import { Events, Guild } from 'discord.js';
import { logs } from '../handlers/logs-handler.js';
import { getMessage } from '../handlers/message-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const guildDelete: BotEvent = {
  name: Events.GuildDelete,
  execute(guild: Guild) {
    logs.info(getMessage('events.guild_delete', {
      name: guild.name,
      id: guild.id,
    }));
  },
};
