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
    expect(names).toContain('helix-create');
    expect(names).toContain('helix-list');
    expect(names).toContain('helix-info');
    expect(names.length).toBe(10);
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
    expect(result.message).toContain('Missing DISCORD_TOKEN');
  });

  describe('Bot Owner API Key Protection', () => {
    it('correctly resolves bot owner from environment variable', async () => {
      const { isBotOwner } = await import('../../bot/src/client.js');
      process.env.DISCORD_OWNER_ID = 'owner-12345';
      expect(await isBotOwner('owner-12345')).toBe(true);
      expect(await isBotOwner('stranger-99999')).toBe(false);
      delete process.env.DISCORD_OWNER_ID;
    });

    it('rejects AI command for non-owner without a personal session', async () => {
      const { aiCommand } = await import('../../bot/src/commands/ai.js');
      delete process.env.DISCORD_OWNER_ID;
      delete process.env.BOT_OWNER_ID;

      let editReplyData: any = null;
      const mockInteraction: any = {
        user: { id: 'unauthorized-user-999', username: 'RandomMember', tag: 'RandomMember#1234' },
        guildId: 'guild-test',
        deferReply: async () => {},
        editReply: async (data: any) => { editReplyData = data; },
        options: {
          getString: (name: string) => (name === 'prompt' ? 'Generate a virus' : null),
        },
      };

      await aiCommand.execute(mockInteraction);

      expect(editReplyData).toBeDefined();
      expect(editReplyData.embeds).toBeDefined();
      const embed = editReplyData.embeds[0].data;
      expect(embed.title).toContain('Bot Owner API Key Protection');
      expect(embed.description).toContain('strictly restricted to the bot application owner');
    });

    it('rejects Explain command for non-owner without a personal session', async () => {
      const { explainCommand } = await import('../../bot/src/commands/explain.js');
      delete process.env.DISCORD_OWNER_ID;
      delete process.env.BOT_OWNER_ID;

      let editReplyData: any = null;
      const mockInteraction: any = {
        user: { id: 'unauthorized-user-888', username: 'RandomMember2', tag: 'RandomMember2#5678' },
        guildId: 'guild-test',
        deferReply: async () => {},
        editReply: async (data: any) => { editReplyData = data; },
        options: {
          getString: (name: string) => (name === 'code' ? 'console.log("hello")' : null),
        },
      };

      await explainCommand.execute(mockInteraction);

      expect(editReplyData).toBeDefined();
      expect(editReplyData.embeds).toBeDefined();
      const embed = editReplyData.embeds[0].data;
      expect(embed.title).toContain('Bot Owner API Key Protection');
      expect(embed.description).toContain('strictly restricted to the bot application owner');
    });
  });

  describe('Merged In-Process Command Executions', () => {
    it('executes helix-create and returns complete scaffold blueprint', async () => {
      const { createCommand } = await import('../../bot/src/commands/create.js');
      let replyData: any = null;
      const mockInteraction: any = {
        user: { id: 'user-scaffold-1', username: 'Developer' },
        deferReply: async () => {},
        editReply: async (data: any) => { replyData = data; },
        options: {
          getString: (name: string) => {
            if (name === 'template') return 'web-react';
            if (name === 'name') return 'my-app';
            if (name === 'git_platform') return 'github';
            return null;
          },
          getBoolean: (name: string) => (name === 'dry_run' ? true : false),
        },
      };

      await createCommand.execute(mockInteraction);

      expect(replyData).toBeDefined();
      expect(replyData.embeds).toBeDefined();
      const embed = replyData.embeds[0].data;
      expect(embed.title).toContain('HELIX Project Scaffolding: my-app');
      expect(embed.description).toContain('web-react');
      const fields = embed.fields;
      expect(fields.find((f: any) => f.name === 'Framework').value.toLowerCase()).toContain('react');
      expect(fields.find((f: any) => f.name === 'Language').value.toLowerCase()).toContain('typescript');
      expect(fields.find((f: any) => f.name === 'Generated Manifest').value).toContain('src/');
      expect(fields.find((f: any) => f.name === 'Getting Started Commands').value).toContain('npm install');
    });

    it('executes helix-list across templates, agents, and platforms', async () => {
      const { listCommand } = await import('../../bot/src/commands/list.js');
      let replyData: any = null;
      const mockInteraction: any = {
        deferReply: async () => {},
        editReply: async (data: any) => { replyData = data; },
        options: {
          getString: (name: string) => (name === 'category' ? 'all' : null),
        },
      };

      await listCommand.execute(mockInteraction);

      expect(replyData).toBeDefined();
      expect(replyData.embeds).toBeDefined();
      const embed = replyData.embeds[0].data;
      expect(embed.title).toContain('HELIX Ecosystem Catalog');
      const fieldNames = embed.fields.map((f: any) => f.name);
      expect(fieldNames.some((n: string) => n.includes('Templates'))).toBe(true);
      expect(fieldNames.some((n: string) => n.includes('AI Agent'))).toBe(true);
      expect(fieldNames.some((n: string) => n.includes('Code Hosting'))).toBe(true);
    });

    it('executes helix-info and returns comprehensive bot diagnostics', async () => {
      const { infoCommand } = await import('../../bot/src/commands/info.js');
      let replyData: any = null;
      const mockInteraction: any = {
        deferReply: async () => {},
        editReply: async (data: any) => { replyData = data; },
      };

      await infoCommand.execute(mockInteraction);

      expect(replyData).toBeDefined();
      expect(replyData.embeds).toBeDefined();
      const embed = replyData.embeds[0].data;
      expect(embed.title).toContain('HELIX Bot & System Diagnostics');
      const fieldNames = embed.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('Bot Version');
      expect(fieldNames).toContain('Memory Footprint');
      expect(fieldNames).toContain('SQLite Database Metrics');
    });
  });
});

