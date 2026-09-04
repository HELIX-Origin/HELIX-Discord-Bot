import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { BotDatabase } from '../../HELIX/src/db/index.js';

describe('Discord Bot Per-User Authentication Sessions', () => {
  let tempDir: string;
  let tempDbPath: string;
  let db: BotDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-user-session-test-'));
    tempDbPath = path.join(tempDir, 'user-sessions.sqlite');
    db = new BotDatabase(tempDbPath);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('stores and retrieves member sessions per user and provider', () => {
    db.setUserSession({
      userId: 'user_123',
      username: 'DiscordMember1',
      guildId: 'guild_abc',
      provider: 'copilot',
      token: 'gho_secret_token_123',
    });

    const session = db.getUserSession('user_123', 'copilot');
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user_123');
    expect(session?.provider).toBe('copilot');
    expect(session?.token).toBe('gho_secret_token_123');
  });

  it('allows a user to have multiple sessions for different AI providers', () => {
    db.setUserSession({
      userId: 'user_123',
      username: 'DiscordMember1',
      provider: 'copilot',
      token: 'token_copilot',
    });

    db.setUserSession({
      userId: 'user_123',
      username: 'DiscordMember1',
      provider: 'antigravity',
      token: 'token_antigravity',
    });

    const sessions = db.getUserSessions('user_123');
    expect(sessions.length).toBe(2);
    const providers = sessions.map(s => s.provider);
    expect(providers).toContain('copilot');
    expect(providers).toContain('antigravity');
  });

  it('updates token for existing user and provider without duplicating', () => {
    db.setUserSession({
      userId: 'user_456',
      username: 'DiscordMember2',
      provider: 'antigravity',
      token: 'initial_key',
    });

    db.setUserSession({
      userId: 'user_456',
      username: 'DiscordMember2',
      provider: 'antigravity',
      token: 'updated_key',
    });

    const sessions = db.getUserSessions('user_456');
    expect(sessions.length).toBe(1);
    expect(sessions[0].token).toBe('updated_key');
  });

  it('deletes specific provider session and all sessions on logout', () => {
    db.setUserSession({
      userId: 'user_789',
      username: 'DiscordMember3',
      provider: 'copilot',
      token: 'token_1',
    });
    db.setUserSession({
      userId: 'user_789',
      username: 'DiscordMember3',
      provider: 'opencode',
      token: 'token_2',
    });

    expect(db.getUserSessions('user_789').length).toBe(2);

    // Delete single provider session
    db.deleteUserSession('user_789', 'copilot');
    expect(db.getUserSessions('user_789').length).toBe(1);
    expect(db.getUserSession('user_789', 'copilot')).toBeNull();

    // Delete all sessions for user
    db.deleteUserSession('user_789');
    expect(db.getUserSessions('user_789').length).toBe(0);
  });

  it('tracks session count in database stats', () => {
    expect(db.getStats().sessionCount).toBe(0);

    db.setUserSession({
      userId: 'user_1',
      username: 'Member1',
      provider: 'antigravity',
      token: 'tok1',
    });
    db.setUserSession({
      userId: 'user_2',
      username: 'Member2',
      provider: 'copilot',
      token: 'tok2',
    });

    expect(db.getStats().sessionCount).toBe(2);
  });
});
