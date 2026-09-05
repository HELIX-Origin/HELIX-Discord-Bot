import { Events, Interaction } from 'discord.js';
import { handleSlashInteraction } from '../handlers/slash-handler.js';
import { handleTicketButton, handleTicketModal } from '../interactions/tickets.js';
import { handleHelpInteraction } from '../commands/info/help.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const interactionCreate: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      await handleSlashInteraction(interaction);
    }
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('help_btn_')) {
        await handleHelpInteraction(interaction);
      } else if (interaction.customId === 'helix_ticket_create' || interaction.customId === 'helix_ticket_close') {
        await handleTicketButton(interaction);
      }
    }
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'help_category_select') {
        await handleHelpInteraction(interaction);
      }
    }
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'helix_ticket_modal') {
        await handleTicketModal(interaction as any);
      }
    }
  },
};

