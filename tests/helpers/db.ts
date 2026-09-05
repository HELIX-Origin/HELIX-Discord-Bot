/**
 * SQLite database helpers for tests.
 * Always creates isolated databases in the OS temp directory.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BotDatabase } from '../../HELIX/src/db/database.js';

export interface TestDbHandle {
  db: BotDatabase;
  dir: string;
  path: string;
  cleanup(): void;
}

export function createTestDb(fileName = 'helix-bot.sqlite'): TestDbHandle {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-db-'));
  const dbPath = path.join(dir, fileName);
  const db = new BotDatabase(dbPath);
  return {
    db,
    dir,
    path: dbPath,
    cleanup() {
      db.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

/**
 * Points DISCORD_DB_PATH at a throwaway SQLite file so singleton-backed
 * modules (dashboard API, router handlers) write to a temp database.
 * Must be called before the first `BotDatabase.getInstance()` invocation in
 * the worker; call at module scope of the importing test file.
 */
export function withTempDbEnvironment(): { dir: string; cleanup(): void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-dbenv-'));
  process.env.DISCORD_DB_PATH = path.join(dir, 'env.sqlite');
  return {
    dir,
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
      delete process.env.DISCORD_DB_PATH;
    },
  };
}