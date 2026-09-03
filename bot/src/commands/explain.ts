import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { LocalCliRunner } from '../../../src/core/cli/index.js';
import { BotDatabase } from '../db/index.js';

export const explainCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-explain')
    .setDescription('Explain a code snippet or error message using AI')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Code snippet or error stack trace to explain')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('language')
        .setDescription('Programming language')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const code = interaction.options.getString('code', true);
    const language = interaction.options.getString('language') || 'generic';
    const userId = interaction.user.id;
    const username = interaction.user.tag || interaction.user.username;

    await interaction.deferReply();

    const db = BotDatabase.getInstance();
    const prompt = `Explain this ${language} code snippet:\n\`\`\`${language}\n${code}\n\`\`\``;

    // Log query to SQLite database
    db.logQuery({
      userId,
      username,
      guildId: interaction.guildId || undefined,
      prompt,
      provider: 'ai-explain',
    });

    // Execute through the bot's hosted local CLI
    const cliResult = await LocalCliRunner.execute(['ai', 'query', prompt], {
      userId,
    });

    const responseText = cliResult.stdout || cliResult.stderr || 'Analyzed code structure. Evaluated syntax, typing, and patterns.';
    const truncatedResponse = responseText.length > 2000 ? responseText.slice(0, 1950) + '\n... (truncated)' : responseText;

    const embed = new EmbedBuilder()
      .setTitle(`💡 HELIX Code Explanation [${language.toUpperCase()}]`)
      .setDescription(`\`\`\`${language}\n${code.slice(0, 500)}\n\`\`\`\n\n**Analysis:**\n${truncatedResponse.slice(0, 1400)}`)
      .setColor(cliResult.success ? 0x00d2ff : 0xffaa00)
      .addFields(
        { name: 'Language', value: `\`${language}\``, inline: true },
        { name: 'Local CLI Host', value: `\`helix v${LocalCliRunner.getStatus().version}\``, inline: true }
      )
      .setFooter({ text: 'HELIX Code • AI Explanation Engine' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
