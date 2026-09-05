import { Collection, Message, PermissionFlagsBits } from 'discord.js';
import { CommandDefinition, ExecuteContext } from '../types/command.js';
import { BotDatabase } from '../db/database.js';
import { botSettings } from './settings-manager.js';
import { registerHelp, createHelp, buildCommandHelpEmbed, getCommandHelp } from './help-registrar.js';
import { logs } from './logs-handler.js';
import { getMessage, formatError } from './message-handler.js';
import { DEFAULT_PREFIX } from '../config.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Collection<string, CommandDefinition>();

function formatPermissionName(perm: any): string {
  if (typeof perm === 'string') return perm;
  for (const [key, value] of Object.entries(PermissionFlagsBits)) {
    if (value === perm) {
      return key.replace(/([A-Z])/g, ' $1').trim();
    }
  }
  return String(perm);
}

function scanCommandFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanCommandFiles(fullPath));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) &&
      !entry.name.endsWith('.d.ts') &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.js') &&
      !entry.name.endsWith('.map')
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function loadPrefixCommands(): Promise<void> {
  const commandsDir = path.resolve(__dirname, '..', 'commands');
  const filePaths = scanCommandFiles(commandsDir);
  let count = 0;

  for (const filePath of filePaths) {
    try {
      let mod: any;
      const rel = path.relative(__dirname, filePath).replaceAll('\\', '/');
      const spec = rel.startsWith('.') ? rel : `./${rel}`;
      try {
        mod = await import(spec);
      } catch {
        mod = await import(pathToFileURL(filePath).href);
      }
      const seenInFile = new Set<string>();
      for (const exp of Object.values(mod as any)) {
        const cmd = exp as CommandDefinition;
        if (!cmd?.name || typeof cmd?.execute !== 'function') continue;
        if (seenInFile.has(cmd.name)) continue;
        seenInFile.add(cmd.name);

        commands.set(cmd.name, cmd);
        if (cmd.aliases) {
          for (const alias of cmd.aliases) commands.set(alias, cmd);
        }

        let generatedUsage = cmd.usage || '';
        if (generatedUsage.startsWith('>')) {
          generatedUsage = generatedUsage.slice(1).trim();
        }
        if (!generatedUsage && cmd.options?.length) {
          generatedUsage = cmd.options.map(o => o.required ? `<${o.name}>` : `[${o.name}]`).join(' ');
        }

        registerHelp(createHelp(cmd.name, cmd.description, cmd.category, {
          usage: generatedUsage,
          permissions: (cmd.permissions || []).map(formatPermissionName),
          aliases: cmd.aliases,
          subcommands: cmd.subcommands?.map(s => ({
            name: s.name,
            description: s.description,
            options: s.options,
          })),
          options: cmd.options,
          examples: cmd.examples,
        }));

        count++;
      }
    } catch (err: any) {
      logs.warn(`Failed to load command file ${filePath}: ${err.message}`);
    }
  }

  logs.info(`Loaded ${count} prefix command(s) (${commands.size} entries inc. aliases)`);
}

export function getPrefixCommands(): Collection<string, CommandDefinition> {
  return commands;
}

export function getPrefixForGuild(guildId: string): string {
  if (!guildId) return DEFAULT_PREFIX;
  return botSettings.getPrefix(guildId);
}

function parseArgs(message: Message, args: string[], cmd: CommandDefinition): (name: string) => any {
  const optionDefs = cmd.options || [];
  const optionMap = new Map(optionDefs.map(o => [o.name, o]));

  return (name: string): any => {
    const opt = optionMap.get(name);
    if (!opt) return null;

    const idx = optionDefs.indexOf(opt);
    const raw = args[idx];
    if (raw === undefined || raw === null || raw === '') return null;

    if (idx === optionDefs.length - 1 && opt.type === 'string' && args.length > optionDefs.length) {
      return args.slice(idx).join(' ');
    }

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

  if (message.content === '') {
    logs.warn(`Received message in #${(message.channel as any)?.name || message.channelId} with empty content. Ensure "Message Content Intent" is enabled in Discord Developer Portal -> Bot -> Privileged Gateway Intents.`);
    return;
  }

  const prefix = getPrefixForGuild(message.guild.id);
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = commands.get(commandName);
  if (!command) return;

  logs.info(`Executing prefix command "${prefix}${command.name}" for user ${message.author.tag} in guild ${message.guild.name}`);

  if (command.permissions?.length) {
    const missing = command.permissions.filter(p => !message.member?.permissions.has(p));
    if (missing.length) {
      await message.reply({ embeds: [formatError('permission_denied')] });
      return;
    }
  }

  try {
    const getOption = parseArgs(message, args, command);

    // 1. Validate top-level required options defined on the command
    if (command.options && command.options.length > 0) {
      const missingOptions = command.options.filter(o => o.required && (getOption(o.name) === null || getOption(o.name) === undefined || getOption(o.name) === ''));
      if (missingOptions.length > 0) {
        const missingNames = missingOptions.map(o => `\`<${o.name}>\``).join(', ');
        const helpEntry = getCommandHelp(command.name);
        if (helpEntry) {
          const helpEmbed = buildCommandHelpEmbed(helpEntry, prefix, {
            missingNotice: `Please provide ${missingNames} to execute this command.`,
          });
          await message.reply({ embeds: [helpEmbed] });
          return;
        }
      }
    }

    // 2. Validate subcommand-based commands
    if (command.subcommands && command.subcommands.length > 0) {
      const helpEntry = getCommandHelp(command.name);
      // If no subcommand argument was passed (e.g. >set, >ticket, >plugin)
      if (args.length === 0) {
        if (helpEntry) {
          const helpEmbed = buildCommandHelpEmbed(helpEntry, prefix, {
            missingNotice: `Please specify a subcommand to execute.`,
          });
          await message.reply({ embeds: [helpEmbed] });
          return;
        }
      }

      const subName = args[0]?.toLowerCase();
      const subDef = command.subcommands.find(s => s.name.toLowerCase() === subName);

      if (!subDef) {
        // Unknown subcommand (e.g. >set foo)
        if (helpEntry) {
          const validSubList = command.subcommands.map(s => `\`${s.name}\``).join(', ');
          const helpEmbed = buildCommandHelpEmbed(helpEntry, prefix, {
            missingNotice: `Unknown subcommand \`${args[0]}\`. Available subcommands: ${validSubList}`,
          });
          await message.reply({ embeds: [helpEmbed] });
          return;
        }
      } else {
        // Subcommand is valid. Check required options for this subcommand
        const subArgs = args.slice(1);
        const subOpts = subDef.options || [];

        // Special handling for nested subcommands / actions like `set slash enable <category>`
        if (command.name === 'set' && subDef.name === 'slash') {
          const action = subArgs[0]?.toLowerCase();
          if (!action) {
            if (helpEntry) {
              const helpEmbed = buildCommandHelpEmbed(helpEntry, prefix, {
                missingNotice: `Please provide action (\`enable\`, \`disable\`, \`view\`, \`clear\`) for \`${prefix}set slash\`.`,
                customUsage: `${prefix}set slash <action> [category]`,
              });
              await message.reply({ embeds: [helpEmbed] });
              return;
            }
          }
          if ((action === 'enable' || action === 'disable') && !subArgs[1]) {
            if (helpEntry) {
              const helpEmbed = buildCommandHelpEmbed(helpEntry, prefix, {
                missingNotice: `Please provide a \`<category>\` (e.g. \`moderation\`, \`utility\`, \`plugins\`, \`info\`, \`project\`, \`config\`, \`all\`) to ${action}.`,
                customUsage: `${prefix}set slash ${action} <category>`,
              });
              await message.reply({ embeds: [helpEmbed] });
              return;
            }
          }
        } else {
          // Standard subcommand options validation
          for (let i = 0; i < subOpts.length; i++) {
            const opt = subOpts[i];
            if (opt.required && (subArgs[i] === undefined || subArgs[i] === null || subArgs[i] === '')) {
              if (helpEntry) {
                const subUsage = `${prefix}${command.name} ${subDef.name} ${subOpts.map(o => o.required ? `<${o.name}>` : `[${o.name}]`).join(' ')}`.trim();
                const helpEmbed = buildCommandHelpEmbed(helpEntry, prefix, {
                  missingNotice: `Please provide \`<${opt.name}>\` for subcommand \`${prefix}${command.name} ${subDef.name}\`.`,
                  customUsage: subUsage,
                });
                await message.reply({ embeds: [helpEmbed] });
                return;
              }
            }
          }
        }
      }
    }

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
