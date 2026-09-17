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

export const slowmodeOptions: ApplicationCommandOption[] = [
  {
    name: 'seconds',
    description: 'Slowmode rate limit in seconds (0 to disable, max 21600)',
    type: ApplicationCommandOptionType.INTEGER,
    required: true,
    min_value: 0,
    max_value: 21600,
  },
  {
    name: 'channel',
    description: 'Target channel (defaults to current channel)',
    type: ApplicationCommandOptionType.CHANNEL,
    required: false,
    channel_types: [0, 5],
  },
];

export const slowmodeCommandDef: ApplicationCommand = {
  name: 'slowmode',
  description: 'Set slowmode rate limit for a channel',
  default_member_permissions: PermissionFlagsBits.ManageChannels.toString(),
  dm_permission: false,
  options: slowmodeOptions,
};

export async function handleSlowmodeCommand(
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
  const seconds = Math.max(0, Math.min(21600, Number(options.find((o) => o.name === 'seconds')?.value ?? 0)));
  const channelId = String(options.find((o) => o.name === 'channel')?.value ?? interaction.channel_id ?? '');

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
  if (!channel || !('setRateLimitPerUser' in channel)) {
    return EmbedHandler.for(deps)
      .error()
      .title('Invalid Channel')
      .description('Slowmode can only be applied to text-based channels.')
      .respond(true);
  }

  try {
    await (channel as TextChannel).setRateLimitPerUser(seconds);
  } catch (err) {
    return EmbedHandler.for(deps)
      .error()
      .title('Slowmode Failed')
      .description(`Failed to configure slowmode: ${(err as Error).message}`)
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
  const statusText = seconds === 0 ? 'Disabled slowmode' : `Set slowmode to ${seconds}s`;
  deps.repo.logActivity(
    user.id,
    'warn',
    'moderation',
    `${statusText} in #${channel.name} (${channelId}) by ${modTag} (Case #${currentCase})`,
  );

  // Dispatch mod log embed
  void dispatchModLog(
    guildId,
    {
      action: 'slowmode',
      moderatorId: modId,
      moderatorTag: modTag,
      targetId: channelId,
      targetTag: `#${channel.name}`,
      reason: statusText,
      caseNumber: currentCase,
    },
    deps,
  );

  return EmbedHandler.for(deps)
    .success()
    .title('Slowmode Updated', '⏱️')
    .description(
      seconds === 0
        ? `Disabled slowmode for <#${channelId}>.`
        : `Set slowmode for <#${channelId}> to **${seconds}** second(s).`,
    )
    .field('Case Number', `#${currentCase}`, true)
    .footer(`Moderator: ${modTag}`)
    .respond();
}

registerCommandMetadata({
  name: 'slowmode',
  description: 'Set slowmode rate limit for a channel',
  category: 'mod',
  emoji: '⏱️',
  usage: '/slowmode seconds:<seconds> [channel:<channel>]',
  options: slowmodeOptions,
  examples: ['/slowmode seconds:5', '/slowmode seconds:0 channel:#general'],
});

export const slowmodeCommand: BotCommand = {
  def: slowmodeCommandDef,
  category: 'mod',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleSlowmodeCommand,
};
