import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { AuthResolver } from '../../../src/core/auth/index.js';
import { ProviderDispatcher } from '../../../src/core/ai/index.js';
import { LocalCliRunner } from '../../../src/core/cli/index.js';
import { BotDatabase } from '../db/index.js';
import { HelixBotClient } from '../client.js';

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

    // Verify if the executing member is the bot application owner
    const botClient = HelixBotClient.getInstance();
    const isOwner = botClient ? await botClient.isOwner(userId) : Boolean(
      (process.env.DISCORD_OWNER_ID && process.env.DISCORD_OWNER_ID.trim() === userId) ||
      (process.env.BOT_OWNER_ID && process.env.BOT_OWNER_ID.trim() === userId)
    );

    // API keys provided by environment variables or secrets are strictly reserved for the bot's owner.
    // Non-owners MUST have their own personal session configured via /helix-auth.
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

    // Only bot owners can use systemProvider fallback (host's env/secret API keys)
    const systemProvider = isOwner ? ProviderDispatcher.selectBestProvider(providerChoice || undefined) : null;

    let activeProviderName = userSession ? userSession.provider : (systemProvider ? systemProvider.displayName : null);
    let activeSource = userSession ? `User Session (${username})` : (systemProvider ? `${systemProvider.source} (Bot Owner)` : null);

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

    // Execute through the bot's hosted local copy of the CLI
    const cliArgs = ['ai', 'query', prompt];
    if (providerChoice) {
      cliArgs.push('--provider', providerChoice);
    }

    const cliResult = await LocalCliRunner.execute(cliArgs, {
      userId,
      isOwner,
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
        { name: 'Session Mode', value: userSession ? 'Personal Member Session' : 'Bot Owner Master Session', inline: true },
        { name: 'Local CLI Host', value: `\`helix v${LocalCliRunner.getStatus().version}\``, inline: true }
      )
      .setFooter({ text: 'HELIX AI • Hosted Local CLI Engine' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
