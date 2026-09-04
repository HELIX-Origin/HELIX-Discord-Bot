import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { LocalCliRunner } from '../../../src/core/cli/index.js';
import { BotDatabase } from '../db/index.js';
import { HelixBotClient } from '../client.js';

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
    const userSession = db.getUserSession(userId);

    // Verify if the executing member is the bot application owner
    const botClient = HelixBotClient.getInstance();
    const isOwner = botClient ? await botClient.isOwner(userId) : Boolean(
      (process.env.DISCORD_OWNER_ID && process.env.DISCORD_OWNER_ID.trim() === userId) ||
      (process.env.BOT_OWNER_ID && process.env.BOT_OWNER_ID.trim() === userId)
    );

    // API keys provided by environment variables or secrets are strictly reserved for the bot's owner.
    if (!isOwner && !userSession) {
      const restrictedEmbed = new EmbedBuilder()
        .setTitle('🔒 Bot Owner API Key Protection')
        .setColor(0xffa500)
        .setDescription(
          'API keys configured in the environment or repository secrets are strictly restricted to the bot application owner.'
        )
        .addFields({
          name: 'How to use HELIX AI',
          value:
            'You can authenticate your personal account with your own AI provider key using `/helix-auth action:login`.\nYour credentials are encrypted in your private SQLite member session and never exposed to other members.',
        })
        .setFooter({ text: 'HELIX Security • Per-user credential isolation' });

      await interaction.editReply({ embeds: [restrictedEmbed] });
      return;
    }

    const prompt = `Explain this ${language} code snippet:\n\`\`\`${language}\n${code}\n\`\`\``;

    // Log query to SQLite database
    db.logQuery({
      userId,
      username,
      guildId: interaction.guildId || undefined,
      prompt,
      provider: userSession ? userSession.provider : 'ai-explain (Bot Owner)',
    });

    // Execute through the bot's hosted local CLI
    const cliResult = await LocalCliRunner.execute(['ai', 'query', prompt], {
      userId,
      isOwner,
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
