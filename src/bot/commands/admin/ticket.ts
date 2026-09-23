import { appDisplayName, type AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  type ApplicationCommand,
  type DiscordEmbed,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { createEmbed, EMBED_COLORS, successEmbed } from '../../utils/embeds.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';
import { dispatchAuditLog } from '../../lib/admin/auditlog.js';

import { ticketOptions, TICKET_ACTIONS, type TicketAction } from '../../lib/options/ticket.js';
export { ticketOptions, TICKET_ACTIONS, type TicketAction };

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

export const DEFAULT_TICKET_MESSAGE = '🎫 Click the button below to open a support ticket.';

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

function parseHexColor(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return parseInt(cleaned, 16);
}

export interface TicketConfig {
  channelId: string | null;
  managerRoleId: string | null;
  transcriptChannelId: string | null;
  logChannelId: string | null;
  ticketMessage: string;
  welcomeMessage: string;
  embed: boolean;
  color: number | null;
  enabled: boolean;
}

export function getTicketConfig(deps: AppDeps, guildId: string): TicketConfig {
  // Read the new text-channel key with fallback to the legacy forum key.
  const channelId =
    deps.repo.getGuildSetting(guildId, 'ticket_channel_id') ||
    deps.repo.getGuildSetting(guildId, 'ticket_category_id') ||
    null;
  const ticketMessage =
    deps.repo.getGuildSetting(guildId, 'ticket_message') ||
    deps.repo.getGuildSetting(guildId, 'ticket_welcome_message') ||
    DEFAULT_TICKET_MESSAGE;
  const rawColor = deps.repo.getGuildSetting(guildId, 'ticket_color');
  return {
    channelId,
    managerRoleId: deps.repo.getGuildSetting(guildId, 'ticket_manager_role_id') || null,
    transcriptChannelId: deps.repo.getGuildSetting(guildId, 'ticket_transcript_channel_id') || null,
    logChannelId: deps.repo.getGuildSetting(guildId, 'ticket_log_channel_id') || null,
    ticketMessage,
    welcomeMessage: ticketMessage,
    embed: deps.repo.getGuildSetting(guildId, 'ticket_embed') === '1',
    color: parseHexColor(rawColor ?? undefined),
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
      return handleSetup(guildId, options, deps, rest);
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
        { name: '⚙️ setup', value: '`/ticket action:setup manager_role:@Support channel:#tickets`', inline: false },
        { name: '🎟️ create', value: '`/ticket action:create reason:"Need help"`', inline: false },
        { name: '🔒 close', value: '`/ticket action:close reason:"Resolved"`', inline: false },
        { name: '➕ add / ➖ remove', value: '`/ticket action:add user:@user`', inline: false },
        { name: '📜 claim / transcript · 👁️ view · 🚫 disable', value: '`/ticket action:transcript`', inline: false },
      ],
    }),
  );
}

export const TICKET_OPEN_BUTTON_ID = 'ticket_open';

/** Sends or updates the message hosting the Open Ticket button in the configured ticket channel. */
export async function sendTicketButtonMessage(
  rest: DiscordRestClient,
  channelId: string,
  content: string = DEFAULT_TICKET_MESSAGE,
  options?: {
    embed?: boolean;
    color?: number | null;
    title?: string;
  },
): Promise<void> {
  const isEmbed = Boolean(options?.embed);
  const color = options?.color ?? EMBED_COLORS.INFO;
  const payload: { content?: string; embeds?: DiscordEmbed[]; components: unknown[] } = {
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            label: 'Open Ticket',
            custom_id: TICKET_OPEN_BUTTON_ID,
          },
        ],
      },
    ],
  };

  if (isEmbed) {
    payload.embeds = [
      createEmbed({
        title: options?.title || '🎫 Support Tickets',
        description: content || DEFAULT_TICKET_MESSAGE,
        color: color ?? EMBED_COLORS.INFO,
      }),
    ];
  } else {
    payload.content = content || DEFAULT_TICKET_MESSAGE;
  }

  await rest.sendChannelMessage(channelId, payload);
}

async function handleSetup(
  guildId: string,
  options: InteractionOption[],
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const channelId = optionValue(options, 'channel') || undefined;
  const managerRoleId = optionValue(options, 'manager_role');
  const transcriptChannelId = optionValue(options, 'transcript_channel') || undefined;
  const logChannelId = optionValue(options, 'log_channel') || undefined;
  const ticketMessage = optionValue(options, 'message') || optionValue(options, 'welcome_message') || undefined;
  const embedOption = optionRaw(options, 'embed');
  const embed = typeof embedOption === 'boolean' ? embedOption : undefined;
  const color = optionValue(options, 'color') || undefined;

  if (!managerRoleId) {
    return ticketUsage();
  }

  const config = getTicketConfig(deps, guildId);

  if (channelId) {
    deps.repo.setGuildSetting(guildId, 'ticket_channel_id', channelId);
    deps.repo.setGuildSetting(guildId, 'ticket_category_id', '');
  }
  deps.repo.setGuildSetting(guildId, 'ticket_manager_role_id', managerRoleId);
  if (transcriptChannelId) deps.repo.setGuildSetting(guildId, 'ticket_transcript_channel_id', transcriptChannelId);
  if (logChannelId) deps.repo.setGuildSetting(guildId, 'ticket_log_channel_id', logChannelId);
  if (ticketMessage) {
    deps.repo.setGuildSetting(guildId, 'ticket_message', ticketMessage);
    deps.repo.setGuildSetting(guildId, 'ticket_welcome_message', ticketMessage);
  }
  if (embed !== undefined) {
    deps.repo.setGuildSetting(guildId, 'ticket_embed', embed ? '1' : '0');
  }
  if (color) {
    deps.repo.setGuildSetting(guildId, 'ticket_color', color);
  }
  deps.repo.setGuildSetting(guildId, 'ticket_enabled', '1');

  deps.repo.logActivity(null, 'info', 'bot', `Configured ticket system for guild ${guildId} via /ticket`);

  void dispatchAuditLog(
    guildId,
    {
      event: 'tickets',
      message: 'Ticket system configured and enabled.',
      guildName: undefined,
      actorId: null,
      actorTag: null,
    },
    deps,
  );

  const isEmbed = embed !== undefined ? embed : config.embed;
  const parsedColor = color ? parseHexColor(color) : config.color;

  let buttonError: string | null = null;
  const targetChannel = channelId || config.channelId;
  const msgContent = ticketMessage || config.ticketMessage || DEFAULT_TICKET_MESSAGE;
  if (targetChannel && (channelId || ticketMessage || embed !== undefined || color)) {
    try {
      await sendTicketButtonMessage(rest, targetChannel, msgContent, {
        embed: isEmbed,
        color: parsedColor,
      });
    } catch (err) {
      buttonError = (err as Error).message;
    }
  }

  const activeChannel = channelId || config.channelId;
  const fields = [
    {
      name: 'Ticket Channel',
      value: activeChannel ? `<#${activeChannel}>` : 'Not set',
      inline: true,
    },
    { name: 'Manager Role', value: `<@&${managerRoleId}>`, inline: true },
    {
      name: 'Format',
      value: isEmbed ? 'Embed' : 'Plain text',
      inline: true,
    },
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

  if (buttonError) {
    fields.push({
      name: '⚠️ Button Message',
      value: `Settings saved, but the button message could not be posted: ${buttonError.slice(0, 500)}`,
      inline: false,
    });
  }

  return embedResponse(
    successEmbed('Ticket System Configured', 'Tickets are now **enabled** for this server.', fields),
  );
}

function handleDisable(guildId: string, deps: AppDeps): InteractionResponse {
  deps.repo.setGuildSetting(guildId, 'ticket_enabled', '0');
  deps.repo.logActivity(null, 'info', 'bot', `Disabled ticket system for guild ${guildId} via /ticket`);

  void dispatchAuditLog(
    guildId,
    { event: 'tickets', message: 'Ticket system disabled.', guildName: undefined, actorId: null, actorTag: null },
    deps,
  );

  return embedResponse(
    successEmbed('Ticket System Disabled', 'No new tickets can be opened as threads until re-enabled.'),
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
        { name: '📂 Ticket Channel', value: config.channelId ? `<#${config.channelId}>` : 'Not set', inline: true },
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
        { name: '🎨 Format', value: config.embed ? 'Embed' : 'Plain text', inline: true },
        { name: '🎫 Ticket Message', value: config.ticketMessage.slice(0, 256), inline: false },
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
  if (!config.channelId) {
    return errorResponse('No Ticket Channel', 'A ticket channel is not configured. Run `/ticket action:setup` first.');
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
    const thread = await openTicketThread(rest, config, guildId, config.channelId, threadName, userId, reason);

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
    void dispatchAuditLog(
      guildId,
      {
        event: 'tickets',
        message: `Ticket created: <#${thread.id}>.`,
        guildName: undefined,
        actorId: userId,
        actorTag: null,
      },
      deps,
    );
    return embedResponse(successEmbed('Ticket Created', `Your ticket is ready: <#${thread.id}>`));
  } catch (err) {
    return errorResponse('Ticket Creation Failed', (err as Error).message);
  }
}

/** Opens a private ticket thread in the configured text channel and adds the opener + manager role. */
async function openTicketThread(
  rest: DiscordRestClient,
  config: TicketConfig,
  _guildId: string,
  channelId: string,
  threadName: string,
  userId: string,
  reason: string,
): Promise<{ id: string; name: string; type: number }> {
  const thread = await rest.createThread(channelId, {
    name: threadName,
    privateThread: true,
    autoArchiveDuration: 4320,
  });

  await rest.addThreadMember(thread.id, userId);

  if (config.managerRoleId) {
    await rest.addThreadRole(thread.id, config.managerRoleId);
  }

  await rest.sendChannelMessage(thread.id, {
    content: `🎫 **Ticket #${threadName}**\n\n**Opened by:** <@${userId}>${reason ? `\n**Reason:** ${reason}` : ''}\n\nA support agent will be with you shortly. Please describe your issue in detail.`,
  });

  return thread;
}

/** Handles the "Open Ticket" button in the configured ticket channel. */
export async function handleTicketButton(
  interaction: DiscordInteraction,
  deps: AppDeps,
  rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return errorResponse('Server Settings Only', '`/ticket` can only be used inside a Discord server (guild).');
  }

  const config = getTicketConfig(deps, guildId);
  if (!config.enabled) {
    return errorResponse('Tickets Disabled', 'The ticket system is disabled on this server. Contact a server admin.');
  }
  if (!config.channelId) {
    return errorResponse('No Ticket Channel', 'A ticket channel is not configured. Run `/ticket action:setup` first.');
  }

  const userId = interaction.member?.user?.id || interaction.user?.id || '0';
  const username = interaction.member?.user?.global_name || interaction.member?.user?.username || 'User';

  const threadName = `ticket-${username.replace(/[^a-zA-Z0-9-_]/g, '')}-${new Date().getTime().toString(36)}`.slice(
    0,
    MAX_TICKET_NAME,
  );

  try {
    const thread = await openTicketThread(rest, config, guildId, config.channelId, threadName, userId, '');

    if (config.logChannelId) {
      await rest.sendChannelMessage(config.logChannelId, {
        embeds: [
          createEmbed({
            color: EMBED_COLORS.SUCCESS,
            title: '🎫 Ticket Created',
            description: `**User:** <@${userId}>\n**Thread:** <#${thread.id}>`,
            timestamp: new Date().toISOString(),
          }),
        ],
      });
    }

    deps.repo.logActivity(null, 'info', 'bot', `Ticket created (${thread.id}) for guild ${guildId} via button`);
    void dispatchAuditLog(
      guildId,
      {
        event: 'tickets',
        message: `Ticket created: <#${thread.id}>.`,
        guildName: undefined,
        actorId: userId,
        actorTag: null,
      },
      deps,
    );
    return {
      type: 4,
      data: {
        flags: 64,
        embeds: [successEmbed('Ticket Created', `Your ticket is ready: <#${thread.id}>`)],
      },
    };
  } catch (err) {
    return {
      type: 4,
      data: {
        flags: 64,
        embeds: [
          createEmbed({
            color: EMBED_COLORS.ERROR,
            title: '❌ Ticket Creation Failed',
            description: (err as Error).message,
          }),
        ],
      },
    };
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
    const userId = interaction.member?.user?.id || interaction.user?.id || '0';
    void dispatchAuditLog(
      guildId,
      {
        event: 'tickets',
        message: `Ticket closed and archived: <#${channelId}>.`,
        guildName: undefined,
        actorId: userId,
        actorTag: null,
      },
      deps,
    );
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
    void dispatchAuditLog(
      guildId,
      {
        event: 'tickets',
        message: `User <@${targetUserId}> added to ticket <#${channelId}>.`,
        guildName: undefined,
        actorId: null,
        actorTag: null,
      },
      deps,
    );
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
    void dispatchAuditLog(
      guildId,
      {
        event: 'tickets',
        message: `User <@${targetUserId}> removed from ticket <#${channelId}>.`,
        guildName: undefined,
        actorId: null,
        actorTag: null,
      },
      deps,
    );
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
    void dispatchAuditLog(
      guildId,
      {
        event: 'tickets',
        message: `Ticket <#${channelId}> claimed by <@${userId}>.`,
        guildName: undefined,
        actorId: userId,
        actorTag: null,
      },
      deps,
    );
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
      name: 'channel',
      description: 'Text channel that hosts the Open Ticket button (setup)',
      type: 7,
      required: false,
      channel_types: [0, 5],
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
      name: 'message',
      description: 'Message hosting the Open Ticket button in the ticket channel (setup)',
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
    '/ticket action:setup manager_role:@Support channel:#tickets',
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
