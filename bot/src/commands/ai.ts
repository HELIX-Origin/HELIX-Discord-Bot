import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { AuthResolver } from '../../../src/core/auth/index.js';
import { ProviderDispatcher } from '../../../src/core/ai/index.js';
import { LocalCliRunner } from '../../../src/core/cli/index.js';
import { BotDatabase } from '../db/index.js';

export const aiCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-ai')
    .setDescription('Query connected AI agents with your prompt')
    .addStringOption(option =>
      option
        .setName('prompt')
        .setDescription('Your coding or architecture question')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('provider')
        .setDescription('AI provider override (antigravity, copilot, opencode)')
        .setRequired(false)
        .addChoices(
          { name: 'Google Antigravity', value: 'antigravity' },
          { name: 'GitHub Copilot', value: 'copilot' },
          { name: 'Open Code Go/Zen', value: 'opencode' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const prompt = interaction.options.getString('prompt', true);
    const providerChoice = interaction.options.getString('provider');
    const userId = interaction.user.id;
    const username = interaction.user.tag || interaction.user.username;

    await interaction.deferReply();

    const db = BotDatabase.getInstance();
    const userSession = db.getUserSession(userId, providerChoice || undefined);
    const systemProvider = ProviderDispatcher.selectBestProvider(providerChoice || undefined);

    let activeProviderName = userSession ? userSession.provider : (systemProvider ? systemProvider.displayName : null);
    let activeSource = userSession ? `User Session (${username})` : (systemProvider ? systemProvider.source : null);

    if (!activeProviderName) {
      await interaction.editReply({
        content: '⚠️ You do not have an active authenticated session. Run `/helix-auth login` to connect your account for this Discord server.',
      });
      return;
    }

    // Persist to internal SQLite database
    db.logQuery({
      userId,
      username,
      guildId: interaction.guildId || undefined,
      prompt,
      provider: activeProviderName,
    });

    // Execute through the bot's hosted local copy of the CLI using the user's personal session token
    const cliArgs = ['ai', 'query', prompt];
    if (providerChoice) {
      cliArgs.push('--provider', providerChoice);
    }

    const cliResult = await LocalCliRunner.execute(cliArgs, {
      userId,
      provider: providerChoice || activeProviderName,
    });

    const responseText = cliResult.stdout || cliResult.stderr || 'Query executed successfully.';
    const truncatedResponse = responseText.length > 2000 ? responseText.slice(0, 1950) + '\n... (truncated)' : responseText;

    const embed = new EmbedBuilder()
      .setTitle(`🤖 HELIX AI — ${activeProviderName.toUpperCase()}`)
      .setDescription(`**Prompt:**\n> ${prompt}\n\n**Output:**\n\`\`\`text\n${truncatedResponse.slice(0, 1500)}\n\`\`\``)
      .setColor(cliResult.success ? 0x00ff88 : 0xffaa00)
      .addFields(
        { name: 'Authenticated Session', value: `\`${activeSource}\``, inline: true },
        { name: 'Session Mode', value: userSession ? 'Personal Member Session' : 'Host Shared Session', inline: true },
        { name: 'Local CLI Host', value: `\`helix v${LocalCliRunner.getStatus().version}\``, inline: true }
      )
      .setFooter({ text: 'HELIX AI • Hosted Local CLI Engine' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
