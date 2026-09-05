import { Events, GuildMember, EmbedBuilder, Colors } from 'discord.js';
import { BotDatabase } from '../db/database.js';
import { logs } from '../handlers/logs-handler.js';
import type { BotEvent } from '../handlers/event-handler.js';

export const guildMemberAdd: BotEvent = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    if (!member?.guild) return;

    const db = BotDatabase.getInstance();
    const settings = db.getGuildSettings(member.guild.id);
    const welcomeChannelId = settings?.welcomeChannelId;
    if (!welcomeChannelId) return;

    try {
      const channel = await member.guild.channels.fetch(welcomeChannelId).catch(() => null);
      if (!channel || !channel.isTextBased() || channel.isThread()) return;

      const memberCount = member.guild.memberCount;
      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle(`👋 Welcome to ${member.guild.name}!`)
        .setDescription(`Welcome <@${member.id}>! We're glad to have you join us.`)
        .addFields(
          { name: 'Member', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
          { name: 'Total Members', value: `${memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await (channel as any).send({ content: `<@${member.id}>`, embeds: [embed] });
      logs.info(`Dispatched welcome message for ${member.user.tag} in #${channel.name} (${member.guild.name})`);
    } catch (err: any) {
      logs.warn(`Failed to dispatch welcome message in guild ${member.guild.id}: ${err.message}`);
    }
  },
};
