/**
 * tests/unit/bot/prefixDispatch.test.ts
 *
 * Unit tests for the prefix command registry, the MessageCreate dispatcher, its
 * permission gate, and the `set` and `help` command implementations.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PermissionFlagsBits, type GuildMember } from 'discord.js';

import { Database } from '../../../src/db/database.js';
import { Repository } from '../../../src/db/repository.js';
import type { AppDeps } from '../../../src/app.js';
import type { DiscordBot } from '../../../src/bot/bot.js';
import {
  getAllPrefixCommands,
  getPrefixCommand,
  handleMessageCreate,
  isGuildManager,
  registerPrefixCommand,
  _resetPrefixCommandRegistry,
} from '../../../src/bot/handlers/prefix.js';
import { setPrefixCommand } from '../../../src/bot/commands/prefix/set.js';
import { helpPrefixCommand } from '../../../src/bot/commands/prefix/help.js';
import { getGuildPrefix, MANAGER_ROLE_SETTING_KEY, setGuildPrefix, setManagerRoleId } from '../../../src/bot/lib/prefix/settings.js';
import { makeMember } from '../../helpers/member.js';
import {
  embedDescriptions,
  embedText,
  embedTitles,
  fieldNames,
  makeBot,
  makeMessage,
  type RecordedSend,
} from '../../helpers/prefix.js';

const GUILD = 'guild-100';
const ADMIN = 'user-admin';
const ROLE_ID = '987654321098765432';

let db: Database;
let deps: AppDeps;

function makeDeps(): void {
  db = Database.open(':memory:');
  const repo = new Repository(db);
  deps = { config: {}, db, repo } as unknown as AppDeps;
}

const admin = (): GuildMember => makeMember({ id: ADMIN, permissions: [PermissionFlagsBits.ManageGuild] });
const plain = (): GuildMember => makeMember({ id: 'user-plain', permissions: [] });

beforeEach(() => {
  makeDeps();
  _resetPrefixCommandRegistry();
  registerPrefixCommand(setPrefixCommand);
  registerPrefixCommand(helpPrefixCommand);
});

afterEach(() => {
  db.close();
  vi.restoreAllMocks();
});

describe('prefix command registry', () => {
  it('resolves commands by name and alias, case-insensitively', () => {
    expect(getPrefixCommand('set')?.name).toBe('set');
    expect(getPrefixCommand('SET')?.name).toBe('set');
    expect(getPrefixCommand('settings')?.name).toBe('set');
    expect(getPrefixCommand('nope')).toBeUndefined();
  });

  it('lists every registered command', () => {
    expect(getAllPrefixCommands().map((c) => c.name).sort()).toEqual(['help', 'set']);
  });

  it('rejects an empty command name', () => {
    expect(() => registerPrefixCommand({ ...setPrefixCommand, name: '  ' })).toThrow();
  });
});

describe('isGuildManager()', () => {
  it('grants access to the guild owner', () => {
    const owner = makeMember({ id: 'user-owner', isOwner: true });
    expect(isGuildManager(deps, GUILD, owner)).toBe(true);
  });

  it('grants access with Manage Guild', () => {
    expect(isGuildManager(deps, GUILD, admin())).toBe(true);
  });

  it('grants access with Administrator', () => {
    const superuser = makeMember({ id: 'user-super', permissions: [PermissionFlagsBits.Administrator] });
    expect(isGuildManager(deps, GUILD, superuser)).toBe(true);
  });

  it('grants access to holders of the configured manager role', () => {
    setManagerRoleId(deps, GUILD, ROLE_ID);
    const manager = makeMember({ id: 'user-mgr', roleIds: [ROLE_ID] });
    expect(isGuildManager(deps, GUILD, manager)).toBe(true);
  });

  it('denies members without any of the above', () => {
    setManagerRoleId(deps, GUILD, ROLE_ID);
    expect(isGuildManager(deps, GUILD, plain())).toBe(false);
    expect(isGuildManager(deps, GUILD, null)).toBe(false);
  });
});

describe('handleMessageCreate() guards', () => {
  it('ignores messages from bots', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!set', isBot: true, member: admin() }), deps, bot);
    expect(sent).toHaveLength(0);
  });

  it('ignores direct messages', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!set', guildId: null, member: admin() }), deps, bot);
    expect(sent).toHaveLength(0);
  });

  it('ignores ordinary conversation that does not use the prefix', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: 'hello everyone', member: admin() }), deps, bot);
    expect(sent).toHaveLength(0);
  });

  it('ignores a bare prefix with nothing after it', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!  ', member: admin() }), deps, bot);
    expect(sent).toHaveLength(0);
  });

  it('replies with guidance for an unknown command', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!nonsense', member: plain() }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Unknown Command');
    expect(embedDescriptions(sent[0]).join()).toContain('!help');
  });
});

describe('handleMessageCreate() permission gate', () => {
  it('blocks a manager-only command for a member with no access', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!set prefix ?', member: plain() }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Insufficient Permissions');
    expect(getGuildPrefix(deps, GUILD)).toBe('!');
  });

  it('blocks when the member cannot be resolved', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!set prefix ?', member: null }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Insufficient Permissions');
  });

  it('allows a manager-only command for a guild manager', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!set prefix ?', member: admin() }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Prefix Updated');
    expect(getGuildPrefix(deps, GUILD)).toBe('?');
  });

  it('allows the manager role holder', async () => {
    setManagerRoleId(deps, GUILD, ROLE_ID);
    const { bot, sent } = makeBot();
    const member = makeMember({ id: 'user-mgr', roleIds: [ROLE_ID] });
    await handleMessageCreate(makeMessage({ content: '!set prefix .', member }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Prefix Updated');
  });

  it('allows a non-manager command for everyone', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!help', member: plain() }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Prefix Commands');
  });
});

describe('[prefix]set prefix', () => {
  async function run(content: string): Promise<RecordedSend | undefined> {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content, member: admin() }), deps, bot);
    return sent[0];
  }

  it('changes the prefix and reports the previous value', async () => {
    const send = await run('!set prefix ?');
    expect(embedTitles(send).join()).toContain('Prefix Updated');
    expect(fieldNames(send)).toContain('Previous');
    expect(getGuildPrefix(deps, GUILD)).toBe('?');
  });

  it('routes subsequent commands through the new prefix', async () => {
    await run('!set prefix ?');
    const { bot, sent } = makeBot();

    // The old prefix no longer matches.
    await handleMessageCreate(makeMessage({ content: '!help', member: plain() }), deps, bot);
    expect(sent).toHaveLength(0);

    await handleMessageCreate(makeMessage({ content: '?help', member: plain() }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Prefix Commands');
  });

  it('rejects an invalid prefix without persisting it', async () => {
    const send = await run('!set prefix "way too long"');
    expect(embedTitles(send).join()).toContain('Invalid Prefix');
    expect(getGuildPrefix(deps, GUILD)).toBe('!');
  });

  it('reports a missing prefix argument', async () => {
    const send = await run('!set prefix');
    expect(embedTitles(send).join()).toContain('Missing Prefix');
  });

  it('resets to the default prefix', async () => {
    await run('!set prefix ?');

    // The prefix is `?` now, so the reset has to be sent with the live prefix.
    const send = await run('?set prefix reset');
    expect(embedTitles(send).join()).toContain('Prefix Reset');
    expect(getGuildPrefix(deps, GUILD)).toBe('!');
  });
});

describe('[prefix]set manager_role', () => {
  async function run(content: string, member: GuildMember = admin()): Promise<RecordedSend | undefined> {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content, member }), deps, bot);
    return sent[0];
  }

  it('accepts a role mention and persists the snowflake', async () => {
    const send = await run(`!set manager_role <@&${ROLE_ID}>`);
    expect(embedTitles(send).join()).toContain('Manager Role Updated');
    expect(deps.repo.getGuildSetting(GUILD, MANAGER_ROLE_SETTING_KEY)).toBe(ROLE_ID);
  });

  it('accepts a bare snowflake', async () => {
    await run(`!set manager_role ${ROLE_ID}`);
    expect(deps.repo.getGuildSetting(GUILD, MANAGER_ROLE_SETTING_KEY)).toBe(ROLE_ID);
  });

  it('rejects a non-role token', async () => {
    const send = await run('!set manager_role Managers');
    expect(embedTitles(send).join()).toContain('Invalid Role');
    expect(deps.repo.getGuildSetting(GUILD, MANAGER_ROLE_SETTING_KEY)).toBeNull();
  });

  it('clears the role with none', async () => {
    await run(`!set manager_role <@&${ROLE_ID}>`);
    const send = await run('!set manager_role none');
    expect(embedTitles(send).join()).toContain('Manager Role Cleared');
    expect(deps.repo.getGuildSetting(GUILD, MANAGER_ROLE_SETTING_KEY)).toBe('none');
  });

  it('reports a missing role argument', async () => {
    const send = await run('!set manager_role');
    expect(embedTitles(send).join()).toContain('Missing Role');
  });
});

describe('[prefix]set <feature_id>', () => {
  async function run(content: string): Promise<RecordedSend | undefined> {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content, member: admin() }), deps, bot);
    return sent[0];
  }

  it('disables a feature', async () => {
    const send = await run('!set reddit_feeds disabled');
    expect(embedTitles(send).join()).toContain('Feature Disabled');
    expect(deps.repo.getGuildSetting(GUILD, 'feature_reddit_feeds')).toBe('0');
  });

  it('re-enables a feature', async () => {
    await run('!set reddit_feeds disabled');
    const send = await run('!set reddit_feeds enabled');
    expect(embedTitles(send).join()).toContain('Feature Enabled');
    expect(deps.repo.getGuildSetting(GUILD, 'feature_reddit_feeds')).toBe('1');
  });

  it('accepts aliases and synonyms for the state word', async () => {
    await run('!set twitch off');
    expect(deps.repo.getGuildSetting(GUILD, 'feature_twitch_feeds')).toBe('0');
    await run('!set twitch on');
    expect(deps.repo.getGuildSetting(GUILD, 'feature_twitch_feeds')).toBe('1');
  });

  it('reports a single feature status when no state is given', async () => {
    const send = await run('!set reddit_feeds');
    expect(embedTitles(send).join()).toContain('Feature Status');
    expect(fieldNames(send)).toContain('Toggle With');
  });

  it('rejects an unknown feature id and lists the real ones', async () => {
    const send = await run('!set not_a_feature disabled');
    expect(embedTitles(send).join()).toContain('Unknown Feature');
    expect(embedText(send)).toContain('reddit_feeds');
  });

  it('rejects an invalid state word', async () => {
    const send = await run('!set reddit_feeds maybe');
    expect(embedTitles(send).join()).toContain('Invalid State');
    expect(deps.repo.getGuildSetting(GUILD, 'feature_reddit_feeds')).toBeNull();
  });

  it('disables the feeds gate only when all feed families are off', async () => {
    for (const id of ['news_feeds', 'reddit_feeds', 'game_feeds', 'patch_notes_feeds']) {
      await run(`!set ${id} disabled`);
    }
    expect(deps.repo.getGuildSetting(GUILD, 'feature_feeds')).toBe('0');
  });
});

describe('[prefix]set summary', () => {
  it('lists the current prefix, manager role, and every feature', async () => {
    setManagerRoleId(deps, GUILD, ROLE_ID);
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!set', member: admin() }), deps, bot);

    const names = fieldNames(sent[0]);
    expect(embedTitles(sent[0]).join()).toContain('Server Configuration');
    expect(names).toContain('Prefix');
    expect(names).toContain('Manager Role');
    expect(names).toContain('🟢 News Feeds');
    expect(names).toContain('🟢 Reddit Feeds');
  });

  it('marks disabled features in the summary', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!set reddit_feeds disabled', member: admin() }), deps, bot);
    await handleMessageCreate(makeMessage({ content: '!set', member: admin() }), deps, bot);
    expect(fieldNames(sent[1])).toContain('⏸️ Reddit Feeds');
  });
});

describe('[prefix]help', () => {
  it('lists registered commands with the live prefix substituted', async () => {
    setGuildPrefix(deps, GUILD, '?');
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '?help', member: plain() }), deps, bot);

    const description = embedDescriptions(sent[0]).join();
    expect(description).toContain('`?`');
    expect(fieldNames(sent[0])).toContain('Commands');
    expect(sent[0].payload.embeds?.[0].fields?.find((f) => f.name === 'Commands')?.value).toContain('? set');
  });

  it('marks manager-only commands with a lock', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!help', member: plain() }), deps, bot);
    const commands = sent[0].payload.embeds?.[0].fields?.find((f) => f.name === 'Commands')?.value ?? '';
    expect(commands).toContain('! set');
    expect(commands).toContain('🔒');
    expect(commands).toContain('! help');
  });

  it('reports when no commands are registered yet', async () => {
    _resetPrefixCommandRegistry();
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!help', member: plain() }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Prefix Commands Loading');
    expect(embedText(sent[0])).not.toContain('!help');
  });

  it('is reachable through its aliases', async () => {
    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!h', member: plain() }), deps, bot);
    expect(embedTitles(sent[0]).join()).toContain('Prefix Commands');
  });
});

describe('handleMessageCreate() error handling', () => {
  it('reports a thrown command failure back to the channel', async () => {
    registerPrefixCommand({
      name: 'boom',
      description: 'always throws',
      usage: 'p boom',
      managerOnly: false,
      execute: async () => {
        throw new Error('kaboom');
      },
    });

    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!boom', member: plain() }), deps, bot);

    expect(embedTitles(sent[0]).join()).toContain('Command Failed');
    expect(embedDescriptions(sent[0]).join()).toContain('kaboom');
    expect(bot.logger.error).toHaveBeenCalled();
  });

  it('sends nothing when a command returns no embeds', async () => {
    registerPrefixCommand({
      name: 'quiet',
      description: 'returns nothing',
      usage: 'p quiet',
      managerOnly: false,
      execute: async () => [],
    });

    const { bot, sent } = makeBot();
    await handleMessageCreate(makeMessage({ content: '!quiet', member: plain() }), deps, bot);
    expect(sent).toHaveLength(0);
  });
});
