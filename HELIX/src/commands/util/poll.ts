import { EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../types/command.js';

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export const poll: CommandDefinition = {
  name: 'poll', description: 'Create an emoji reaction poll', category: 'utility',
  options: [
    { name: 'question', description: 'Poll question', type: 'string', required: true },
    { name: 'options', description: 'Options separated by |', type: 'string', required: true },
  ],
  async execute({ message, interaction, getOption }) {
    const question = getOption<string>('question') || '';
    const options = (getOption<string>('options') || '').split('|').map(o => o.trim()).filter(Boolean);
    if (options.length < 2 || options.length > 10) { const r = '❌ Provide 2-10 options separated by `|`.'; if (message) return message.reply(r); return interaction!.reply({ content: r, ephemeral: true }); }

    const embed = new EmbedBuilder().setTitle(question).setColor(0x00d2ff).setDescription(options.map((o, i) => `${emojis[i]} ${o}`).join('\n')).setTimestamp();
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
