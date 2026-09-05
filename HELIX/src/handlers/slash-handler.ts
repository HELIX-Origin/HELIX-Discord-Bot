import { Collection, ChatInputCommandInteraction, SlashCommandBuilder, REST, Routes, ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { CommandDefinition, CommandOption } from '../types/command.js';
import { logs } from './logs-handler.js';

const slashCommands = new Collection<string, { def: CommandDefinition; builder: SlashCommandBuilder }>();

function buildSlashData(cmd: CommandDefinition): SlashCommandBuilder {
  const cleanName = cmd.name.toLowerCase().slice(0, 32);
  const cleanDesc = (cmd.description || 'No description provided').slice(0, 100);
  let builder = new SlashCommandBuilder().setName(cleanName).setDescription(cleanDesc);

  if (cmd.subcommands?.length) {
    for (const sub of cmd.subcommands) {
      builder.addSubcommand(subBuilder => {
        const subName = sub.name.toLowerCase().slice(0, 32);
        const subDesc = (sub.description || 'No description provided').slice(0, 100);
        subBuilder.setName(subName).setDescription(subDesc);
        if (sub.options) {
          for (const opt of sub.options) addOption(subBuilder, opt);
        }
        return subBuilder;
      });
    }
  } else if (cmd.options?.length) {
    for (const opt of cmd.options) {
      addOption(builder, opt);
    }
  }

  return builder;
}

function addOption(builder: any, opt: CommandOption): void {
  const method = `add${opt.type.charAt(0).toUpperCase() + opt.type.slice(1)}Option`;
  if (typeof builder[method] !== 'function') return;

  const optName = opt.name.toLowerCase().slice(0, 32);
  const optDesc = (opt.description || 'No description provided').slice(0, 100);

  builder[method]((b: any) => {
    b.setName(optName).setDescription(optDesc).setRequired(opt.required || false);
    if (opt.choices?.length) b.addChoices(...opt.choices);
    if (opt.minValue !== undefined) b.setMinValue(opt.minValue);
    if (opt.maxValue !== undefined) b.setMaxValue(opt.maxValue);
    if (opt.type === 'channel') b.addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildCategory);
    return b;
  });
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanSlashCommandFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanSlashCommandFiles(fullPath));
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

export function registerSlashCommand(cmd: CommandDefinition): void {
  if (!cmd?.name || typeof cmd?.execute !== 'function') return;
  const builder = buildSlashData(cmd);
  slashCommands.set(cmd.name, { def: cmd, builder });
}

export function clearSlashCommands(): void {
  slashCommands.clear();
}

export async function loadSlashCommands(): Promise<void> {
  const commandsDir = path.resolve(__dirname, '..', 'commands');
  const filePaths = scanSlashCommandFiles(commandsDir);
  let count = 0;

  for (const filePath of filePaths) {
    try {
      let mod: any;
      try {
        mod = await import(pathToFileURL(filePath).href);
      } catch {
        mod = await import(filePath);
      }
      const seenInFile = new Set<string>();
      for (const exp of Object.values(mod as any)) {
        const cmd = exp as CommandDefinition;
        if (!cmd?.name || typeof cmd?.execute !== 'function') continue;
        if (seenInFile.has(cmd.name)) continue;
        seenInFile.add(cmd.name);

        registerSlashCommand(cmd);
        count++;
      }
    } catch (err: any) {
      logs.warn(`Failed to load slash command file ${filePath}: ${err.message}`);
    }
  }

  logs.info(`Loaded ${count} slash command(s)`);
}

export function getSlashCommandCategories(): string[] {
  const categories = new Set<string>();
  for (const { def } of slashCommands.values()) {
    if (def.category) {
      categories.add(def.category.toLowerCase());
    }
  }
  if (categories.size === 0) {
    return ['info', 'project', 'config', 'mod', 'util'];
  }
  return Array.from(categories).sort();
}

export function getSlashCommands(): Collection<string, { def: CommandDefinition; builder: SlashCommandBuilder }> {
  return slashCommands;
}

export async function registerGuildSlashCategories(
  token: string,
  clientId: string,
  guildId: string,
  categories: string[]
): Promise<{ count: number; categories: string[] }> {
  const rest = new REST({ version: '10' }).setToken(token);
  const isAll = categories.includes('all');
  const catSet = new Set(categories.map(c => c.toLowerCase()));

  const matched = slashCommands.filter(({ def }) => {
    if (isAll) return true;
    const cat = (def.category || 'general').toLowerCase();
    return catSet.has(cat);
  });

  const payload = matched.map(({ builder }) => builder.toJSON());

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: payload });
    logs.success(`Registered ${payload.length} slash command(s) for guild ${guildId} [categories: ${categories.join(', ')}]`);
    return { count: payload.length, categories };
  } catch (err: any) {
    logs.error(`Failed to register slash commands for guild ${guildId}: ${err.message}`);
    throw err;
  }
}

export async function clearGuildSlashCommands(
  token: string,
  clientId: string,
  guildId: string
): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
    logs.success(`Cleared all slash command(s) for guild ${guildId}`);
  } catch (err: any) {
    logs.error(`Failed to clear slash commands for guild ${guildId}: ${err.message}`);
    throw err;
  }
}

export async function purgeGlobalSlashCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    logs.success('Purged all global slash commands (slash commands are per-guild opt-in)');
  } catch (err: any) {
    logs.warn(`Failed to purge global slash commands: ${err.message}`);
  }
}

export async function reconcileAllGuildSlashCommands(
  token: string,
  clientId: string,
  guildIds: string[]
): Promise<void> {
  const db = (await import('../db/database.js')).BotDatabase.getInstance();
  for (const guildId of guildIds) {
    try {
      const settings = db.getGuildSettings(guildId);
      const categories = settings?.enabledSlashCategories || [];
      if (categories.length > 0) {
        await registerGuildSlashCategories(token, clientId, guildId, categories);
      } else {
        await clearGuildSlashCommands(token, clientId, guildId);
      }
    } catch (err: any) {
      logs.warn(`Slash reconciliation failed for guild ${guildId}: ${err.message}`);
    }
  }
}

export async function registerGlobalSlashCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(token);
  const payload = slashCommands.map(({ builder }) => builder.toJSON());

  try {
    await rest.put(Routes.applicationCommands(clientId), { body: payload });
    logs.success(`Registered ${payload.length} global slash command(s)`);
  } catch (err: any) {
    logs.error(`Failed to register global slash commands: ${err.message}`);
  }
}

export async function handleSlashInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
  const entry = slashCommands.get(interaction.commandName);
  if (!entry) return;

  try {
    const getOption = (name: string): any => {
      const val = interaction.options.get(name);
      if (!val) return null;
      if (val.member instanceof Object && 'user' in val.member) return val.member;
      return val.value ?? null;
    };

    await entry.def.execute({
      interaction,
      args: interaction.options.data.map(o => String(o.value)),
      guild: interaction.guild!,
      member: interaction.member,
      user: interaction.user,
      getOption,
    });
  } catch (err: any) {
    logs.error(`Slash command "${interaction.commandName}" failed: ${err.message}`);
    const reply = { content: '❌ An error occurred.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
}
