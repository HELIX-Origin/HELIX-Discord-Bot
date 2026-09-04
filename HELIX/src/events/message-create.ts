import { Events, Message } from 'discord.js';
import { handlePrefixMessage } from '../handlers/command-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const messageCreate: BotEvent = {
  name: Events.MessageCreate,
  execute(message: Message) {
    handlePrefixMessage(message);
  },
};
