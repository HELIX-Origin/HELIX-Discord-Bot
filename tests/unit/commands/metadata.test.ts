import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const TEST_DIR = path.dirname(__filename);
const COMMANDS_ROOT = path.resolve(TEST_DIR, '..', '..', '..', 'HELIX', 'src', 'commands');
const EXECUTABLE_DIRS = fs.readdirSync(COMMANDS_ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const OPTION_TYPES = new Set(['user', 'string', 'integer', 'boolean', 'channel', 'role']);

function commandFiles(): string[] {
  const files: string[] = [];
  for (const dir of EXECUTABLE_DIRS) {
    const abs = path.join(COMMANDS_ROOT, dir);
    for (const f of fs.readdirSync(abs)) {
      if (f.endsWith('.ts')) files.push(path.join(abs, f));
    }
  }
  return files.sort();
}

function commandSpecifier(file: string): string {
  const rel = path.relative(TEST_DIR, file).replaceAll('\\', '/');
  const specifier = rel.startsWith('.') ? rel : `./${rel}`;
  return specifier;
}

async function importCommand(file: string): Promise<any> {
  const mod: any = await import(commandSpecifier(file));
  const derivedName = path.basename(file).replace(/\.ts$/, '');
  return mod[derivedName];
}

function validateOption(option: any, where: string): string[] {
  const errors: string[] = [];
  if (typeof option.name !== 'string' || !option.name) errors.push(`${where}: option missing name`);
  if (typeof option.description !== 'string' || !option.description) {
    errors.push(`${where}: option '${option.name ?? '?'}' missing description`);
  }
  if (!OPTION_TYPES.has(option.type)) {
    errors.push(`${where}: option '${option.name ?? '?'}' has invalid type '${option.type}'`);
  }
  return errors;
}

describe('commands — metadata integrity', () => {
  it('discovers command files across the expected categories', () => {
    const files = commandFiles();
    expect(EXECUTABLE_DIRS).toEqual(['config', 'info', 'mod', 'project', 'util']);
    expect(files.length).toBeGreaterThanOrEqual(25);
  });

  it('loads every command and exposes a valid unique CommandDefinition', async () => {
    const seen = new Map<string, string>();
    const errors: string[] = [];
    const files = commandFiles();

    for (const file of files) {
      const derivedName = path.basename(file).replace(/\.ts$/, '');
      const def: any = await importCommand(file);

      if (!def) {
        errors.push(`${file}: missing named export '${derivedName}'`);
        continue;
      }
      const where = `'${derivedName}'`;
      if (typeof def.name !== 'string' || !def.name) errors.push(`${file}: empty name`);
      else if (derivedName !== def.name) errors.push(`${where}: export name '${derivedName}' does not match definition name '${def.name}'`);
      if (typeof def.description !== 'string' || !def.description) errors.push(`${where}: missing description`);
      if (typeof def.category !== 'string' || !def.category) errors.push(`${where}: missing category`);
      if (typeof def.execute !== 'function') errors.push(`${where}: missing execute function`);
      if (def.aliases !== undefined && (!Array.isArray(def.aliases) || def.aliases.some((a: any) => typeof a !== 'string'))) {
        errors.push(`${where}: aliases must be an array of strings`);
      }
      if (def.options !== undefined) {
        if (!Array.isArray(def.options)) errors.push(`${where}: options must be an array`);
        else def.options.forEach((o: any) => errors.push(...validateOption(o, where)));
      }
      if (def.subcommands !== undefined) {
        if (!Array.isArray(def.subcommands)) errors.push(`${where}: subcommands must be an array`);
        else {
          def.subcommands.forEach((s: any) => {
            if (typeof s.name !== 'string' || !s.name) errors.push(`${where}: subcommand missing name`);
            if (typeof s.description !== 'string' || !s.description) errors.push(`${where}: subcommand missing description`);
            if (s.options !== undefined) s.options.forEach((o: any) => errors.push(...validateOption(o, `${where}.${s.name}`)));
          });
        }
      }

      if (seen.has(def.name)) {
        errors.push(`${where}: duplicate command name '${def.name}' also in ${seen.get(def.name)}`);
      } else {
        seen.set(def.name, file);
      }
    }

    expect(errors).toEqual([]);
    expect(seen.size).toBe(files.length);
  }, 20000);

  it('keeps command names and aliases distinct from every other command', async () => {
    const registered = new Map<string, string>();
    const files = commandFiles();
    for (const file of files) {
      const derivedName = path.basename(file).replace(/\.ts$/, '');
      const def: any = await importCommand(file);
      for (const key of [def?.name, ...(def?.aliases ?? [])]) {
        expect(registered.has(key)).toBe(false);
        registered.set(key, derivedName);
      }
    }
    expect(registered.size).toBeGreaterThanOrEqual(files.length);
  });

  it('includes the core built-in commands', () => {
    const names = commandFiles().map((f) => path.basename(f, path.extname(f)));
    for (const expected of ['set', 'plugin', 'ticket', 'ban', 'kick', 'warn', 'purge', 'help', 'ping', 'scaffold', 'create']) {
      expect(names).toContain(expected);
    }
  });
});