import { Client, Events } from 'discord.js';
import { logs } from './logs-handler.js';

export interface BotEvent {
  name: Events;
  once?: boolean;
  execute(...args: any[]): void;
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function scanEventFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanEventFiles(fullPath));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) &&
      !entry.name.endsWith('.d.ts') &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.js')
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function loadEvents(client: Client): Promise<void> {
  const eventsDir = path.resolve(__dirname, '..', 'events');
  const filePaths = scanEventFiles(eventsDir);
  let count = 0;

  for (const filePath of filePaths) {
    try {
      const mod = await import(pathToFileURL(filePath).href);
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
    } catch (err: any) {
      logs.warn(`Failed to load event file ${filePath}: ${err.message}`);
    }
  }

  logs.info(`Loaded ${count} event handler(s)`);
}
