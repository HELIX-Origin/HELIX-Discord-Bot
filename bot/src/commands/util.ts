import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { HelixBotClient } from '../client.js';

export const utilCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-util')
    .setDescription('HELIX Utility Suite - Server info, user info, avatar, polls, snowflake lookup, and reminders')
    .addSubcommand(sub =>
      sub.setName('ping').setDescription('Check Discord WebSocket latency and REST round-trip ping')
    )
    .addSubcommand(sub =>
      sub
        .setName('avatar')
        .setDescription('Display high-resolution user avatar')
        .addUserOption(opt => opt.setName('user').setDescription('Target user (defaults to you)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('serverinfo').setDescription('View comprehensive server statistics and details')
    )
    .addSubcommand(sub =>
      sub
        .setName('userinfo')
        .setDescription('View account details, join date, and roles for a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target user (defaults to you)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('poll')
        .setDescription('Create an interactive community poll with emoji voting')
        .addStringOption(opt => opt.setName('question').setDescription('Poll question or topic').setRequired(true))
        .addStringOption(opt => opt.setName('option1').setDescription('First voting option').setRequired(true))
        .addStringOption(opt => opt.setName('option2').setDescription('Second voting option').setRequired(true))
        .addStringOption(opt => opt.setName('option3').setDescription('Third voting option').setRequired(false))
        .addStringOption(opt => opt.setName('option4').setDescription('Fourth voting option').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('snowflake')
        .setDescription('Decode a Discord Snowflake ID into its exact creation timestamp')
        .addStringOption(opt => opt.setName('id').setDescription('Snowflake ID (User, Channel, Message, etc.)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remind')
        .setDescription('Set a personal reminder')
        .addIntegerOption(opt =>
          opt
            .setName('minutes')
            .setDescription('Duration in minutes before receiving reminder')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1440)
        )
        .addStringOption(opt => opt.setName('reminder').setDescription('What should HELIX remind you about?').setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ping') {
      await interaction.deferReply();
      const bot = HelixBotClient.getInstance();
      const wsPing = bot ? bot.getGatewayLatency() : -1;
      const mem = process.memoryUsage();

      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong! • HELIX Latency')
        .setColor(0x00d2ff)
        .addFields(
          { name: 'WebSocket Heartbeat', value: wsPing >= 0 ? `\`${wsPing} ms\`` : '`Connecting...`', inline: true },
          { name: 'Memory Footprint', value: `\`${Math.round(mem.rss / 1024 / 1024)} MB\``, inline: true },
          { name: 'Uptime', value: `\`${Math.floor(process.uptime() / 60)} minutes\``, inline: true }
        )
        .setFooter({ text: 'HELIX Discord Suite' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'avatar') {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const avatarUrl = targetUser.displayAvatarURL({ size: 1024, extension: 'png' });

      const embed = new EmbedBuilder()
        .setTitle(`🖼️ Avatar • ${targetUser.username}`)
        .setImage(avatarUrl)
        .setColor(0x38bdf8)
        .setDescription(`[Open Full Size Image](${avatarUrl})`)
        .setFooter({ text: `User ID: ${targetUser.id}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'serverinfo') {
      await interaction.deferReply();
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply({ content: '❌ This command must be run inside a server.' });
        return;
      }

      const owner = await guild.fetchOwner().catch(() => null);
      const iconUrl = guild.iconURL({ size: 512, extension: 'png' });

      const embed = new EmbedBuilder()
        .setTitle(`🏰 ${guild.name}`)
        .setColor(0x00d2ff)
        .setThumbnail(iconUrl)
        .addFields(
          { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
          { name: 'Owner', value: owner ? `<@${owner.id}> (${owner.user.tag})` : 'Unknown', inline: true },
          { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Total Members', value: `${guild.memberCount}`, inline: true },
          { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
          { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'Verification Level', value: `${guild.verificationLevel}`, inline: true },
          { name: 'Nitro Boost Tier', value: `Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true }
        )
        .setFooter({ text: 'HELIX Server Information' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'userinfo') {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const member = interaction.guild ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;
      const avatarUrl = targetUser.displayAvatarURL({ size: 512, extension: 'png' });

      const embed = new EmbedBuilder()
        .setTitle(`👤 User Info • ${targetUser.username}`)
        .setColor(0x38bdf8)
        .setThumbnail(avatarUrl)
        .addFields(
          { name: 'Username', value: `${targetUser.tag}`, inline: true },
          { name: 'User ID', value: `\`${targetUser.id}\``, inline: true },
          { name: 'Bot Account', value: targetUser.bot ? 'Yes' : 'No', inline: true },
          { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
        );

      if (member) {
        const roles = member.roles.cache
          .filter(r => r.id !== interaction.guildId)
          .map(r => `<@&${r.id}>`)
          .slice(0, 10);

        embed.addFields(
          { name: 'Joined Server', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
          { name: 'Highest Role', value: member.roles.highest ? `<@&${member.roles.highest.id}>` : 'None', inline: true },
          { name: `Roles (${member.roles.cache.size - 1})`, value: roles.length > 0 ? roles.join(', ') : 'None', inline: false }
        );
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'poll') {
      await interaction.deferReply();
      const question = interaction.options.getString('question', true);
      const opt1 = interaction.options.getString('option1', true);
      const opt2 = interaction.options.getString('option2', true);
      const opt3 = interaction.options.getString('option3');
      const opt4 = interaction.options.getString('option4');

      const emojiMap = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
      const options = [opt1, opt2];
      if (opt3) options.push(opt3);
      if (opt4) options.push(opt4);

      const description = options.map((opt, i) => `${emojiMap[i]} **${opt}**`).join('\n\n');

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${question}`)
        .setDescription(description)
        .setColor(0x00d2ff)
        .setFooter({ text: `Poll opened by ${interaction.user.tag} • React below to cast your vote` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      try {
        const msg = await interaction.fetchReply();
        for (let i = 0; i < options.length; i++) {
          await msg.react(emojiMap[i]);
        }
      } catch {
        // Ignore reaction errors if permissions don't allow
      }
      return;
    }

    if (subcommand === 'snowflake') {
      await interaction.deferReply();
      const id = interaction.options.getString('id', true).trim();

      if (!/^\d{17,20}$/.test(id)) {
        await interaction.editReply({ content: '❌ Invalid Snowflake ID. Must be a 17-20 digit integer.' });
        return;
      }

      const timestampMs = Number((BigInt(id) >> 22n) + 1420070400000n);
      const date = new Date(timestampMs);

      const embed = new EmbedBuilder()
        .setTitle('❄️ Snowflake Decoder')
        .setColor(0x38bdf8)
        .addFields(
          { name: 'Snowflake ID', value: `\`${id}\``, inline: true },
          { name: 'Created At (UTC)', value: date.toUTCString(), inline: true },
          { name: 'Relative Time', value: `<t:${Math.floor(timestampMs / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'remind') {
      const minutes = interaction.options.getInteger('minutes', true);
      const reminderText = interaction.options.getString('reminder', true);

      await interaction.reply({
        content: `⏰ I will remind you in **${minutes} minute(s)**: "${reminderText}"`,
        ephemeral: true,
      });

      setTimeout(async () => {
        try {
          const user = interaction.user;
          const dm = await user.createDM();
          const remindEmbed = new EmbedBuilder()
            .setTitle('⏰ HELIX Reminder!')
            .setDescription(reminderText)
            .setColor(0xffaa00)
            .setFooter({ text: 'Scheduled via HELIX Utility Suite' })
            .setTimestamp();

          await dm.send({ embeds: [remindEmbed] });
        } catch {
          try {
            if (interaction.channel && interaction.channel.isTextBased()) {
              await (interaction.channel as any).send({
                content: `<@${interaction.user.id}> ⏰ **Reminder**: ${reminderText}`,
              });
            }
          } catch {}
        }
      }, minutes * 60 * 1000);
      return;
    }
  },
};
