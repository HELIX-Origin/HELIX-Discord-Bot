import { describe, it, expect } from 'vitest';
import {
  handleTicketCommand,
  getTicketConfig,
  sendTicketButtonMessage,
  DEFAULT_TICKET_MESSAGE,
  TICKET_OPEN_BUTTON_ID,
} from '../../../src/bot/commands/admin/ticket.js';
import { ticketOptions, TICKET_ACTIONS } from '../../../src/bot/lib/options/ticket.js';
import type { AppDeps } from '../../../src/app.js';
import type { DiscordRestClient } from '../../../src/bot/rest.js';
import { ApplicationCommandOptionType, type DiscordInteraction } from '../../../src/bot/utils/types.js';

function makeDeps(initialSettings: Record<string, string> = {}): {
  deps: AppDeps;
  settings: Record<string, string>;
  sentMessages: { channelId: string; payload: unknown }[];
  rest: DiscordRestClient;
} {
  const settings: Record<string, string> = { ...initialSettings };
  const sentMessages: { channelId: string; payload: unknown }[] = [];

  const rest = {
    sendChannelMessage: async (channelId: string, payload: unknown) => {
      sentMessages.push({ channelId, payload });
      return { id: 'msg-1' };
    },
    createThread: async (channelId: string, payload: unknown) => {
      return { id: 'th-99', name: (payload as { name: string }).name, type: 12 };
    },
    addThreadMember: async () => {},
    addThreadRole: async () => {},
  } as unknown as DiscordRestClient;

  const deps = {
    config: {
      features: { administrationEnabled: true },
    },
    repo: {
      getGuildSetting(guildId: string, key: string) {
        return settings[`${guildId}:${key}`] ?? null;
      },
      setGuildSetting(guildId: string, key: string, val: string) {
        settings[`${guildId}:${key}`] = val;
      },
      logActivity: () => {},
      getGuildBinding: () => ({ name: 'Test Guild' }),
    },
    bot: {
      getAppName: () => 'HELIX Bot',
      rest,
    },
  } as unknown as AppDeps;

  return { deps, settings, sentMessages, rest };
}

function makeInteraction(options: { name: string; value?: string | number | boolean }[] = []): DiscordInteraction {
  return {
    id: 'int-1',
    application_id: 'app-1',
    type: 2,
    token: 'tok-1',
    version: 1,
    guild_id: 'guild-123',
    member: {
      user: { id: 'user-1', username: 'tester', global_name: 'Tester' },
      permissions: '8',
    },
    data: {
      id: 'cmd-1',
      type: 1,
      name: 'ticket',
      options: options.map((o) => ({
        type: ApplicationCommandOptionType.STRING,
        ...o,
      })),
    },
  };
}

describe('ticketOptions', () => {
  it('exports valid options and actions from options file', () => {
    expect(ticketOptions).toBeDefined();
    expect(TICKET_ACTIONS).toContain('setup');
    expect(TICKET_ACTIONS).toContain('disable');
    expect(TICKET_ACTIONS).toContain('view');
    expect(TICKET_ACTIONS).toContain('create');
  });

  it('contains message option representing the button-hosting message', () => {
    const msgOpt = ticketOptions.find((o) => o.name === 'message');
    expect(msgOpt).toBeDefined();
    expect(msgOpt?.description).toContain('hosting the Open Ticket button');
  });
});

describe('handleTicketCommand — Setup & Ticket Message', () => {
  it('posts the ticket message with button component to the ticket channel on setup', async () => {
    const { deps, settings, sentMessages, rest } = makeDeps();
    const interaction = makeInteraction([
      { name: 'action', value: 'setup' },
      { name: 'channel', value: 'channel-tickets' },
      { name: 'manager_role', value: 'role-mgr' },
      { name: 'message', value: 'Need help? Click below to open a ticket.' },
    ]);

    const res = await handleTicketCommand(interaction, deps, rest);
    expect(res.data?.embeds?.[0].title).toContain('Ticket System Configured');
    expect(settings['guild-123:ticket_channel_id']).toBe('channel-tickets');
    expect(settings['guild-123:ticket_manager_role_id']).toBe('role-mgr');
    expect(settings['guild-123:ticket_message']).toBe('Need help? Click below to open a ticket.');

    // Verify button message was sent to the ticket channel
    expect(sentMessages.length).toBe(1);
    expect(sentMessages[0].channelId).toBe('channel-tickets');
    const payload = sentMessages[0].payload as { content: string; components: { components: { custom_id: string }[] }[] };
    expect(payload.content).toBe('Need help? Click below to open a ticket.');
    expect(payload.components[0].components[0].custom_id).toBe(TICKET_OPEN_BUTTON_ID);
  });

  it('displays Ticket Message in /ticket action:view', async () => {
    const { deps, rest } = makeDeps({
      'guild-123:ticket_channel_id': 'channel-tickets',
      'guild-123:ticket_manager_role_id': 'role-mgr',
      'guild-123:ticket_message': 'Custom ticket button header',
      'guild-123:ticket_enabled': '1',
    });
    const interaction = makeInteraction([{ name: 'action', value: 'view' }]);

    const res = await handleTicketCommand(interaction, deps, rest);
    const embed = res.data?.embeds?.[0];
    expect(embed?.title).toContain('Ticket Configuration');
    const msgField = embed?.fields?.find((f) => f.name.includes('Ticket Message'));
    expect(msgField).toBeDefined();
    expect(msgField?.value).toContain('Custom ticket button header');
  });

  it('creates ticket thread without sending duplicate welcome message', async () => {
    const { deps, sentMessages, rest } = makeDeps({
      'guild-123:ticket_channel_id': 'channel-tickets',
      'guild-123:ticket_manager_role_id': 'role-mgr',
      'guild-123:ticket_message': 'Custom button message',
      'guild-123:ticket_enabled': '1',
    });
    const interaction = makeInteraction([
      { name: 'action', value: 'create' },
      { name: 'reason', value: 'Help with billing' },
    ]);

    const res = await handleTicketCommand(interaction, deps, rest);
    expect(res.data?.embeds?.[0].title).toContain('Ticket Created');

    // Only one opening prompt message sent into the thread (no separate welcome message)
    const threadMessages = sentMessages.filter((m) => m.channelId === 'th-99');
    expect(threadMessages.length).toBe(1);
    const content = (threadMessages[0].payload as { content: string }).content;
    expect(content).toContain('Opened by:');
    expect(content).toContain('Help with billing');
    expect(content).toContain('A support agent will be with you shortly');
  });

  it('sendTicketButtonMessage utility sends button component with default text when none given', async () => {
    const sent: { channelId: string; payload: unknown }[] = [];
    const mockRest = {
      sendChannelMessage: async (channelId: string, payload: unknown) => {
        sent.push({ channelId, payload });
      },
    } as unknown as DiscordRestClient;

    await sendTicketButtonMessage(mockRest, 'chan-123');
    expect(sent.length).toBe(1);
    expect(sent[0].channelId).toBe('chan-123');
    const payload = sent[0].payload as { content: string; components: { components: { custom_id: string }[] }[] };
    expect(payload.content).toBe(DEFAULT_TICKET_MESSAGE);
    expect(payload.components[0].components[0].custom_id).toBe(TICKET_OPEN_BUTTON_ID);
  });
});
