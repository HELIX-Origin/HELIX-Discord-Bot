/**
 * src/bot/lib/prefix/types.ts
 *
 * Shared contract for prefix commands. Command implementations live in
 * `src/bot/commands/prefix/` and are registered dynamically by the loader,
 * mirroring the slash command architecture.
 */

import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import type { DiscordEmbed } from '../../utils/types.js';
import type { PrefixInvocation } from './parser.js';
import type { GuildMember } from 'discord.js';

export interface PrefixCommandContext {
  readonly deps: AppDeps;
  readonly rest: DiscordRestClient;
  readonly guildId: string;
  readonly channelId: string;
  readonly userId: string;
  /** Invoking member, fetched from the gateway when not cached. */
  readonly member: GuildMember | null;
  readonly prefix: string;
  readonly invocation: PrefixInvocation;
  /** The guild prefix as it was at parse time, for usage strings. */
  readonly usagePrefix: string;
}

export interface PrefixCommand {
  /** Primary command name, matched case-insensitively after the prefix. */
  readonly name: string;
  /** Alternative names resolving to this command. */
  readonly aliases?: readonly string[];
  /** One-line summary shown by `[prefix]help`. */
  readonly description: string;
  /** Usage line, where `p` is substituted with the guild's prefix. */
  readonly usage: string;
  /** Optional examples, where `p` is substituted with the guild's prefix. */
  readonly examples?: readonly string[];
  /**
   * When true (the default) the command requires guild manager access:
   * guild owner, Manage Guild or Administrator, or the configured manager role.
   */
  readonly managerOnly?: boolean;
  readonly execute: (ctx: PrefixCommandContext) => Promise<DiscordEmbed[] | DiscordEmbed>;
}
