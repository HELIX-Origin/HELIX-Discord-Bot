import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { createEmbed, formatError } from "../../handlers/message-handler.js";
import { getPlugin, getPluginByExtension, getAllPlugins } from "../../plugins/registry.js";
import type { DocReference, CodeExplanation } from "../../plugins/types.js";

function extractCodeAndLang(rawInput: string): { lang?: string; code: string } {
  const match = rawInput.match(/```(\w+)?\s*([\s\S]*?)```/);
  if (match) {
    return { lang: match[1]?.toLowerCase(), code: match[2].trim() };
  }
  return { code: rawInput.trim() };
}

export const explain: CommandDefinition = {
  name: "explain",
  description: "Explain code structure and purpose via static analysis & docs (zero AI)",
  category: "info",
  options: [
    { name: "code", description: "Code snippet to explain", type: "string", required: true },
    { name: "language", description: "Programming language (e.g. typescript, python, rust)", type: "string", required: false },
  ],
  async execute(ctx: ExecuteContext) {
    const { message, interaction, getOption, args } = ctx;

    const reply = async (payload: any) => {
      if (message) return message.reply(payload);
      return interaction!.reply(payload);
    };

    const rawCode = getOption<string>("code") || args.slice(1).join(" ");
    let languageOpt = getOption<string>("language") || (args[0] && !args[0].includes("`") ? args[0] : undefined);

    if (!rawCode) {
      return reply({
        embeds: [formatError("Usage: `>explain <language> <code>` or `/explain code:<code> language:<language>`")],
        ephemeral: true,
      });
    }

    const { lang: extractedLang, code } = extractCodeAndLang(rawCode);
    const targetLang = (languageOpt || extractedLang || "typescript").toLowerCase();

    const plugin = getPlugin(targetLang) || getPluginByExtension(`.${targetLang}`) || getAllPlugins()[0];

    if (!plugin) {
      return reply({
        embeds: [formatError("unsupported_language", { lang: targetLang })],
        ephemeral: true,
      });
    }

    try {
      const output = await plugin.explain(code);

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

      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Explain analysis failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};

export default explain;
