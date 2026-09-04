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
  ticketsHubChannelId?: string | null;
  ticketManagerRoleId?: string | null;
  modLogChannelId?: string | null;
  welcomeChannelId?: string | null;
  updatedAt?: string;
}

export interface TicketRecord {
  id?: number;
  guildId: string;
  channelId: string;
  threadId: string;
  userId: string;
  status?: 'open' | 'closed';
  subject?: string;
  createdAt?: string;
  closedAt?: string | null;
  closedBy?: string | null;
}

export interface ModerationLogEntry {
  id?: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  action: 'kick' | 'ban' | 'unban' | 'timeout' | 'untimeout' | 'purge' | 'warn';
  reason?: string;
  durationMinutes?: number;
  timestamp?: string;
}

export interface WarningEntry {
  id?: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  timestamp?: string;
}

export interface UserSettings {
  userId: string;
  defaultAiProvider?: string;
  defaultModel?: string;
  notificationsEnabled?: boolean;
  updatedAt?: string;
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
        tickets_hub_channel_id TEXT,
        ticket_manager_role_id TEXT,
        mod_log_channel_id TEXT,
        welcome_channel_id TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        thread_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        subject TEXT,
        created_at TEXT,
        closed_at TEXT,
        closed_by TEXT
      );

      CREATE TABLE IF NOT EXISTS moderation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT,
        duration_minutes INTEGER,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        default_ai_provider TEXT,
        default_model TEXT,
        notifications_enabled INTEGER DEFAULT 1,
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

    // Column migrations for pre-existing databases
    const columnsToAdd = [
      'tickets_hub_channel_id TEXT',
      'ticket_manager_role_id TEXT',
      'mod_log_channel_id TEXT',
      'welcome_channel_id TEXT',
    ];
    for (const col of columnsToAdd) {
      try {
        this.db.exec(`ALTER TABLE guild_settings ADD COLUMN ${col}`);
      } catch {
        // Ignored if column already exists
      }
    }

    try {
      this.db.exec(`ALTER TABLE user_settings ADD COLUMN default_model TEXT`);
    } catch {
      // Ignored if column already exists
    }

    try {
      this.db.exec(`
        INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
        VALUES ('db_version', '1.0.0', datetime('now'));

        INSERT OR REPLACE INTO bot_kv (key, value, updated_at)
        VALUES ('bot_version', '0.1.0', datetime('now'));
      `);
    } catch {
      // Ignored if table write fails
    }
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

  public getGuildSettings(guildId: string): GuildSettings | null {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
      const row: any = stmt.get(guildId);
      if (!row) return null;
      return {
        guildId: row.guild_id,
        prefix: row.prefix,
        aiProvider: row.ai_provider,
        callbackUrl: row.callback_url,
        ticketsHubChannelId: row.tickets_hub_channel_id,
        ticketManagerRoleId: row.ticket_manager_role_id,
        modLogChannelId: row.mod_log_channel_id,
        welcomeChannelId: row.welcome_channel_id,
        updatedAt: row.updated_at,
        ...row,
      };
    } catch {
      return null;
    }
  }

  public setGuildSettings(settings: GuildSettings): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO guild_settings (
          guild_id, prefix, ai_provider, callback_url,
          tickets_hub_channel_id, ticket_manager_role_id, mod_log_channel_id, welcome_channel_id,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET
          prefix = COALESCE(excluded.prefix, guild_settings.prefix),
          ai_provider = COALESCE(excluded.ai_provider, guild_settings.ai_provider),
          callback_url = COALESCE(excluded.callback_url, guild_settings.callback_url),
          tickets_hub_channel_id = COALESCE(excluded.tickets_hub_channel_id, guild_settings.tickets_hub_channel_id),
          ticket_manager_role_id = COALESCE(excluded.ticket_manager_role_id, guild_settings.ticket_manager_role_id),
          mod_log_channel_id = COALESCE(excluded.mod_log_channel_id, guild_settings.mod_log_channel_id),
          welcome_channel_id = COALESCE(excluded.welcome_channel_id, guild_settings.welcome_channel_id),
          updated_at = datetime('now')
      `);
      stmt.run(
        settings.guildId,
        settings.prefix !== undefined ? settings.prefix : null,
        settings.aiProvider !== undefined ? settings.aiProvider : null,
        settings.callbackUrl !== undefined ? settings.callbackUrl : null,
        settings.ticketsHubChannelId !== undefined ? settings.ticketsHubChannelId : null,
        settings.ticketManagerRoleId !== undefined ? settings.ticketManagerRoleId : null,
        settings.modLogChannelId !== undefined ? settings.modLogChannelId : null,
        settings.welcomeChannelId !== undefined ? settings.welcomeChannelId : null
      );
    } catch {
      // Silently ignore write failures
    }
  }

  // --- TICKET SYSTEM METHODS ---
  public createTicket(ticket: TicketRecord): number | null {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO tickets (guild_id, channel_id, thread_id, user_id, status, subject, created_at)
        VALUES (?, ?, ?, ?, 'open', ?, datetime('now'))
      `);
      const info: any = stmt.run(ticket.guildId, ticket.channelId, ticket.threadId, ticket.userId, ticket.subject || 'Support Ticket');
      return Number(info?.lastInsertRowid || 0);
    } catch {
      return null;
    }
  }

  public getTicketByThread(threadId: string): TicketRecord | null {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare('SELECT * FROM tickets WHERE thread_id = ?');
      const row: any = stmt.get(threadId);
      if (!row) return null;
      return {
        id: row.id,
        guildId: row.guild_id,
        channelId: row.channel_id,
        threadId: row.thread_id,
        userId: row.user_id,
        status: row.status,
        subject: row.subject,
        createdAt: row.created_at,
        closedAt: row.closed_at,
        closedBy: row.closed_by,
      };
    } catch {
      return null;
    }
  }

  public getUserActiveTicket(guildId: string, userId: string): TicketRecord | null {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open' LIMIT 1");
      const row: any = stmt.get(guildId, userId);
      if (!row) return null;
      return {
        id: row.id,
        guildId: row.guild_id,
        channelId: row.channel_id,
        threadId: row.thread_id,
        userId: row.user_id,
        status: row.status,
        subject: row.subject,
        createdAt: row.created_at,
        closedAt: row.closed_at,
        closedBy: row.closed_by,
      };
    } catch {
      return null;
    }
  }

  public getTicketsByGuild(guildId: string, status?: 'open' | 'closed'): TicketRecord[] {
    if (!this.db) return [];
    try {
      let rows: any[];
      if (status) {
        const stmt = this.db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND status = ? ORDER BY id DESC');
        rows = stmt.all(guildId, status);
      } else {
        const stmt = this.db.prepare('SELECT * FROM tickets WHERE guild_id = ? ORDER BY id DESC');
        rows = stmt.all(guildId);
      }
      return rows.map((r: any) => ({
        id: r.id,
        guildId: r.guild_id,
        channelId: r.channel_id,
        threadId: r.thread_id,
        userId: r.user_id,
        status: r.status,
        subject: r.subject,
        createdAt: r.created_at,
        closedAt: r.closed_at,
        closedBy: r.closed_by,
      }));
    } catch {
      return [];
    }
  }

  public closeTicket(threadId: string, closedBy: string): boolean {
    if (!this.db) return false;
    try {
      const stmt = this.db.prepare(`
        UPDATE tickets SET status = 'closed', closed_at = datetime('now'), closed_by = ? WHERE thread_id = ?
      `);
      stmt.run(closedBy, threadId);
      return true;
    } catch {
      return false;
    }
  }

  public getTicketStats(guildId?: string): { total: number; open: number; closed: number } {
    if (!this.db) return { total: 0, open: 0, closed: 0 };
    try {
      if (guildId) {
        const total = (this.db.prepare('SELECT COUNT(*) as count FROM tickets WHERE guild_id = ?').get(guildId) as any)?.count || 0;
        const open = (this.db.prepare("SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = 'open'").get(guildId) as any)?.count || 0;
        const closed = (this.db.prepare("SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = 'closed'").get(guildId) as any)?.count || 0;
        return { total, open, closed };
      }
      const total = (this.db.prepare('SELECT COUNT(*) as count FROM tickets').get() as any)?.count || 0;
      const open = (this.db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'").get() as any)?.count || 0;
      const closed = (this.db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'").get() as any)?.count || 0;
      return { total, open, closed };
    } catch {
      return { total: 0, open: 0, closed: 0 };
    }
  }

  // --- MODERATION & WARNING METHODS ---
  public logModeration(entry: ModerationLogEntry): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO moderation_logs (guild_id, user_id, moderator_id, action, reason, duration_minutes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(
        entry.guildId,
        entry.userId,
        entry.moderatorId,
        entry.action,
        entry.reason || 'No reason provided',
        entry.durationMinutes || null
      );
    } catch {
      // Silently ignore log errors
    }
  }

  public getModerationLogs(guildId: string, limit: number = 20): ModerationLogEntry[] {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM moderation_logs WHERE guild_id = ? ORDER BY id DESC LIMIT ?');
      const rows: any[] = stmt.all(guildId, limit);
      return rows.map(r => ({
        id: r.id,
        guildId: r.guild_id,
        userId: r.user_id,
        moderatorId: r.moderator_id,
        action: r.action,
        reason: r.reason,
        durationMinutes: r.duration_minutes,
        timestamp: r.timestamp,
      }));
    } catch {
      return [];
    }
  }

  public addWarning(entry: WarningEntry): number | null {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
      const info: any = stmt.run(entry.guildId, entry.userId, entry.moderatorId, entry.reason);
      return Number(info?.lastInsertRowid || 0);
    } catch {
      return null;
    }
  }

  public getWarnings(guildId: string, userId: string): WarningEntry[] {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC');
      const rows: any[] = stmt.all(guildId, userId);
      return rows.map(r => ({
        id: r.id,
        guildId: r.guild_id,
        userId: r.user_id,
        moderatorId: r.moderator_id,
        reason: r.reason,
        timestamp: r.timestamp,
      }));
    } catch {
      return [];
    }
  }

  public clearWarnings(guildId: string, userId: string): number {
    if (!this.db) return 0;
    try {
      const stmt = this.db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?');
      const info: any = stmt.run(guildId, userId);
      return Number(info?.changes || 0);
    } catch {
      return 0;
    }
  }

  // --- USER SETTINGS METHODS ---
  public getUserSettings(userId: string): UserSettings | null {
    if (!this.db) return null;
    try {
      const stmt = this.db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
      const row: any = stmt.get(userId);
      if (!row) return null;
      return {
        userId: row.user_id,
        defaultAiProvider: row.default_ai_provider,
        defaultModel: row.default_model,
        notificationsEnabled: row.notifications_enabled === 1,
        updatedAt: row.updated_at,
      };
    } catch {
      return null;
    }
  }

  public setUserSettings(settings: UserSettings): void {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT INTO user_settings (user_id, default_ai_provider, default_model, notifications_enabled, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          default_ai_provider = COALESCE(excluded.default_ai_provider, user_settings.default_ai_provider),
          default_model = COALESCE(excluded.default_model, user_settings.default_model),
          notifications_enabled = COALESCE(excluded.notifications_enabled, user_settings.notifications_enabled),
          updated_at = datetime('now')
      `);
      stmt.run(
        settings.userId,
        settings.defaultAiProvider || null,
        settings.defaultModel || null,
        settings.notificationsEnabled !== undefined ? (settings.notificationsEnabled ? 1 : 0) : 1
      );
    } catch {
      // Silently ignore write errors
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
    ticketCount: number;
    moderationCount: number;
    warningCount: number;
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
    let ticketCount = 0;
    let moderationCount = 0;
    let warningCount = 0;

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

        const tRow: any = this.db.prepare('SELECT COUNT(*) as count FROM tickets').get();
        ticketCount = tRow?.count || 0;

        const mRow: any = this.db.prepare('SELECT COUNT(*) as count FROM moderation_logs').get();
        moderationCount = mRow?.count || 0;

        const wRow: any = this.db.prepare('SELECT COUNT(*) as count FROM warnings').get();
        warningCount = wRow?.count || 0;
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
      ticketCount,
      moderationCount,
      warningCount,
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
