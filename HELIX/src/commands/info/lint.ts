import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { getPrefixForGuild } from "../../handlers/command-handler.js";
import { createEmbed, formatError } from "../../handlers/message-handler.js";
import { getPlugin, getPluginByExtension, getAllPlugins } from "../../plugins/registry.js";
import { resolveSourceCode } from "../../plugins/sdk/source-resolver.js";
import type { LintResult } from "../../plugins/types.js";

export const lint: CommandDefinition = {
  name: "lint",
  description: "Static code analysis and syntax linting",
  category: "info",
  usage: "<code | url> [language]",
  examples: ['lint let x = 10; typescript', 'lint https://raw.githubusercontent.com/user/repo/main/app.ts'],
  options: [
    { name: "code", description: "Code snippet or file URL to lint", type: "string", required: false },
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
    const prefix = getPrefixForGuild(message?.guildId || interaction?.guildId || '');

    try {
      const resolved = await resolveSourceCode({
        input: inputToResolve,
        language: langOpt,
        message,
        interaction,
      });

      if (!resolved.code) {
        return reply({
          embeds: [formatError(`Usage: \`${prefix}lint [language] <code | url>\` or attach a file with \`${prefix}lint\``)],
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

      const output = await plugin.lint(resolved.code, resolved.sourceName);

      if (output.results.length === 0) {
        const embed = createEmbed("info.lint.clean_embed", { language: plugin.name });
        embed.setFooter({ text: `Source: ${resolved.sourceName} • ${resolved.sizeBytes} bytes` });
        return reply({ embeds: [embed] });
      }

      const issuesList = output.results
        .slice(0, 10)
        .map((r: LintResult) => {
          const icon = r.severity === "error" ? "🔴" : r.severity === "warning" ? "🟡" : "ℹ️";
          const doc = r.docLink ? ` [Docs](${r.docLink})` : "";
          return `${icon} **Line ${r.line}:${r.column}** — \`${r.code}\`: ${r.message}${doc}`;
        })
        .join("\n\n");

      const embed = createEmbed("info.lint.issues_embed", {
        language: plugin.name,
        errors: String(output.summary.errors),
        warnings: String(output.summary.warnings),
        info: String(output.summary.info),
        issuesList,
      });

      embed.setFooter({ text: `Source: ${resolved.sourceName} • ${resolved.sizeBytes} bytes` });
      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Lint analysis failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};

