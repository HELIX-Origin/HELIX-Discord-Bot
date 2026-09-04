import { describe, it, expect } from 'vitest';
import { kick } from '../../HELIX/src/commands/mod/kick.js';
import { ban } from '../../HELIX/src/commands/mod/ban.js';
import { unban } from '../../HELIX/src/commands/mod/unban.js';
import { timeout } from '../../HELIX/src/commands/mod/timeout.js';
import { untimeout } from '../../HELIX/src/commands/mod/untimeout.js';
import { purge } from '../../HELIX/src/commands/mod/purge.js';
import { warn } from '../../HELIX/src/commands/mod/warn.js';

import { ping } from '../../HELIX/src/commands/util/ping.js';
import { avatar } from '../../HELIX/src/commands/util/avatar.js';
import { serverinfo } from '../../HELIX/src/commands/util/serverinfo.js';
import { userinfo } from '../../HELIX/src/commands/util/userinfo.js';
import { poll } from '../../HELIX/src/commands/util/poll.js';
import { snowflake } from '../../HELIX/src/commands/util/snowflake.js';
import { remind } from '../../HELIX/src/commands/util/remind.js';

import { help } from '../../HELIX/src/commands/info/help.js';
import { info } from '../../HELIX/src/commands/info/info.js';
import { list } from '../../HELIX/src/commands/info/list.js';
import { status } from '../../HELIX/src/commands/info/status.js';
import { lint } from '../../HELIX/src/commands/info/lint.js';
import { explain } from '../../HELIX/src/commands/info/explain.js';
import { docs } from '../../HELIX/src/commands/info/docs.js';

import { create } from '../../HELIX/src/commands/project/create.js';
import { scaffold } from '../../HELIX/src/commands/project/scaffold.js';

import { plugin } from '../../HELIX/src/commands/config/plugin.js';
import { set } from '../../HELIX/src/commands/config/set.js';
import { ticket } from '../../HELIX/src/commands/config/ticket.js';

describe('Built-in Discord Bot Commands (No AI)', () => {
  const allCommands = [
    kick, ban, unban, timeout, untimeout, purge, warn,
    ping, avatar, serverinfo, userinfo, poll, snowflake, remind,
    help, info, list, status, lint, explain, docs,
    create, scaffold,
    plugin, set, ticket,
  ];

  it('defines all 26 native commands with required metadata', () => {
    expect(allCommands).toHaveLength(26);

    for (const cmd of allCommands) {
      expect(cmd.name).toBeDefined();
      expect(typeof cmd.name).toBe('string');
      expect(cmd.description).toBeDefined();
      expect(typeof cmd.description).toBe('string');
      expect(cmd.category).toBeDefined();
      expect(['moderation', 'utility', 'plugins', 'info', 'project', 'config']).toContain(cmd.category);
      expect(typeof cmd.execute).toBe('function');
    }
  });

  describe('Moderation Commands', () => {
    it('declares moderation category for mod commands', () => {
      const modCmds = [kick, ban, unban, timeout, untimeout, purge, warn];
      for (const cmd of modCmds) {
        expect(cmd.category).toBe('moderation');
        expect(cmd.permissions).toBeDefined();
        expect(cmd.permissions!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Utility Commands', () => {
    it('declares utility category for util commands', () => {
      const utilCmds = [ping, avatar, serverinfo, userinfo, poll, snowflake, remind];
      for (const cmd of utilCmds) {
        expect(cmd.category).toBe('utility');
      }
    });
  });

  describe('Info Commands', () => {
    it('declares info category for info commands', () => {
      const infoCmds = [help, info, list, status];
      for (const cmd of infoCmds) {
        expect(cmd.category).toBe('info');
      }
    });
  });

  describe('Project Scaffolding Commands', () => {
    it('declares project category for create and scaffold', () => {
      expect(create.category).toBe('project');
      expect(scaffold.category).toBe('project');
    });
  });

  describe('Configuration & Plugin Commands', () => {
    it('declares config category for set and ticket, plugins for plugin', () => {
      expect(set.category).toBe('config');
      expect(ticket.category).toBe('config');
      expect(plugin.category).toBe('plugins');
    });
  });

  describe('Bot Owner Resolution', () => {
    it('resolves owner from DISCORD_OWNER_ID or BOT_OWNER_ID', async () => {
      const { isBotOwner } = await import('../../HELIX/src/client.js');
      process.env.DISCORD_OWNER_ID = 'owner-999';
      expect(isBotOwner('owner-999')).toBe(true);
      expect(isBotOwner('other-user')).toBe(false);
      delete process.env.DISCORD_OWNER_ID;
    });
  });
});
