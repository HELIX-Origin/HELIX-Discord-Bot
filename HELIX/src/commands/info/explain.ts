import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { createEmbed, formatError } from "../../handlers/message-handler.js";
import { getPlugin, getPluginByExtension, getAllPlugins } from "../../plugins/registry.js";
import { resolveSourceCode } from "../../plugins/sdk/source-resolver.js";
import type { DocReference, CodeExplanation } from "../../plugins/types.js";

export const explain: CommandDefinition = {
  name: "explain",
  description: "Explain code structure and AST syntax",
  category: "info",
  options: [
    { name: "code", description: "Code snippet or file URL to explain", type: "string", required: false },
    { name: "language", description: "Programming language", type: "string", required: false },
  ],
  async execute(ctx: ExecuteContext) {
    const { message, interaction, getOption, args } = ctx;

    const reply = async (payload: any) => {
      if (message) return message.reply(payload);
      return interaction!.reply(payload);
    };

    const rawInput = getOption<string>("code") || args.join(" ");
    const langOpt = getOption<string>("language") || (args[0] && !args[0].includes("`") && !args[0].startsWith("http") && args.length > 1 ? args[0] : undefined);
    const inputToResolve = langOpt && args.length > 1 ? args.slice(1).join(" ") : rawInput;

    try {
      const resolved = await resolveSourceCode({
        input: inputToResolve,
        language: langOpt,
        message,
        interaction,
      });

      if (!resolved.code) {
        return reply({
          embeds: [formatError("Usage: `>explain [language] <code | url>` or attach a file with `>explain`")],
          ephemeral: true,
        });
      }

      const targetLang = (resolved.language || "typescript").toLowerCase();
      const plugin = getPlugin(targetLang) || getPluginByExtension(`.${targetLang}`) || getAllPlugins()[0];

      if (!plugin) {
        return reply({
          embeds: [formatError("unsupported_language", { lang: targetLang })],
          ephemeral: true,
        });
      }

      const output = await plugin.explain(resolved.code);

      const explanationsList = output.explanations
        .slice(0, 8)
        .map((e: CodeExplanation) => `**Line ${e.line}** \`${e.code.slice(0, 40)}${e.code.length > 40 ? "..." : ""}\`\n↳ ${e.explanation}`)
        .join("\n\n");

      const embed = createEmbed("info.explain.embed", {
        language: plugin.name,
        summary: output.summary,
        explanationsList: explanationsList || "Single statement execution.",
      });

      if (output.docReferences && output.docReferences.length > 0) {
        const docLinks = output.docReferences.map((d: DocReference) => `• [${d.title}](${d.url}) — ${d.summary}`).join("\n");
        embed.addFields({ name: "Documentation References", value: docLinks, inline: false });
      }

      embed.setFooter({ text: `Source: ${resolved.sourceName} • ${resolved.sizeBytes} bytes` });
      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Explain analysis failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};

