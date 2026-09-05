import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { createEmbed, formatError } from "../../handlers/message-handler.js";
import { refactorCode } from "../../plugins/sdk/code-transformer.js";
import { resolveSourceCode } from "../../plugins/sdk/source-resolver.js";

export const refactor: CommandDefinition = {
  name: "refactor",
  description: "Modernize code syntax and apply idioms for pasted code, attachments, or remote repos (100% local, zero AI)",
  category: "info",
  options: [
    { name: "code", description: "Code snippet, file URL (GitHub/GitLab/Bitbucket/Gist), or raw text", type: "string", required: false },
    { name: "language", description: "Programming language (default: typescript)", type: "string", required: false },
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
          embeds: [formatError("Usage: `>refactor [language] <code | url>` or attach a file with `>refactor`")],
          ephemeral: true,
        });
      }

      const targetLang = (resolved.language || "typescript").toLowerCase();
      const { getPlugin, getPluginByExtension, getAllPlugins } = await import("../../plugins/registry.js");
      const plugin = getPlugin(targetLang) || getPluginByExtension(`.${targetLang}`) || getAllPlugins()[0];

      let output: any;
      if (plugin && typeof plugin.refactor === "function") {
        output = await plugin.refactor(resolved.code);
      } else {
        const { refactorCode } = await import("../../plugins/sdk/code-transformer.js");
        output = refactorCode(resolved.code, targetLang);
      }

      const transformationsList = output.transformations
        .map((t: string) => `• ${t}`)
        .join("\n");

      const embed = createEmbed("info.refactor.embed", {
        language: plugin?.name || targetLang,
        diffSummary: output.diffSummary,
        transformationsList,
      });

      embed.addFields(
        {
          name: "🔴 Original Code",
          value: `\`\`\`${targetLang}\n${output.originalCode.slice(0, 1000)}\n\`\`\``,
          inline: false,
        },
        {
          name: "🟢 Refactored Code",
          value: `\`\`\`${targetLang}\n${output.refactoredCode.slice(0, 1000)}\n\`\`\``,
          inline: false,
        }
      );

      embed.setFooter({ text: `Source: ${resolved.sourceName} • ${resolved.sizeBytes} bytes` });
      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Refactor execution failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
