import type { AppDeps } from '../../../app.js';
import { EmbedHandler } from '../embeds/builder.js';
import type { DiscordEmbed } from '../../utils/types.js';

export const AUDIT_EVENTS = ['settings', 'welcome', 'tickets', 'feeds'] as const;
export type AuditEvent = (typeof AUDIT_EVENTS)[number];

export const AUDIT_EVENT_LABELS: Record<AuditEvent, string> = {
  settings: 'Server settings',
  welcome: 'Welcome messages',
  tickets: 'Ticket system & lifecycle',
  feeds: 'Feed & alert changes',
};

export interface AuditLogEntry {
  event: AuditEvent;
  message: string;
  guildName?: string | null;
  actorId?: string | null;
  actorTag?: string | null;
}

export function parseAuditEvents(raw: string | null): Set<AuditEvent> {
  const allowed = new Set<AuditEvent>(AUDIT_EVENTS);
  if (!raw || raw.trim() === '') return allowed;
  const selected = new Set<AuditEvent>();
  for (const part of raw.split(',')) {
    const key = part.trim();
    if ((AUDIT_EVENTS as readonly string[]).includes(key)) {
      selected.add(key as AuditEvent);
    }
  }
  return selected;
}

function eventAllowed(guildId: string, event: AuditEvent, deps: AppDeps): boolean {
  const raw = deps.repo.getGuildSetting(guildId, 'audit_log_events');
  const selected = parseAuditEvents(raw);
  return selected.has(event);
}

export function buildAuditLogEmbed(entry: AuditLogEntry, deps: AppDeps): DiscordEmbed {
  const h = EmbedHandler.for(deps).info().title(`${AUDIT_EVENT_LABELS[entry.event]} Audit`);

  if (entry.actorId && entry.actorTag) {
    h.field('Actor', `<@${entry.actorId}> (${entry.actorTag})`, true);
  }
  if (entry.guildName) {
    h.field('Server', entry.guildName, true);
  }

  h.section('Action', entry.message);
  h.footer(`Event: ${entry.event}`);

  return h.build();
}

export async function dispatchAuditLog(guildId: string, entry: AuditLogEntry, deps: AppDeps): Promise<void> {
  const auditLogChannelId = deps.repo.getGuildSetting(guildId, 'audit_log_channel_id');
  if (!auditLogChannelId || !deps.bot) return;
  if (!eventAllowed(guildId, entry.event, deps)) return;

  try {
    const embed = buildAuditLogEmbed(entry, deps);
    await deps.bot.rest.sendChannelMessage(auditLogChannelId, {
      embeds: [embed],
    });
  } catch (err) {
    deps.bot.logger.warn(`Failed to dispatch audit log to channel ${auditLogChannelId}`, {
      guildId,
      event: entry.event,
      err: (err as Error).message,
    });
  }
}
