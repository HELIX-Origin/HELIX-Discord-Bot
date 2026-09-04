import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-help')
    .setDescription('Explore all HELIX Code and HELIX CLI commands and capabilities'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('🧬 HELIX Discord Suite - Command Index')
      .setDescription(
        'HELIX provides an all-in-one developer suite, moderation system, utility toolkit, and thread-based support ticket engine directly inside Discord.'
      )
      .setColor(0x00d2ff)
      .addFields(
        {
          name: '🛠️ Developer & Scaffolding',
          value:
            '• `/helix-create <template> <name>` - Scaffold 14 multi-framework project blueprints\n' +
            '• `/helix-list [category]` - Catalog of templates, AI models, and hosting platforms\n' +
            '• `/helix-scaffold [preset]` - Blueprint generator for Discord bot architectures',
        },
        {
          name: '🤖 AI & Code Intelligence',
          value:
            '• `/helix-ai <prompt> [provider]` - Natural language code generation & synthesis\n' +
            '• `/helix-explain <code> [language]` - Code explanation, debugging, and security review\n' +
            '• `/helix-auth <status|login|logout>` - Personal member AI session management',
        },
        {
          name: '🛡️ Moderation Suite',
          value:
            '• `/helix-mod <kick|ban|unban>` - Member removal with audit logging\n' +
            '• `/helix-mod <timeout|untimeout>` - Temporary mute with duration in minutes\n' +
            '• `/helix-mod purge <amount>` - Bulk delete up to 100 messages\n' +
            '• `/helix-mod <warn|warnings|clear-warnings>` - Server warning tracking',
        },
        {
          name: '🎫 Support & Ticket System',
          value:
            '• `/helix-ticket setup-hub [channel]` - Deploy persistent Ticket Hub panel & button\n' +
            '• `/helix-ticket <create|close>` - Open or close thread support tickets\n' +
            '• `/helix-ticket <add|remove>` - Manage thread participants\n' +
            '• `/helix-ticket transcript` - Download full markdown ticket transcript',
        },
        {
          name: '🧰 Utility Suite',
          value:
            '• `/helix-util <ping|snowflake>` - Latency metrics & ID timestamp decoder\n' +
            '• `/helix-util <avatar|userinfo>` - User profiles and avatar image viewer\n' +
            '• `/helix-util serverinfo` - Server statistics, channels, and role counts\n' +
            '• `/helix-util <poll|remind>` - Emoji polls and automated DM reminders',
        },
        {
          name: '⚙️ Configuration & Diagnostics',
          value:
            '• `/helix-set guild <tickets-hub|ticket-manager-role|mod-log-channel|welcome-channel|view>`\n' +
            '• `/helix-set user <ai-provider|notifications|view>`\n' +
            '• `/helix-info` - Comprehensive system, memory, and database metrics\n' +
            '• `/helix-status` - Gateway ping and active server cache\n' +
            '• `/helix-repo` - Remote GitHub/GitLab CLI credentials',
        }
      )
      .setFooter({ text: 'HELIX Discord Suite • 14 Native In-Process Commands' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
