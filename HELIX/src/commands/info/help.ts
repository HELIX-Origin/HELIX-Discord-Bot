import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  EmbedBuilder,
} from 'discord.js';
import {
  getAllHelp,
  getHelpByCategory,
  getCommandHelp,
  categoryOrder,
  getCategoryEmoji,
  getCategoryLabel,
  getCategoryDescription,
  getCategoryColor,
  type CategoryKey,
} from '../../handlers/help-registrar.js';
import { getPrefixForGuild } from '../../handlers/command-handler.js';
import { createEmbed, formatError } from '../../handlers/message-handler.js';
import { getNextAuthUrl } from '../../env.js';
import type { CommandDefinition } from '../../types/command.js';

type ViewTarget = 'home' | CategoryKey;

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

    const commandList = cmds.length
      ? cmds
          .map(c => {
            const usage = (c.usage || `>${c.name}`).replace(/^>/, prefix);
            const aliasStr = c.aliases && c.aliases.length ? ` *(aliases: ${c.aliases.map(a => `\`${prefix}${a}\``).join(', ')})*` : '';
            return `### \`${prefix}${c.name}\`${aliasStr}\n${c.description}\n\`\`\`syntax\n${usage}\n\`\`\``;
          })
          .join('\n')
      : '*No commands registered in this category.*';

    embed = new EmbedBuilder()
      .setColor(color as any)
      .setTitle(`${emoji} ${label}`)
      .setDescription(`*${description}*\n\n${commandList}`)
      .setFooter({
        text: `Category ${catIndex}/${categoryOrder.length} • ${cmds.length} command(s) • Prefix: ${prefix}`,
      });
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

  // 2. Navigation Buttons
  const currentIndex = target === 'home' ? -1 : categoryOrder.indexOf(target as CategoryKey);

  const prevCat =
    target === 'home'
      ? categoryOrder[categoryOrder.length - 1]
      : currentIndex === 0
      ? 'home'
      : categoryOrder[currentIndex - 1];

  const nextCat =
    target === 'home'
      ? categoryOrder[0]
      : currentIndex === categoryOrder.length - 1
      ? 'home'
      : categoryOrder[currentIndex + 1];

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

      const aliasText = found.aliases && found.aliases.length ? found.aliases.map(a => `\`${prefix}${a}\``).join(', ') : 'None';
      const permsText = found.permissions && found.permissions.length ? found.permissions.map(p => `\`${p}\``).join(', ') : 'Everyone';
      const subcmdsText = found.subcommands && found.subcommands.length ? found.subcommands.map(s => `\`${s}\``).join(', ') : 'None';
      const usageText = (found.usage || `>${found.name}`).replace(/^>/, prefix);

      const detailEmbed = createEmbed('info.help.detail_embed', {
        prefix,
        name: found.name,
        description: found.description,
        category: `${getCategoryEmoji(found.category)} ${getCategoryLabel(found.category)}`,
        usage: usageText,
        aliases: aliasText,
        permissions: permsText,
        subcommands: subcmdsText,
      });

      if (message) return message.reply({ embeds: [detailEmbed] });
      return interaction!.reply({ embeds: [detailEmbed] });
    }

    // ─── Interactive Multi-Category Menu ─────────────────────────────────────
    let currentView: ViewTarget = 'home';
    const initialPayload = buildHelpPayload(currentView, prefix, false);

    const authorId = message ? message.author.id : interaction!.user.id;
    const replyMessage = message
      ? await message.reply(initialPayload)
      : await (async () => {
          const res = await interaction!.reply({ ...initialPayload, fetchReply: true });
          return res;
        })();

    // Component Collector (2-minute interactive session)
    const collector = replyMessage.createMessageComponentCollector({
      filter: (i: any) => {
        if (i.user.id !== authorId) {
          i.reply({
            content: '❌ This interactive help menu belongs to another user. Use `>help` to open your own.',
            ephemeral: true,
          }).catch(() => {});
          return false;
        }
        return true;
      },
      time: 120_000,
    });

    collector.on('collect', async (i: any) => {
      try {
        if (i.isStringSelectMenu() && i.customId === 'help_category_select') {
          currentView = i.values[0] as ViewTarget;
          const updated = buildHelpPayload(currentView, prefix, false);
          await i.update(updated);
          return;
        }

        if (i.isButton()) {
          if (i.customId === 'help_btn_close') {
            collector.stop('closed');
            try {
              if (message) {
                await replyMessage.delete();
              } else {
                await i.update({
                  content: '🗑️ *Help menu closed.*',
                  embeds: [],
                  components: [],
                });
              }
            } catch {}
            return;
          }

          if (i.customId === 'help_btn_home') {
            currentView = 'home';
          } else if (i.customId.startsWith('help_btn_')) {
            currentView = i.customId.replace('help_btn_', '') as ViewTarget;
          }

          const updated = buildHelpPayload(currentView, prefix, false);
          await i.update(updated);
        }
      } catch (err) {
        // Ignored if expired or interaction acknowledged
      }
    });

    collector.on('end', async (_collected: any, reason: string) => {
      if (reason === 'closed') return;
      try {
        const disabledPayload = buildHelpPayload(currentView, prefix, true);
        await replyMessage.edit(disabledPayload);
      } catch {}
    });
  },
};

