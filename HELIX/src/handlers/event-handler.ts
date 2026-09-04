import { Client, Events } from 'discord.js';
import { logs } from './logs-handler.js';

export interface BotEvent {
  name: Events;
  once?: boolean;
  execute(...args: any[]): void;
}

export async function loadEvents(client: Client): Promise<void> {
  const modules = import.meta.glob('../events/**/*.ts', { eager: true });
  let count = 0;

  for (const [, mod] of Object.entries(modules)) {
    for (const exp of Object.values(mod as any)) {
      const event = exp as BotEvent;
      if (!event?.name || typeof event?.execute !== 'function') continue;

      if (event.once) {
        client.once(event.name as any, (...args: any[]) => event.execute(...args));
      } else {
        client.on(event.name as any, (...args: any[]) => event.execute(...args));
      }
      count++;
    }
  }

  logs.info(`Loaded ${count} event handler(s)`);
}
