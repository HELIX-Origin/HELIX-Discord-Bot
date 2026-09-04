import { Collection, Message } from 'discord.js';
import { CommandDefinition, ExecuteContext } from '../types/command.js';
import { BotDatabase } from '../db/database.js';
import { registerHelp, createHelp } from './help-registrar.js';
import { logs } from './logs-handler.js';
import { getMessage, formatError } from './message-handler.js';
import { DEFAULT_PREFIX } from '../config.js';

const commands = new Collection<string, CommandDefinition>();

export async function loadPrefixCommands(): Promise<void> {
  const modules = import.meta.glob('../commands/**/*.ts', { eager: true });
  let count = 0;

  for (const [, mod] of Object.entries(modules)) {
    for (const exp of Object.values(mod as any)) {
      const cmd = exp as CommandDefinition;
      if (!cmd?.name || typeof cmd?.execute !== 'function') continue;

      commands.set(cmd.name, cmd);
      if (cmd.aliases) {
        for (const alias of cmd.aliases) commands.set(alias, cmd);
      }

      registerHelp(createHelp(cmd.name, cmd.description, cmd.category, {
        usage: `>${cmd.name}`,
        permissions: (cmd.permissions || []).map(String),
        aliases: cmd.aliases,
        subcommands: cmd.subcommands?.map(s => s.name),
      }));

      count++;
    }
  }

  logs.info(`Loaded ${count} prefix command(s) (${commands.size} entries inc. aliases)`);
}

export function getPrefixCommands(): Collection<string, CommandDefinition> {
  return commands;
}

export function getPrefixForGuild(guildId: string): string {
  if (!guildId) return DEFAULT_PREFIX;
  return BotDatabase.getInstance().getGuildSettings(guildId)?.prefix || DEFAULT_PREFIX;
}

function parseArgs(message: Message, args: string[], cmd: CommandDefinition): (name: string) => any {
  const optionDefs = cmd.options || [];
  const optionMap = new Map(optionDefs.map(o => [o.name, o]));

  return (name: string): any => {
    const opt = optionMap.get(name);
    if (!opt) return null;

    const idx = optionDefs.indexOf(opt);
    const raw = args[idx];
    if (!raw) return null;

    if (opt.type === 'user') {
      const id = raw.replace(/[<@!>]/g, '');
      return message.mentions.members?.get(id) || message.guild?.members.cache.get(id) || null;
    }
    if (opt.type === 'channel') {
      const id = raw.replace(/[<#>]/g, '');
      return message.guild?.channels.cache.get(id) || null;
    }
    if (opt.type === 'role') {
      const id = raw.replace(/[<@&>]/g, '');
      return message.guild?.roles.cache.get(id) || null;
    }
    if (opt.type === 'integer') return parseInt(raw) || null;
    if (opt.type === 'boolean') return raw === 'true' || raw === '1';
    return raw;
  };
}

export async function handlePrefixMessage(message: Message): Promise<void> {
  if (message.author.bot || !message.guild) return;

  const prefix = getPrefixForGuild(message.guild.id);
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = commands.get(commandName);
  if (!command) return;

  if (command.permissions?.length) {
    const missing = command.permissions.filter(p => !message.member?.permissions.has(p));
    if (missing.length) {
      await message.reply({ embeds: [formatError('permission_denied')] });
      return;
    }
  }

  try {
    const getOption = parseArgs(message, args, command);
    await command.execute({
      message,
      args,
      guild: message.guild,
      member: message.member,
      user: message.author,
      getOption,
    });
  } catch (err: any) {
    logs.error(`Prefix command "${command.name}" failed: ${err.message}`);
    await message.reply({ embeds: [formatError('generic')] }).catch(() => {});
  }
}
