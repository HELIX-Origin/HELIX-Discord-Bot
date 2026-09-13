import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../types.js';
import { commandHelpResponse } from '../handlers/embeds.js';

export const welcomeCommandDef: ApplicationCommand = {
  name: 'welcome',
  description: 'Configure welcome system for new members',
  default_member_permissions: '8',
  dm_permission: false,
  options: [
    {
      name: 'channel',
      description: 'Set the welcome channel',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'channel',
          description: 'Channel to send welcome messages',
          type: ApplicationCommandOptionType.CHANNEL,
          required: true,
          channel_types: [0, 5],
        },
      ],
    },
    {
      name: 'message',
      description: 'Set the welcome message template',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'content',
          description: 'Welcome message (supports {user}, {server}, {membercount}, {mention})',
          type: ApplicationCommandOptionType.STRING,
          required: true,
        },
        {
          name: 'embed',
          description: 'Use embed format',
          type: ApplicationCommandOptionType.BOOLEAN,
          required: false,
        },
        {
          name: 'color',
          description: 'Embed color (hex, e.g. #06b6d4)',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'thumbnail',
          description: 'Show user avatar as thumbnail',
          type: ApplicationCommandOptionType.BOOLEAN,
          required: false,
        },
        {
          name: 'banner',
          description: 'Banner image URL for embed',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
    {
      name: 'disable',
      description: 'Disable the welcome system',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'view',
      description: 'View current welcome configuration',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'test',
      description: 'Send a test welcome message',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
  ],
};

export async function handleWelcomeCommand(
  interaction: DiscordInteraction,
  _deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const subCommand = interaction.data?.options?.[0];
  if (!subCommand) {
    return commandHelpResponse({
      name: 'welcome',
      description: 'Configure welcome system for new members with embed support',
      subcommands: [
        { name: 'channel', description: 'Set the welcome channel', options: [] },
        { name: 'message', description: 'Set the welcome message template', options: [] },
        { name: 'disable', description: 'Disable the welcome system', options: [] },
        { name: 'view', description: 'View current welcome configuration', options: [] },
        { name: 'test', description: 'Send a test welcome message', options: [] },
      ],
      examples: [
        '/welcome channel channel:#welcome',
        '/welcome message content:"Welcome {user} to {server}!" embed:True color:#06b6d4',
        '/welcome test',
        '/welcome view',
        '/welcome disable',
      ],
    });
  }
  // TODO: Implement full welcome system when guild settings infrastructure is ready
  return commandHelpResponse({
    name: 'welcome',
    description: 'Configure welcome system for new members with embed support',
    subcommands: [
      { name: 'channel', description: 'Set the welcome channel', options: [] },
      { name: 'message', description: 'Set the welcome message template', options: [] },
      { name: 'disable', description: 'Disable the welcome system', options: [] },
      { name: 'view', description: 'View current welcome configuration', options: [] },
      { name: 'test', description: 'Send a test welcome message', options: [] },
    ],
    examples: [
      '/welcome channel channel:#welcome',
      '/welcome message content:"Welcome {user} to {server}!" embed:True color:#06b6d4',
      '/welcome test',
      '/welcome view',
      '/welcome disable',
    ],
  });
}
