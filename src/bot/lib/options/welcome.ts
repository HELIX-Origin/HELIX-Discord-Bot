import { ApplicationCommandOptionType, type ApplicationCommandOption } from '../../utils/types.js';

export const WELCOME_ACTIONS = ['setup', 'channel', 'message', 'disable', 'view', 'test'] as const;
export type WelcomeAction = (typeof WELCOME_ACTIONS)[number];

export const welcomeOptions: ApplicationCommandOption[] = [
  {
    name: 'action',
    description: 'What to configure',
    type: ApplicationCommandOptionType.STRING,
    required: true,
    choices: [
      { name: 'Configure welcome system', value: 'setup' },
      { name: 'Set the welcome channel', value: 'channel' },
      { name: 'Set the welcome message', value: 'message' },
      { name: 'View current configuration', value: 'view' },
      { name: 'Send a test message', value: 'test' },
      { name: 'Disable the welcome system', value: 'disable' },
    ],
  },
  {
    name: 'channel',
    description: 'Channel to send welcome messages (setup / channel)',
    type: ApplicationCommandOptionType.CHANNEL,
    required: false,
    channel_types: [0, 5],
  },
  {
    name: 'content',
    description: 'Message shown to new members when they join the server ({user}, {mention}, etc.)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
  {
    name: 'embed',
    description: 'Use embed format (setup / message)',
    type: ApplicationCommandOptionType.BOOLEAN,
    required: false,
  },
  {
    name: 'color',
    description: 'Embed color hex, e.g. #06b6d4 (setup / message)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
  {
    name: 'thumbnail',
    description: 'Show user avatar as thumbnail (setup / message)',
    type: ApplicationCommandOptionType.BOOLEAN,
    required: false,
  },
  {
    name: 'banner',
    description: 'Banner image URL for embed (setup / message)',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
];
