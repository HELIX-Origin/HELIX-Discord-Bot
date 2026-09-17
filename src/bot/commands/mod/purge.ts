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

export const purgeOptions: ApplicationCommandOption[] = [
  {
    name: 'count',
    description: 'Number of messages to delete (1-100)',
    type: ApplicationCommandOptionType.INTEGER,
    required: true,
    min_value: 1,
    max_value: 100,
  },
];

export const purgeCommandDef: ApplicationCommand = {
  name: 'purge',
  description: 'Bulk delete messages from a channel',
  default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
  dm_permission: false,
  options: purgeOptions,
};

export async function handlePurgeCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  const channelId = interaction.channel_id;

  if (!guildId || !channelId || !deps.bot) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('This command can only be used in a server channel.')
      .respond(true);
  }

  const options = interaction.data?.options ?? [];
  const count = Math.max(1, Math.min(100, Number(options.find((o) => o.name === 'count')?.value ?? 1)));

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
  if (!channel || !channel.isTextBased() || !('bulkDelete' in channel)) {
    return EmbedHandler.for(deps)
      .error()
      .title('Invalid Channel')
      .description('Messages can only be purged in text channels.')
      .respond(true);
  }

  let deletedCount: number;
  try {
    const deleted = await (channel as TextChannel).bulkDelete(count, true);
    deletedCount = deleted.size;
  } catch (err) {
    return EmbedHandler.for(deps)
      .error()
      .title('Purge Failed')
      .description(`Failed to purge messages: ${(err as Error).message}`)
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
    `Purged ${deletedCount} messages in channel #${channel.name} (${channelId}) by ${modTag} (Case #${currentCase})`,
  );

  // Dispatch mod log embed
  void dispatchModLog(
    guildId,
    {
      action: 'purge',
      moderatorId: modId,
      moderatorTag: modTag,
      targetId: channelId,
      targetTag: `#${channel.name}`,
      reason: `Bulk deleted ${deletedCount} message(s)`,
      caseNumber: currentCase,
    },
    deps,
  );

  return EmbedHandler.for(deps)
    .success()
    .title('Messages Purged', '🧹')
    .description(`Successfully deleted **${deletedCount}** message(s) from <#${channelId}>.`)
    .field('Case Number', `#${currentCase}`, true)
    .footer(`Moderator: ${modTag}`)
    .respond(true);
}

registerCommandMetadata({
  name: 'purge',
  description: 'Bulk delete messages from a channel',
  category: 'mod',
  emoji: '🧹',
  usage: '/purge count:<1-100>',
  options: purgeOptions,
  examples: ['/purge count:25'],
});

export const purgeCommand: BotCommand = {
  def: purgeCommandDef,
  category: 'mod',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handlePurgeCommand,
};
