import { describe, it, expect } from 'vitest';
import { botCommands } from '../../bot/src/commands/index.js';
import { deployBotCommands } from '../../bot/src/deploy.js';

describe('Built-in Discord Bot Commands', () => {
  it('registers all required slash commands', () => {
    const names = botCommands.map(c => c.data.name);
    expect(names).toContain('helix-help');
    expect(names).toContain('helix-ai');
    expect(names).toContain('helix-auth');
    expect(names).toContain('helix-explain');
    expect(names).toContain('helix-scaffold');
    expect(names).toContain('helix-status');
    expect(names).toContain('helix-repo');
  });

  it('serializes slash commands into valid Discord REST payloads', () => {
    for (const cmd of botCommands) {
      const json = cmd.data.toJSON();
      expect(typeof json.name).toBe('string');
      expect(typeof json.description).toBe('string');
      expect(json.name.startsWith('helix-')).toBe(true);
    }
  });

  it('executes deployBotCommands in dry-run mode without network calls', async () => {
    const result = await deployBotCommands({
      token: 'mock-token',
      clientId: '123456789',
      dryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(botCommands.length);
    expect(result.message).toContain('Dry-run');
  });

  it('handles missing credentials when dryRun is false', async () => {
    const result = await deployBotCommands({
      token: '',
      clientId: '',
      dryRun: false,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing DISCORD_BOT_TOKEN');
  });
});
