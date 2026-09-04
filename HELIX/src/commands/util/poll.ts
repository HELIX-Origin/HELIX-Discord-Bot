import { createEmbed, formatError, getMessage } from '../../handlers/message-handler.js';
import type { CommandDefinition } from '../../types/command.js';

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export const poll: CommandDefinition = {
  name: 'poll',
  description: 'Create a reaction poll with up to 10 options',
  category: 'utility',
  options: [
    { name: 'question', description: 'Poll question', type: 'string', required: true },
    { name: 'options', description: 'Comma-separated options (e.g. Yes, No, Maybe)', type: 'string', required: false },
  ],
  async execute({ message, interaction, getOption }) {
    const question = getOption<string>('question') || 'Poll';
    const rawOptions = getOption<string>('options') || 'Yes, No';
    const options = rawOptions.split(',').map(o => o.trim()).filter(Boolean);

    if (options.length < 2 || options.length > 10) {
      const err = formatError('Poll requires between 2 and 10 comma-separated options.');
      if (message) return message.reply({ embeds: [err] });
      return interaction!.reply({ embeds: [err], ephemeral: true });
    }

    const optionsText = options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n\n');

    const embed = createEmbed('utility.poll.embed', {
      question,
      optionsText,
    });

    if (message) {
      const msg = await message.reply({ embeds: [embed] });
      for (let i = 0; i < options.length; i++) await msg.react(emojis[i]);
    } else {
      await interaction!.reply({ embeds: [embed] });
      const msg = await interaction!.fetchReply();
      for (let i = 0; i < options.length; i++) await msg.react(emojis[i]);
    }
  },
};
