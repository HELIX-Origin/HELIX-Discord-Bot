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

export const CANONICAL_SLASH_CATEGORIES = ['moderation', 'utility', 'plugins', 'info', 'project', 'config'] as const;
export type CanonicalSlashCategory = (typeof CANONICAL_SLASH_CATEGORIES)[number];

const CATEGORY_ALIASES: Record<string, CanonicalSlashCategory> = {
  mod: 'moderation',
  moderation: 'moderation',
  util: 'utility',
  utility: 'utility',
  utils: 'utility',
  plugin: 'plugins',
  plugins: 'plugins',
  info: 'info',
  information: 'info',
  proj: 'project',
  project: 'project',
  projects: 'project',
  cfg: 'config',
  config: 'config',
  configuration: 'config',
  setting: 'config',
  settings: 'config',
};

export function normalizeCategory(cat: string): string {
  if (!cat) return '';
  const lower = cat.trim().toLowerCase();
  return CATEGORY_ALIASES[lower] || lower;
}

export function normalizeCategories(cats: string[]): string[] {
  if (!cats || !Array.isArray(cats)) return [];
  const result = new Set<string>();
  for (const c of cats) {
    if (!c) continue;
    const lower = c.trim().toLowerCase();
    if (lower === 'all') {
      for (const canonical of CANONICAL_SLASH_CATEGORIES) {
        result.add(canonical);
      }
    } else {
      const normalized = normalizeCategory(lower);
      if (normalized) result.add(normalized);
    }
  }
  return Array.from(result);
}

export function getSlashCommandCategories(): string[] {
  const categories = new Set<string>();
  for (const { def } of slashCommands.values()) {
    if (def.category) {
      categories.add(normalizeCategory(def.category));
    }
  }
  if (categories.size === 0) {
    return Array.from(CANONICAL_SLASH_CATEGORIES);
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
): Promise<{ count: number; categories: string[]; commandNames: string[] }> {
  if (!token || !clientId || !guildId) {
    throw new Error(`Missing required parameter for slash registration (token: ${Boolean(token)}, clientId: ${Boolean(clientId)}, guildId: ${guildId})`);
  }

  const normalized = normalizeCategories(categories);
  const rest = new REST({ version: '10' }).setToken(token);
  const catSet = new Set(normalized);

  const matched = slashCommands.filter(({ def }) => {
    const cmdCat = normalizeCategory(def.category || 'general');
    return catSet.has(cmdCat);
  });

  const payload = matched.map(({ builder }) => builder.toJSON());

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: payload });
    logs.success(`Registered ${payload.length} slash command(s) for guild ${guildId} [categories: ${normalized.join(', ')}]`);
    return { count: payload.length, categories: normalized, commandNames: matched.map(m => m.def.name) };
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

export async function syncGuildSlashCategories(
  guildId: string,
  categories?: string[]
): Promise<{ count: number; categories: string[]; commandNames: string[] }> {
  const { getBotToken, getClientId } = await import('../env.js');
  const { botSettings } = await import('./settings-manager.js');
  const { getBot } = await import('../client.js');

  const botClient = getBot();
  const token = getBotToken() || (botClient?.token as string) || '';
  const clientId = getClientId() || botClient?.user?.id || '';

  if (!token || !clientId) {
    throw new Error('Discord Bot Token or Client ID is not configured. Cannot synchronize slash commands.');
  }

  // Ensure slash command registry is loaded
  if (slashCommands.size === 0) {
    await loadSlashCommands();
  }

  const resolvedCats = categories !== undefined ? categories : (botSettings.getGuildSettings(guildId)?.enabledSlashCategories || []);
  const normalized = normalizeCategories(resolvedCats);

  if (normalized.length === 0) {
    await clearGuildSlashCommands(token, clientId, guildId);
    return { count: 0, categories: [], commandNames: [] };
  }

  return await registerGuildSlashCategories(token, clientId, guildId, normalized);
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
  const { botSettings } = await import('./settings-manager.js');
  for (const guildId of guildIds) {
    try {
      const settings = botSettings.getGuildSettings(guildId);
      const categories = settings?.enabledSlashCategories || [];
      const normalized = normalizeCategories(categories);
      if (normalized.length > 0) {
        await registerGuildSlashCategories(token, clientId, guildId, normalized);
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
