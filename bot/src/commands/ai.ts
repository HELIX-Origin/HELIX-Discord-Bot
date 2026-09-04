import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BotDatabase } from '../db/index.js';
import { HelixBotClient } from '../client.js';
import { BotAIEngine } from '../ai/engine.js';
import { resolveAIModel } from '../ai/models.js';

export const aiCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-ai')
    .setDescription('Query connected AI models with your prompt (Free tier auto-runs OpenCode Zen)')
    .addStringOption(option =>
      option
        .setName('prompt')
        .setDescription('Your coding or architecture question')
        .setRequired(true)
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
    const modelChoice = interaction.options.getString('model');
    const providerChoice = interaction.options.getString('provider');
    const userId = interaction.user.id;
    const username = interaction.user.tag || interaction.user.username;

    await interaction.deferReply();

    const db = BotDatabase.getInstance();
    const userSession = db.getUserSession(userId, providerChoice || undefined);
    const userSettings = db.getUserSettings(userId);

    // Verify if the executing member is the bot application owner
    const botClient = HelixBotClient.getInstance();
    const isOwner = botClient ? await botClient.isOwner(userId) : Boolean(
      (process.env.DISCORD_OWNER_ID && process.env.DISCORD_OWNER_ID.trim() === userId) ||
      (process.env.BOT_OWNER_ID && process.env.BOT_OWNER_ID.trim() === userId)
    );

    // Host environment/secret API keys are strictly reserved for the bot owner.
    // Non-owners can use their personal userSession API key, or auto-run Free Tier (OpenCode Zen's BigPickle).
    const hasPersonalKey = Boolean(userSession && userSession.token);
    const userHasKey = isOwner || hasPersonalKey;

    const requestedModel = modelChoice || userSettings?.defaultModel || null;
    const preferredProvider = providerChoice || userSession?.provider || userSettings?.defaultAiProvider || null;

    // Resolve the model with automatic Free Tier fallback and downgrade messaging
    const resolution = resolveAIModel(requestedModel, userHasKey, preferredProvider);

    // Log query to SQLite database
    db.logQuery({
      userId,
      username,
      guildId: interaction.guildId || undefined,
      prompt,
      provider: resolution.model.provider,
    });

    // Execute through in-process BotAIEngine (Zero CLI subprocesses)
    const result = await BotAIEngine.executeQuery(prompt, {
      model: resolution.model,
      isFreeTier: resolution.isFreeTier,
      userToken: userSession?.token,
    });

    const embed = new EmbedBuilder()
      .setTitle(`🤖 HELIX AI — ${resolution.model.name}`)
      .setDescription(result.content.slice(0, 4000))
      .setColor(resolution.isFreeTier ? 0x00d2ff : 0x00ff88)
      .addFields(
        {
          name: 'Tier & Access',
          value: resolution.isFreeTier ? '🆓 OpenCode Zen Free Tier' : (isOwner ? '👑 Bot Owner Session' : '🔑 Authenticated Member Session'),
          inline: true,
        },
        {
          name: 'Provider',
          value: `\`${resolution.model.provider}\``,
          inline: true,
        },
        {
          name: 'Latency',
          value: `\`${result.latencyMs}ms\``,
          inline: true,
        }
      )
      .setFooter({
        text: resolution.downgraded
          ? `Notice: ${resolution.downgradeReason}`
          : 'HELIX AI • Zero-Subprocess In-Process Gateway',
      })
      .setTimestamp();

    if (resolution.downgraded && resolution.downgradeReason) {
      embed.addFields({
        name: '⚡ Tier Notice',
        value: `${resolution.downgradeReason}\nUse \`/helix-auth action:login\` to authenticate your API key and unlock proprietary models.`,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
