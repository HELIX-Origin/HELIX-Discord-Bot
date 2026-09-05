import { describe, it, expect, afterEach } from 'vitest';
import { EnvSandbox } from '../../helpers/env.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getEnvPaths,
  loadEnv,
  saveEnvValue,
  parseEnvFile,
} from '../../../HELIX/src/utils/env.js';

describe('src/utils/env.ts — CLI-style environment loader', () => {
  it('returns the three candidate paths in precedence order', () => {
    const paths = getEnvPaths();
    expect(paths).toHaveLength(3);
    expect(paths[0]).toBe(path.resolve(process.cwd(), '.env'));
    expect(paths[1]).toBe(path.resolve(os.homedir(), '.helix', '.env'));
    expect(paths[2]).toBe(path.resolve(os.homedir(), '.env'));
  });

  it('loadEnv is safe to call repeatedly', () => {
    expect(() => loadEnv()).not.toThrow();
    expect(() => loadEnv()).not.toThrow();
  });
});

describe('src/utils/env.ts — saveEnvValue and parseEnvFile', () => {
  const sandbox = new EnvSandbox();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-utils-env-'));

  afterEach(() => {
    sandbox.restore();
  });

  it('writes a fresh file when none exists', () => {
    const envPath = path.join(tmp, 'fresh.env');
    const written = saveEnvValue('TOKEN', 'abc', envPath);
    expect(written).toBe(envPath);
    expect(fs.existsSync(envPath)).toBe(true);
    expect(fs.readFileSync(envPath, 'utf-8')).toContain('TOKEN=abc');
    expect(process.env.TOKEN).toBe('abc');
  });

  it('replaces an existing key and leaves others intact', () => {
    const envPath = path.join(tmp, 'replace.env');
    fs.writeFileSync(envPath, 'A=1\nB=2\n', 'utf-8');
    saveEnvValue('B', 'updated', envPath);
    const parsed = parseEnvFile(envPath);
    expect(parsed.A).toBe('1');
    expect(parsed.B).toBe('updated');
  });

  it('parses quoted values without the quotes', () => {
    const envPath = path.join(tmp, 'quoted.env');
    fs.writeFileSync(envPath, 'URL="https://example.com"\nEMPTY=\n', 'utf-8');
    const parsed = parseEnvFile(envPath);
    expect(parsed.URL).toBe('https://example.com');
    expect(parsed.EMPTY).toBe('');
  });

  it('returns an empty object for a missing file', () => {
    expect(parseEnvFile(path.join(tmp, 'nope.env'))).toEqual({});
  });
});