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

export const voiceOptions: ApplicationCommandOption[] = [
  {
    name: 'mute',
    description: 'Server-mute a member in voice',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'The member to server-mute',
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for mute',
        type: ApplicationCommandOptionType.STRING,
        required: false,
      },
    ],
  },
  {
    name: 'unmute',
    description: 'Server-unmute a member in voice',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'The member to server-unmute',
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
    ],
  },
  {
    name: 'deafen',
    description: 'Server-deafen a member in voice',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'The member to server-deafen',
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for deafen',
        type: ApplicationCommandOptionType.STRING,
        required: false,
      },
    ],
  },
  {
    name: 'undeafen',
    description: 'Server-undeafen a member in voice',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'The member to server-undeafen',
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
    ],
  },
  {
    name: 'move',
    description: 'Move a member to another voice channel',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'The member to move',
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
      {
        name: 'channel',
        description: 'The destination voice channel',
        type: ApplicationCommandOptionType.CHANNEL,
        required: true,
        channel_types: [2, 13],
      },
    ],
  },
  {
    name: 'disconnect',
    description: 'Disconnect a member from voice',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'The member to disconnect',
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for disconnect',
        type: ApplicationCommandOptionType.STRING,
        required: false,
      },
    ],
  },
];

export const voiceCommandDef: ApplicationCommand = {
  name: 'voice',
  description: 'Manage guild voice channels and member states',
  default_member_permissions: (
    PermissionFlagsBits.MuteMembers |
    PermissionFlagsBits.DeafenMembers |
    PermissionFlagsBits.MoveMembers
  ).toString(),
  dm_permission: false,
  options: voiceOptions,
};

export async function handleVoiceCommand(
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

  const client = deps.bot.getClient();
  const guild = client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId).catch(() => null));
  if (!guild) {
    return EmbedHandler.for(deps)
      .error()
      .title('Guild Not Found')
      .description('Could not resolve current server details.')
      .respond(true);
  }

  const subCommand = interaction.data?.options?.[0];
  const subName = subCommand?.name;
  const subOptions = subCommand?.options ?? [];

  const targetUserId = String(subOptions.find((o) => o.name === 'user')?.value ?? '');
  if (!targetUserId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing User')
      .description('Please specify a valid user.')
      .respond(true);
  }

  const member = await guild.members.fetch(targetUserId).catch(() => null);
  if (!member) {
    return EmbedHandler.for(deps)
      .error()
      .title('Member Not Found')
      .description('The specified user is not in this server.')
      .respond(true);
  }

  if (!member.voice.channelId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Not in Voice')
      .description(`<@${member.id}> is not connected to any voice channel.`)
      .respond(true);
  }

  const reason =
    (subOptions.find((o) => o.name === 'reason')?.value as string | undefined)?.trim() || 'No reason provided';

  try {
    switch (subName) {
      case 'mute': {
        await member.voice.setMute(true, reason);
        return EmbedHandler.for(deps)
          .success()
          .title('Member Muted', '🔇')
          .description(`Server-muted <@${member.id}> in voice.`)
          .respond();
      }
      case 'unmute': {
        await member.voice.setMute(false);
        return EmbedHandler.for(deps)
          .success()
          .title('Member Unmuted', '🔊')
          .description(`Server-unmuted <@${member.id}> in voice.`)
          .respond();
      }
      case 'deafen': {
        await member.voice.setDeaf(true, reason);
        return EmbedHandler.for(deps)
          .success()
          .title('Member Deafened', '🔇')
          .description(`Server-deafened <@${member.id}> in voice.`)
          .respond();
      }
      case 'undeafen': {
        await member.voice.setDeaf(false);
        return EmbedHandler.for(deps)
          .success()
          .title('Member Undeafened', '🔊')
          .description(`Server-undeafened <@${member.id}> in voice.`)
          .respond();
      }
      case 'move': {
        const destChannelId = String(subOptions.find((o) => o.name === 'channel')?.value ?? '');
        if (!destChannelId) {
          return EmbedHandler.for(deps)
            .error()
            .title('Missing Channel')
            .description('Please specify a destination voice channel.')
            .respond(true);
        }
        await member.voice.setChannel(destChannelId);
        return EmbedHandler.for(deps)
          .success()
          .title('Member Moved', '🔄')
          .description(`Moved <@${member.id}> to <#${destChannelId}>.`)
          .respond();
      }
      case 'disconnect': {
        await member.voice.disconnect(reason);
        return EmbedHandler.for(deps)
          .success()
          .title('Member Disconnected', '👋')
          .description(`Disconnected <@${member.id}> from voice.`)
          .respond();
      }
      default:
        return EmbedHandler.for(deps)
          .error()
          .title('Invalid Action')
          .description('Unknown voice subcommand.')
          .respond(true);
    }
  } catch (err) {
    return EmbedHandler.for(deps)
      .error()
      .title('Voice Action Failed')
      .description(`Error: ${(err as Error).message}`)
      .respond(true);
  }
}

registerCommandMetadata({
  name: 'voice',
  description: 'Manage guild voice channels and member states',
  category: 'admin',
  emoji: '🔊',
  usage: '/voice <mute|unmute|deafen|undeafen|move|disconnect>',
  options: voiceOptions,
  subcommands: [
    { name: 'mute', description: 'Server-mute a member in voice' },
    { name: 'unmute', description: 'Server-unmute a member in voice' },
    { name: 'deafen', description: 'Server-deafen a member in voice' },
    { name: 'undeafen', description: 'Server-undeafen a member in voice' },
    { name: 'move', description: 'Move a member to another voice channel' },
    { name: 'disconnect', description: 'Disconnect a member from voice' },
  ],
  examples: ['/voice mute user:@User', '/voice move user:@User channel:#Voice2', '/voice disconnect user:@User'],
});

export const voiceCommand: BotCommand = {
  def: voiceCommandDef,
  category: 'admin',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleVoiceCommand,
};
