import { Collection, ChatInputCommandInteraction, SlashCommandBuilder, REST, Routes, ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { CommandDefinition, CommandOption } from '../types/command.js';
import { logs } from './logs-handler.js';

const slashCommands = new Collection<string, { def: CommandDefinition; builder: SlashCommandBuilder }>();

function buildSlashData(cmd: CommandDefinition): SlashCommandBuilder {
  let builder = new SlashCommandBuilder().setName(cmd.name).setDescription(cmd.description);

  if (cmd.subcommands?.length) {
    for (const sub of cmd.subcommands) {
      builder.addSubcommand(subBuilder => {
        subBuilder.setName(sub.name).setDescription(sub.description);
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
  const map: Record<string, number> = {
    string: ApplicationCommandOptionType.String,
    integer: ApplicationCommandOptionType.Integer,
    boolean: ApplicationCommandOptionType.Boolean,
    user: ApplicationCommandOptionType.User,
    channel: ApplicationCommandOptionType.Channel,
    role: ApplicationCommandOptionType.Role,
  };

  const method = `add${opt.type.charAt(0).toUpperCase() + opt.type.slice(1)}Option`;
  if (typeof builder[method] !== 'function') return;

  builder[method]((b: any) => {
    b.setName(opt.name).setDescription(opt.description).setRequired(opt.required || false);
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
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanSlashCommandFiles(fullPath));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) &&
      !entry.name.endsWith('.d.ts') &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.js')
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function loadSlashCommands(): Promise<void> {
  const commandsDir = path.resolve(__dirname, '..', 'commands');
  const filePaths = scanSlashCommandFiles(commandsDir);
  let count = 0;

  for (const filePath of filePaths) {
    try {
      const mod = await import(pathToFileURL(filePath).href);
      for (const exp of Object.values(mod as any)) {
        const cmd = exp as CommandDefinition;
        if (!cmd?.name || typeof cmd?.execute !== 'function') continue;

        const builder = buildSlashData(cmd);
        slashCommands.set(cmd.name, { def: cmd, builder });
        count++;
      }
    } catch (err: any) {
      logs.warn(`Failed to load slash command file ${filePath}: ${err.message}`);
    }
  }

  logs.info(`Loaded ${count} slash command(s)`);
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
