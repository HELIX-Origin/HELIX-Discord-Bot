import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { BotDatabase } from '../../HELIX/src/db/database.js';

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
      provider: 'discord',
      token: 'oauth_secret_token_123',
    });

    const session = db.getUserSession('user_123', 'discord');
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user_123');
    expect(session?.provider).toBe('discord');
    expect(session?.token).toBe('oauth_secret_token_123');
  });

  it('updates token for existing user and provider without duplicating', () => {
    db.setUserSession({
      userId: 'user_456',
      username: 'DiscordMember2',
      provider: 'discord',
      token: 'initial_token',
    });

    db.setUserSession({
      userId: 'user_456',
      username: 'DiscordMember2',
      provider: 'discord',
      token: 'updated_token',
    });

    const sessions = db.getUserSessions('user_456');
    expect(sessions.length).toBe(1);
    expect(sessions[0].token).toBe('updated_token');
  });

  it('deletes session on revocation/logout', () => {
    db.setUserSession({
      userId: 'user_789',
      username: 'DiscordMember3',
      provider: 'discord',
      token: 'token_1',
    });

    expect(db.getUserSessions('user_789').length).toBe(1);

    // Delete session
    db.deleteUserSession('user_789', 'discord');
    expect(db.getUserSessions('user_789').length).toBe(0);
    expect(db.getUserSession('user_789', 'discord')).toBeNull();
  });

  it('tracks session count in database stats', () => {
    expect(db.getStats().sessionCount).toBe(0);

    db.setUserSession({
      userId: 'user_1',
      username: 'Member1',
      provider: 'discord',
      token: 'tok1',
    });
    db.setUserSession({
      userId: 'user_2',
      username: 'Member2',
      provider: 'discord',
      token: 'tok2',
    });

    expect(db.getStats().sessionCount).toBe(2);
  });
});
