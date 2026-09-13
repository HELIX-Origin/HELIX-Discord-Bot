import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../types.js';
import { commandHelpResponse } from '../handlers/embeds.js';

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
          name: 'category',
          description: 'Forum channel for tickets (optional)',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [15],
        },
        {
          name: 'manager_role',
          description: 'Role that can manage tickets (auto-added)',
          type: ApplicationCommandOptionType.ROLE,
          required: true,
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

export async function handleTicketCommand(
  interaction: DiscordInteraction,
  _deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const subCommand = interaction.data?.options?.[0];
  if (!subCommand) {
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
  // TODO: Implement full ticket system when infrastructure (DB tables, Discord API methods) is ready
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
