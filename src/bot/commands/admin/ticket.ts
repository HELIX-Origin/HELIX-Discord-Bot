import { appDisplayName, type AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordEmbed,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { commandHelpResponse, createEmbed, EMBED_COLORS, successEmbed } from '../../utils/embeds.js';

export const ticketCommandDef: ApplicationCommand = {
  name: 'ticket',
  description: 'Manage support ticket system',
  default_member_permissions: '8',
  dm_permission: false,
  options: [
    {
      name: 'setup',
      description: 'Configure the ticket system',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'manager_role',
          description: 'Role that can manage tickets (auto-added)',
          type: ApplicationCommandOptionType.ROLE,
          required: true,
        },
        {
          name: 'category',
          description: 'Forum channel for tickets (optional)',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [15],
        },
        {
          name: 'transcript_channel',
          description: 'Channel for ticket transcripts',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [0, 5],
        },
        {
          name: 'log_channel',
          description: 'Channel for ticket logs',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [0, 5],
        },
        {
          name: 'welcome_message',
          description: 'Message shown when ticket is created',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
    {
      name: 'disable',
      description: 'Disable the ticket system',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'view',
      description: 'View current ticket configuration',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'create',
      description: 'Create a support ticket',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'reason',
          description: 'Reason for creating the ticket',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
      ],
    },
    {
      name: 'close',
      description: 'Close a ticket (run inside ticket channel)',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'reason',
          description: 'Reason for closing',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
    {
      name: 'add',
      description: 'Add a user to the ticket',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'user',
          description: 'User to add',
          type: ApplicationCommandOptionType.USER,
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Remove a user from the ticket',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'user',
          description: 'User to remove',
          type: ApplicationCommandOptionType.USER,
          required: true,
        },
      ],
    },
    {
      name: 'claim',
      description: 'Claim a ticket as a manager',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'transcript',
      description: 'Generate transcript for current ticket',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
  ],
};

const DEFAULT_TICKET_WELCOME =
  '📩 A support agent will be with you shortly. Please describe your issue in detail and remain patient.';

const MAX_TICKET_NAME = 100;

function embedResponse(embed: DiscordEmbed): InteractionResponse {
  return {
    type: 4,
    data: { embeds: [embed] },
  };
}

function errorResponse(title: string, description: string): InteractionResponse {
  return embedResponse(
    createEmbed({
      color: EMBED_COLORS.ERROR,
      title: `❌ ${title}`,
      description,
    }),
  );
}

export interface TicketConfig {
  categoryId: string | null;
  managerRoleId: string | null;
  transcriptChannelId: string | null;
  logChannelId: string | null;
  welcomeMessage: string;
  enabled: boolean;
}

export function getTicketConfig(deps: AppDeps, guildId: string): TicketConfig {
  return {
    categoryId: deps.repo.getGuildSetting(guildId, 'ticket_category_id') || null,
    managerRoleId: deps.repo.getGuildSetting(guildId, 'ticket_manager_role_id') || null,
    transcriptChannelId: deps.repo.getGuildSetting(guildId, 'ticket_transcript_channel_id') || null,
    logChannelId: deps.repo.getGuildSetting(guildId, 'ticket_log_channel_id') || null,
    welcomeMessage: deps.repo.getGuildSetting(guildId, 'ticket_welcome_message') || DEFAULT_TICKET_WELCOME,
    enabled: deps.repo.getGuildSetting(guildId, 'ticket_enabled') === '1',
  };
}

export function isTicketThread(threadName: string): boolean {
  return /^ticket-/i.test(threadName) || threadName.startsWith('🎫');
}

export async function handleTicketCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return errorResponse('Server Settings Only', '`/ticket` can only be used inside a Discord server (guild).');
  }

  const subCommand = interaction.data?.options?.[0];
  if (!subCommand) {
    return ticketHelp();
  }

  const options = subCommand.options ?? [];

  switch (subCommand.name) {
    case 'setup':
      return handleSetup(guildId, options, deps);
    case 'disable':
      return handleDisable(guildId, deps);
    case 'view':
      return handleView(guildId, deps);
    case 'create':
      return handleCreate(interaction, guildId, options, deps, rest);
    case 'close':
      return handleClose(interaction, guildId, options, deps, rest);
    case 'add':
      return handleAdd(interaction, guildId, options, deps, rest);
    case 'remove':
      return handleRemove(interaction, guildId, options, deps, rest);
    case 'claim':
      return handleClaim(interaction, guildId, deps, rest);
    case 'transcript':
      return handleTranscript(interaction, guildId, deps, rest);
    default:
      return errorResponse('Unknown Subcommand', `\`${subCommand.name}\` is not a valid \`/ticket\` subcommand.`);
  }
}

function ticketHelp(): InteractionResponse {
  return commandHelpResponse({
    name: 'ticket',
    description: 'Manage support ticket system with forum thread support',
    subcommands: [
      { name: 'setup', description: 'Configure the ticket system', options: [] },
      { name: 'disable', description: 'Disable the ticket system', options: [] },
      { name: 'view', description: 'View current ticket configuration', options: [] },
      { name: 'create', description: 'Create a support ticket', options: [] },
      { name: 'close', description: 'Close a ticket', options: [] },
      { name: 'add', description: 'Add a user to the ticket', options: [] },
      { name: 'remove', description: 'Remove a user from the ticket', options: [] },
      { name: 'claim', description: 'Claim a ticket as a manager', options: [] },
      { name: 'transcript', description: 'Generate transcript for current ticket', options: [] },
    ],
    examples: [
      '/ticket setup manager_role:@Support category:#tickets transcript_channel:#transcripts',
      '/ticket create reason:"Need help with feeds"',
      '/ticket close reason:"Issue resolved"',
      '/ticket add user:@user',
      '/ticket transcript',
    ],
  });
}

function handleSetup(guildId: string, options: InteractionOption[], deps: AppDeps): InteractionResponse {
  const categoryId = String(options.find((o) => o.name === 'category')?.value ?? '').trim() || undefined;
  const managerRoleId = String(options.find((o) => o.name === 'manager_role')?.value ?? '').trim();
  const transcriptChannelId =
    String(options.find((o) => o.name === 'transcript_channel')?.value ?? '').trim() || undefined;
  const logChannelId = String(options.find((o) => o.name === 'log_channel')?.value ?? '').trim() || undefined;
  const welcomeMessage = String(options.find((o) => o.name === 'welcome_message')?.value ?? '').trim() || undefined;

  if (!managerRoleId) {
    return ticketHelp();
  }

  const config = getTicketConfig(deps, guildId);

  if (categoryId) deps.repo.setGuildSetting(guildId, 'ticket_category_id', categoryId);
  deps.repo.setGuildSetting(guildId, 'ticket_manager_role_id', managerRoleId);
  if (transcriptChannelId) deps.repo.setGuildSetting(guildId, 'ticket_transcript_channel_id', transcriptChannelId);
  if (logChannelId) deps.repo.setGuildSetting(guildId, 'ticket_log_channel_id', logChannelId);
  if (welcomeMessage) deps.repo.setGuildSetting(guildId, 'ticket_welcome_message', welcomeMessage);
  deps.repo.setGuildSetting(guildId, 'ticket_enabled', '1');

  deps.repo.logActivity(null, 'info', 'bot', `Configured ticket system for guild ${guildId} via /ticket`);

  const fields = [
    {
      name: 'Forum Channel',
      value: categoryId ? `<#${categoryId}>` : config.categoryId ? `<#${config.categoryId}>` : 'Not set',
      inline: true,
    },
    { name: 'Manager Role', value: `<@&${managerRoleId}>`, inline: true },
    {
      name: 'Transcript Channel',
      value: transcriptChannelId
        ? `<#${transcriptChannelId}>`
        : config.transcriptChannelId
          ? `<#${config.transcriptChannelId}>`
          : 'Not set',
      inline: true,
    },
    {
      name: 'Log Channel',
      value: logChannelId ? `<#${logChannelId}>` : config.logChannelId ? `<#${config.logChannelId}>` : 'Not set',
      inline: true,
    },
  ];

  return embedResponse(
    successEmbed('Ticket System Configured', 'Tickets are now **enabled** for this server.', fields),
  );
}

function handleDisable(guildId: string, deps: AppDeps): InteractionResponse {
  deps.repo.setGuildSetting(guildId, 'ticket_enabled', '0');
  deps.repo.logActivity(null, 'info', 'bot', `Disabled ticket system for guild ${guildId} via /ticket`);

  return embedResponse(
    successEmbed('Ticket System Disabled', 'No new tickets can be created as forum posts until re-enabled.'),
  );
}

function handleView(guildId: string, deps: AppDeps): InteractionResponse {
  const config = getTicketConfig(deps, guildId);
  const binding = deps.repo.getGuildBinding(guildId);
  const guildName = (binding?.name || '').trim() || 'this server';

  return embedResponse(
    createEmbed({
      color: EMBED_COLORS.INFO,
      title: `🎫 ${guildName} — Ticket Configuration`,
      description: config.enabled ? 'Ticket system is **enabled**.' : 'Ticket system is **disabled**.',
      fields: [
        { name: '📂 Forum Channel', value: config.categoryId ? `<#${config.categoryId}>` : 'Not set', inline: true },
        {
          name: '👮 Manager Role',
          value: config.managerRoleId ? `<@&${config.managerRoleId}>` : 'Not set',
          inline: true,
        },
        {
          name: '📜 Transcript Channel',
          value: config.transcriptChannelId ? `<#${config.transcriptChannelId}>` : 'Not set',
          inline: true,
        },
        { name: '📋 Log Channel', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Not set', inline: true },
        { name: '👋 Ticket Welcome', value: config.welcomeMessage.slice(0, 256), inline: false },
      ],
      footer: { text: `${appDisplayName(deps)} • /ticket view` },
    }),
  );
}

async function handleCreate(
  interaction: DiscordInteraction,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const config = getTicketConfig(deps, guildId);
  if (!config.enabled) {
    return errorResponse('Tickets Disabled', 'The ticket system is disabled on this server. Contact a server admin.');
  }
  if (!config.categoryId) {
    return errorResponse('No Ticket Forum', 'A forum channel is not configured. Run `/ticket setup` first.');
  }

  const reason = String(options.find((o) => o.name === 'reason')?.value ?? '').trim();
  if (!reason) {
    return ticketHelp();
  }

  const userId = interaction.member?.user?.id || interaction.user?.id || '0';
  const username = interaction.member?.user?.global_name || interaction.member?.user?.username || 'User';

  const safeBase = reason.length > 25 ? `${reason.slice(0, 25).trimEnd()}…` : reason;
  const threadName = `ticket-${username.replace(/[^a-zA-Z0-9-_]/g, '')}-${safeBase}`
    .replace(/\s+/g, '-')
    .slice(0, MAX_TICKET_NAME);

  try {
    const thread = await rest.createForumThread(config.categoryId, {
      name: threadName,
      message: {
        content: `🎫 **Ticket #${threadName}**\n\n**Opened by:** <@${userId}>\n**Reason:** ${reason}`,
      },
      autoArchiveDuration: 4320,
    });

    if (config.managerRoleId) {
      await rest.sendChannelMessage(thread.id, {
        content: `${config.welcomeMessage}\n\n👮 <@&${config.managerRoleId}>`,
      });
    }

    if (config.logChannelId) {
      await rest.sendChannelMessage(config.logChannelId, {
        embeds: [
          createEmbed({
            color: EMBED_COLORS.SUCCESS,
            title: '🎫 Ticket Created',
            description: `**User:** <@${userId}>\n**Thread:** <#${thread.id}>\n**Reason:** ${reason}`,
            timestamp: new Date().toISOString(),
          }),
        ],
      });
    }

    deps.repo.logActivity(null, 'info', 'bot', `Ticket created (${thread.id}) for guild ${guildId} via /ticket`);
    return embedResponse(successEmbed('Ticket Created', `Your ticket is ready: <#${thread.id}>`));
  } catch (err) {
    return errorResponse('Ticket Creation Failed', (err as Error).message);
  }
}

async function handleClose(
  interaction: DiscordInteraction,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const channelId = interaction.channel_id;
  const reason = String(options.find((o) => o.name === 'reason')?.value ?? '').trim();

  if (!channelId) {
    return errorResponse('No Channel', 'This command must be run inside a ticket thread.');
  }

  const config = getTicketConfig(deps, guildId);

  try {
    if (config.transcriptChannelId) {
      const transcript = await buildTranscript(rest, channelId);
      if (transcript) {
        await rest.sendChannelMessage(config.transcriptChannelId, {
          embeds: [
            createEmbed({
              color: EMBED_COLORS.INFO,
              title: '🎫 Ticket Transcript',
              description: transcript.slice(0, 4000),
              footer: { text: `Closed in ${guildId}` },
              timestamp: new Date().toISOString(),
            }),
          ],
        });
      }
    }

    await rest.archiveThread(channelId);

    if (config.logChannelId) {
      const userId = interaction.member?.user?.id || interaction.user?.id || '0';
      await rest.sendChannelMessage(config.logChannelId, {
        embeds: [
          createEmbed({
            color: EMBED_COLORS.INFO,
            title: '🎫 Ticket Closed',
            description: `**Thread:** <#${channelId}>\n**Closed by:** <@${userId}>${reason ? `\n**Reason:** ${reason}` : ''}`,
            timestamp: new Date().toISOString(),
          }),
        ],
      });
    }

    deps.repo.logActivity(null, 'info', 'bot', `Ticket closed (${channelId}) for guild ${guildId} via /ticket`);
    return embedResponse(successEmbed('Ticket Closed', `Ticket <#${channelId}> has been archived and locked.`));
  } catch (err) {
    return errorResponse('Close Failed', (err as Error).message);
  }
}

async function handleAdd(
  interaction: DiscordInteraction,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const channelId = interaction.channel_id;
  const targetUserId = String(options.find((o) => o.name === 'user')?.value ?? '').trim();

  if (!channelId || !targetUserId) {
    return errorResponse('Usage', 'Run this command inside a ticket thread with `user:<member>`.');
  }

  try {
    await rest.addThreadMember(channelId, targetUserId);
    deps.repo.logActivity(null, 'info', 'bot', `Added ${targetUserId} to ticket ${channelId} via /ticket`);
    return embedResponse(successEmbed('Member Added', `<@${targetUserId}> was added to this ticket.`));
  } catch (err) {
    return errorResponse('Add Failed', (err as Error).message);
  }
}

async function handleRemove(
  interaction: DiscordInteraction,
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const channelId = interaction.channel_id;
  const targetUserId = String(options.find((o) => o.name === 'user')?.value ?? '').trim();

  if (!channelId || !targetUserId) {
    return errorResponse('Usage', 'Run this command inside a ticket thread with `user:<member>`.');
  }

  try {
    await rest.removeThreadMember(channelId, targetUserId);
    deps.repo.logActivity(null, 'info', 'bot', `Removed ${targetUserId} from ticket ${channelId} via /ticket`);
    return embedResponse(successEmbed('Member Removed', `<@${targetUserId}> was removed from this ticket.`));
  } catch (err) {
    return errorResponse('Remove Failed', (err as Error).message);
  }
}

async function handleClaim(
  interaction: DiscordInteraction,
  guildId: string,
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const channelId = interaction.channel_id;
  if (!channelId) {
    return errorResponse('No Channel', 'Run this command inside a ticket thread.');
  }

  const userId = interaction.member?.user?.id || interaction.user?.id || '0';

  try {
    await rest.sendChannelMessage(channelId, {
      content: `👮 <@${userId}> claimed this ticket.`,
    });
    deps.repo.logActivity(null, 'info', 'bot', `Ticket ${channelId} claimed by ${userId} via /ticket`);
    return embedResponse(successEmbed('Ticket Claimed', 'This ticket has been claimed.'));
  } catch (err) {
    return errorResponse('Claim Failed', (err as Error).message);
  }
}

async function handleTranscript(
  interaction: DiscordInteraction,
  guildId: string,
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const channelId = interaction.channel_id;
  if (!channelId) {
    return errorResponse('No Channel', 'Run this command inside a ticket thread.');
  }

  try {
    const transcript = await buildTranscript(rest, channelId);
    if (!transcript) {
      return embedResponse(
        createEmbed({
          color: EMBED_COLORS.WARNING,
          title: '⚠️ Empty Transcript',
          description: 'No messages were found in this thread.',
        }),
      );
    }

    deps.repo.logActivity(null, 'info', 'bot', `Transcript generated for ticket ${channelId} via /ticket`);
    return embedResponse(
      createEmbed({
        color: EMBED_COLORS.SUCCESS,
        title: '🎫 Ticket Transcript',
        description: transcript.slice(0, 4000),
        footer: { text: `Ticket ${channelId}` },
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (err) {
    return errorResponse('Transcript Failed', (err as Error).message);
  }
}

async function buildTranscript(rest: DiscordRestClient, channelId: string): Promise<string | null> {
  try {
    const messages = await rest.getChannelMessages(channelId, 50);
    if (messages.length === 0) return null;

    const lines = messages
      .slice()
      .reverse()
      .map((m) => {
        const author = m.author?.username ?? 'unknown';
        const date = new Date(m.timestamp).toLocaleString();
        const content = (m.content || '(no text content)').replace(/`/g, "'");
        return `${date} — ${author}:\n${content}`;
      });

    return lines.join('\n\n');
  } catch {
    return '⚠️ Could not fetch messages. Check that the bot can read the ticket thread.';
  }
}
