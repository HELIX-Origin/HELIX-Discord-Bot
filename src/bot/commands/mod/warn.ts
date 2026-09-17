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
import { PermissionFlagsBits } from 'discord.js';

export const warnOptions: ApplicationCommandOption[] = [
  {
    name: 'user',
    description: 'The member to warn',
    type: ApplicationCommandOptionType.USER,
    required: true,
  },
  {
    name: 'reason',
    description: 'Reason for the warning',
    type: ApplicationCommandOptionType.STRING,
    required: true,
  },
];

export const warnCommandDef: ApplicationCommand = {
  name: 'warn',
  description: 'Issue a warning to a guild member',
  default_member_permissions: PermissionFlagsBits.ModerateMembers.toString(),
  dm_permission: false,
  options: warnOptions,
};

export async function handleWarnCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('This command can only be used in a server.')
      .respond(true);
  }

  const options = interaction.data?.options ?? [];
  const targetId = String(options.find((o) => o.name === 'user')?.value ?? '');
  const reason = String(options.find((o) => o.name === 'reason')?.value ?? '').trim();

  if (!targetId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing User')
      .description('Please specify a valid member to warn.')
      .respond(true);
  }

  if (!reason) {
    return EmbedHandler.for(deps)
      .error()
      .title('Missing Reason')
      .description('Please provide a reason for the warning.')
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
    `Member ${targetId} warned by ${modTag} (Case #${currentCase}): ${reason}`,
  );

  // Dispatch mod log embed
  void dispatchModLog(
    guildId,
    {
      action: 'warn',
      moderatorId: modId,
      moderatorTag: modTag,
      targetId,
      targetTag: targetId,
      reason,
      caseNumber: currentCase,
    },
    deps,
  );

  return EmbedHandler.for(deps)
    .warning()
    .title('Member Warned', '⚠️')
    .description(`Successfully issued a warning to <@${targetId}>.`)
    .field('Case Number', `#${currentCase}`, true)
    .field('Reason', reason, false)
    .footer(`Moderator: ${modTag}`)
    .respond();
}

registerCommandMetadata({
  name: 'warn',
  description: 'Issue a warning to a guild member',
  category: 'mod',
  emoji: '⚠️',
  usage: '/warn user:<user> reason:<reason>',
  options: warnOptions,
  examples: ['/warn user:@troublemaker reason:Rule 1 violation (spam)'],
});

export const warnCommand: BotCommand = {
  def: warnCommandDef,
  category: 'mod',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleWarnCommand,
};
