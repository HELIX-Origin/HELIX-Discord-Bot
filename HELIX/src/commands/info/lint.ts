import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { createEmbed, formatError } from "../../handlers/message-handler.js";
import { getPlugin, getPluginByExtension, getAllPlugins } from "../../plugins/registry.js";
import type { LintResult } from "../../plugins/types.js";

function extractCodeAndLang(rawInput: string): { lang?: string; code: string } {
  const match = rawInput.match(/```(\w+)?\s*([\s\S]*?)```/);
  if (match) {
    return { lang: match[1]?.toLowerCase(), code: match[2].trim() };
  }
  return { code: rawInput.trim() };
}

export const lint: CommandDefinition = {
  name: "lint",
  description: "Static code analysis and linting (100% local, zero AI)",
  category: "info",
  options: [
    { name: "code", description: "Code snippet to analyze", type: "string", required: true },
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
        embeds: [formatError("Usage: `>lint <language> <code>` or `/lint code:<code> language:<language>`")],
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
      const output = await plugin.lint(code);

      if (output.results.length === 0) {
        return reply({
          embeds: [createEmbed("info.lint.clean_embed", { language: plugin.name })],
        });
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

      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Lint analysis failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};

export default lint;
