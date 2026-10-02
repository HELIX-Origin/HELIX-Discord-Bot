import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import type {
  ApplicationCommand,
  ApplicationCommandOption,
  DiscordInteraction,
  InteractionResponse,
} from '../utils/types.js';

type CommandCategory = 'feeds' | 'admin' | 'mod' | 'utility';

export interface CommandHelpMetadata {
  name: string;
  description: string;
  category: CommandCategory;
  emoji: string;
  usage?: string;
  options?: ApplicationCommandOption[];
  subcommands?: {
    name: string;
    description: string;
    options?: ApplicationCommandOption[];
  }[];
  examples?: string[];
}

export interface BotCommand {
  readonly def: ApplicationCommand;
  readonly category: CommandCategory;
  readonly execute: (
    interaction: DiscordInteraction,
    deps: AppDeps,
    rest: DiscordRestClient,
  ) => Promise<InteractionResponse>;
  readonly autocomplete?: (interaction: DiscordInteraction, deps: AppDeps) => Promise<InteractionResponse>;
  readonly metadata?: CommandHelpMetadata;
  readonly aliases?: string[];
}

const CATEGORY_EMOJIS: Record<CommandCategory, string> = {
  feeds: '📰',
  admin: '🛡️',
  mod: '⚖️',
  utility: '🔧',
};

const commandRegistry = new Map<string, BotCommand>();
const aliasRegistry = new Map<string, string>();
const metadataRegistry = new Map<string, CommandHelpMetadata>();

function validateCommandLimits(def: ApplicationCommand): void {
  const nameRegex = /^[a-z0-9_-]{1,32}$/;
  if (!nameRegex.test(def.name)) {
    throw new Error(`Command name "${def.name}" violates Discord limits (must match ^[a-z0-9_-]{1,32}$)`);
  }
  if (!def.description || def.description.length > 100) {
    throw new Error(
      `Command "${def.name}" description must be between 1 and 100 characters (got ${def.description?.length ?? 0})`,
    );
  }
  if (def.options && def.options.length > 25) {
    throw new Error(`Command "${def.name}" exceeds maximum 25 options limit (got ${def.options.length})`);
  }
  if (def.options) {
    for (const opt of def.options) {
      if (!nameRegex.test(opt.name)) {
        throw new Error(`Option "${opt.name}" in command "${def.name}" violates naming rules`);
      }
      if (!opt.description || opt.description.length > 100) {
        throw new Error(`Option "${opt.name}" in command "${def.name}" description exceeds 100 characters`);
      }
      if (opt.choices && opt.choices.length > 25) {
        throw new Error(`Option "${opt.name}" in command "${def.name}" exceeds maximum 25 choices limit`);
      }
    }
  }
}

export function registerCommand(command: BotCommand): void {
  validateCommandLimits(command.def);
  const name = command.def.name.toLowerCase();
  commandRegistry.set(name, command);

  if (command.aliases) {
    for (const alias of command.aliases) {
      aliasRegistry.set(alias.toLowerCase(), name);
    }
  }

  const meta: CommandHelpMetadata = command.metadata ?? {
    name: command.def.name,
    description: command.def.description,
    category: command.category,
    emoji: CATEGORY_EMOJIS[command.category] ?? '⚡',
    usage: `/${command.def.name}`,
    options: command.def.options,
  };
  metadataRegistry.set(name, meta);
}

export function getCommand(name: string): BotCommand | undefined {
  const normalized = name.toLowerCase();
  const direct = commandRegistry.get(normalized);
  if (direct) return direct;
  const target = aliasRegistry.get(normalized);
  if (target) return commandRegistry.get(target);
  return undefined;
}

export function getAllCommands(): BotCommand[] {
  return [...commandRegistry.values()];
}

export function getEnabledCommands(_deps?: AppDeps): ApplicationCommand[] {
  return [...commandRegistry.values()].map((cmd) => cmd.def);
}

export function getGuildEnabledCommands(_guildId?: string, _deps?: AppDeps): ApplicationCommand[] {
  return [...commandRegistry.values()].map((cmd) => cmd.def);
}

export function registerCommandMetadata(metadata: CommandHelpMetadata): void {
  metadataRegistry.set(metadata.name.toLowerCase(), metadata);
}

export function getCommandMetadata(name: string): CommandHelpMetadata | undefined {
  return metadataRegistry.get(name.toLowerCase());
}

export function getAllCommandMetadata(): CommandHelpMetadata[] {
  return [...metadataRegistry.values()];
}

interface CategorizedCommands {
  feeds: CommandHelpMetadata[];
  admin: CommandHelpMetadata[];
  mod: CommandHelpMetadata[];
  utility: CommandHelpMetadata[];
}

export function getCategorizedCommands(): CategorizedCommands {
  const cats: CategorizedCommands = {
    feeds: [],
    admin: [],
    mod: [],
    utility: [],
  };
  for (const meta of metadataRegistry.values()) {
    if (cats[meta.category]) {
      cats[meta.category].push(meta);
    }
  }
  return cats;
}
