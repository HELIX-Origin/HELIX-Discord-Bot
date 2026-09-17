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
import { canManageMember } from '../../lib/admin/permissions.js';
import { PermissionFlagsBits } from 'discord.js';

export const banOptions: ApplicationCommandOption[] = [
  {
    name: 'user',
    description: 'The user to ban',
    type: ApplicationCommandOptionType.USER,
    required: true,
  },
  {
    name: 'delete_days',
    description: 'Number of days of message history to delete (0-7)',
    type: ApplicationCommandOptionType.INTEGER,
    required: false,
    min_value: 0,
    max_value: 7,
  },
  {
    name: 'reason',
    description: 'Reason for the ban',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
];

export const banCommandDef: ApplicationCommand = {
  name: 'ban',
  description: 'Ban a member from the server',
  default_member_permissions: PermissionFlagsBits.BanMembers.toString(),
  dm_permission: false,
  options: banOptions,
};

export async function handleBanCommand(
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
  const targetId = String(options.find((o) => o.name === 'user')?.value ?? '');
  const deleteDays = Math.max(0, Math.min(7, Number(options.find((o) => o.name === 'delete_days')?.value ?? 0)));
  const reason =
    (options.find((o) => o.name === 'reason')?.value as string | undefined)?.trim() || 'No reason provided';

  if (!targetId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing User')
      .description('Please specify a valid user to ban.')
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

  const executorMember = interaction.member?.user
    ? await guild.members.fetch(interaction.member.user.id).catch(() => null)
    : null;
  const targetMember = await guild.members.fetch(targetId).catch(() => null);
  const botMember =
    guild.members.me ?? (client.user ? await guild.members.fetch(client.user.id).catch(() => null) : null);

  if (targetMember) {
    if (targetMember.id === guild.ownerId) {
      return EmbedHandler.for(deps)
        .error()
        .title('Action Denied')
        .description('You cannot ban the server owner.')
        .respond(true);
    }
    if (botMember && !canManageMember(botMember, targetMember)) {
      return EmbedHandler.for(deps)
        .error()
        .title('Insufficient Bot Permissions')
        .description('The bot cannot ban this member due to role hierarchy.')
        .respond(true);
    }
    if (executorMember && !canManageMember(executorMember, targetMember)) {
      return EmbedHandler.for(deps)
        .error()
        .title('Action Denied')
        .description('You cannot ban a member with an equal or higher role than yours.')
        .respond(true);
    }
  }

  try {
    await guild.members.ban(targetId, {
      deleteMessageSeconds: deleteDays * 86400,
      reason,
    });
  } catch (err) {
    return EmbedHandler.for(deps)
      .error()
      .title('Ban Failed')
      .description(`Failed to ban user: ${(err as Error).message}`)
      .respond(true);
  }

  const moderator = interaction.member?.user ?? interaction.user;
  const modId = moderator?.id ?? 'Unknown';
  const modTag = moderator?.username ?? 'Moderator';
  const targetTag = targetMember ? targetMember.user.tag : targetId;

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
    `User ${targetTag} (${targetId}) banned by ${modTag} (Case #${currentCase}): ${reason}`,
  );

  // Dispatch mod log embed
  void dispatchModLog(
    guildId,
    {
      action: 'ban',
      moderatorId: modId,
      moderatorTag: modTag,
      targetId,
      targetTag,
      reason,
      caseNumber: currentCase,
    },
    deps,
  );

  return EmbedHandler.for(deps)
    .warning()
    .title('User Banned', '🔨')
    .description(`Successfully banned <@${targetId}> (${targetTag}) from the server.`)
    .field('Case Number', `#${currentCase}`, true)
    .field('Message History Deleted', `${deleteDays} day(s)`, true)
    .field('Reason', reason, false)
    .footer(`Moderator: ${modTag}`)
    .respond();
}

registerCommandMetadata({
  name: 'ban',
  description: 'Ban a member from the server',
  category: 'mod',
  emoji: '🔨',
  usage: '/ban user:<user> [delete_days:<0-7>] [reason:<reason>]',
  options: banOptions,
  examples: ['/ban user:@raider delete_days:7 reason:Server raiding'],
});

export const banCommand: BotCommand = {
  def: banCommandDef,
  category: 'mod',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleBanCommand,
};
