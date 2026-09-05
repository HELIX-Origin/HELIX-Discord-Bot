import fs from 'fs';
import path from 'path';
import { getDbPath } from '../env.js';
import { logs } from '../handlers/logs-handler.js';

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
  callbackUrl?: string;
  ticketsHubChannelId?: string | null;
  ticketManagerRoleId?: string | null;
  modLogChannelId?: string | null;
  welcomeChannelId?: string | null;
  enabledSlashCategories?: string[] | null;
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
  notificationsEnabled?: boolean;
  updatedAt?: string;
}

export interface PluginRepositoryEntry {
  id?: number;
  repoName: string;
  guildId?: string | null;
  configJson: string;
  manifestJson: string;
  entrySource: string;
  enabled?: boolean;
  createdAt?: string;
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
    if (!BotDatabase.instance || !BotDatabase.instance.db) {
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
        prefix TEXT DEFAULT '>',
        callback_url TEXT,
        tickets_hub_channel_id TEXT,
        ticket_manager_role_id TEXT,
        mod_log_channel_id TEXT,
        welcome_channel_id TEXT,
        enabled_slash_categories TEXT,
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

      CREATE TABLE IF NOT EXISTS plugin_repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_name TEXT NOT NULL,
        guild_id TEXT,
        config_json TEXT NOT NULL,
        manifest_json TEXT NOT NULL,
        entry_source TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    // Column migrations for pre-existing databases
    const columnsToAdd = [
      'tickets_hub_channel_id TEXT',
      'ticket_manager_role_id TEXT',
      'mod_log_channel_id TEXT',
      'welcome_channel_id TEXT',
      'enabled_slash_categories TEXT',
    ];
    for (const col of columnsToAdd) {
      try {
        this.db.exec(`ALTER TABLE guild_settings ADD COLUMN ${col}`);
      } catch {
        // Ignored if column already exists
      }
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

      let enabledSlashCategories: string[] | null = null;
      if (row.enabled_slash_categories) {
        try {
          enabledSlashCategories = JSON.parse(row.enabled_slash_categories);
        } catch {
          enabledSlashCategories = row.enabled_slash_categories.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      return {
        guildId: row.guild_id,
        prefix: row.prefix,
        callbackUrl: row.callback_url,
        ticketsHubChannelId: row.tickets_hub_channel_id,
        ticketManagerRoleId: row.ticket_manager_role_id,
        modLogChannelId: row.mod_log_channel_id,
        welcomeChannelId: row.welcome_channel_id,
        enabledSlashCategories,
        updatedAt: row.updated_at,
      };
    } catch (err: any) {
      logs.error(`Failed to get guild settings for ${guildId}: ${err?.message || err}`);
      return null;
    }
  }

  public setGuildSettings(settings: GuildSettings): void {
    if (!this.db) return;
    try {
      const slashCatJson = settings.enabledSlashCategories !== undefined
        ? (settings.enabledSlashCategories ? JSON.stringify(settings.enabledSlashCategories) : null)
        : null;

      const stmt = this.db.prepare(`
        INSERT INTO guild_settings (
          guild_id, prefix, callback_url,
          tickets_hub_channel_id, ticket_manager_role_id, mod_log_channel_id, welcome_channel_id,
          enabled_slash_categories, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET
          prefix = COALESCE(excluded.prefix, guild_settings.prefix),
          callback_url = COALESCE(excluded.callback_url, guild_settings.callback_url),
          tickets_hub_channel_id = COALESCE(excluded.tickets_hub_channel_id, guild_settings.tickets_hub_channel_id),
          ticket_manager_role_id = COALESCE(excluded.ticket_manager_role_id, guild_settings.ticket_manager_role_id),
          mod_log_channel_id = COALESCE(excluded.mod_log_channel_id, guild_settings.mod_log_channel_id),
          welcome_channel_id = COALESCE(excluded.welcome_channel_id, guild_settings.welcome_channel_id),
          enabled_slash_categories = CASE WHEN excluded.enabled_slash_categories IS NOT NULL THEN excluded.enabled_slash_categories ELSE guild_settings.enabled_slash_categories END,
          updated_at = datetime('now')
      `);
      stmt.run(
        settings.guildId,
        settings.prefix !== undefined ? settings.prefix : null,
        settings.callbackUrl !== undefined ? settings.callbackUrl : null,
        settings.ticketsHubChannelId !== undefined ? settings.ticketsHubChannelId : null,
        settings.ticketManagerRoleId !== undefined ? settings.ticketManagerRoleId : null,
        settings.modLogChannelId !== undefined ? settings.modLogChannelId : null,
        settings.welcomeChannelId !== undefined ? settings.welcomeChannelId : null,
        slashCatJson
      );
    } catch (err: any) {
      logs.error(`Failed to set guild settings for ${settings.guildId}: ${err?.message || err}`);
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
      const stmt = this.db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1");
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
        INSERT INTO user_settings (user_id, notifications_enabled, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          notifications_enabled = COALESCE(excluded.notifications_enabled, user_settings.notifications_enabled),
          updated_at = datetime('now')
      `);
      stmt.run(
        settings.userId,
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
    scaffoldCount: number;
    guildCount: number;
    sessionCount: number;
    ticketCount: number;
    moderationCount: number;
    warningCount: number;
    pluginRepoCount: number;
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

    let scaffoldCount = 0;
    let guildCount = 0;
    let sessionCount = 0;
    let ticketCount = 0;
    let moderationCount = 0;
    let warningCount = 0;
    let pluginRepoCount = 0;

    if (this.db) {
      try {
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

        const pRow: any = this.db.prepare('SELECT COUNT(*) as count FROM plugin_repositories').get();
        pluginRepoCount = pRow?.count || 0;
      } catch {
        // Fallback to 0 if tables aren't readable
      }
    }

    return {
      dbPath: this.dbPath,
      exists,
      sizeBytes,
      scaffoldCount,
      guildCount,
      sessionCount,
      ticketCount,
      moderationCount,
      warningCount,
      pluginRepoCount,
    };
  }

  // --- PLUGIN REPOSITORY METHODS ---
  public addPluginRepository(entry: PluginRepositoryEntry): number | null {
    if (!this.db) return null;
    try {
      const existing = this.getPluginRepository(entry.repoName, entry.guildId);
      if (existing && existing.id) {
        const stmt = this.db.prepare(`
          UPDATE plugin_repositories
          SET config_json = ?, manifest_json = ?, entry_source = ?, enabled = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        stmt.run(
          entry.configJson,
          entry.manifestJson,
          entry.entrySource,
          entry.enabled === undefined || entry.enabled ? 1 : 0,
          existing.id
        );
        return existing.id;
      } else {
        const stmt = this.db.prepare(`
          INSERT INTO plugin_repositories (repo_name, guild_id, config_json, manifest_json, entry_source, enabled, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);
        const info: any = stmt.run(
          entry.repoName,
          entry.guildId || null,
          entry.configJson,
          entry.manifestJson,
          entry.entrySource,
          entry.enabled === undefined || entry.enabled ? 1 : 0
        );
        return Number(info?.lastInsertRowid || 0);
      }
    } catch {
      return null;
    }
  }

  public getPluginRepository(repoName: string, guildId?: string | null): PluginRepositoryEntry | null {
    if (!this.db) return null;
    try {
      let stmt;
      let row: any;
      if (guildId !== undefined && guildId !== null) {
        stmt = this.db.prepare('SELECT * FROM plugin_repositories WHERE repo_name = ? AND guild_id = ?');
        row = stmt.get(repoName, guildId);
      } else {
        stmt = this.db.prepare('SELECT * FROM plugin_repositories WHERE repo_name = ? AND guild_id IS NULL');
        row = stmt.get(repoName);
      }
      if (!row) return null;
      return {
        id: row.id,
        repoName: row.repo_name,
        guildId: row.guild_id,
        configJson: row.config_json,
        manifestJson: row.manifest_json,
        entrySource: row.entry_source,
        enabled: row.enabled === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch {
      return null;
    }
  }

  public listPluginRepositories(guildId?: string | null): PluginRepositoryEntry[] {
    if (!this.db) return [];
    try {
      let stmt;
      let rows: any[];
      if (guildId !== undefined && guildId !== null) {
        stmt = this.db.prepare('SELECT * FROM plugin_repositories WHERE guild_id = ? OR guild_id IS NULL ORDER BY id ASC');
        rows = stmt.all(guildId);
      } else {
        stmt = this.db.prepare('SELECT * FROM plugin_repositories WHERE guild_id IS NULL ORDER BY id ASC');
        rows = stmt.all();
      }
      return (rows || []).map((row: any) => ({
        id: row.id,
        repoName: row.repo_name,
        guildId: row.guild_id,
        configJson: row.config_json,
        manifestJson: row.manifest_json,
        entrySource: row.entry_source,
        enabled: row.enabled === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      return [];
    }
  }

  public removePluginRepository(repoName: string, guildId?: string | null): boolean {
    if (!this.db) return false;
    try {
      let stmt;
      let info: any;
      if (guildId !== undefined && guildId !== null) {
        stmt = this.db.prepare('DELETE FROM plugin_repositories WHERE repo_name = ? AND (guild_id = ? OR guild_id IS NULL)');
        info = stmt.run(repoName, guildId);
      } else {
        stmt = this.db.prepare('DELETE FROM plugin_repositories WHERE repo_name = ?');
        info = stmt.run(repoName);
      }
      return Boolean(info && info.changes > 0);
    } catch {
      return false;
    }
  }

  public setPluginRepositoryEnabled(repoName: string, enabled: boolean, guildId?: string | null): boolean {
    if (!this.db) return false;
    try {
      let stmt;
      let info: any;
      if (guildId !== undefined && guildId !== null) {
        stmt = this.db.prepare('UPDATE plugin_repositories SET enabled = ?, updated_at = datetime(\'now\') WHERE repo_name = ? AND (guild_id = ? OR guild_id IS NULL)');
        info = stmt.run(enabled ? 1 : 0, repoName, guildId);
      } else {
        stmt = this.db.prepare('UPDATE plugin_repositories SET enabled = ?, updated_at = datetime(\'now\') WHERE repo_name = ?');
        info = stmt.run(enabled ? 1 : 0, repoName);
      }
      return Boolean(info && info.changes > 0);
    } catch {
      return false;
    }
  }

  public getAllStoredPluginRepositories(): PluginRepositoryEntry[] {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare('SELECT * FROM plugin_repositories ORDER BY id ASC');
      const rows: any[] = stmt.all();
      return (rows || []).map((row: any) => ({
        id: row.id,
        repoName: row.repo_name,
        guildId: row.guild_id,
        configJson: row.config_json,
        manifestJson: row.manifest_json,
        entrySource: row.entry_source,
        enabled: row.enabled === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      return [];
    }
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
    if (BotDatabase.instance === this) {
      BotDatabase.instance = null;
    }
  }
}
