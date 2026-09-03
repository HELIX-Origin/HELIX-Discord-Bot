import { Command } from 'commander';
import { createCommand } from './commands/create/index.js';
import { listCommand } from './commands/list/index.js';
import { aiCommand } from './commands/ai/index.js';
import { repoCommand } from './commands/repo/index.js';
import { infoCommand } from './commands/info/index.js';
import { updateCommand } from './commands/update/index.js';
import { completionCommand } from './commands/completion/index.js';
import { botCommand } from './commands/bot/index.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('helix')
    .description('Universal development scaffolding, multi-agent assistant & code hosting automation')
    .version('0.1.0');

  // Command: create
  program
    .command('create')
    .description('Scaffold a new project from a multi-framework template')
    .argument('<type>', 'Project type (e.g. discord-bot, web, desktop, mobile, game-engine, backend)')
    .argument('<name>', 'Project directory name')
    .option('-t, --template <name>', 'Specific template name (e.g. web-react, desktop-tauri)')
    .option('-l, --language <lang>', 'Target language')
    .option('-f, --framework <framework>', 'Target framework')
    .option('--skip-install', 'Skip dependency installation')
    .option('--skip-git', 'Skip local git repository initialization')
    .option('--dry-run', 'Preview files that would be generated without writing to disk')
    .option('--git-platform <platform>', 'Remote platform (github, gitlab, bitbucket, none)')
    .option('--repo-visibility <visibility>', 'Remote repository visibility (public, private)', 'public')
    .action(async (type, name, options) => {
      await createCommand(type, name, options);
    });

  // Command: list
  program
    .command('list')
    .description('List registered agents, skills, and templates')
    .argument('[category]', 'Category to list (agents, skills, templates, all)', 'all')
    .action(async (category) => {
      await listCommand(category);
    });

  // Command: ai
  program
    .command('ai')
    .description('Manage and interact with AI agent integrations (Copilot, Antigravity, Open Code)')
    .argument('[action]', 'Action to perform: status, test, query, generate', 'status')
    .argument('[query]', 'Query, instruction, or feature description (for query/generate/test)')
    .option('--provider <provider>', 'Explicit AI provider override (copilot, antigravity, opencode)')
    .action(async (action, query, options) => {
      await aiCommand(action, query, options);
    });

  // Command: repo
  program
    .command('repo')
    .description('Manage code hosting platforms and remote repositories via official CLIs')
    .argument('[action]', 'Action to perform: status, create, sync-secrets', 'status')
    .option('-p, --platform <platform>', 'Hosting platform (github, gitlab, bitbucket)', 'github')
    .option('-n, --name <name>', 'Remote repository name')
    .option('-v, --visibility <visibility>', 'Repository visibility (public, private)', 'public')
    .option('--env-path <path>', 'Custom .env file path to sync to GitHub Secrets')
    .action(async (action, options) => {
      await repoCommand(action, options);
    });

  // Command: info
  program
    .command('info')
    .description('Show system diagnostic and detected CLI toolchain versions')
    .action(async () => {
      await infoCommand();
    });

  // Command: update
  program
    .command('update')
    .description('Check for HELIX CLI updates on npm')
    .action(async () => {
      await updateCommand();
    });

  // Command: completion
  program
    .command('completion')
    .description('Generate shell auto-completion script (bash, zsh, powershell)')
    .argument('[shell]', 'Target shell (bash, zsh, powershell)', 'bash')
    .action(async (shell) => {
      await completionCommand(shell);
    });

  // Command: bot
  program
    .command('bot')
    .description('Manage the built-in HELIX Discord bot and NextAuth Web Dashboard')
    .argument('[action]', 'Action to perform: status, setup, dashboard, config, deploy, start', 'status')
    .option('--token <token>', 'Discord bot token')
    .option('--client-id <clientId>', 'Discord application client ID')
    .option('--client-secret <clientSecret>', 'Discord application client secret')
    .option('--guild-id <guildId>', 'Discord development guild ID for immediate deployment')
    .option('--callback-url <callbackUrl>', 'OAuth2 callback base URL (default: http://localhost:5000)')
    .option('--port <port>', 'Dashboard and OAuth2 server port (default: 5000)', parseInt)
    .option('--env-path <path>', 'Custom .env file path to read/write')
    .option('--dry-run', 'Preview slash command definitions without registering to Discord API')
    .action(async (action, options) => {
      await botCommand(action, options);
    });

  return program;
}
