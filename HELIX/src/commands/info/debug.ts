import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { createEmbed, formatError } from "../../handlers/message-handler.js";
import { diagnoseError } from "../../plugins/sdk/stack-trace-parser.js";
import { resolveSourceCode } from "../../plugins/sdk/source-resolver.js";

export const debug: CommandDefinition = {
  name: "debug",
  description: "Diagnose stack traces, compiler errors, log files, or remote logs (100% local, zero AI)",
  category: "info",
  options: [
    { name: "error", description: "Stack trace, exception, compiler error message, or log URL/file", type: "string", required: false },
  ],
  async execute(ctx: ExecuteContext) {
    const { message, interaction, getOption, args } = ctx;

    const reply = async (payload: any) => {
      if (message) return message.reply(payload);
      return interaction!.reply(payload);
    };

    const rawError = getOption<string>("error") || args.join(" ");

    try {
      const resolved = await resolveSourceCode({
        input: rawError,
        message,
        interaction,
      });

      if (!resolved.code) {
        return reply({
          embeds: [formatError("Usage: `>debug <error_log_or_stack_trace>` or attach a log file with `>debug`")],
          ephemeral: true,
        });
      }

      const rawDiag = diagnoseError(resolved.code);
      const targetLang = rawDiag.language;

      const { getPlugin, getPluginByExtension, getAllPlugins } = await import("../../plugins/registry.js");
      const plugin = getPlugin(targetLang) || getPluginByExtension(`.${targetLang}`) || getAllPlugins()[0];

      let diagnostic: any;
      if (plugin && typeof plugin.debug === "function") {
        diagnostic = await plugin.debug(resolved.code);
      } else {
        diagnostic = rawDiag;
      }

      const embed = createEmbed("info.debug.embed", {
        errorType: diagnostic.errorType,
        errorMessage: diagnostic.errorMessage,
        rootCause: diagnostic.rootCause,
        suggestedFix: diagnostic.suggestedFix,
      });

      if (diagnostic.failingLocation?.file || diagnostic.failingLocation?.line) {
        const fileLoc = diagnostic.failingLocation.file || "Source File";
        const lineLoc = diagnostic.failingLocation.line ? `:${diagnostic.failingLocation.line}` : "";
        const colLoc = diagnostic.failingLocation.column ? `:${diagnostic.failingLocation.column}` : "";
        embed.addFields({
          name: "📍 Failing Location",
          value: `\`${fileLoc}${lineLoc}${colLoc}\``,
          inline: true,
        });
      }

      if (diagnostic.fixCode) {
        embed.addFields(
          {
            name: "🔴 Original Vulnerable / Failing Code",
            value: `\`\`\`${diagnostic.language}\n${diagnostic.fixCode.original}\n\`\`\``,
            inline: false,
          },
          {
            name: "🟢 Recommended Fixed Code",
            value: `\`\`\`${diagnostic.language}\n${diagnostic.fixCode.fixed}\n\`\`\``,
            inline: false,
          }
        );
      }

      if (diagnostic.docLink) {
        embed.addFields({
          name: "📚 Reference Documentation",
          value: `[Official Reference](${diagnostic.docLink})`,
          inline: false,
        });
      }

      embed.setFooter({ text: `Source: ${resolved.sourceName} • ${resolved.sizeBytes} bytes` });
      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Debug diagnostic failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
