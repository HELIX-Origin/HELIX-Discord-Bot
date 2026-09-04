import pc from 'picocolors';
import { logger } from '../../utils/logger/index.js';
import { getAuthorizationUrl, getBotInviteUrl, resolveBotInviteUrl, BotDatabase, HelixBotClient } from '../../../bot/index.js';

export function showBotStatus(): void {
  const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID;
  const callbackBase = process.env.DISCORD_CALLBACK_URL || 'http://localhost:5000';
  const callbackUrl = `${callbackBase.replace(/\/$/, '')}/api/auth/callback/discord`;
  const dbStats = BotDatabase.getInstance().getStats();

  logger.title('Built-in Discord Bot Status & Configuration');

  const mask = (val?: string) => {
    if (!val) return pc.red('Not set');
    if (val.length < 8) return pc.yellow('***');
    return pc.green(`${val.slice(0, 4)}...${val.slice(-4)}`);
  };

  const inviteUrl = resolveBotInviteUrl(process.env.NEXT_PUBLIC_INVITE_URL, callbackBase, clientId);

  const nextAuthUrl = process.env.NEXTAUTH_URL || callbackBase;
  const nextAuthInternal = process.env.NEXTAUTH_INTERNAL_URL || nextAuthUrl;

  const botClient = HelixBotClient.getInstance();
  const liveGuildCount = botClient ? botClient.getGuildsCache().length : 0;

  console.log(`  ${token ? pc.green('✔') : pc.red('✖')} Bot Token:     ${mask(token)}`);
  console.log(`  ${clientId ? pc.green('✔') : pc.red('✖')} Client ID:     ${clientId ? pc.cyan(clientId) : pc.red('Not set')}`);
  console.log(`  ${pc.dim('○')} Guild Count:   ${liveGuildCount > 0 ? pc.green(`${liveGuildCount} guild(s) connected`) : pc.dim('Auto-detected via Discord gateway')}`);
  console.log(`  ${pc.green('✔')} Callback URL:  ${pc.cyan(callbackUrl)}`);
  console.log(`  ${pc.green('✔')} NEXTAUTH_URL:  ${pc.cyan(nextAuthUrl)}`);
  console.log(`  ${pc.green('✔')} NEXTAUTH_INT:  ${pc.cyan(nextAuthInternal)}`);
  console.log(`  ${inviteUrl ? pc.green('✔') : pc.yellow('○')} Invite URL:    ${inviteUrl ? pc.cyan(inviteUrl) : pc.yellow('Set DISCORD_CLIENT_ID to generate')}`);
  console.log(`  ${dbStats.exists ? pc.green('✔') : pc.red('✖')} SQLite DB:     ${dbStats.exists ? pc.green(`${dbStats.dbPath} (${Math.round(dbStats.sizeBytes / 1024)} KB)`) : pc.yellow('Not generated (run npm run setup)')}`);
  console.log();

  if (!token || !clientId) {
    logger.warn('To configure the built-in bot:');
    console.log(`  1. Create a bot in the ${pc.cyan('Discord Developer Portal')} (https://discord.com/developers).`);
    console.log(`  2. Add the OAuth2 redirect URL in Discord Portal:`);
    console.log(`     ${pc.yellow(callbackUrl)}`);
    console.log(`  3. Run ${pc.bold('helix bot setup')} or set variables in ${pc.bold('.env')}:`);
    console.log(pc.dim(`     DISCORD_TOKEN=your_token_here`));
    console.log(pc.dim(`     DISCORD_CLIENT_ID=your_client_id_here`));
    console.log(pc.dim(`     DISCORD_CALLBACK_URL=http://localhost:5000`));
    console.log(pc.dim(`     NEXT_PUBLIC_INVITE_URL="https://discord.com/api/oauth2/authorize?client_id=yourclientid&permissions=8&scope=bot"\n`));
  } else {
    logger.success('Discord Bot credentials configured! Ready to start: "helix bot start"');
    console.log('\n  🔗 Administrator Bot Invite URL:');
    console.log(`  ${pc.underline(pc.cyan(inviteUrl || getBotInviteUrl(clientId, 8)))}\n`);
  }
}
