/**
 * src/bot/handlers/loader.ts
 *
 * Dynamic command loader — discovers and registers every BotCommand from the
 * `src/bot/commands/<category>/` directory tree at startup, and every
 * PrefixCommand from the `prefix` category.
 *
 * Design principles (Rule 06 & Discord.js Standards):
 *  - Zero static command index files inside `src/bot/commands/`.
 *  - Commands are dynamically discovered by scanning category subdirectories.
 *  - Each command file is self-contained and exports its command object.
 *  - The loader calls `registerCommand()` (slash) or `registerPrefixCommand()`
 *    (prefix) for each discovered command.
 */

import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { registerCommand, type BotCommand } from './registry.js';
import { registerPrefixCommand } from './prefix.js';
import type { PrefixCommand } from '../lib/prefix/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recognised command category directory names under src/bot/commands/.
 *
 * Every directory here must exist in the tree, otherwise its commands are never
 * discovered. Keep in sync with `CommandCategory` in `registry.ts`, which the
 * dashboard uses to group slash commands.
 */
const COMMAND_CATEGORIES = ['feeds', 'admin', 'mod', 'utility', 'prefix'] as const;

/** Category whose exports are registered as prefix commands. */
const PREFIX_CATEGORY = 'prefix';

/**
 * Returns true when a module export value looks like a BotCommand —
 * i.e. it has a `def` object with a `name` string and an `execute` function.
 */
function isBotCommand(value: unknown): value is BotCommand {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['def'] === 'object' &&
    v['def'] !== null &&
    typeof (v['def'] as Record<string, unknown>)['name'] === 'string' &&
    typeof v['execute'] === 'function'
  );
}

/**
 * Returns true when a module export value looks like a PrefixCommand.
 *
 * Prefix commands are identified by a flat `name`/`usage`/`execute` shape with
 * no `def`, which keeps the two registries unambiguous.
 */
function isPrefixCommand(value: unknown): value is PrefixCommand {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v['def'] === undefined &&
    typeof v['name'] === 'string' &&
    typeof v['usage'] === 'string' &&
    typeof v['description'] === 'string' &&
    typeof v['execute'] === 'function'
  );
}

let loaded = false;
let loadPromise: Promise<number> | null = null;

/**
 * Dynamically discovers and registers all BotCommands from the commands directory.
 *
 * Safe to call concurrently and multiple times — only runs discovery once.
 * Resolves to the number of commands registered.
 */
export async function loadAllCommands(): Promise<number> {
  if (loaded) return 0;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Resolve commands directory relative to this file's location.
    // In source/test (Vitest/tsx): src/bot/handlers/.. -> src/bot/commands
    // In compiled dist (production): dist/bot/handlers/.. -> dist/bot/commands
    const commandsDir = join(__dirname, '..', 'commands');

    let count = 0;

    for (const category of COMMAND_CATEGORIES) {
      const categoryDir = join(commandsDir, category);

      let entries: string[];
      try {
        entries = readdirSync(categoryDir);
      } catch {
        // Directory may not exist in minimal environments — skip silently.
        continue;
      }

      // Filter valid command files, ignoring declaration files, map files, and index files
      const files = entries.filter((f) => {
        if (f.endsWith('.d.ts') || f.endsWith('.map')) return false;
        if (f.startsWith('index.') || f.startsWith('.')) return false;
        return f.endsWith('.js') || f.endsWith('.ts');
      });

      let categoryCount = 0;

      // Deduplicate base filenames in case both .ts and .js exist in the same dir
      const seenBases = new Set<string>();

      for (const file of files) {
        const baseName = file.replace(/\.(js|ts)$/, '');
        if (seenBases.has(baseName)) continue;
        seenBases.add(baseName);

        const filePath = join(categoryDir, file);
        const fileUrl = pathToFileURL(filePath).href;

        let mod: Record<string, unknown>;
        try {
          mod = (await import(fileUrl)) as Record<string, unknown>;
        } catch (err) {
          console.error(`[loader] Failed to import command file ${filePath}:`, err);
          continue;
        }

        for (const value of Object.values(mod)) {
          if (category === PREFIX_CATEGORY) {
            if (isPrefixCommand(value)) {
              registerPrefixCommand(value);
              categoryCount++;
            }
          } else if (isBotCommand(value)) {
            registerCommand(value);
            categoryCount++;
          }
        }
      }

      // A category directory that yields nothing means its command modules do
      // not export a matching command object, so those commands never reach
      // Discord. Fail loudly rather than registering a silently shortened list.
      if (categoryCount === 0) {
        console.warn(`[loader] No commands discovered in category "${category}" (${files.length} file(s) scanned)`);
      }

      count += categoryCount;
    }

    loaded = true;
    return count;
  })();

  return loadPromise;
}

/** Reset loader cache state (used by test suites if needed). */
export function _resetCommandLoaderState(): void {
  loaded = false;
  loadPromise = null;
}
