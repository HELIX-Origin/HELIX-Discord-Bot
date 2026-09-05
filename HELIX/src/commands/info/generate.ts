import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { createEmbed, formatError } from "../../handlers/message-handler.js";
import { getPlugin, getPluginByExtension, getAllPlugins } from "../../plugins/registry.js";

export const generate: CommandDefinition = {
  name: "generate",
  description: "Generate boilerplate code, models, and routes",
  category: "info",
  options: [
    { name: "language", description: "Target language (e.g. typescript, rust)", type: "string", required: true },
    { name: "type", description: "Snippet type (model, route, test, algorithm)", type: "string", required: true },
    { name: "name", description: "Entity or module name", type: "string", required: true },
  ],
  async execute(ctx: ExecuteContext) {
    const { message, interaction, getOption, args } = ctx;

    const reply = async (payload: any) => {
      if (message) return message.reply(payload);
      return interaction!.reply(payload);
    };

    const language = getOption<string>("language") || args[0];
    const type = getOption<string>("type") || args[1] || "model";
    const name = getOption<string>("name") || args[2] || "Item";

    if (!language || !type || !name) {
      return reply({
        embeds: [formatError("Usage: `>generate <language> <type> <name>` or `/generate language:<lang> type:<type> name:<name>`\nValid types: `model`, `route`, `test`, `algorithm`")],
        ephemeral: true,
      });
    }

    const plugin = getPlugin(language.toLowerCase()) || getPluginByExtension(`.${language.toLowerCase()}`) || getAllPlugins()[0];

    if (!plugin) {
      return reply({
        embeds: [formatError("unsupported_language", { lang: language })],
        ephemeral: true,
      });
    }

    try {
      let snippet: any;
      if (typeof plugin.generate === "function") {
        snippet = await plugin.generate(type, name);
      } else {
        const { buildSnippet } = await import("../../plugins/sdk/snippet-builder.js");
        snippet = buildSnippet(plugin.id, type, name);
      }

      const embed = createEmbed("info.generate.embed", {
        name: snippet.name,
        language: plugin.name,
        snippetType: snippet.snippetType,
        description: snippet.description,
      });

      embed.addFields({
        name: `Generated ${snippet.language} Code`,
        value: `\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``,
        inline: false,
      });

      if (snippet.dependencies && snippet.dependencies.length > 0) {
        embed.addFields({
          name: "📦 Required Dependencies",
          value: snippet.dependencies.map((d: string) => `\`${d}\``).join(", "),
          inline: true,
        });
      }

      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Snippet generation failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
