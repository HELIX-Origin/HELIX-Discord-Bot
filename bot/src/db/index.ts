import fs from 'fs';
import path from 'path';
import { getDbPath } from '../env.js';

export interface QueryLogEntry {
  userId: string;
  username: string;
  guildId?: string;
  prompt: string;
  provider: string;
}

export interface ScaffoldLogEntry {
  userId: string;
  templateId: string;
  projectName: string;
}

export interface UserSession {
  userId: string;
  username: string;
  guildId?: string;
  provider: string;
  token?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuildSettings {
  guildId: string;
  prefix?: string;
  aiProvider?: string;
  callbackUrl?: string;
}

export class BotDatabase {
  private static instance: BotDatabase | null = null;
  private db: any = null;
  private dbPath: string;

  constructor(customPath?: string) {
    this.dbPath = customPath || getDbPath();
    this.initialize();
  }

  public static getInstance(customPath?: string): BotDatabase {
    if (!BotDatabase.instance) {
      BotDatabase.instance = new BotDatabase(customPath);
    }
    return BotDatabase.instance;
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  private initialize(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      // Dynamic require or import of node:sqlite
      const { DatabaseSync } = (globalThis as any).DatabaseSync
        ? { DatabaseSync: (globalThis as any).DatabaseSync }
        : require('node:sqlite');

      this.db = new DatabaseSync(this.dbPath);
      this.ensureSchema();
    } catch {
      // Graceful fallback if node:sqlite isn't accessible
      this.db = null;
    }
  }

  private ensureSchema(): void {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '/',
        ai_provider TEXT,
        callback_url TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        user_id TEXT,
        provider TEXT,
        username TEXT,
        guild_id TEXT,
        token TEXT,
        created_at TEXT,
        updated_at TEXT,
        PRIMARY KEY (user_id, provider)
      );

      CREATE TABLE IF NOT EXISTS query_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        username TEXT,
        guild_id TEXT,
        prompt TEXT,
        provider TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS scaffold_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        template_id TEXT,
        project_name TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS bot_kv (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );
    `);
  }

  public logQuery(entry: QueryLogEntry): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO query_logs (user_id, username, guild_id, prompt, provider, timestamp)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(entry.userId, entry.username, entry.guildId || 'DM', entry.prompt, entry.provider);
    } catch {
      // Silently ignore logging failures in non-critical paths
    }
  }

  public logScaffold(entry: ScaffoldLogEntry): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO scaffold_history (user_id, template_id, project_name, timestamp)
        VALUES (?, ?, ?, datetime('now'))
      `);
      stmt.run(entry.userId, entry.templateId, entry.projectName);
    } catch {
      // Silently ignore logging failures
    }
  }

  public getGuildSettings(guildId: string): any {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
      return stmt.get(guildId);
    } catch {
      return null;
    }
  }

  public setGuildSettings(settings: GuildSettings): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO guild_settings (guild_id, prefix, ai_provider, callback_url, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET
          prefix = excluded.prefix,
          ai_provider = excluded.ai_provider,
          callback_url = excluded.callback_url,
          updated_at = datetime('now')
      `);
      stmt.run(
        settings.guildId,
        settings.prefix || '/',
        settings.aiProvider || null,
        settings.callbackUrl || null
      );
    } catch {
      // Silently ignore write failures
    }
  }

  public setUserSession(session: UserSession): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO user_sessions (user_id, provider, username, guild_id, token, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(user_id, provider) DO UPDATE SET
          token = excluded.token,
          username = excluded.username,
          guild_id = excluded.guild_id,
          updated_at = datetime('now')
      `);
      stmt.run(
        session.userId,
        session.provider,
        session.username,
        session.guildId || null,
        session.token || null
      );
    } catch {
      // Silently ignore write failures
    }
  }

  public getUserSession(userId: string, provider?: string): UserSession | null {
    if (!this.db) return null;
    try {
      if (provider) {
        const stmt = this.db.prepare('SELECT * FROM user_sessions WHERE user_id = ? AND provider = ?');
        const row: any = stmt.get(userId, provider);
        if (!row) return null;
        return {
          userId: row.user_id,
          provider: row.provider,
          username: row.username,
          guildId: row.guild_id,
          token: row.token,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } else {
        const stmt = this.db.prepare('SELECT * FROM user_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
        const row: any = stmt.get(userId);
        if (!row) return null;
        return {
          userId: row.user_id,
          provider: row.provider,
          username: row.username,
          guildId: row.guild_id,
          token: row.token,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } catch {
      return null;
    }
  }

  public getUserSessions(userId: string): UserSession[] {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM user_sessions WHERE user_id = ? ORDER BY provider ASC');
      const rows: any[] = stmt.all(userId);
      return rows.map(r => ({
        userId: r.user_id,
        provider: r.provider,
        username: r.username,
        guildId: r.guild_id,
        token: r.token,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch {
      return [];
    }
  }

  public deleteUserSession(userId: string, provider?: string): boolean {
    if (!this.db) return false;
    try {
      if (provider) {
        const stmt = this.db.prepare('DELETE FROM user_sessions WHERE user_id = ? AND provider = ?');
        stmt.run(userId, provider);
      } else {
        const stmt = this.db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
        stmt.run(userId);
      }
      return true;
    } catch {
      return false;
    }
  }

  public getAllUserSessions(): UserSession[] {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM user_sessions ORDER BY updated_at DESC');
      const rows: any[] = stmt.all();
      return rows.map(r => ({
        userId: r.user_id,
        provider: r.provider,
        username: r.username,
        guildId: r.guild_id,
        token: r.token,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch {
      return [];
    }
  }

  public getRecentQueries(limit: number = 20): Array<{
    id: number;
    userId: string;
    username: string;
    guildId: string;
    prompt: string;
    provider: string;
    timestamp: string;
  }> {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM query_logs ORDER BY id DESC LIMIT ?');
      const rows: any[] = stmt.all(limit);
      return rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        username: r.username,
        guildId: r.guild_id,
        prompt: r.prompt,
        provider: r.provider,
        timestamp: r.timestamp,
      }));
    } catch {
      return [];
    }
  }

  public getRecentScaffolds(limit: number = 20): Array<{
    id: number;
    userId: string;
    templateId: string;
    projectName: string;
    timestamp: string;
  }> {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM scaffold_history ORDER BY id DESC LIMIT ?');
      const rows: any[] = stmt.all(limit);
      return rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        templateId: r.template_id,
        projectName: r.project_name,
        timestamp: r.timestamp,
      }));
    } catch {
      return [];
    }
  }

  public getStats(): {
    dbPath: string;
    exists: boolean;
    sizeBytes: number;
    queryCount: number;
    scaffoldCount: number;
    guildCount: number;
    sessionCount: number;
  } {
    const exists = fs.existsSync(this.dbPath);
    let sizeBytes = 0;
    if (exists) {
      try {
        sizeBytes = fs.statSync(this.dbPath).size;
      } catch {
        sizeBytes = 0;
      }
    }

    let queryCount = 0;
    let scaffoldCount = 0;
    let guildCount = 0;
    let sessionCount = 0;

    if (this.db) {
      try {
        const qRow: any = this.db.prepare('SELECT COUNT(*) as count FROM query_logs').get();
        queryCount = qRow?.count || 0;

        const sRow: any = this.db.prepare('SELECT COUNT(*) as count FROM scaffold_history').get();
        scaffoldCount = sRow?.count || 0;

        const gRow: any = this.db.prepare('SELECT COUNT(*) as count FROM guild_settings').get();
        guildCount = gRow?.count || 0;

        const uRow: any = this.db.prepare('SELECT COUNT(*) as count FROM user_sessions').get();
        sessionCount = uRow?.count || 0;
      } catch {
        // Fallback to 0 if tables aren't readable
      }
    }

    return {
      dbPath: this.dbPath,
      exists,
      sizeBytes,
      queryCount,
      scaffoldCount,
      guildCount,
      sessionCount,
    };
  }

  public getKv(key: string): string | null {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare('SELECT value FROM bot_kv WHERE key = ?');
      const row: any = stmt.get(key);
      return row ? row.value : null;
    } catch {
      return null;
    }
  }

  public setKv(key: string, value: string): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO bot_kv (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `);
      stmt.run(key, value);
    } catch {
      // Silently ignore KV write errors
    }
  }

  public close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {
        // Ignore close errors
      }
      this.db = null;
    }
  }
}
