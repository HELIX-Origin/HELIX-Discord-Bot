import { Message, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, GuildMember } from 'discord.js';

export type OptionType = 'user' | 'string' | 'integer' | 'boolean' | 'channel' | 'role';

export interface CommandOption {
  name: string;
  description: string;
  type: OptionType;
  required?: boolean;
  choices?: { name: string; value: string }[];
  minValue?: number;
  maxValue?: number;
}

export interface ExecuteContext {
  message?: Message;
  interaction?: ChatInputCommandInteraction;
  args: string[];
  guild: NonNullable<Message['guild'] | ChatInputCommandInteraction['guild']>;
  member: ChatInputCommandInteraction['member'];
  user: ChatInputCommandInteraction['user'];
  getOption<T = string>(name: string): T | null;
}

export interface CommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  category: string;
  usage?: string;
  examples?: string[];
  permissions?: (typeof PermissionFlagsBits)[keyof typeof PermissionFlagsBits][];
  options?: CommandOption[];
  subcommands?: { name: string; description: string; options?: CommandOption[] }[];
  execute(context: ExecuteContext): Promise<any>;
}
