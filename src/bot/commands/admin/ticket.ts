import { appDisplayName, type AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type ApplicationCommandOption,
  type DiscordEmbed,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { createEmbed, EMBED_COLORS, successEmbed } from '../../utils/embeds.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';

export const TICKET_ACTIONS = [
  'setup',
  'disable',
  'view',
  'create',
  'close',
  'add',
  'remove',
  'claim',
  'transcript',
] as const;
export type TicketAction = (typeof TICKET_ACTIONS)[number];

export const ticketOptions: ApplicationCommandOption[] = [
  {
    name: 'action',
    description: 'What to do',
    type: ApplicationCommandOptionType.STRING,
    required: true,
    choices: [
      { name: 'Configure the ticket system', value: 'setup' },
      { name: 'Disable the ticket system', value: 'disable' },
      { name: 'View current configuration', value: 'view' },
      { name: 'Create a support ticket', value: 'create' },
      { name: 'Close the current ticket', value: 'close' },
      { name: 'Add a user to the ticket', value: 'add' },
      { name: 'Remove a user from the ticket', value: 'remove' },
      { name: 'Claim the ticket', value: 'claim' },
      { name: 'Generate a transcript', value: 'transcript' },
    ],
  },
  {
    name: 'manager_role',
    description: 'Role that can manage tickets (setup)',
    type: ApplicationCommandOptionType.ROLE,
    required: false,
  },
  {
    name: 'category',
    description: 'Forum channel for tickets (setup)',
    type: ApplicationCommandOptionType.CHANNEL,
    required: false,
    channel_types: [15],
  },
  {
    name: 'transcript_channel',
    description: 'Channel for ticket transcripts (setup)',
    type: ApplicationCommandOptionType.CHANNEL,
    required: false,
    channel_types: [0, 5],
  },
  {
    name: 'log_channel',
    description: 'Channel for ticket logs (setup)',
    type: ApplicationCommandOptionType.CHANNEL,
    required: false,
    channel_types: [0, 5],
  },
  {
    name: 'welcome_message',
    description: 'Message shown when a ticket is created (setup)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
  {
    name: 'reason',
    description: 'Reason for creating or closing the ticket (create / close)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
  {
    name: 'user',
    description: 'User to add or remove from the ticket (add / remove)',
    type: ApplicationCommandOptionType.USER,
    required: false,
  },
];

export const ticketCommandDef: ApplicationCommand = {
  name: 'ticket',
  description: 'Manage support ticket system',
  default_member_permissions: '8',
  dm_permission: false,
  options: ticketOptions,
};

function optionRaw(options: InteractionOption[], name: string): unknown {
  return options.find((o) => o.name === name)?.value;
}

function optionValue(options: InteractionOption[], name: string): string {
  return String(optionRaw(options, name) ?? '').trim();
}

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

  const options = interaction.data?.options ?? [];

  switch (optionValue(options, 'action')) {
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
      return ticketUsage();
  }
}

function ticketUsage(): InteractionResponse {
  return embedResponse(
    createEmbed({
      color: EMBED_COLORS.INFO,
      title: '🎫 Ticket Command Usage',
      description: 'Use `/ticket` with one of the actions below.',
      fields: [
        { name: '⚙️ setup', value: '`/ticket action:setup manager_role:@Support category:#tickets`', inline: false },
        { name: '🎟️ create', value: '`/ticket action:create reason:"Need help"`', inline: false },
        { name: '🔒 close', value: '`/ticket action:close reason:"Resolved"`', inline: false },
        { name: '➕ add / ➖ remove', value: '`/ticket action:add user:@user`', inline: false },
        { name: '📜 claim / transcript · 👁️ view · 🚫 disable', value: '`/ticket action:transcript`', inline: false },
      ],
    }),
  );
}

function handleSetup(guildId: string, options: InteractionOption[], deps: AppDeps): InteractionResponse {
  const categoryId = optionValue(options, 'category') || undefined;
  const managerRoleId = optionValue(options, 'manager_role');
  const transcriptChannelId = optionValue(options, 'transcript_channel') || undefined;
  const logChannelId = optionValue(options, 'log_channel') || undefined;
  const welcomeMessage = optionValue(options, 'welcome_message') || undefined;

  if (!managerRoleId) {
    return ticketUsage();
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
    return errorResponse('No Ticket Forum', 'A forum channel is not configured. Run `/ticket action:setup` first.');
  }

  const reason = optionValue(options, 'reason');
  if (!reason) {
    return ticketUsage();
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
  const reason = optionValue(options, 'reason');

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
  const targetUserId = optionValue(options, 'user');

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
  const targetUserId = optionValue(options, 'user');

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

registerCommandMetadata({
  name: 'ticket',
  description: 'Manage support ticket system',
  category: 'admin',
  emoji: '🛡️',
  usage: '/ticket <action> [options]',
  options: [
    {
      name: 'action',
      description: 'What to do',
      type: 3,
      required: true,
      choices: [
        { name: 'Configure the ticket system', value: 'setup' },
        { name: 'Disable the ticket system', value: 'disable' },
        { name: 'View current configuration', value: 'view' },
        { name: 'Create a support ticket', value: 'create' },
        { name: 'Close the current ticket', value: 'close' },
        { name: 'Add a user to the ticket', value: 'add' },
        { name: 'Remove a user from the ticket', value: 'remove' },
        { name: 'Claim the ticket', value: 'claim' },
        { name: 'Generate a transcript', value: 'transcript' },
      ],
    },
    { name: 'manager_role', description: 'Role that can manage tickets (setup)', type: 8, required: false },
    {
      name: 'category',
      description: 'Forum channel for tickets (setup)',
      type: 7,
      required: false,
      channel_types: [15],
    },
    {
      name: 'transcript_channel',
      description: 'Channel for ticket transcripts (setup)',
      type: 7,
      required: false,
      channel_types: [0, 5],
    },
    {
      name: 'log_channel',
      description: 'Channel for ticket logs (setup)',
      type: 7,
      required: false,
      channel_types: [0, 5],
    },
    {
      name: 'welcome_message',
      description: 'Message shown when a ticket is created (setup)',
      type: 3,
      required: false,
    },
    {
      name: 'reason',
      description: 'Reason for creating or closing the ticket (create / close)',
      type: 3,
      required: false,
    },
    { name: 'user', description: 'User to add or remove from the ticket (add / remove)', type: 6, required: false },
  ],
  examples: [
    '/ticket action:setup manager_role:@Support category:#tickets',
    '/ticket action:create reason:"Need help with feeds"',
    '/ticket action:close reason:"Issue resolved"',
    '/ticket action:add user:@user',
    '/ticket action:transcript',
  ],
});

export const ticketCommand: BotCommand = {
  def: ticketCommandDef,
  category: 'admin',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleTicketCommand,
};
