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

export const kickOptions: ApplicationCommandOption[] = [
  {
    name: 'user',
    description: 'The member to kick',
    type: ApplicationCommandOptionType.USER,
    required: true,
  },
  {
    name: 'reason',
    description: 'Reason for the kick',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
];

export const kickCommandDef: ApplicationCommand = {
  name: 'kick',
  description: 'Kick a member from the server',
  default_member_permissions: PermissionFlagsBits.KickMembers.toString(),
  dm_permission: false,
  options: kickOptions,
};

export async function handleKickCommand(
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
  const reason =
    (options.find((o) => o.name === 'reason')?.value as string | undefined)?.trim() || 'No reason provided';

  if (!targetId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing User')
      .description('Please specify a valid member to kick.')
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

  if (!targetMember) {
    return EmbedHandler.for(deps)
      .error()
      .title('Member Not Found')
      .description('The specified user is not in this server.')
      .respond(true);
  }

  if (targetMember.id === guild.ownerId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Action Denied')
      .description('You cannot kick the server owner.')
      .respond(true);
  }

  if (botMember && !canManageMember(botMember, targetMember)) {
    return EmbedHandler.for(deps)
      .error()
      .title('Insufficient Bot Permissions')
      .description('The bot cannot kick this member due to role hierarchy.')
      .respond(true);
  }

  if (executorMember && !canManageMember(executorMember, targetMember)) {
    return EmbedHandler.for(deps)
      .error()
      .title('Action Denied')
      .description('You cannot kick a member with an equal or higher role than yours.')
      .respond(true);
  }

  try {
    await targetMember.kick(reason);
  } catch (err) {
    return EmbedHandler.for(deps)
      .error()
      .title('Kick Failed')
      .description(`Failed to kick member: ${(err as Error).message}`)
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
    `Member ${targetMember.user.tag} (${targetId}) kicked by ${modTag} (Case #${currentCase}): ${reason}`,
  );

  // Dispatch mod log embed
  void dispatchModLog(
    guildId,
    {
      action: 'kick',
      moderatorId: modId,
      moderatorTag: modTag,
      targetId,
      targetTag: targetMember.user.tag,
      reason,
      caseNumber: currentCase,
    },
    deps,
  );

  return EmbedHandler.for(deps)
    .warning()
    .title('Member Kicked', '👢')
    .description(`Successfully kicked <@${targetId}> (${targetMember.user.tag}) from the server.`)
    .field('Case Number', `#${currentCase}`, true)
    .field('Reason', reason, false)
    .footer(`Moderator: ${modTag}`)
    .respond();
}

registerCommandMetadata({
  name: 'kick',
  description: 'Kick a member from the server',
  category: 'mod',
  emoji: '👢',
  usage: '/kick user:<user> [reason:<reason>]',
  options: kickOptions,
  examples: ['/kick user:@rulebreaker reason:Spamming links'],
});

export const kickCommand: BotCommand = {
  def: kickCommandDef,
  category: 'mod',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleKickCommand,
};
