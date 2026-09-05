import type { CommandDefinition, ExecuteContext } from "../../types/command.js";
import { getPrefixForGuild } from "../../handlers/command-handler.js";
import { createEmbed, formatError } from "../../handlers/message-handler.js";
import { scanSecurity } from "../../plugins/sdk/security-scanner.js";
import { resolveSourceCode } from "../../plugins/sdk/source-resolver.js";

export const inspect: CommandDefinition = {
  name: "inspect",
  description: "Run security and anti-pattern analysis",
  category: "info",
  usage: "<code | url> [language]",
  examples: ['inspect function evalData(x) { eval(x); } typescript', 'inspect https://raw.githubusercontent.com/user/repo/main/app.ts'],
  options: [
    { name: "code", description: "Code snippet or file URL to inspect", type: "string", required: false },
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
          embeds: [formatError(`Usage: \`${prefix}inspect [language] <code | url>\` or attach a file with \`${prefix}inspect\``)],
          ephemeral: true,
        });
      }

      const targetLang = (resolved.language || "typescript").toLowerCase();
      const { getPlugin, getPluginByExtension, getAllPlugins } = await import("../../plugins/registry.js");
      const plugin = getPlugin(targetLang) || getPluginByExtension(`.${targetLang}`) || getAllPlugins()[0];

      let audit: any;
      if (plugin && typeof plugin.inspect === "function") {
        audit = await plugin.inspect(resolved.code);
      } else {
        audit = scanSecurity(resolved.code, targetLang);
      }

      if (audit.findings.length === 0) {
        const embed = createEmbed("info.inspect.clean_embed", { language: plugin?.name || targetLang });
        embed.setFooter({ text: `Source: ${resolved.sourceName} • ${resolved.sizeBytes} bytes` });
        return reply({ embeds: [embed] });
      }

      const findingsList = audit.findings
        .slice(0, 8)
        .map((f: any) => {
          const icon = f.severity === "critical" ? "🔴" : f.severity === "high" ? "🟠" : "🟡";
          const cweStr = f.cwe ? ` [${f.cwe}]` : "";
          return `${icon} **${f.title}** (\`${f.ruleId}\`${cweStr})\n↳ Line ${f.line}: \`${f.snippet}\`\n💡 *Fix:* ${f.recommendation}`;
        })
        .join("\n\n");

      const embed = createEmbed("info.inspect.issues_embed", {
        language: targetLang,
        score: String(audit.score),
        critical: String(audit.summary.critical),
        high: String(audit.summary.high),
        medium: String(audit.summary.medium),
        low: String(audit.summary.low),
        findingsList,
      });

      embed.setFooter({ text: `Source: ${resolved.sourceName} • ${resolved.sizeBytes} bytes` });
      return reply({ embeds: [embed] });
    } catch (err: any) {
      return reply({
        embeds: [formatError(`Security inspection failed: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
