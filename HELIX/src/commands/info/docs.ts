import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { createEmbed, formatError, getMessage } from "../../handlers/message-handler.js";
import { getPlugin, getPluginByExtension, getAllPlugins } from "../../plugins/registry.js";
import type { DocReference } from "../../plugins/types.js";

export const docs: CommandDefinition = {
  name: "docs",
  description: "Search official language documentation",
  category: "info",
  options: [
    { name: "topic", description: "Topic to look up (e.g. types, promises)", type: "string", required: true },
    { name: "language", description: "Programming language", type: "string", required: false },
  ],
  async execute(ctx: ExecuteContext) {
    const { message, interaction, getOption, args } = ctx;

    const reply = async (payload: any) => {
      if (message) return message.reply(payload);
      return interaction!.reply(payload);
    };

    const topic = getOption<string>("topic") || args[1] || args[0];
    const languageOpt = getOption<string>("language") || (args[1] ? args[0] : "typescript");

    if (!topic) {
      return reply({
        embeds: [formatError("Usage: `>docs [language] <topic>` or `/docs topic:<topic> language:<language>`")],
        ephemeral: true,
      });
    }

    const targetLang = languageOpt.toLowerCase();
    const plugin = getPlugin(targetLang) || getPluginByExtension(`.${targetLang}`) || getAllPlugins()[0];

    if (!plugin) {
      return reply({
        embeds: [formatError("unsupported_language", { lang: targetLang })],
        ephemeral: true,
      });
    }

    try {
      const references = await plugin.getDocumentation(topic);

      if (!references || references.length === 0) {
        return reply({
          embeds: [formatError(getMessage("info.docs.not_found", { topic, language: plugin.name }))],
          ephemeral: true,
        });
      }

      const primary = references[0];
      const embed = createEmbed("info.docs.embed", {
        topic: primary.title,
        summary: primary.summary,
        url: primary.url,
      });

      if (primary.codeExamples && primary.codeExamples.length > 0) {
        embed.addFields({
          name: "Code Example",
          value: `\`\`\`${plugin.id}\n${primary.codeExamples[0]}\n\`\`\``,
          inline: false,
        });
      }

      if (references.length > 1) {
        const moreLinks = references
          .slice(1, 4)
          .map((r: DocReference) => `• [${r.title}](${r.url})`)
          .join("\n");
        embed.addFields({ name: "Related Guides", value: moreLinks, inline: false });
      }

      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Documentation lookup failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
