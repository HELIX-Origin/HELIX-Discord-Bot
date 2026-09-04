import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

let client: Client | null = null;

export function createBot(): Client {
  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });
  return client;
}

export function getBot(): Client | null {
  return client;
}

export function isBotOwner(userId: string): boolean {
  const ownerId = process.env.DISCORD_OWNER_ID || process.env.BOT_OWNER_ID;
  if (ownerId) return userId === ownerId;
  if (client?.application?.owner) return userId === client.application.owner.id;
  return false;
}

export class HelixBotClient {
  static getInstance(): HelixBotClient | null {
    if (!client) return null;
    return new HelixBotClient(client);
  }

  constructor(private c: Client) {}

  isReady(): boolean {
    return this.c.isReady();
  }

  getGatewayLatency(): number {
    return this.c.ws.ping;
  }

  getGuildsCache() {
    return [...this.c.guilds.cache.values()];
  }

  async isOwner(userId: string): Promise<boolean> {
    return isBotOwner(userId);
  }

  async sendChannelMessage(channelId: string, content: string): Promise<boolean> {
    try {
      const ch = await this.c.channels.fetch(channelId);
      if (ch && ch.isTextBased() && !ch.isDMBased()) {
        await (ch as TextChannel).send(content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
