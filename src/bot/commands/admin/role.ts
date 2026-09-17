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

export const roleOptions: ApplicationCommandOption[] = [
  {
    name: 'add',
    description: 'Assign a role to a member',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'The member to assign the role to',
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
      {
        name: 'role',
        description: 'The role to assign',
        type: ApplicationCommandOptionType.ROLE,
        required: true,
      },
    ],
  },
  {
    name: 'remove',
    description: 'Remove a role from a member',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'The member to remove the role from',
        type: ApplicationCommandOptionType.USER,
        required: true,
      },
      {
        name: 'role',
        description: 'The role to remove',
        type: ApplicationCommandOptionType.ROLE,
        required: true,
      },
    ],
  },
  {
    name: 'list',
    description: 'List roles of a member or all server roles',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
      {
        name: 'user',
        description: 'Optional member to list roles for',
        type: ApplicationCommandOptionType.USER,
        required: false,
      },
    ],
  },
];

export const roleCommandDef: ApplicationCommand = {
  name: 'role',
  description: 'Manage guild roles and member assignments',
  default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
  dm_permission: false,
  options: roleOptions,
};

export async function handleRoleCommand(
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

  if (subName === 'list') {
    const targetUserId = subOptions.find((o) => o.name === 'user')?.value as string | undefined;
    if (targetUserId) {
      const member = await guild.members.fetch(targetUserId).catch(() => null);
      if (!member) {
        return EmbedHandler.for(deps)
          .error()
          .title('Member Not Found')
          .description('Could not find member in this server.')
          .respond(true);
      }
      const roles = member.roles.cache.filter((r) => r.id !== guild.id).map((r) => `<@&${r.id}>`);

      return EmbedHandler.for(deps)
        .info()
        .title(`Roles for ${member.user.tag}`, '🎭')
        .description(roles.length > 0 ? roles.join(' ') : 'No roles assigned.')
        .respond();
    }

    const allRoles = guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => `<@&${r.id}> (${r.members.size} members)`);

    return EmbedHandler.for(deps)
      .info()
      .title(`${guild.name} Roles (${allRoles.length})`, '🎭')
      .description(allRoles.slice(0, 30).join('\n') || 'No custom roles in server.')
      .respond();
  }

  const targetUserId = String(subOptions.find((o) => o.name === 'user')?.value ?? '');
  const roleId = String(subOptions.find((o) => o.name === 'role')?.value ?? '');

  if (!targetUserId || !roleId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing Parameters')
      .description('Please specify both a user and a role.')
      .respond(true);
  }

  const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
  if (!targetMember) {
    return EmbedHandler.for(deps)
      .error()
      .title('Member Not Found')
      .description('The specified user is not in this server.')
      .respond(true);
  }

  const targetRole = guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId).catch(() => null));
  if (!targetRole) {
    return EmbedHandler.for(deps)
      .error()
      .title('Role Not Found')
      .description('Could not find specified role.')
      .respond(true);
  }

  const executorMember = interaction.member?.user
    ? await guild.members.fetch(interaction.member.user.id).catch(() => null)
    : null;
  const botMember =
    guild.members.me ?? (client.user ? await guild.members.fetch(client.user.id).catch(() => null) : null);

  if (botMember && botMember.roles.highest.position <= targetRole.position) {
    return EmbedHandler.for(deps)
      .error()
      .title('Insufficient Bot Permissions')
      .description('The bot highest role must be above the target role to manage it.')
      .respond(true);
  }

  if (
    executorMember &&
    executorMember.id !== guild.ownerId &&
    executorMember.roles.highest.position <= targetRole.position
  ) {
    return EmbedHandler.for(deps)
      .error()
      .title('Action Denied')
      .description('You cannot manage a role equal to or higher than your own highest role.')
      .respond(true);
  }

  if (subName === 'add') {
    try {
      await targetMember.roles.add(targetRole);
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Assign Role')
        .description(`Error: ${(err as Error).message}`)
        .respond(true);
    }

    return EmbedHandler.for(deps)
      .success()
      .title('Role Added', '🎭')
      .description(`Successfully assigned <@&${targetRole.id}> to <@${targetMember.id}>.`)
      .respond();
  }

  if (subName === 'remove') {
    try {
      await targetMember.roles.remove(targetRole);
    } catch (err) {
      return EmbedHandler.for(deps)
        .error()
        .title('Failed to Remove Role')
        .description(`Error: ${(err as Error).message}`)
        .respond(true);
    }

    return EmbedHandler.for(deps)
      .success()
      .title('Role Removed', '🎭')
      .description(`Successfully removed <@&${targetRole.id}> from <@${targetMember.id}>.`)
      .respond();
  }

  return EmbedHandler.for(deps).error().title('Invalid Subcommand').description('Unknown role action.').respond(true);
}

registerCommandMetadata({
  name: 'role',
  description: 'Manage guild roles and member assignments',
  category: 'admin',
  emoji: '🎭',
  usage: '/role <add|remove|list>',
  options: roleOptions,
  subcommands: [
    { name: 'add', description: 'Assign a role to a member' },
    { name: 'remove', description: 'Remove a role from a member' },
    { name: 'list', description: 'List roles of a member or all server roles' },
  ],
  examples: ['/role add user:@User role:@DJ', '/role remove user:@User role:@Member', '/role list'],
});

export const roleCommand: BotCommand = {
  def: roleCommandDef,
  category: 'admin',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleRoleCommand,
};
