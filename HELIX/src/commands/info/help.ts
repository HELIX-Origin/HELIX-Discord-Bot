import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  ButtonInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import {
  getAllHelp,
  getHelpByCategory,
  getCommandHelp,
  buildCommandHelpEmbed,
  categoryOrder,
  getCategoryEmoji,
  getCategoryLabel,
  getCategoryDescription,
  getCategoryColor,
  type CategoryKey,
} from '../../handlers/help-registrar.js';
import { getPrefixForGuild } from '../../handlers/command-handler.js';
import { createEmbed, formatError } from '../../handlers/message-handler.js';
import { logs } from '../../handlers/logs-handler.js';
import { getNextAuthUrl } from '../../env.js';
import type { CommandDefinition } from '../../types/command.js';

type ViewTarget = 'home' | CategoryKey;

export async function handleHelpInteraction(
  interaction: ButtonInteraction | StringSelectMenuInteraction
): Promise<void> {
  const prefix = getPrefixForGuild(interaction.guildId || '');

  try {
    if (interaction.isStringSelectMenu() && interaction.customId === 'help_category_select') {
      const selected = (interaction.values[0] || 'home') as ViewTarget;
      const payload = buildHelpPayload(selected, prefix, false);
      await interaction.update(payload);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'help_btn_close') {
        try {
          if (interaction.message.deletable) {
            await interaction.message.delete();
          } else {
            await interaction.update({
              content: '🗑️ *Help menu closed.*',
              embeds: [],
              components: [],
            });
          }
        } catch {
          await interaction.update({
            content: '🗑️ *Help menu closed.*',
            embeds: [],
            components: [],
          });
        }
        return;
      }

      if (interaction.customId === 'help_btn_home') {
        const payload = buildHelpPayload('home', prefix, false);
        await interaction.update(payload);
        return;
      }

      if (interaction.customId.startsWith('help_btn_')) {
        const target = interaction.customId.replace('help_btn_', '') as ViewTarget;
        const payload = buildHelpPayload(target, prefix, false);
        await interaction.update(payload);
        return;
      }
    }
  } catch (err: any) {
    logs.error(`Help interaction failed: ${err?.message || err}`);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Failed to update help view.', ephemeral: true });
      }
    } catch {}
  }
}

export function buildHelpPayload(
  target: ViewTarget,
  prefix: string,
  disabled: boolean = false
): { embeds: EmbedBuilder[]; components: ActionRowBuilder<any>[] } {
  const allEntries = getAllHelp();
  const grouped = getHelpByCategory();

  let embed: EmbedBuilder;

  if (target === 'home') {
    embed = createEmbed('info.help.embed', {
      prefix,
      count: allEntries.length,
      categories: categoryOrder.length,
    });

    for (const cat of categoryOrder) {
      const cmds = grouped.get(cat) || [];
      if (!cmds.length) continue;
      const emoji = getCategoryEmoji(cat);
      const label = getCategoryLabel(cat);
      const cmdPills = cmds.map(c => `\`${prefix}${c.name}\``).join(' ');
      embed.addFields({
        name: `${emoji} ${label} (${cmds.length})`,
        value: `${cmdPills}\n*${getCategoryDescription(cat)}*`,
        inline: false,
      });
    }

    embed.setFooter({
      text: `Prefix: ${prefix} • ${allEntries.length} Commands • Select a category below to view details`,
    });
  } else {
    const cat = target as CategoryKey;
    const cmds = grouped.get(cat) || [];
    const emoji = getCategoryEmoji(cat);
    const label = getCategoryLabel(cat);
    const color = getCategoryColor(cat);
    const description = getCategoryDescription(cat);
    const catIndex = categoryOrder.indexOf(cat) + 1;

    embed = new EmbedBuilder()
      .setColor(color as any)
      .setTitle(`${emoji} ${label}`)
      .setDescription(`*${description}*`)
      .setTimestamp()
      .setFooter({
        text: `Category ${catIndex}/${categoryOrder.length} • ${cmds.length} command(s) • Prefix: ${prefix}`,
      });

    if (cmds.length === 0) {
      embed.addFields({
        name: 'No Commands',
        value: '*No commands are currently registered in this category.*',
        inline: false,
      });
    } else {
      for (const c of cmds) {
        let usage = '';
        if (!c.usage) {
          usage = `${prefix}${c.name}`;
        } else if (c.usage.startsWith(c.name)) {
          usage = `${prefix}${c.usage}`;
        } else if (c.usage.startsWith('>')) {
          usage = `${prefix}${c.usage.slice(1).trim()}`;
        } else {
          usage = `${prefix}${c.name} ${c.usage}`;
        }
        const aliasStr = c.aliases && c.aliases.length ? `\n*Aliases:* ${c.aliases.map(a => `\`${prefix}${a}\``).join(', ')}` : '';
        const permsStr = c.permissions && c.permissions.length ? ` \`[${c.permissions.join(', ')}]\`` : '';
        embed.addFields({
          name: `\`${prefix}${c.name}\`${permsStr}`,
          value: `${c.description}\n\`\`\`syntax\n${usage}\n\`\`\`${aliasStr}`,
          inline: false,
        });
      }
    }
  }

  // ─── Component Rows ─────────────────────────────────────────────────────────

  // 1. Category Selection Dropdown
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('📂 Browse commands by category...')
    .setDisabled(disabled);

  // Home Option
  selectMenu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel('Home / Overview')
      .setValue('home')
      .setDescription('Command center summary and category index')
      .setEmoji('🏠')
      .setDefault(target === 'home')
  );

  // Category Options
  for (const cat of categoryOrder) {
    const cmds = grouped.get(cat) || [];
    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`${getCategoryLabel(cat)} (${cmds.length})`)
        .setValue(cat)
        .setDescription(getCategoryDescription(cat).slice(0, 100))
        .setEmoji(getCategoryEmoji(cat))
        .setDefault(target === cat)
    );
  }

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  // 2. Navigation Buttons (with unique customIds across all targets)
  const currentIndex = target === 'home' ? -1 : categoryOrder.indexOf(target as CategoryKey);

  const prevCat =
    target === 'home'
      ? categoryOrder[categoryOrder.length - 1]
      : categoryOrder[(currentIndex - 1 + categoryOrder.length) % categoryOrder.length];

  const nextCat =
    target === 'home'
      ? categoryOrder[0]
      : categoryOrder[(currentIndex + 1) % categoryOrder.length];

  const btnHome = new ButtonBuilder()
    .setCustomId('help_btn_home')
    .setLabel('Home')
    .setStyle(target === 'home' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setEmoji('🏠')
    .setDisabled(disabled);

  const btnPrev = new ButtonBuilder()
    .setCustomId(`help_btn_${prevCat}`)
    .setLabel('Previous')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('◀️')
    .setDisabled(disabled);

  const btnNext = new ButtonBuilder()
    .setCustomId(`help_btn_${nextCat}`)
    .setLabel('Next')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('▶️')
    .setDisabled(disabled);

  const btnClose = new ButtonBuilder()
    .setCustomId('help_btn_close')
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🗑️')
    .setDisabled(disabled);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    btnHome,
    btnPrev,
    btnNext,
    btnClose
  );

  // Optional Dashboard Link Button
  const publicUrl = getNextAuthUrl();
  if (publicUrl && !publicUrl.includes('localhost') && !publicUrl.includes('127.0.0.1')) {
    const btnDash = new ButtonBuilder()
      .setLabel('Web Dashboard')
      .setStyle(ButtonStyle.Link)
      .setURL(`${publicUrl.replace(/\/+$/, '')}/dashboard`)
      .setEmoji('🌐');
    buttonRow.addComponents(btnDash);
  }

  return {
    embeds: [embed],
    components: [selectRow, buttonRow],
  };
}

export const help: CommandDefinition = {
  name: 'help',
  description: 'Interactive command center with category browsing and detailed syntax',
  category: 'info',
  usage: '[command]',
  examples: ['help', 'help ban', 'help scaffold'],
  options: [
    {
      name: 'command',
      description: 'Specific command name to inspect syntax and usage for',
      type: 'string',
      required: false,
    },
  ],
  async execute({ message, interaction, guild, args }) {
    const prefix = getPrefixForGuild(guild?.id || '');
    const query = args?.[0] || interaction?.options?.getString('command');

    // ─── Single Command Inspection ───────────────────────────────────────────
    if (query) {
      const found = getCommandHelp(query);
      if (!found) {
        const errorEmbed = formatError('info.help.command_not_found', { name: query, prefix }, prefix);
        if (message) return message.reply({ embeds: [errorEmbed] });
        return interaction!.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      const detailEmbed = buildCommandHelpEmbed(found, prefix);

      if (message) return message.reply({ embeds: [detailEmbed] });
      return interaction!.reply({ embeds: [detailEmbed] });
    }

    // ─── Interactive Multi-Category Menu ─────────────────────────────────────
    const initialPayload = buildHelpPayload('home', prefix, false);

    if (message) {
      return message.reply(initialPayload);
    }
    if (interaction) {
      return interaction.reply(initialPayload);
    }
  },
};

