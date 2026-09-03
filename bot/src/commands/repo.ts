import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { RepoManager } from '../../../src/core/hosting/index.js';

export const repoCommand = {
  data: new SlashCommandBuilder()
    .setName('helix-repo')
    .setDescription('Check remote repository and official CLI status')
    .addStringOption(option =>
      option
        .setName('platform')
        .setDescription('Code hosting platform')
        .setRequired(false)
        .addChoices(
          { name: 'GitHub (gh)', value: 'github' },
          { name: 'GitLab (glab)', value: 'gitlab' },
          { name: 'Bitbucket', value: 'bitbucket' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const platform = interaction.options.getString('platform');

    if (platform === 'github') {
      const gh = RepoManager.checkGitHub();
      const embed = new EmbedBuilder()
        .setTitle('GitHub CLI Status')
        .setColor(gh.authenticated ? 0x00ff00 : 0xff0000)
        .setDescription(gh.authDetail)
        .addFields(
          { name: 'CLI Installed', value: gh.cliInstalled ? 'Yes' : 'No', inline: true },
          { name: 'Authenticated', value: gh.authenticated ? 'Yes' : 'No', inline: true }
        );
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (platform === 'gitlab') {
      const glab = RepoManager.checkGitLab();
      const embed = new EmbedBuilder()
        .setTitle('GitLab CLI Status')
        .setColor(glab.authenticated ? 0x00ff00 : 0xff0000)
        .setDescription(glab.authDetail)
        .addFields(
          { name: 'CLI Installed', value: glab.cliInstalled ? 'Yes' : 'No', inline: true },
          { name: 'Authenticated', value: glab.authenticated ? 'Yes' : 'No', inline: true }
        );
      await interaction.reply({ embeds: [embed] });
      return;
    }

    const all = RepoManager.checkAll();
    const desc = all.map(p => `**${p.name}**: ${p.authDetail}`).join('\n\n');
    const embed = new EmbedBuilder()
      .setTitle('Code Hosting Platform Overview')
      .setDescription(desc)
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });
  },
};
