/**
 * src/bot/handlers/prefix.ts
 *
 * Prefix command registry and `MessageCreate` dispatcher.
 *
 * Mirrors the slash command pipeline in `handlers/commands.ts`: commands are
 * discovered dynamically, registered into a registry, then dispatched by name
 * after a permission gate. Replies are sent through `EmbedHandler` so prefix
 * commands share the canonical embed layout with slash commands.
 */

import { PermissionFlagsBits, type Guild, type GuildMember, type Message } from 'discord.js';

import type { AppDeps } from '../../app.js';
import type { DiscordBot } from '../bot.js';
import { EmbedHandler } from '../lib/embeds/builder.js';
import { parsePrefixInvocation } from '../lib/prefix/parser.js';
import { getGuildPrefix, getManagerRoleId } from '../lib/prefix/settings.js';
import type { PrefixCommand, PrefixCommandContext } from '../lib/prefix/types.js';

const prefixCommandRegistry = new Map<string, PrefixCommand>();
const prefixAliasRegistry = new Map<string, string>();

/**
 * Registers a prefix command.
 *
 * Names are normalised to lowercase; aliases may not shadow another command.
 */
export function registerPrefixCommand(command: PrefixCommand): void {
  const name = command.name.trim().toLowerCase();
  if (!name) throw new Error('Prefix command name cannot be empty');

  prefixCommandRegistry.set(name, command);

  for (const alias of command.aliases ?? []) {
    const key = alias.trim().toLowerCase();
    if (!key) continue;
    prefixAliasRegistry.set(key, name);
  }
}

/** Resolves a prefix command by name or alias. */
export function getPrefixCommand(name: string): PrefixCommand | undefined {
  const needle = name.trim().toLowerCase();
  const direct = prefixCommandRegistry.get(needle);
  if (direct) return direct;
  const target = prefixAliasRegistry.get(needle);
  return target ? prefixCommandRegistry.get(target) : undefined;
}

/** Every registered prefix command, in registration order. */
export function getAllPrefixCommands(): PrefixCommand[] {
  return [...prefixCommandRegistry.values()];
}

/** Clears the registry. Used by test suites to isolate registrations. */
export function _resetPrefixCommandRegistry(): void {
  prefixCommandRegistry.clear();
  prefixAliasRegistry.clear();
}

/**
 * Guild manager access for prefix commands.
 *
 * Grants access to the guild owner, holders of Manage Guild or Administrator,
 * and members holding the guild's configured manager role.
 */
export function isGuildManager(deps: AppDeps, guildId: string, member: GuildMember | null): boolean {
  if (!member) return false;

  if (member.guild.ownerId === member.id) return true;
  if (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return true;
  }

  const managerRoleId = getManagerRoleId(deps, guildId);
  if (managerRoleId && member.roles.cache.has(managerRoleId)) return true;

  return false;
}

/**
 * Entry point for the `MessageCreate` event.
 *
 * Silently ignores anything that is not a prefix command in a guild, so ordinary
 * conversation never triggers work.
 */
export async function handleMessageCreate(message: Message, deps: AppDeps, bot: DiscordBot): Promise<void> {
  if (message.author?.bot) return;

  const guildId = message.guildId;
  const channelId = message.channelId;
  const content = message.content ?? '';
  if (!guildId || !channelId || !content) return;

  const prefix = getGuildPrefix(deps, guildId);
  const invocation = parsePrefixInvocation(content, prefix);
  if (!invocation) return;

  const command = getPrefixCommand(invocation.command);
  if (!command) {
    await sendUnknownCommand(deps, bot, channelId, prefix, invocation.command);
    return;
  }

  const guild = bot.getClient().guilds.cache.get(guildId);
  const member = (await resolveMember(guild, message)) ?? null;

  const managerOnly = command.managerOnly ?? true;
  if (managerOnly && !isGuildManager(deps, guildId, member)) {
    await bot.sendChannelMessage(channelId, {
      embeds: EmbedHandler.for(deps)
        .error()
        .title('Insufficient Permissions', '🔒')
        .description(
          `You need **Manage Server** permission, **Administrator**, or the configured manager role to run \`${prefix}${command.name}\`.`,
        )
        .message().embeds,
    });
    return;
  }

  const ctx: PrefixCommandContext = {
    deps,
    rest: bot.rest,
    guildId,
    channelId,
    userId: message.author.id,
    member,
    prefix,
    usagePrefix: prefix,
    invocation,
  };

  try {
    const result = await command.execute(ctx);
    const embeds = Array.isArray(result) ? result : [result];
    if (embeds.length === 0) return;
    await bot.sendChannelMessage(channelId, { embeds });
  } catch (err) {
    bot.logger.error('Prefix command failed', {
      command: command.name,
      guildId,
      userId: message.author.id,
      err: (err as Error).message,
    });
    await bot.sendChannelMessage(channelId, {
      embeds: EmbedHandler.for(deps)
        .error()
        .title('Command Failed', '⚠️')
        .description(`\`${prefix}${command.name}\` could not be completed: ${(err as Error).message}`)
        .message().embeds,
    });
  }
}

async function resolveMember(guild: Guild | undefined, message: Message): Promise<GuildMember | null> {
  const cached = message.member as GuildMember | null;
  if (cached) return cached;
  if (!guild) return null;
  return guild.members.fetch(message.author.id).catch(() => null);
}

async function sendUnknownCommand(
  deps: AppDeps,
  bot: DiscordBot,
  channelId: string,
  prefix: string,
  attempted: string,
): Promise<void> {
  // An empty registry means command discovery has not finished yet, so
  // suggesting `[prefix]help` would send the user to a command that does not
  // exist yet. Report the real state instead of a dead end.
  const registered = getAllPrefixCommands().length > 0;

  const embed = registered
    ? EmbedHandler.for(deps)
        .warning()
        .title('Unknown Command', '❓')
        .description(
          `\`${prefix}${attempted}\` is not a prefix command. Run \`${prefix}help\` to see what is available.`,
        )
    : EmbedHandler.for(deps)
        .warning()
        .title('Prefix Commands Loading', '⏳')
        .description('Prefix commands are still being registered. Try again in a moment.');

  try {
    await bot.sendChannelMessage(channelId, { embeds: embed.message().embeds });
  } catch (err) {
    bot.logger.debug('Failed to deliver unknown prefix command notice', { err: (err as Error).message });
  }
}
