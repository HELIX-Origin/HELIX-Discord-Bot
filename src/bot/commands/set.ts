import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionResponse,
} from '../types.js';
import { commandHelpResponse } from '../handlers/embeds.js';

export const setCommandDef: ApplicationCommand = {
  name: 'set',
  description: 'Configure guild settings (channels, roles, permissions, features)',
  default_member_permissions: '8',
  dm_permission: false,
  options: [
    {
      name: 'channel',
      description: 'Set delivery channel for a feed category',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'category',
          description: 'Feed category',
          type: ApplicationCommandOptionType.STRING,
          required: true,
          choices: [
            { name: 'RSS/Atom Feeds', value: 'rss' },
            { name: 'Reddit Feeds', value: 'reddit' },
            { name: 'Free Games', value: 'freegames' },
            { name: 'Stream Alerts (YouTube/Twitch)', value: 'streamalerts' },
          ],
        },
        {
          name: 'channel',
          description: 'Target Discord text/announcement channel',
          type: ApplicationCommandOptionType.CHANNEL,
          required: true,
          channel_types: [0, 5],
        },
        {
          name: 'thread_channel',
          description: 'Optional forum channel for thread delivery',
          type: ApplicationCommandOptionType.CHANNEL,
          required: false,
          channel_types: [15],
        },
      ],
    },
    {
      name: 'role',
      description: 'Configure role-based permissions',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'dj',
          description: 'Set the DJ role for music commands',
          type: ApplicationCommandOptionType.ROLE,
          required: false,
        },
        {
          name: 'admin',
          description: 'Set a role that can manage feeds and bot settings',
          type: ApplicationCommandOptionType.ROLE,
          required: false,
        },
        {
          name: 'clear',
          description: 'Remove a configured role',
          type: ApplicationCommandOptionType.STRING,
          required: false,
          choices: [
            { name: 'DJ Role', value: 'dj' },
            { name: 'Admin Role', value: 'admin' },
          ],
        },
      ],
    },
    {
      name: 'feature',
      description: 'Enable or disable features for this guild',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'name',
          description: 'Feature to toggle',
          type: ApplicationCommandOptionType.STRING,
          required: true,
          choices: [
            { name: 'Feeds (RSS/Reddit/Free Games)', value: 'feeds' },
            { name: 'Stream Alerts (YouTube/Twitch)', value: 'streamalerts' },
            { name: 'Thread Delivery', value: 'threads' },
            { name: 'Music (Lavalink)', value: 'music' },
            { name: 'GIF Commands', value: 'gifs' },
          ],
        },
        {
          name: 'enabled',
          description: 'Enable or disable the feature',
          type: ApplicationCommandOptionType.BOOLEAN,
          required: true,
        },
      ],
    },
    {
      name: 'prefix',
      description: 'Set a custom command prefix for this guild',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'value',
          description: 'Prefix string (e.g. "!", "?", ".") - empty to reset',
          type: ApplicationCommandOptionType.STRING,
          required: false,
        },
      ],
    },
    {
      name: 'view',
      description: 'View current guild configuration',
      type: ApplicationCommandOptionType.SUB_COMMAND,
    },
    {
      name: 'reset',
      description: 'Reset a setting to default',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'target',
          description: 'What to reset',
          type: ApplicationCommandOptionType.STRING,
          required: true,
          choices: [
            { name: 'All Channels', value: 'channels' },
            { name: 'All Roles', value: 'roles' },
            { name: 'All Features', value: 'features' },
            { name: 'Prefix', value: 'prefix' },
            { name: 'Everything', value: 'all' },
          ],
        },
      ],
    },
  ],
};

export async function handleSetCommand(
  interaction: DiscordInteraction,
  _deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const subCommand = interaction.data?.options?.[0];
  if (!subCommand) {
    return commandHelpResponse({
      name: 'set',
      description: 'Configure guild settings (channels, roles, permissions, features)',
      subcommands: [
        { name: 'channel', description: 'Set delivery channel for a feed category', options: [] },
        { name: 'role', description: 'Configure role-based permissions', options: [] },
        { name: 'feature', description: 'Enable/disable features for this guild', options: [] },
        { name: 'prefix', description: 'Set custom command prefix', options: [] },
        { name: 'view', description: 'View current guild configuration', options: [] },
        { name: 'reset', description: 'Reset a setting to default', options: [] },
      ],
      examples: [
        '/set channel category:rss channel:#news',
        '/set role dj:@MusicRole',
        '/set feature name:music enabled:True',
        '/set prefix value:!',
        '/set view',
        '/set reset target:channels',
      ],
    });
  }
  // TODO: Implement full set command when guild settings infrastructure is ready
  return commandHelpResponse({
    name: 'set',
    description: 'Configure guild settings (channels, roles, permissions, features)',
    subcommands: [
      { name: 'channel', description: 'Set delivery channel for a feed category', options: [] },
      { name: 'role', description: 'Configure role-based permissions', options: [] },
      { name: 'feature', description: 'Enable/disable features for this guild', options: [] },
      { name: 'prefix', description: 'Set custom command prefix', options: [] },
      { name: 'view', description: 'View current guild configuration', options: [] },
      { name: 'reset', description: 'Reset a setting to default', options: [] },
    ],
    examples: [
      '/set channel category:rss channel:#news',
      '/set role dj:@MusicRole',
      '/set feature name:music enabled:True',
      '/set prefix value:!',
      '/set view',
      '/set reset target:channels',
    ],
  });
}
