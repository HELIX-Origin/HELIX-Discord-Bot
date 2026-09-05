import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSlashCommandCategories,
  getSlashCommands,
  registerSlashCommand,
  clearSlashCommands,
  registerGuildSlashCategories,
  clearGuildSlashCommands,
  registerGlobalSlashCommands,
  handleSlashInteraction,
} from '../../../HELIX/src/handlers/slash-handler.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';
import { set } from '../../../HELIX/src/commands/config/set.js';
import { ping } from '../../../HELIX/src/commands/util/ping.js';
import { help } from '../../../HELIX/src/commands/info/help.js';
import { REST } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('slash-handler', () => {
  let tmpDbPath: string;
  let db: BotDatabase;

  beforeEach(() => {
    vi.spyOn(REST.prototype, 'setToken').mockReturnThis();
    vi.spyOn(REST.prototype, 'put').mockResolvedValue([] as any);

    tmpDbPath = path.join(os.tmpdir(), `test-slash-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
    db = new BotDatabase(tmpDbPath);

    clearSlashCommands();
    registerSlashCommand(set);
    registerSlashCommand(ping);
    registerSlashCommand(help);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearSlashCommands();
    try {
      if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
    } catch {}
  });

  it('registers slash commands and retrieves them', () => {
    const commands = getSlashCommands();
    expect(commands.size).toBe(3);
    expect(commands.has('set')).toBe(true);
    expect(commands.has('ping')).toBe(true);
    expect(commands.has('help')).toBe(true);
  });

  it('discovers slash command categories correctly', () => {
    const categories = getSlashCommandCategories();
    expect(categories).toContain('config');
    expect(categories).toContain('utility');
    expect(categories).toContain('info');
  });

  it('registers guild slash commands filtered by category', async () => {
    const res = await registerGuildSlashCategories('fake-token', '123456789', '987654321', ['config']);
    expect(res.categories).toEqual(['config']);
    expect(res.count).toBe(1);
  });

  it('registers all slash commands when category is all', async () => {
    const res = await registerGuildSlashCategories('fake-token', '123456789', '987654321', ['all']);
    expect(res.count).toBe(3);
  });

  it('clears guild slash commands cleanly', async () => {
    await expect(clearGuildSlashCommands('fake-token', '123456789', '987654321')).resolves.not.toThrow();
  });

  it('registers global slash commands when called', async () => {
    await expect(registerGlobalSlashCommands('fake-token', '123456789')).resolves.not.toThrow();
  });

  it('persists enabled_slash_categories in database', () => {
    const guildId = 'guild-slash-test-1';
    db.setGuildSettings({
      guildId,
      prefix: '!',
      enabledSlashCategories: ['config', 'info'],
    });

    const settings = db.getGuildSettings(guildId);
    expect(settings).not.toBeNull();
    expect(settings?.enabledSlashCategories).toEqual(['config', 'info']);
  });

  it('handles slash command interaction execution', async () => {
    const mockInteraction: any = {
      commandName: 'ping',
      options: {
        data: [],
        get: vi.fn().mockReturnValue(null),
      },
      guild: { id: 'g1' },
      member: {},
      user: { id: 'u1' },
      reply: vi.fn().mockResolvedValue(true),
      followUp: vi.fn().mockResolvedValue(true),
      replied: false,
      deferred: false,
    };

    await handleSlashInteraction(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalled();
  });

  it('purges global slash commands cleanly', async () => {
    const { purgeGlobalSlashCommands } = await import('../../../HELIX/src/handlers/slash-handler.js');
    await expect(purgeGlobalSlashCommands('fake-token', '123456789')).resolves.not.toThrow();
  });

  it('reconciles all guild slash commands based on database settings', async () => {
    const { reconcileAllGuildSlashCommands } = await import('../../../HELIX/src/handlers/slash-handler.js');
    const dbInstance = BotDatabase.getInstance();
    dbInstance.setGuildSettings({
      guildId: 'guild-reconcile-1',
      enabledSlashCategories: ['config'],
    });
    dbInstance.setGuildSettings({
      guildId: 'guild-reconcile-2',
      enabledSlashCategories: [],
    });

    await expect(
      reconcileAllGuildSlashCommands('fake-token', '123456789', ['guild-reconcile-1', 'guild-reconcile-2'])
    ).resolves.not.toThrow();
  });
});
