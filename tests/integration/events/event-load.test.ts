import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const TEST_DIR = path.dirname(__filename);
const EVENTS_DIR = path.resolve(TEST_DIR, '..', '..', '..', 'HELIX', 'src', 'events');

const EVENT_FILE_EXPECTATION: Record<string, { export: string; name: string; once: boolean }> = {
  'ready.ts': { export: 'ready', name: 'clientReady', once: true },
  'message-create.ts': { export: 'messageCreate', name: 'messageCreate', once: false },
  'interaction-create.ts': { export: 'interactionCreate', name: 'interactionCreate', once: false },
  'guild-create.ts': { export: 'guildCreate', name: 'guildCreate', once: false },
  'guild-delete.ts': { export: 'guildDelete', name: 'guildDelete', once: false },
  'guild-member-add.ts': { export: 'guildMemberAdd', name: 'guildMemberAdd', once: false },
};

async function importEvent(file: string): Promise<any> {
  const rel = path.relative(TEST_DIR, file).replaceAll('\\', '/');
  const specifier = rel.startsWith('.') ? rel : `./${rel}`;
  const mod: any = await import(specifier);
  return mod[EVENT_FILE_EXPECTATION[path.basename(file)].export];
}

describe('integration — event modules', () => {
  it('contains exactly the expected event files', () => {
    const files = fs.readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.ts')).sort();
    expect(Object.keys(EVENT_FILE_EXPECTATION).sort()).toEqual(files);
  });

  it('presents a valid BotEvent for every event file', async () => {
    for (const file of Object.keys(EVENT_FILE_EXPECTATION)) {
      const event = await importEvent(path.join(EVENTS_DIR, file));
      const expectation = EVENT_FILE_EXPECTATION[file];
      expect(event, file).toBeDefined();
      expect(event.name, file).toBe(expectation.name);
      expect(event.once ?? false, file).toBe(expectation.once);
      expect(typeof event.execute, file).toBe('function');
    }
  });
});