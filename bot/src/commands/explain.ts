import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BotDatabase } from '../db/index.js';
import { HelixBotClient } from '../client.js';
import { BotAIEngine } from '../ai/engine.js';
import { resolveAIModel } from '../ai/models.js';

export const explainCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-explain')
    .setDescription('Explain a code snippet or error message using AI (Free tier auto-runs OpenCode Zen)')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Code snippet or error stack trace to explain')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('language')
        .setDescription('Programming language (e.g. typescript, python, rust, go)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('model')
        .setDescription('AI model selection (Free: Gemini Flash, GPT-4o Mini, BigPickle; Key-required: Pro models)')
        .setRequired(false)
        .addChoices(
          { name: 'Google Gemini 2.5 Flash (Free)', value: 'gemini-2.5-flash' },
          { name: 'Google Gemini 1.5 Flash (Free)', value: 'gemini-1.5-flash' },
          { name: 'GitHub Copilot GPT-4o Mini (Free)', value: 'gpt-4o-mini' },
          { name: "OpenCode Zen's BigPickle (Free)", value: 'big-pickle' },
          { name: 'OpenCode Zen Standard (Free)', value: 'opencode-zen-standard' },
          { name: 'Google Gemini 2.5 Pro (Key Required)', value: 'gemini-2.5-pro' },
          { name: 'Google Gemini 1.5 Pro (Key Required)', value: 'gemini-1.5-pro' },
          { name: 'GitHub Copilot GPT-4o (Key Required)', value: 'gpt-4o' },
          { name: 'GitHub Copilot Claude 3.5 Sonnet (Key Required)', value: 'claude-3.5-sonnet' },
          { name: 'OpenCode Pro 2.0 (Key Required)', value: 'opencode-pro' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const code = interaction.options.getString('code', true);
    const language = interaction.options.getString('language') || 'generic';
    const modelChoice = interaction.options.getString('model');
    const userId = interaction.user.id;
    const username = interaction.user.tag || interaction.user.username;

    await interaction.deferReply();

    const db = BotDatabase.getInstance();
    const userSession = db.getUserSession(userId);
    const userSettings = db.getUserSettings(userId);

    // Verify if the executing member is the bot application owner
    const botClient = HelixBotClient.getInstance();
    const isOwner = botClient ? await botClient.isOwner(userId) : Boolean(
      (process.env.DISCORD_OWNER_ID && process.env.DISCORD_OWNER_ID.trim() === userId) ||
      (process.env.BOT_OWNER_ID && process.env.BOT_OWNER_ID.trim() === userId)
    );

    const hasPersonalKey = Boolean(userSession && userSession.token);
    const userHasKey = isOwner || hasPersonalKey;

    const requestedModel = modelChoice || userSettings?.defaultModel || null;
    const resolution = resolveAIModel(requestedModel, userHasKey, userSession?.provider || userSettings?.defaultAiProvider);

    // Log query to SQLite database
    db.logQuery({
      userId,
      username,
      guildId: interaction.guildId || undefined,
      prompt: `[Explain ${language}] ${code.slice(0, 100)}...`,
      provider: resolution.model.provider,
    });

    // Execute through in-process BotAIEngine (Zero CLI subprocesses)
    const result = await BotAIEngine.executeExplain(code, {
      model: resolution.model,
      language,
      isFreeTier: resolution.isFreeTier,
      userToken: userSession?.token,
    });

    const embed = new EmbedBuilder()
      .setTitle(`💡 HELIX Code Review [${language.toUpperCase()}] — ${resolution.model.name}`)
      .setDescription(result.content.slice(0, 4000))
      .setColor(resolution.isFreeTier ? 0x00d2ff : 0x00ff88)
      .addFields(
        { name: 'Language', value: `\`${language}\``, inline: true },
        {
          name: 'Tier',
          value: resolution.isFreeTier ? '🆓 OpenCode Zen Free' : (isOwner ? '👑 Bot Owner' : '🔑 Authenticated Member'),
          inline: true,
        },
        { name: 'Latency', value: `\`${result.latencyMs}ms\``, inline: true }
      )
      .setFooter({
        text: resolution.downgraded
          ? `Notice: ${resolution.downgradeReason}`
          : 'HELIX Code • AI Explanation Engine',
      })
      .setTimestamp();

    if (resolution.downgraded && resolution.downgradeReason) {
      embed.addFields({
        name: '⚡ Tier Notice',
        value: `${resolution.downgradeReason}\nAuthenticate an API key via \`/helix-auth action:login\` to unlock proprietary models.`,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
