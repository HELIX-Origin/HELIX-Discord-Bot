import { ChatInputCommandInteraction, ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { logs } from './logs-handler.js';

type InteractionType = 'command' | 'button' | 'modal';

export async function handleError(
  error: any,
  type: InteractionType,
  name: string,
  interaction: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction
): Promise<void> {
  const errorMsg = error?.message || String(error);
  logs.error(`Error handling ${type} "${name}": ${errorMsg}`);

  const content = `❌ An error occurred while processing this ${type}.`;

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  } catch {
    // Interaction already expired or failed
  }
}

export function wrapError(type: InteractionType, name: string, fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    try {
      await fn();
    } catch (error: any) {
      logs.error(`Error in ${type} "${name}": ${error?.message || error}`);
    }
  };
}
