import { BotDatabase, type GuildSettings } from '../db/database.js';
import { logs } from './logs-handler.js';

export const DEFAULT_PREFIX = '>';

/**
 * Central In-Memory Bot Session State Engine for all Guild Settings.
 *
 * All bot handlers, commands, events, interactions, and dashboard endpoints
 * consume settings directly from this live in-memory session manager with
 * automatic preloading and persistent synchronization to SQLite.
 */
export class GuildSettingsManager {
  private static instance: GuildSettingsManager | null = null;
  private cache: Map<string, GuildSettings> = new Map();
  private hydrated: boolean = false;

  private constructor() {
    BotDatabase.setOnSettingsUpdated((settings) => this.updateCacheFromDb(settings));
  }

  public static getInstance(): GuildSettingsManager {
    if (!GuildSettingsManager.instance) {
      GuildSettingsManager.instance = new GuildSettingsManager();
    }
    return GuildSettingsManager.instance;
  }

  /**
   * Preload and hydrate all guild settings from the SQLite database into memory.
   */
  public hydrateFromDatabase(): void {
    try {
      const db = BotDatabase.getInstance();
      const allSettings = db.getAllGuildSettings();
      for (const [guildId, settings] of allSettings.entries()) {
        this.cache.set(guildId, { ...settings });
      }
      this.hydrated = true;
      logs.info(`Bot Session State hydrated with ${this.cache.size} guild configuration(s).`);
    } catch (err: any) {
      logs.warn(`Bot Session State hydration warning: ${err?.message || err}`);
    }
  }

  public isHydrated(): boolean {
    return this.hydrated;
  }

  /**
   * Retrieve live guild settings from the in-memory session cache.
   * Lazily loads from SQLite if uncached.
   */
  public getGuildSettings(guildId?: string | null): GuildSettings {
    if (!guildId) {
      return { guildId: '', prefix: DEFAULT_PREFIX };
    }

    if (this.cache.has(guildId)) {
      return this.cache.get(guildId)!;
    }

    // Lazy load from DB if not already in session cache
    try {
      const db = BotDatabase.getInstance();
      const loaded = db.getGuildSettings(guildId);
      if (loaded) {
        this.cache.set(guildId, loaded);
        return loaded;
      }
    } catch {
      // Fallback on error
    }

    const defaultSettings: GuildSettings = {
      guildId,
      prefix: DEFAULT_PREFIX,
      ticketsHubChannelId: null,
      ticketManagerRoleId: null,
      modLogChannelId: null,
      welcomeChannelId: null,
      enabledSlashCategories: null,
    };
    this.cache.set(guildId, defaultSettings);
    return defaultSettings;
  }

  /**
   * Update guild settings in the bot's live session memory immediately,
   * then persist the updated record to the SQLite database.
   */
  public setGuildSettings(settings: GuildSettings): void {
    if (!settings.guildId) return;

    const current = this.getGuildSettings(settings.guildId);
    const merged: GuildSettings = {
      ...current,
      ...settings,
      prefix: settings.prefix !== undefined ? settings.prefix : (current.prefix || DEFAULT_PREFIX),
      callbackUrl: settings.callbackUrl !== undefined ? settings.callbackUrl : current.callbackUrl,
      ticketsHubChannelId: settings.ticketsHubChannelId !== undefined ? settings.ticketsHubChannelId : current.ticketsHubChannelId,
      ticketManagerRoleId: settings.ticketManagerRoleId !== undefined ? settings.ticketManagerRoleId : current.ticketManagerRoleId,
      modLogChannelId: settings.modLogChannelId !== undefined ? settings.modLogChannelId : current.modLogChannelId,
      welcomeChannelId: settings.welcomeChannelId !== undefined ? settings.welcomeChannelId : current.welcomeChannelId,
      enabledSlashCategories: settings.enabledSlashCategories !== undefined ? settings.enabledSlashCategories : current.enabledSlashCategories,
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately update the live bot session state in memory
    this.cache.set(settings.guildId, merged);

    // 2. Persist to SQLite
    try {
      const db = BotDatabase.getInstance();
      db.setGuildSettings(settings);
    } catch (err: any) {
      logs.error(`Failed to persist guild settings for ${settings.guildId} to database: ${err?.message || err}`);
    }
  }

  /**
   * Directly synchronize in-memory session cache when database is updated.
   */
  public updateCacheFromDb(settings: GuildSettings): void {
    if (!settings.guildId) return;
    const current = this.cache.get(settings.guildId) || { guildId: settings.guildId, prefix: DEFAULT_PREFIX };
    this.cache.set(settings.guildId, {
      ...current,
      ...settings,
      prefix: settings.prefix !== undefined ? settings.prefix : (current.prefix || DEFAULT_PREFIX),
      callbackUrl: settings.callbackUrl !== undefined ? settings.callbackUrl : current.callbackUrl,
      ticketsHubChannelId: settings.ticketsHubChannelId !== undefined ? settings.ticketsHubChannelId : current.ticketsHubChannelId,
      ticketManagerRoleId: settings.ticketManagerRoleId !== undefined ? settings.ticketManagerRoleId : current.ticketManagerRoleId,
      modLogChannelId: settings.modLogChannelId !== undefined ? settings.modLogChannelId : current.modLogChannelId,
      welcomeChannelId: settings.welcomeChannelId !== undefined ? settings.welcomeChannelId : current.welcomeChannelId,
      enabledSlashCategories: settings.enabledSlashCategories !== undefined ? settings.enabledSlashCategories : current.enabledSlashCategories,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Helper: Get active command prefix for a guild (defaults to DEFAULT_PREFIX).
   */
  public getPrefix(guildId?: string | null): string {
    if (!guildId) return DEFAULT_PREFIX;
    return this.getGuildSettings(guildId).prefix || DEFAULT_PREFIX;
  }

  /**
   * Helper: Get active tickets hub text channel ID for a guild.
   */
  public getTicketsHubChannelId(guildId?: string | null): string | null {
    if (!guildId) return null;
    return this.getGuildSettings(guildId).ticketsHubChannelId || null;
  }

  /**
   * Helper: Get active ticket manager staff role ID for a guild.
   */
  public getTicketManagerRoleId(guildId?: string | null): string | null {
    if (!guildId) return null;
    return this.getGuildSettings(guildId).ticketManagerRoleId || null;
  }

  /**
   * Helper: Get active moderation log channel ID for a guild.
   */
  public getModLogChannelId(guildId?: string | null): string | null {
    if (!guildId) return null;
    return this.getGuildSettings(guildId).modLogChannelId || null;
  }

  /**
   * Helper: Get active welcome channel ID for a guild.
   */
  public getWelcomeChannelId(guildId?: string | null): string | null {
    if (!guildId) return null;
    return this.getGuildSettings(guildId).welcomeChannelId || null;
  }

  /**
   * Helper: Get enabled optional slash command categories for a guild.
   */
  public getEnabledSlashCategories(guildId?: string | null): string[] | null {
    if (!guildId) return null;
    return this.getGuildSettings(guildId).enabledSlashCategories || null;
  }

  /**
   * Clear session cache (used for unit tests and environment teardowns).
   */
  public clearCache(): void {
    this.cache.clear();
    this.hydrated = false;
  }

  public hasCached(guildId: string): boolean {
    return this.cache.has(guildId);
  }
}

export const botSettings = GuildSettingsManager.getInstance();
