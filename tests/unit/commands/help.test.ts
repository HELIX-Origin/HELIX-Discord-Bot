import { describe, it, expect, beforeEach } from 'vitest';
import { buildHelpPayload, help, handleHelpInteraction } from '../../../HELIX/src/commands/info/help.js';
import { registerHelp, createHelp, clearHelpRegistry } from '../../../HELIX/src/handlers/help-registrar.js';

describe('commands/info/help — buildHelpPayload & execute', () => {
  beforeEach(() => {
    clearHelpRegistry();
    registerHelp(createHelp('ping', 'Latency test', 'utility', { usage: '>ping', aliases: ['p'] }));
    registerHelp(createHelp('warn', 'Warn member', 'moderation', { usage: '>warn <user>', permissions: ['ModerateMembers'] }));
    registerHelp(createHelp('scaffold', 'Generate project', 'project', { usage: '>scaffold <template>' }));
  });

  it('renders home overview payload with fields and interactive components', () => {
    const payload = buildHelpPayload('home', '>');
    expect(payload.embeds).toHaveLength(1);
    expect(payload.components).toHaveLength(2);

    const embed = payload.embeds[0];
    const data = embed.toJSON();
    expect(data.title).toContain('Command Center');
    expect(data.fields?.length).toBeGreaterThan(0);

    // Select Menu verification
    const selectRow = payload.components[0].toJSON() as any;
    expect(selectRow.components[0].custom_id).toBe('help_category_select');
    expect(selectRow.components[0].options.length).toBeGreaterThanOrEqual(2);

    // Button Row verification
    const buttonRow = payload.components[1].toJSON() as any;
    const buttonIds = buttonRow.components.map((b: any) => b.custom_id);
    expect(buttonIds).toContain('help_btn_home');
    expect(buttonIds).toContain('help_btn_close');
  });

  it('renders category-specific payload with command syntax blocks', () => {
    const payload = buildHelpPayload('utility', '!');
    expect(payload.embeds).toHaveLength(1);

    const embed = payload.embeds[0];
    const data = embed.toJSON();
    expect(data.title).toContain('Utility Suite');
    expect(data.description).toContain('!ping');
    expect(data.description).toContain('Latency test');
    expect(data.footer?.text).toContain('Prefix: !');
  });

  it('disables select menu and buttons when disabled flag is true', () => {
    const payload = buildHelpPayload('home', '>', true);
    const selectRow = payload.components[0].toJSON() as any;
    const buttonRow = payload.components[1].toJSON() as any;

    expect(selectRow.components[0].disabled).toBe(true);
    for (const btn of buttonRow.components) {
      if (btn.custom_id) {
        expect(btn.disabled).toBe(true);
      }
    }
  });

  it('handles single command detail lookup in execute', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { id: 'user-123' },
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await help.execute({
      message: mockMessage,
      guild: { id: 'guild-1' } as any,
      args: ['warn'],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);
    const data = repliedPayload.embeds[0].toJSON();
    expect(data.title).toContain('>warn');
    expect(data.description).toContain('Warn member');
  });

  it('handles nonexistent command gracefully in execute', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { id: 'user-123' },
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await help.execute({
      message: mockMessage,
      guild: { id: 'guild-1' } as any,
      args: ['nonexistent'],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);
    const data = repliedPayload.embeds[0].toJSON();
    expect(data.title).toContain('Error');
    expect(data.description).toContain('Command `nonexistent` was not found');
  });

  it('handles select menu interaction in handleHelpInteraction', async () => {
    let updatedPayload: any = null;
    const mockInteraction: any = {
      isStringSelectMenu: () => true,
      isButton: () => false,
      customId: 'help_category_select',
      values: ['utility'],
      guildId: 'guild-1',
      update: async (p: any) => {
        updatedPayload = p;
      },
    };

    await handleHelpInteraction(mockInteraction);
    expect(updatedPayload).toBeDefined();
    expect(updatedPayload.embeds).toHaveLength(1);
    const data = updatedPayload.embeds[0].toJSON();
    expect(data.title).toContain('Utility Suite');
  });

  it('handles button navigation interaction in handleHelpInteraction', async () => {
    let updatedPayload: any = null;
    const mockInteraction: any = {
      isStringSelectMenu: () => false,
      isButton: () => true,
      customId: 'help_btn_moderation',
      guildId: 'guild-1',
      update: async (p: any) => {
        updatedPayload = p;
      },
    };

    await handleHelpInteraction(mockInteraction);
    expect(updatedPayload).toBeDefined();
    expect(updatedPayload.embeds).toHaveLength(1);
    const data = updatedPayload.embeds[0].toJSON();
    expect(data.title).toContain('Moderation Suite');
  });

  it('guarantees unique component custom IDs for all categories and home target', () => {
    const targets = ['home', 'moderation', 'utility', 'plugins', 'info', 'project', 'config'] as const;
    for (const target of targets) {
      const payload = buildHelpPayload(target, '>');
      const buttonRow = payload.components[1].toJSON() as any;
      const customIds = buttonRow.components
        .map((b: any) => b.custom_id)
        .filter(Boolean);
      const uniqueIds = new Set(customIds);
      expect(uniqueIds.size).toBe(customIds.length);
    }
  });

  it('renders home overview when execute is called with no query', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      author: { id: 'user-456' },
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await help.execute({
      message: mockMessage,
      guild: { id: 'guild-1' } as any,
      args: [],
      getOption: () => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);
    expect(repliedPayload.components).toHaveLength(2);
    const data = repliedPayload.embeds[0].toJSON();
    expect(data.title).toContain('Command Center');
  });
});

