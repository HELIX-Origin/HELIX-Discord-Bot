/**
 * src/bot/commands/prefix/set.ts
 *
 * `[prefix]set` — the guild configuration surface for prefix commands.
 *
 * - `set prefix <new_prefix>`      change the guild command prefix
 * - `set manager_role <role_id>`   grant prefix access to a role (`none` clears)
 * - `set <feature_id> <state>`     enable or disable a feature for the guild
 * - `set`                          show the current configuration
 */

import { EmbedHandler } from '../../lib/embeds/builder.js';
import {
  findPrefixFeature,
  isFeatureEnabled,
  listFeatureStates,
  PREFIX_FEATURES,
  setFeatureEnabled,
} from '../../lib/prefix/features.js';
import { findCachedRoleName, resolveRoleId } from '../../lib/prefix/parser.js';
import {
  DEFAULT_COMMAND_PREFIX,
  getGuildPrefix,
  getManagerRoleId,
  resetGuildPrefix,
  setGuildPrefix,
  setManagerRoleId,
  validateCommandPrefix,
} from '../../lib/prefix/settings.js';
import type { PrefixCommand, PrefixCommandContext } from '../../lib/prefix/types.js';
import type { DiscordEmbed } from '../../utils/types.js';

const ENABLED_STATES = new Set(['enabled', 'enable', 'on', 'true', 'yes', '1']);
const DISABLED_STATES = new Set(['disabled', 'disable', 'off', 'false', 'no', '0']);

/** Normalises a state word, or null when it is neither on nor off. */
function parseState(raw: string): boolean | null {
  const value = raw.trim().toLowerCase();
  if (ENABLED_STATES.has(value)) return true;
  if (DISABLED_STATES.has(value)) return false;
  return null;
}

/** `[prefix]set <feature_id> <enabled|disabled>` */
function handleFeatureToggle(ctx: PrefixCommandContext, featureId: string, state: string): DiscordEmbed {
  const feature = findPrefixFeature(featureId);
  if (!feature) {
    return EmbedHandler.for(ctx.deps)
      .error()
      .title('Unknown Feature', '❓')
      .description(`\`${featureId}\` is not a recognised feature id.`)
      .section('Available Features', PREFIX_FEATURES.map((f) => `\`${f.id}\``).join(', '))
      .build();
  }

  const enabled = parseState(state);
  if (enabled === null) {
    return EmbedHandler.for(ctx.deps)
      .error()
      .title('Invalid State', '❓')
      .description(`Expected \`enabled\` or \`disabled\`, but received \`${state}\`.`)
      .build();
  }

  setFeatureEnabled(ctx.deps, ctx.guildId, feature.id, enabled);

  const familyMembers = PREFIX_FEATURES.filter((f) => f.family === feature.family);
  const familyNote =
    familyMembers.length > 1
      ? ` This feature is one of ${familyMembers.length} in the \`${feature.family}\` gate, which stays enabled while any of them is on.`
      : '';

  return EmbedHandler.for(ctx.deps)
    .variant(enabled ? 'success' : 'warning')
    .title(enabled ? 'Feature Enabled' : 'Feature Disabled', enabled ? '✅' : '⏸️')
    .field('Feature', feature.label, true)
    .field('Feature ID', `\`${feature.id}\``, true)
    .field('State', enabled ? '🟢 Enabled' : '⏸️ Disabled', true)
    .field('Command', `\`${ctx.usagePrefix}set ${feature.id} ${enabled ? 'disabled' : 'enabled'}\``, true)
    .section('Notes', `Applies to this server only.${familyNote}`)
    .build();
}

/** `[prefix]set prefix <new_prefix>` */
function handleSetPrefix(ctx: PrefixCommandContext, rawPrefix: string | undefined): DiscordEmbed {
  if (!rawPrefix) {
    return EmbedHandler.for(ctx.deps)
      .error()
      .title('Missing Prefix', '❓')
      .description(`Usage: \`${ctx.usagePrefix}set prefix ?\``)
      .build();
  }

  if (rawPrefix.trim().toLowerCase() === 'default' || rawPrefix.trim().toLowerCase() === 'reset') {
    resetGuildPrefix(ctx.deps, ctx.guildId);
    return EmbedHandler.for(ctx.deps)
      .success()
      .title('Prefix Reset', '↩️')
      .description(`The command prefix for this server is back to \`${DEFAULT_COMMAND_PREFIX}\`.`)
      .field('Previous', `\`${ctx.prefix}\``, true)
      .field('Current', `\`${DEFAULT_COMMAND_PREFIX}\``, true)
      .build();
  }

  const validated = validateCommandPrefix(rawPrefix);
  if (!validated.ok) {
    return EmbedHandler.for(ctx.deps).error().title('Invalid Prefix', '❓').description(validated.error).build();
  }

  const previous = getGuildPrefix(ctx.deps, ctx.guildId);
  setGuildPrefix(ctx.deps, ctx.guildId, validated.prefix);

  return EmbedHandler.for(ctx.deps)
    .success()
    .title('Prefix Updated', '🔧')
    .description(`All future prefix commands in this server must use \`${validated.prefix}\`.`)
    .field('Previous', `\`${previous}\``, true)
    .field('New', `\`${validated.prefix}\``, true)
    .build();
}

/** `[prefix]set manager_role <role_id|none>` */
function handleSetManagerRole(ctx: PrefixCommandContext, rawRole: string | undefined): DiscordEmbed {
  if (!rawRole) {
    return EmbedHandler.for(ctx.deps)
      .error()
      .title('Missing Role', '❓')
      .description(
        `Usage: \`${ctx.usagePrefix}set manager_role @Managers\` or \`${ctx.usagePrefix}set manager_role none\``,
      )
      .build();
  }

  const trimmed = rawRole.trim();
  if (trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'clear') {
    const previous = getManagerRoleId(ctx.deps, ctx.guildId);
    setManagerRoleId(ctx.deps, ctx.guildId, null);
    return EmbedHandler.for(ctx.deps)
      .success()
      .title('Manager Role Cleared', '🧹')
      .description('Prefix commands now require **Manage Server** or **Administrator**.')
      .field('Previous', previous ? `<@&${previous}>` : 'None', true)
      .build();
  }

  const roleId = resolveRoleId(trimmed);
  if (!roleId) {
    return EmbedHandler.for(ctx.deps)
      .error()
      .title('Invalid Role', '❓')
      .description(`\`${trimmed}\` is not a valid role. Mention the role or paste its ID.`)
      .build();
  }

  const roleName = findCachedRoleName(ctx.member, roleId);
  setManagerRoleId(ctx.deps, ctx.guildId, roleId);

  return EmbedHandler.for(ctx.deps)
    .success()
    .title('Manager Role Updated', '🛡️')
    .description(`Members holding <@&${roleId}> can now run prefix commands without **Manage Server**.`)
    .field('Role', roleName ? `${roleName} (\`${roleId}\`)` : `\`${roleId}\``, true)
    .field('Clear With', `\`${ctx.usagePrefix}set manager_role none\``, true)
    .build();
}

/** `[prefix]set` — current configuration summary. */
function handleSummary(ctx: PrefixCommandContext): DiscordEmbed {
  const states = listFeatureStates(ctx.deps, ctx.guildId);
  const managerRoleId = getManagerRoleId(ctx.deps, ctx.guildId);

  const builder = EmbedHandler.for(ctx.deps)
    .primary()
    .title('Server Configuration', '⚙️')
    .field('Prefix', `\`${ctx.prefix}\``, true)
    .field('Manager Role', managerRoleId ? `<@&${managerRoleId}>` : 'Manage Server only', true);

  for (const state of states) {
    builder.field(
      `${state.enabled ? '🟢' : '⏸️'} ${state.label}`,
      `\`${state.id}\` — ${state.enabled ? 'Enabled' : 'Disabled'}`,
      true,
    );
  }

  return builder.section('Toggle a Feature', `\`${ctx.usagePrefix}set <feature_id> <enabled|disabled>\``).build();
}

export const setPrefixCommand: PrefixCommand = {
  name: 'set',
  aliases: ['config', 'settings'],
  description: 'Change the server prefix, manager role, or feature toggles',
  usage: 'p set <prefix|manager_role|feature_id> <value>',
  examples: ['p set prefix ?', 'p set manager_role @Managers', 'p set reddit_feeds disabled', 'p set'],
  managerOnly: true,
  execute: async (ctx) => {
    const [subcommand, ...rest] = ctx.invocation.args;
    const value = rest.join(' ');

    switch ((subcommand ?? '').toLowerCase()) {
      case '':
      case undefined:
        return handleSummary(ctx);
      case 'prefix':
      case 'command_prefix':
        return handleSetPrefix(ctx, value || undefined);
      case 'manager_role':
      case 'managerrole':
        return handleSetManagerRole(ctx, value || undefined);
      default: {
        const target = findPrefixFeature(subcommand);
        if (target && !value) {
          const enabled = isFeatureEnabled(ctx.deps, ctx.guildId, target.id);
          return EmbedHandler.for(ctx.deps)
            .info()
            .title('Feature Status', '🔍')
            .field('Feature', target.label, true)
            .field('Feature ID', `\`${target.id}\``, true)
            .field('State', enabled ? '🟢 Enabled' : '⏸️ Disabled', true)
            .field('Toggle With', `\`${ctx.usagePrefix}set ${target.id} ${enabled ? 'disabled' : 'enabled'}\``, false)
            .build();
        }
        return handleFeatureToggle(ctx, subcommand, value);
      }
    }
  },
};
