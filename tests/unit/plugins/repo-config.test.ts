import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { validateRepoConfig, loadRepoConfig } from '../../../HELIX/src/plugins/repo-config.js';
import { validDemoConfig } from '../../fixtures/plugin-repo.js';

const tmpDirs: string[] = [];

function tmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-repocfg-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe('repo-config — validateRepoConfig', () => {
  it('accepts a complete config', () => {
    expect(validateRepoConfig(validDemoConfig).valid).toBe(true);
  });

  it('rejects non-object input', () => {
    expect(validateRepoConfig(undefined).valid).toBe(false);
    expect(validateRepoConfig([]).valid).toBe(false);
  });

  it('rejects missing repository metadata', () => {
    const res = validateRepoConfig({ ...validDemoConfig, repository: '', name: undefined });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('repository'))).toBe(true);
    expect(res.errors.some((e) => e.includes('name'))).toBe(true);
  });

  it('rejects an empty plugins array', () => {
    expect(validateRepoConfig({ ...validDemoConfig, plugins: [] }).valid).toBe(false);
  });

  it('flags invalid plugin entries by index', () => {
    const res = validateRepoConfig({
      ...validDemoConfig,
      plugins: [{ id: 'ok', path: 'ok' }, { id: null, path: '' }, 'not-an-object'],
    });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('plugins[1]'))).toBe(true);
    expect(res.errors.some((e) => e.includes('plugins[2]'))).toBe(true);
  });
});

describe('repo-config — loadRepoConfig', () => {
  it('returns null when config.json is absent', () => {
    expect(loadRepoConfig(tmpDir())).toBeNull();
  });

  it('loads a valid config from disk', () => {
    const dir = path.join(tmpDir(), 'repo');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(validDemoConfig), 'utf-8');
    const loaded = loadRepoConfig(dir);
    expect(loaded?.repository).toBe('demo-repo');
    expect(loaded?.plugins).toHaveLength(1);
  });

  it('returns null for an invalid config', () => {
    const dir = path.join(tmpDir(), 'repo');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ repository: 'x' }), 'utf-8');
    expect(loadRepoConfig(dir)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    const dir = path.join(tmpDir(), 'repo');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.json'), '{{{', 'utf-8');
    expect(loadRepoConfig(dir)).toBeNull();
  });
});