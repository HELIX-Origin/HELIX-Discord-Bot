import { loadBotEnv, getBotToken, getClientId, getPort, getCallbackUrl } from './src/env.js';

// Ensure environment variables are loaded immediately before initializing subsystems
loadBotEnv();

import { createBot, getBot } from './src/client.js';
import { BotCallbackServer } from './src/server.js';
import { logs } from './src/handlers/logs-handler.js';
import { loadPrefixCommands, handlePrefixMessage } from './src/handlers/command-handler.js';
import { loadSlashCommands, registerGlobalSlashCommands, handleSlashInteraction } from './src/handlers/slash-handler.js';
import { loadEvents } from './src/handlers/event-handler.js';
import { loadAllPlugins } from './src/plugins/plugin-loader.js';
import { registerPlugins } from './src/plugins/registry.js';
import { botSettings } from './src/handlers/settings-manager.js';

export * from './src/client.js';
export * from './src/server.js';
export * from './src/db/database.js';
export * from './src/env.js';
export * from './src/keep-alive.js';
export * from './src/handlers/settings-manager.js';

export interface LaunchBotOptions {
  token?: string;
  callbackUrl?: string;
}

export async function launchBotAndDashboard(options: LaunchBotOptions = {}): Promise<{
  bot: ReturnType<typeof getBot>;
  server: BotCallbackServer;
}> {
  const token = options.token || getBotToken();
  const port = getPort();
  const callbackUrl = options.callbackUrl || getCallbackUrl();

  console.log('====================================================');
  console.log('  🤖 HELIX Discord Bot & Web Dashboard');
  console.log('====================================================\n');

  // Preload and hydrate all guild settings into Bot Session Memory
  botSettings.hydrateFromDatabase();

  // Discover and register all language plugins
  try {
    const loadedPlugins = await loadAllPlugins();
    registerPlugins(loadedPlugins);
    logs.info(`Language Plugin System initialized: ${loadedPlugins.length} plugin(s) active.`);
  } catch (err: any) {
    logs.warn(`Plugin loader initialization warning: ${err.message}`);
  }

  const server = new BotCallbackServer({ callbackUrl });
  await server.start();

  const clientId = getClientId();
  let client = createBot(true);

  if (token) {
    const masked = token.length > 10 ? `${token.slice(0, 6)}...${token.slice(-4)}` : '***';
    logs.info(`Discord credentials loaded: Token=${masked} (${token.length} chars), ClientID=${clientId || 'Not Set'}`);

    try {
      await loadPrefixCommands();
      await loadSlashCommands();
      await loadEvents(client);

      logs.info('Connecting Discord Bot client to gateway...');

      client.on('error', (err) => {
        logs.error(`Discord client error: ${err.message}`);
      });

      client.on('shardError', (err) => {
        logs.error(`Discord WebSocket connection error: ${err.message}`);
      });

      try {
        await client.login(token);
        logs.success(`Discord Bot connected to gateway as ${client.user?.tag || 'HELIX Bot'}.`);
      } catch (err: any) {
        const isDisallowedIntents =
          err?.code === 'DisallowedIntents' ||
          (typeof err?.message === 'string' &&
            (err.message.toLowerCase().includes('disallowed intents') ||
              err.message.toLowerCase().includes('disallowedintents')));

        if (isDisallowedIntents) {
          logs.warn('Privileged Gateway Intent (MessageContent) is disabled in Discord Developer Portal.');
          logs.info('Retrying connection with standard intents (Guilds, GuildMessages)...');
          try {
            await client.destroy();
          } catch {}
          client = createBot(false);
          await loadEvents(client);
          await client.login(token);
          logs.success(`Discord Bot connected to gateway with fallback intents as ${client.user?.tag || 'HELIX Bot'} (Slash commands active).`);
          logs.info('To enable prefix commands (e.g. >help, >ticket), enable "Message Content Intent" in Discord Developer Portal -> Bot -> Privileged Gateway Intents.');
        } else if (err?.code === 'TokenInvalid' || (err?.message && err.message.toLowerCase().includes('invalid token'))) {
          logs.error('Invalid Discord Bot Token provided (Discord API returned 401: Unauthorized).');
          logs.warn('👉 The current DISCORD_TOKEN is expired, invalid, or was reset in the Developer Portal.');
          logs.warn(`👉 Go to: https://discord.com/developers/applications/${clientId || ''}/bot`);
          logs.warn('👉 Click "Reset Token", copy the new token, and paste it into DISCORD_TOKEN in your .env file.');
        } else {
          logs.error(`Discord gateway connection failed: ${err.message}`);
          throw err;
        }
      }

      logs.info('Slash commands are optional per-guild (enable via ">set slash enable <category>").');
    } catch (err: any) {
      logs.error(`Gateway error: ${err.message}`);
    }
  } else {
    logs.warn('No DISCORD_TOKEN found in process environment or .env file.');
    logs.warn('👉 Please configure DISCORD_TOKEN in your .env file (or set DISCORD_TOKEN in your environment).');
    logs.info('Web dashboard is running. Configure your bot token in .env to connect.');
  }

  const shutdown = async () => {
    logs.info('Shutting down...');
    try {
      const bot = getBot();
      if (bot) await bot.destroy();
      await server.stop();
    } catch {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { bot: getBot(), server };
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('index.js') ||
  process.argv[1].endsWith('index.ts') ||
  process.argv[1].endsWith('HELIX/index.js') ||
  process.argv[1].endsWith('HELIX/index.ts')
);

if (isDirectRun) {
  launchBotAndDashboard().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
