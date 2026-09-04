import path from 'path';
import prompts from 'prompts';
import pc from 'picocolors';
import { saveEnvValue, loadEnv } from '../../utils/env/index.js';
import { logger } from '../../utils/logger/index.js';
import { BotDatabase, getBotInviteUrl } from '../../../bot/index.js';

export async function runInteractiveBotSetup(): Promise<void> {
  loadEnv();
  logger.title('Interactive HELIX Bot Configuration');
  console.log('Configure required Discord bot keys and optional local CLI credentials.\n');

  const questions: prompts.PromptObject[] = [
    {
      type: 'password',
      name: 'botToken',
      message: 'Discord Bot Token (Required):',
      initial: process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || '',
      validate: (val: string) => (val.trim().length > 0 ? true : 'Bot token is required for the bot to run'),
    },
    {
      type: 'text',
      name: 'clientId',
      message: 'Discord Application Client ID (Required):',
      initial: process.env.DISCORD_CLIENT_ID || '',
      validate: (val: string) => (val.trim().length > 0 ? true : 'Client ID is required'),
    },
    {
      type: 'text',
      name: 'callbackUrl',
      message: 'OAuth2 Callback Base URL:',
      initial: process.env.DISCORD_CALLBACK_URL || 'http://localhost:5000',
    },
    {
      type: 'confirm',
      name: 'configApiKeys',
      message: 'Configure optional AI API keys for local CLI scripts? (Note: Discord bot members use per-user /helix-auth)',
      initial: false,
    },
    {
      type: (prev) => (prev ? 'password' : null),
      name: 'geminiApiKey',
      message: 'Google Gemini / Antigravity API Key (Optional):',
      initial: process.env.GEMINI_API_KEY || '',
    },
    {
      type: (prev, answers) => (answers.configApiKeys ? 'password' : null),
      name: 'opencodeApiKey',
      message: 'Open Code API Key (Optional):',
      initial: process.env.OPENCODE_API_KEY || '',
    },
    {
      type: (prev, answers) => (answers.configApiKeys ? 'password' : null),
      name: 'githubToken',
      message: 'GitHub Personal Access Token (Optional):',
      initial: process.env.GITHUB_TOKEN || '',
    },
    {
      type: 'confirm',
      name: 'confirmSave',
      message: 'Save these configuration values to .env?',
      initial: true,
    },
  ];

  const answers = await prompts(questions);

  if (!answers.confirmSave) {
    logger.info('Setup cancelled. No changes were written to .env.');
    return;
  }

  const envPath = path.resolve(process.cwd(), '.env');

  // Save bot keys
  saveEnvValue('DISCORD_TOKEN', answers.botToken.trim(), envPath);
  saveEnvValue('DISCORD_CLIENT_ID', answers.clientId.trim(), envPath);
  const callbackBase = (answers.callbackUrl || 'http://localhost:5000').trim();
  saveEnvValue('DISCORD_CALLBACK_URL', callbackBase, envPath);

  // Generate & save Discord Bot Invite URL with Administrator permissions (permissions=8) and scope=bot
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${answers.clientId.trim()}&permissions=8&scope=bot`;
  saveEnvValue('NEXT_PUBLIC_INVITE_URL', `"${inviteUrl}"`, envPath);

  // Save optional API keys if provided
  if (answers.geminiApiKey && answers.geminiApiKey.trim()) {
    saveEnvValue('GEMINI_API_KEY', answers.geminiApiKey.trim(), envPath);
  }
  if (answers.opencodeApiKey && answers.opencodeApiKey.trim()) {
    saveEnvValue('OPENCODE_API_KEY', answers.opencodeApiKey.trim(), envPath);
  }
  if (answers.githubToken && answers.githubToken.trim()) {
    saveEnvValue('GITHUB_TOKEN', answers.githubToken.trim(), envPath);
  }

  // Initialize SQLite Database
  const db = BotDatabase.getInstance();
  const dbStats = db.getStats();

  logger.success(`Configuration successfully written to ${pc.bold(envPath)}`);
  logger.success(`Administrator Bot Invite URL: ${pc.underline(pc.cyan(inviteUrl))}`);
  logger.success(`Internal SQLite database ready at ${pc.bold(dbStats.dbPath)}`);
  console.log('\nYou can now deploy slash commands and start the bot:');
  console.log(pc.cyan('  helix bot deploy'));
  console.log(pc.cyan('  helix bot start\n'));
}

export default runInteractiveBotSetup;
