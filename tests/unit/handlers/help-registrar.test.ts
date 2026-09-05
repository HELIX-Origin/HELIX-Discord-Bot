import { describe, it, expect } from 'vitest';
import {
  createHelp,
  registerHelp,
  getAllHelp,
  getHelpByCategory,
  getCategoryEmoji,
  getCategoryLabel,
  getCategoryDescription,
  getCategoryColor,
  getCommandHelp,
  buildCommandHelpEmbed,
  helpCount,
} from '../../../HELIX/src/handlers/help-registrar.js';

describe('help-registrar — structure', () => {
  it('builds a CommandHelp entry with sensible usage default', () => {
    const help = createHelp('ping', 'Checks latency', 'utility');
    expect(help.name).toBe('ping');
    expect(help.description).toBe('Checks latency');
    expect(help.category).toBe('utility');
    expect(help.usage).toBe('');
    expect(help.permissions).toEqual([]);
    expect(help.aliases).toBeUndefined();
  });

  it('supports explicit usage, permissions, aliases, and subcommands', () => {
    const help = createHelp('warn', 'Warn a user', 'moderation', {
      usage: 'warn <user> [reason]',
      permissions: ['ModerateMembers'],
      aliases: ['w'],
      subcommands: ['list', 'clear'],
    });
    expect(help.usage).toBe('warn <user> [reason]');
    expect(help.permissions).toContain('ModerateMembers');
    expect(help.aliases).toEqual(['w']);
    expect(help.subcommands).toEqual(['list', 'clear']);
  });

  it('registerHelp deduplicates by name and groups by category order', () => {
    registerHelp(createHelp('ping', 'd', 'utility'));
    registerHelp(createHelp('warn', 'd2', 'moderation'));
    registerHelp(createHelp('ping', 'updated', 'utility'));

    const grouped = getHelpByCategory();
    const order = [...grouped.keys()];
    expect(order).toEqual(['moderation', 'utility', 'plugins', 'info', 'project', 'config']);

    const utilities = grouped.get('utility') || [];
    expect(utilities).toHaveLength(1);
    expect(utilities[0].description).toBe('updated');
    expect(helpCount()).toBeGreaterThanOrEqual(2);
  });

  it('getAllHelp returns at least what was registered', () => {
    // this test runs after the helper registrations so the registry has content
    expect(getAllHelp().length).toBe(helpCount());
  });

  it('maps known categories to emoji, labels, colors, and descriptions', () => {
    expect(getCategoryEmoji('moderation')).toBe('🛡️');
    expect(getCategoryEmoji('utility')).toBe('🧰');
    expect(getCategoryEmoji('plugins')).toBe('🧩');
    expect(getCategoryEmoji('unknown')).toBe('📋');
    expect(getCategoryLabel('moderation')).toBe('Moderation Suite');
    expect(getCategoryLabel('unknown-cat')).toBe('unknown-cat');
    expect(getCategoryColor('moderation')).toBe('#ff5252');
    expect(getCategoryDescription('moderation')).toContain('Enforce server rules');
  });

  it('looks up command help by name or alias', () => {
    registerHelp(createHelp('scaffold', 'Scaffold projects', 'project', { aliases: ['init', 'gen'] }));
    expect(getCommandHelp('scaffold')?.name).toBe('scaffold');
    expect(getCommandHelp('>scaffold')?.name).toBe('scaffold');
    expect(getCommandHelp('init')?.name).toBe('scaffold');
    expect(getCommandHelp('nonexistent')).toBeUndefined();
  });

  it('builds a clean, professional command help embed via buildCommandHelpEmbed', async () => {
    const { buildCommandHelpEmbed } = await import('../../../HELIX/src/handlers/help-registrar.js');
    const helpEntry = createHelp('ban', 'Permanently ban a user from the server', 'moderation', {
      usage: '<user> [reason] [delete_days]',
      examples: ['ban @spammer Excessive spam', 'ban 123456789012345678 Raid bot 7'],
      permissions: ['BanMembers'],
      aliases: ['b'],
      options: [
        { name: 'user', description: 'Target user to ban', type: 'user', required: true },
        { name: 'reason', description: 'Reason for the ban', type: 'string', required: false },
        { name: 'delete_days', description: 'Days of messages to delete (0-7)', type: 'integer', required: false },
      ],
    });

    const embed = buildCommandHelpEmbed(helpEntry, '>');
    const data = embed.toJSON();

    expect(data.title).toBe('🛡️ Command Help: `>ban`');
    expect(data.description).toBe('Permanently ban a user from the server');
    expect(data.fields).toBeDefined();

    // Check inline fields
    const catField = data.fields?.find(f => f.name === 'Category');
    expect(catField).toBeDefined();
    expect(catField?.inline).toBe(true);
    expect(catField?.value).toContain('Moderation Suite');

    const permField = data.fields?.find(f => f.name === 'Permissions');
    expect(permField).toBeDefined();
    expect(permField?.inline).toBe(true);
    expect(permField?.value).toContain('`BanMembers`');

    const aliasField = data.fields?.find(f => f.name === 'Aliases');
    expect(aliasField).toBeDefined();
    expect(aliasField?.inline).toBe(true);
    expect(aliasField?.value).toContain('`>b`');

    // Check non-inline fields
    const syntaxField = data.fields?.find(f => f.name === 'Syntax & Usage');
    expect(syntaxField).toBeDefined();
    expect(syntaxField?.inline).toBe(false);
    expect(syntaxField?.value).toContain('```syntax\n>ban <user> [reason] [delete_days]\n```');

    const optionsField = data.fields?.find(f => f.name === 'Arguments & Parameters');
    expect(optionsField).toBeDefined();
    expect(optionsField?.inline).toBe(false);
    expect(optionsField?.value).toContain('`<user>`');
    expect(optionsField?.value).toContain('REQUIRED');
    expect(optionsField?.value).toContain('`<reason>`');
    expect(optionsField?.value).toContain('OPTIONAL');

    const examplesField = data.fields?.find(f => f.name === 'Examples');
    expect(examplesField).toBeDefined();
    expect(examplesField?.inline).toBe(false);
    expect(examplesField?.value).toContain('>ban @spammer Excessive spam');
  });

  it('renders rich subcommands and actions with descriptions and options', () => {
    const helpEntry = createHelp('ticket', 'Manage support tickets', 'config', {
      subcommands: [
        {
          name: 'create',
          description: 'Create a new ticket thread',
          options: [{ name: 'subject', description: 'Subject of ticket', type: 'string', required: true }],
        },
        {
          name: 'close',
          description: 'Close the current ticket thread',
        },
      ],
    });

    const embed = buildCommandHelpEmbed(helpEntry, '>');
    const data = embed.toJSON();
    const subField = data.fields?.find(f => f.name === 'Available Subcommands & Features');
    expect(subField).toBeDefined();
    expect(subField?.value).toContain('• `>ticket create <subject>` — Create a new ticket thread');
    expect(subField?.value).toContain('• `>ticket close` — Close the current ticket thread');
  });
});