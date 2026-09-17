import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type ApplicationCommandOption,
  type DiscordInteraction,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';
import { PermissionFlagsBits } from 'discord.js';

export const announceOptions: ApplicationCommandOption[] = [
  {
    name: 'channel',
    description: 'Channel to send announcement to',
    type: ApplicationCommandOptionType.CHANNEL,
    required: true,
    channel_types: [0, 5],
  },
  {
    name: 'message',
    description: 'The announcement message body',
    type: ApplicationCommandOptionType.STRING,
    required: true,
  },
  {
    name: 'title',
    description: 'Optional announcement title',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
];

export const announceCommandDef: ApplicationCommand = {
  name: 'announce',
  description: 'Send a formatted announcement embed to a channel',
  default_member_permissions: PermissionFlagsBits.ManageChannels.toString(),
  dm_permission: false,
  options: announceOptions,
};

export async function handleAnnounceCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId || !deps.bot) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('This command can only be used in a server.')
      .respond(true);
  }

  const options = interaction.data?.options ?? [];
  const channelId = String(options.find((o) => o.name === 'channel')?.value ?? '');
  const message = String(options.find((o) => o.name === 'message')?.value ?? '').trim();
  const title = (options.find((o) => o.name === 'title')?.value as string | undefined)?.trim() || '📢 Announcement';

  if (!channelId || !message) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing Parameters')
      .description('Please provide both a target channel and message.')
      .respond(true);
  }

  const moderator = interaction.member?.user ?? interaction.user;
  const modTag = moderator?.username ?? 'Staff';

  const announcementEmbed = EmbedHandler.for(deps)
    .primary()
    .title(title, '📢')
    .description(message)
    .footer(`Announced by ${modTag}`)
    .build();

  try {
    await deps.bot.rest.sendChannelMessage(channelId, {
      embeds: [announcementEmbed],
    });
  } catch (err) {
    return EmbedHandler.for(deps)
      .error()
      .title('Announcement Failed')
      .description(`Failed to send announcement: ${(err as Error).message}`)
      .respond(true);
  }

  const user = deps.repo.getOrCreateGuildUser(guildId);
  deps.repo.logActivity(user.id, 'info', 'moderation', `Announcement posted to channel ${channelId} by ${modTag}`);

  return EmbedHandler.for(deps)
    .success()
    .title('Announcement Sent', '📢')
    .description(`Successfully posted announcement to <#${channelId}>.`)
    .respond(true);
}

registerCommandMetadata({
  name: 'announce',
  description: 'Send a formatted announcement embed to a channel',
  category: 'mod',
  emoji: '📢',
  usage: '/announce channel:<channel> message:<message> [title:<title>]',
  options: announceOptions,
  examples: ['/announce channel:#announcements message:Maintenance tonight at midnight title:Server Maintenance'],
});

export const announceCommand: BotCommand = {
  def: announceCommandDef,
  category: 'mod',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleAnnounceCommand,
};
