import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import pc from 'picocolors';
import { botCommands } from './commands/index.js';
import { logger } from './utils/logger/index.js';

export class HelixBotClient {
  private static instance: HelixBotClient | null = null;
  private client: Client;
  private commands: Collection<string, any>;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this.commands = new Collection();
    for (const cmd of botCommands) {
      this.commands.set(cmd.data.name, cmd);
    }

    this.registerEvents();
    HelixBotClient.instance = this;
  }

  public static getInstance(): HelixBotClient | null {
    return HelixBotClient.instance;
  }

  public isReady(): boolean {
    return this.client.isReady();
  }

  public getGatewayLatency(): number {
    return this.client.ws ? this.client.ws.ping : -1;
  }

  public getGuildsCache(): Array<{
    id: string;
    name: string;
    memberCount: number;
    channelCount: number;
    joinedTimestamp: number | null;
  }> {
    if (!this.client.isReady()) return [];
    return this.client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      joinedTimestamp: guild.joinedTimestamp,
    }));
  }

  public async sendChannelMessage(channelId: string, content: string): Promise<boolean> {
    if (!this.client.isReady()) return false;
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && channel.isTextBased() && 'send' in channel) {
        await (channel as any).send(content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private registerEvents(): void {
    this.client.once(Events.ClientReady, (readyClient) => {
      logger.success(`HELIX Discord Bot is online! Connected as: ${pc.bold(readyClient.user.tag)}`);
      logger.info(`Serving ${readyClient.guilds.cache.size} server(s)`);
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error: any) {
        logger.error(`Error executing ${interaction.commandName}: ${error.message}`);
        const replyContent = { content: '❌ An error occurred while executing this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyContent);
        } else {
          await interaction.reply(replyContent);
        }
      }
    });
  }

  public async start(token: string): Promise<void> {
    await this.client.login(token);
  }

  public async stop(): Promise<void> {
    await this.client.destroy();
  }
}
