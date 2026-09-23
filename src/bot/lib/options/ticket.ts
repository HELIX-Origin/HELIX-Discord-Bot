import { ApplicationCommandOptionType, type ApplicationCommandOption } from '../../utils/types.js';

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
    name: 'channel',
    description: 'Text channel that hosts the Open Ticket button (setup)',
    type: ApplicationCommandOptionType.CHANNEL,
    required: false,
    channel_types: [0, 5],
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
    name: 'message',
    description: 'Message hosting the Open Ticket button in the ticket channel (setup)',
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
