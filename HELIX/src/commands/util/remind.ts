import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

export const remind: CommandDefinition = {
  name: 'remind',
  description: 'Set a timed reminder',
  category: 'utility',
  usage: '<time> <message>',
  examples: ['remind 10m Standup meeting', 'remind 2h Deploy release', 'remind 1d Review pull requests'],
  options: [
    { name: 'time', description: 'Duration (e.g. 10m, 1h, 2d)', type: 'string', required: true },
    { name: 'message', description: 'Reminder text', type: 'string', required: true },
  ],
  async execute({ message, interaction, getOption }) {
    const timeStr = getOption<string>('time') || '10m';
    const text = getOption<string>('message') || 'Reminder';
    const user = message?.author || interaction!.user;

    const match = timeStr.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) {
      const err = formatError(getMessage('errors.invalid_duration'));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    const val = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const delay = val * multipliers[unit];

    if (delay > 2419200000) {
      const err = formatError(getMessage('errors.duration_too_long', { max: '28d' }));
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    const embed = createEmbed('utility.remind.embed', {
      duration: timeStr,
      message: text,
    });

    if (message) await message.reply({ embeds: [embed] });
    else await interaction!.reply({ embeds: [embed] });

    setTimeout(async () => {
      try {
        await user.send(`⏰ **Reminder:** ${text}`);
      } catch {}
    }, delay);
  },
};
