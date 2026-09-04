import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BotDatabase } from '../db/index.js';
import { getAuthorizationUrl } from '../server.js';
import { getClientId, getCallbackUrl } from '../env.js';

export const authCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-auth')
    .setDescription('Manage your personal authenticated AI session for this Discord server')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Authentication action')
        .setRequired(true)
        .addChoices(
          { name: 'status - View your active sessions', value: 'status' },
          { name: 'login - Authenticate with an AI provider', value: 'login' },
          { name: 'logout - Terminate your session', value: 'logout' }
        )
    )
    .addStringOption(option =>
      option
        .setName('provider')
        .setDescription('Target AI provider')
        .setRequired(false)
        .addChoices(
          { name: 'Google Antigravity', value: 'antigravity' },
          { name: 'GitHub Copilot', value: 'copilot' },
          { name: 'Open Code Go/Zen', value: 'opencode' }
        )
    )
    .addStringOption(option =>
      option
        .setName('token')
        .setDescription('Personal access token or API key for the provider')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const action = interaction.options.getString('action', true);
    const provider = interaction.options.getString('provider') || 'antigravity';
    const token = interaction.options.getString('token');
    const userId = interaction.user.id;
    const username = interaction.user.tag || interaction.user.username;
    const guildId = interaction.guildId || undefined;

    const db = BotDatabase.getInstance();

    if (action === 'status') {
      const sessions = db.getUserSessions(userId);

      const embed = new EmbedBuilder()
        .setTitle(`🔐 Authentication Status: ${username}`)
        .setColor(sessions.length > 0 ? 0x00ff88 : 0xffa500)
        .setDescription(
          sessions.length > 0
            ? 'You have active authenticated AI sessions stored for your Discord account:'
            : 'You do not have any active sessions yet. Authenticate using `/helix-auth login`.'
        );

      if (sessions.length > 0) {
        for (const s of sessions) {
          const masked = s.token ? `${s.token.slice(0, 4)}...${s.token.slice(-4)}` : 'Session Active';
          embed.addFields({
            name: `Provider: ${s.provider.toUpperCase()}`,
            value: `Credential: \`${masked}\`\nUpdated: ${s.updatedAt || 'Recently'}`,
            inline: false,
          });
        }
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (action === 'login') {
      if (token) {
        db.setUserSession({
          userId,
          username,
          guildId,
          provider,
          token,
        });

        const embed = new EmbedBuilder()
          .setTitle('✅ Session Authenticated!')
          .setColor(0x00ff88)
          .setDescription(`Successfully saved your personal session for **${provider.toUpperCase()}**.`)
          .addFields(
            { name: 'Discord Member', value: `<@${userId}>`, inline: true },
            { name: 'Provider', value: `\`${provider}\``, inline: true }
          )
          .setFooter({ text: 'Your token is stored in the internal SQLite database and used for your queries.' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const clientId = getClientId();
        const callbackBase = getCallbackUrl();
        const authUrl = `${getAuthorizationUrl(clientId, callbackBase)}&state=${encodeURIComponent(`${userId}:${guildId || 'DM'}:${provider}`)}`;

        const embed = new EmbedBuilder()
          .setTitle('🔑 Authenticate Your Session')
          .setColor(0x38bdf8)
          .setDescription(`To connect your account for **${provider.toUpperCase()}**, provide your token directly or click the authorization link below:`)
          .addFields(
            {
              name: 'Option 1: Command with Token',
              value: `\`/helix-auth action:login provider:${provider} token:<YOUR_KEY>\``,
            },
            {
              name: 'Option 2: Browser Authorization',
              value: `[Authorize via Browser](${authUrl})`,
            }
          )
          .setFooter({ text: 'Sessions are stored per user in the internal SQLite database.' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return;
    }

    if (action === 'logout') {
      const deleted = db.deleteUserSession(userId, provider);

      const embed = new EmbedBuilder()
        .setTitle('🚪 Session Terminated')
        .setColor(0xff4444)
        .setDescription(
          deleted
            ? `Your session for **${provider.toUpperCase()}** has been removed from the database.`
            : `No active session found for **${provider.toUpperCase()}**.`
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
