import { Events, Interaction } from 'discord.js';
import { handleSlashInteraction } from '../handlers/slash-handler.js';
import { handleTicketButton, handleTicketModal } from '../interactions/tickets.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const interactionCreate: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      await handleSlashInteraction(interaction);
    }
    if (interaction.isButton()) {
      if (interaction.customId === 'helix_ticket_create' || interaction.customId === 'helix_ticket_close') {
        await handleTicketButton(interaction);
      }
    }
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'helix_ticket_modal') {
        await handleTicketModal(interaction as any);
      }
    }
  },
};
