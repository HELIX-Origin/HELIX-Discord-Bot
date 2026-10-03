/**
 * src/bot/lib/prefix/features.ts
 *
 * Catalog of the per-guild feature toggles reachable from
 * `[prefix]set <feature_id> <enabled|disabled>`.
 *
 * Each feature owns its own `feature_<id>` guild setting so individual features
 * can be disabled without disturbing their siblings. Because several features
 * share a single enforcement gate in the feed watcher (for example every feed
 * family is gated by `feature_feeds`), toggles also refresh a derived family
 * aggregate. The family key is disabled only when *every* member feature of that
 * family is off, which keeps the existing runtime enforcement correct while the
 * per-feature keys hold the precise user-facing state.
 */

import type { AppDeps } from '../../../app.js';

export interface PrefixFeature {
  /** User-facing identifier typed after `[prefix]set`. */
  readonly id: string;
  /** Human readable label for embed fields and help output. */
  readonly label: string;
  /** Guild setting key holding this feature's precise state. */
  readonly settingKey: string;
  /** Enforcement gate this feature rolls up into. */
  readonly family: string;
  /** Alternative spellings accepted from users. */
  readonly aliases: readonly string[];
}

function feature(id: string, label: string, family: string, aliases: readonly string[] = []): PrefixFeature {
  return { id, label, settingKey: `feature_${id}`, family, aliases };
}

/**
 * Feature catalog.
 *
 * Families `feeds`, `streamalerts`, `welcome` and `ticket` map onto the setting
 * keys the feed watcher, welcome handler and ticket dispatcher already enforce.
 */
export const PREFIX_FEATURES: readonly PrefixFeature[] = [
  feature('news_feeds', 'News Feeds', 'feeds', ['news', 'rss']),
  feature('reddit_feeds', 'Reddit Feeds', 'feeds', ['reddit']),
  feature('game_feeds', 'Game Feeds', 'feeds', ['games', 'freegames', 'free_games']),
  feature('patch_notes_feeds', 'Patch Notes Feeds', 'feeds', ['patch_notes', 'patchnotes']),
  feature('stream_alerts', 'Stream Alerts', 'streamalerts', ['streams']),
  feature('youtube_feeds', 'YouTube Alerts', 'streamalerts', ['youtube']),
  feature('twitch_feeds', 'Twitch Alerts', 'streamalerts', ['twitch']),
  feature('welcome', 'Welcome Messages', 'welcome', ['welcomes']),
  feature('tickets', 'Ticket System', 'ticket', ['ticket']),
  feature('voice_hub', 'Voice Hub', 'voicehub', ['hub', 'voice']),
  feature('music', 'Music', 'music', ['music_support']),
];

/** Resolves a catalog entry by id or alias, case-insensitively. */
export function findPrefixFeature(idOrAlias: string): PrefixFeature | undefined {
  const needle = idOrAlias.trim().toLowerCase();
  if (!needle) return undefined;
  return PREFIX_FEATURES.find((f) => f.id === needle || f.aliases.some((alias) => alias.toLowerCase() === needle));
}

/** Guild setting key holding the derived aggregate for a family gate. */
export function familySettingKey(family: string): string {
  return `feature_${family}`;
}

/**
 * Reads a feature toggle.
 *
 * Features are opt-out: an absent setting means enabled, matching the existing
 * `=== '0'` checks throughout the runtime.
 */
export function isFeatureEnabled(deps: AppDeps, guildId: string, idOrAlias: string): boolean {
  const target = findPrefixFeature(idOrAlias);
  if (!target) return true;
  return deps.repo.getGuildSetting(guildId, target.settingKey) !== '0';
}

/**
 * Recomputes a family aggregate from its member features.
 *
 * The gate stays enabled while any member feature is on, so disabling one feed
 * family member never silently disables the rest.
 */
function syncFamilyAggregate(deps: AppDeps, guildId: string, family: string): void {
  const members = PREFIX_FEATURES.filter((f) => f.family === family);
  if (members.length === 0) return;

  const allDisabled = members.every((f) => deps.repo.getGuildSetting(guildId, f.settingKey) === '0');
  deps.repo.setGuildSetting(guildId, familySettingKey(family), allDisabled ? '0' : '1');
}

/**
 * Writes a feature toggle and refreshes its family aggregate.
 *
 * Returns the resolved feature, or null when the id is not in the catalog.
 */
export function setFeatureEnabled(
  deps: AppDeps,
  guildId: string,
  idOrAlias: string,
  enabled: boolean,
): PrefixFeature | null {
  const target = findPrefixFeature(idOrAlias);
  if (!target) return null;

  deps.repo.setGuildSetting(guildId, target.settingKey, enabled ? '1' : '0');
  syncFamilyAggregate(deps, guildId, target.family);
  return target;
}

export interface PrefixFeatureState extends PrefixFeature {
  readonly enabled: boolean;
  readonly familyEnabled: boolean;
}

/** Current state of every catalog feature for a guild, for status output. */
export function listFeatureStates(deps: AppDeps, guildId: string): PrefixFeatureState[] {
  return PREFIX_FEATURES.map((f) => ({
    ...f,
    enabled: deps.repo.getGuildSetting(guildId, f.settingKey) !== '0',
    familyEnabled: deps.repo.getGuildSetting(guildId, familySettingKey(f.family)) !== '0',
  }));
}
