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
import { dispatchModLog } from '../../lib/admin/modlog.js';
import { PermissionFlagsBits, type TextChannel } from 'discord.js';

export const lockOptions: ApplicationCommandOption[] = [
  {
    name: 'channel',
    description: 'Channel to lock (defaults to current channel)',
    type: ApplicationCommandOptionType.CHANNEL,
    required: false,
    channel_types: [0, 5],
  },
  {
    name: 'reason',
    description: 'Reason for channel lockdown',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
];

export const lockCommandDef: ApplicationCommand = {
  name: 'lock',
  description: 'Lock a channel to prevent members from sending messages',
  default_member_permissions: PermissionFlagsBits.ManageChannels.toString(),
  dm_permission: false,
  options: lockOptions,
};

export async function handleLockCommand(
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
  const channelId = String(options.find((o) => o.name === 'channel')?.value ?? interaction.channel_id ?? '');
  const reason =
    (options.find((o) => o.name === 'reason')?.value as string | undefined)?.trim() || 'No reason provided';

  if (!channelId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing Channel')
      .description('Please specify a valid channel.')
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

  const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId).catch(() => null));
  if (!channel || !('permissionOverwrites' in channel)) {
    return EmbedHandler.for(deps)
      .error()
      .title('Invalid Channel')
      .description('Permissions cannot be modified on this channel.')
      .respond(true);
  }

  try {
    await (channel as TextChannel).permissionOverwrites.edit(
      guild.roles.everyone,
      {
        SendMessages: false,
        AddReactions: false,
      },
      { reason },
    );
  } catch (err) {
    return EmbedHandler.for(deps)
      .error()
      .title('Lock Failed')
      .description(`Failed to lock channel: ${(err as Error).message}`)
      .respond(true);
  }

  const moderator = interaction.member?.user ?? interaction.user;
  const modId = moderator?.id ?? 'Unknown';
  const modTag = moderator?.username ?? 'Moderator';

  // Increment guild mod case counter
  const caseKey = 'mod_case_counter';
  const currentCase = parseInt(deps.repo.getGuildSetting(guildId, caseKey) || '0', 10) + 1;
  deps.repo.setGuildSetting(guildId, caseKey, String(currentCase));

  // Log to database activity log
  const user = deps.repo.getOrCreateGuildUser(guildId);
  deps.repo.logActivity(
    user.id,
    'warn',
    'moderation',
    `Locked channel #${channel.name} (${channelId}) by ${modTag} (Case #${currentCase}): ${reason}`,
  );

  // Dispatch mod log embed
  void dispatchModLog(
    guildId,
    {
      action: 'lock',
      moderatorId: modId,
      moderatorTag: modTag,
      targetId: channelId,
      targetTag: `#${channel.name}`,
      reason,
      caseNumber: currentCase,
    },
    deps,
  );

  return EmbedHandler.for(deps)
    .warning()
    .title('Channel Locked', '🔒')
    .description(`Successfully locked <#${channelId}> for @everyone.`)
    .field('Case Number', `#${currentCase}`, true)
    .field('Reason', reason, false)
    .footer(`Moderator: ${modTag}`)
    .respond();
}

registerCommandMetadata({
  name: 'lock',
  description: 'Lock a channel to prevent members from sending messages',
  category: 'mod',
  emoji: '🔒',
  usage: '/lock [channel:<channel>] [reason:<reason>]',
  options: lockOptions,
  examples: ['/lock', '/lock channel:#general reason:Raid containment'],
});

export const lockCommand: BotCommand = {
  def: lockCommandDef,
  category: 'mod',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleLockCommand,
};
