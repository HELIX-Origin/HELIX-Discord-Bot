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
    expect(names).toContain('helix-mod');
    expect(names).toContain('helix-util');
    expect(names).toContain('helix-ticket');
    expect(names).toContain('helix-set');
    expect(names.length).toBe(14);
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

  describe('Tiered AI Model Access & Owner Protection', () => {
    it('correctly resolves bot owner from environment variable', async () => {
      const { isBotOwner } = await import('../../bot/src/client.js');
      process.env.DISCORD_OWNER_ID = 'owner-12345';
      expect(await isBotOwner('owner-12345')).toBe(true);
      expect(await isBotOwner('stranger-99999')).toBe(false);
      delete process.env.DISCORD_OWNER_ID;
    });

    it('auto-runs OpenCode Zen BigPickle by default on Free Tier for non-owner without an API key', async () => {
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
          getString: (name: string) => (name === 'prompt' ? 'How do I optimize SQLite queries?' : null),
        },
      };

      await aiCommand.execute(mockInteraction);

      expect(editReplyData).toBeDefined();
      expect(editReplyData.embeds).toBeDefined();
      const embed = editReplyData.embeds[0].data;
      expect(embed.title).toContain("OpenCode Zen's BigPickle");
      expect(embed.fields.some((f: any) => f.name === 'Tier & Access' && f.value.includes('Free Tier'))).toBe(true);
    });

    it('allows non-owner without an API key to select free Google Gemini Flash or GitHub GPT-4o Mini', async () => {
      const { aiCommand } = await import('../../bot/src/commands/ai.js');
      delete process.env.DISCORD_OWNER_ID;
      delete process.env.BOT_OWNER_ID;

      let editReplyData: any = null;
      const mockInteraction: any = {
        user: { id: 'free-user-1', username: 'FreeDev', tag: 'FreeDev#1111' },
        guildId: 'guild-test',
        deferReply: async () => {},
        editReply: async (data: any) => { editReplyData = data; },
        options: {
          getString: (name: string) => {
            if (name === 'prompt') return 'Explain async/await in Node.js';
            if (name === 'model') return 'gemini-2.5-flash';
            return null;
          },
        },
      };

      await aiCommand.execute(mockInteraction);

      expect(editReplyData).toBeDefined();
      const embed = editReplyData.embeds[0].data;
      expect(embed.title).toContain('Google Gemini 2.5 Flash');
      expect(embed.fields.some((f: any) => f.name === 'Tier & Access' && f.value.includes('Free Tier'))).toBe(true);
    });

    it('gracefully downgrades to free counterpart when non-owner requests a key-required model', async () => {
      const { aiCommand } = await import('../../bot/src/commands/ai.js');
      delete process.env.DISCORD_OWNER_ID;
      delete process.env.BOT_OWNER_ID;

      let editReplyData: any = null;
      const mockInteraction: any = {
        user: { id: 'free-user-2', username: 'CuriousDev', tag: 'Curious#2222' },
        guildId: 'guild-test',
        deferReply: async () => {},
        editReply: async (data: any) => { editReplyData = data; },
        options: {
          getString: (name: string) => {
            if (name === 'prompt') return 'Refactor this algorithm';
            if (name === 'model') return 'gemini-2.5-pro'; // Key required
            return null;
          },
        },
      };

      await aiCommand.execute(mockInteraction);

      expect(editReplyData).toBeDefined();
      const embed = editReplyData.embeds[0].data;
      expect(embed.title).toContain('Google Gemini 2.5 Flash'); // Reverted to free model
      expect(embed.fields.some((f: any) => f.name === '⚡ Tier Notice')).toBe(true);
    });

    it('auto-runs Free Tier for Explain command for non-owner without an API key', async () => {
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
      expect(embed.title).toContain('HELIX Code Review');
      expect(embed.fields.some((f: any) => f.name === 'Tier' && f.value.includes('Free'))).toBe(true);
    });

    it('allows bot owner to select key-required models with host credentials', async () => {
      const { aiCommand } = await import('../../bot/src/commands/ai.js');
      process.env.DISCORD_OWNER_ID = 'owner-12345';

      let editReplyData: any = null;
      const mockInteraction: any = {
        user: { id: 'owner-12345', username: 'BotOwner', tag: 'Owner#0001' },
        guildId: 'guild-test',
        deferReply: async () => {},
        editReply: async (data: any) => { editReplyData = data; },
        options: {
          getString: (name: string) => {
            if (name === 'prompt') return 'Design architecture';
            if (name === 'model') return 'gemini-2.5-pro';
            return null;
          },
        },
      };

      await aiCommand.execute(mockInteraction);

      expect(editReplyData).toBeDefined();
      const embed = editReplyData.embeds[0].data;
      expect(embed.title).toContain('Google Gemini 2.5 Pro');
      expect(embed.fields.some((f: any) => f.name === 'Tier & Access' && f.value.includes('Owner Session'))).toBe(true);

      delete process.env.DISCORD_OWNER_ID;
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

    it('executes helix-mod warn and warnings subcommands', async () => {
      const { modCommand } = await import('../../bot/src/commands/mod.js');
      let replyData: any = null;
      const mockInteraction: any = {
        guild: { id: 'guild-test-mod', channels: { fetch: async () => null } },
        user: { id: 'moderator-1', tag: 'Mod#0001' },
        member: { permissions: { has: () => true } },
        deferReply: async () => {},
        editReply: async (data: any) => { replyData = data; },
        options: {
          getSubcommand: () => 'warn',
          getUser: () => ({ id: 'troublemaker-1', tag: 'Bad#0001', username: 'BadUser' }),
          getString: (name: string) => (name === 'reason' ? 'Disruptive behavior' : null),
        },
      };

      await modCommand.execute(mockInteraction);

      expect(replyData).toBeDefined();
      expect(replyData.embeds).toBeDefined();
      const embed = replyData.embeds[0].data;
      expect(embed.title).toContain('Member Warned');
      expect(embed.fields.some((f: any) => f.name === 'Reason' && f.value === 'Disruptive behavior')).toBe(true);
    });

    it('executes helix-util ping and snowflake subcommands', async () => {
      const { utilCommand } = await import('../../bot/src/commands/util.js');
      let replyData: any = null;
      const mockInteraction: any = {
        deferReply: async () => {},
        editReply: async (data: any) => { replyData = data; },
        options: {
          getSubcommand: () => 'snowflake',
          getString: (name: string) => (name === 'id' ? '1545203514932731934' : null),
        },
      };

      await utilCommand.execute(mockInteraction);

      expect(replyData).toBeDefined();
      expect(replyData.embeds).toBeDefined();
      const embed = replyData.embeds[0].data;
      expect(embed.title).toContain('Snowflake Decoder');
      expect(embed.fields.some((f: any) => f.name === 'Snowflake ID')).toBe(true);
    });

    it('executes helix-ticket setup-hub subcommand', async () => {
      const { ticketCommand } = await import('../../bot/src/commands/ticket.js');
      let replyData: any = null;
      let sentData: any = null;
      const mockChannel: any = {
        id: 'channel-hub-123',
        isTextBased: () => true,
        isThread: () => false,
        send: async (data: any) => { sentData = data; },
      };
      const mockInteraction: any = {
        guild: { id: 'guild-ticket-test' },
        member: { permissions: { has: () => true } },
        channel: mockChannel,
        deferReply: async () => {},
        editReply: async (data: any) => { replyData = data; },
        options: {
          getSubcommand: () => 'setup-hub',
          getChannel: () => mockChannel,
        },
      };

      await ticketCommand.execute(mockInteraction);

      expect(sentData).toBeDefined();
      expect(sentData.embeds[0].data.title).toContain('HELIX Support & Ticket Hub');
      expect(sentData.components.length).toBeGreaterThan(0);
      expect(replyData.content).toContain('Tickets Hub deployed successfully');
    });

    it('executes helix-set guild and user view subcommands', async () => {
      const { setCommand } = await import('../../bot/src/commands/set.js');
      let replyData: any = null;
      const mockInteraction: any = {
        guild: { id: 'guild-set-test', name: 'Dev Guild' },
        user: { id: 'user-set-test', username: 'TestDeveloper' },
        member: { permissions: { has: () => true } },
        deferReply: async () => {},
        editReply: async (data: any) => { replyData = data; },
        options: {
          getSubcommandGroup: () => 'guild',
          getSubcommand: () => 'view',
        },
      };

      await setCommand.execute(mockInteraction);

      expect(replyData).toBeDefined();
      expect(replyData.embeds).toBeDefined();
      const embed = replyData.embeds[0].data;
      expect(embed.title).toContain('Server Configuration');
      expect(embed.fields.some((f: any) => f.name === 'Tickets Hub Channel')).toBe(true);
    });

    it('executes helix-set user model subcommand and updates user settings', async () => {
      const { setCommand } = await import('../../bot/src/commands/set.js');
      const { BotDatabase } = await import('../../bot/src/db/index.js');
      let replyData: any = null;
      const mockInteraction: any = {
        user: { id: 'user-model-test-1', username: 'ModelTester' },
        deferReply: async () => {},
        editReply: async (data: any) => { replyData = data; },
        options: {
          getSubcommandGroup: () => 'user',
          getSubcommand: () => 'model',
          getString: (name: string) => (name === 'model' ? 'gemini-2.5-flash' : null),
        },
      };

      await setCommand.execute(mockInteraction);

      expect(replyData).toBeDefined();
      expect(replyData.embeds).toBeDefined();
      const embed = replyData.embeds[0].data;
      expect(embed.title).toContain('User Preference Updated: AI Model');
      expect(embed.description).toContain('gemini-2.5-flash');

      const saved = BotDatabase.getInstance().getUserSettings('user-model-test-1');
      expect(saved?.defaultModel).toBe('gemini-2.5-flash');
    });
  });
});


