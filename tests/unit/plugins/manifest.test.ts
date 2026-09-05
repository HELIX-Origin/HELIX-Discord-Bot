import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { validateManifest, loadManifest } from '../../../HELIX/src/plugins/manifest.js';
import { validDemoManifest } from '../../fixtures/plugin-repo.js';

const tmpDirs: string[] = [];

function tmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-manifest-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe('manifest — validateManifest', () => {
  it('accepts a complete manifest', () => {
    expect(validateManifest(validDemoManifest).valid).toBe(true);
  });

  it('rejects non-object input', () => {
    expect(validateManifest(null).valid).toBe(false);
    expect(validateManifest('x').valid).toBe(false);
  });

  it('rejects missing required string fields', () => {
    const broken = { ...validDemoManifest, id: undefined, description: 42 };
    const res = validateManifest(broken);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('id'))).toBe(true);
    expect(res.errors.some((e) => e.includes('description'))).toBe(true);
  });

  it('rejects empty fileExtensions and capabilities', () => {
    expect(validateManifest({ ...validDemoManifest, fileExtensions: [] }).valid).toBe(false);
    expect(validateManifest({ ...validDemoManifest, capabilities: [] }).valid).toBe(false);
  });

  it('rejects unknown capabilities', () => {
    const res = validateManifest({ ...validDemoManifest, capabilities: ['lint', 'bogus'] });
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('bogus'))).toBe(true);
  });

  it('accepts every documented valid capability', () => {
    for (const cap of ['lint', 'explain', 'fixes', 'docs', 'format', 'patterns']) {
      const res = validateManifest({ ...validDemoManifest, capabilities: [cap] });
      expect(res.valid).toBe(true);
    }
  });
});

describe('manifest — loadManifest', () => {
  it('returns null when plugin.json is absent', () => {
    expect(loadManifest(tmpDir())).toBeNull();
  });

  it('loads a valid manifest from disk', () => {
    const dir = path.join(tmpDir(), 'plugins', 'demo');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'plugin.json'), JSON.stringify(validDemoManifest), 'utf-8');
    const loaded = loadManifest(dir);
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe('demo');
    expect(loaded?.capabilities).toEqual(['lint']);
  });

  it('returns null for an invalid manifest on disk', () => {
    const dir = path.join(tmpDir(), 'plugins', 'bad');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'plugin.json'), JSON.stringify({ id: undefined }), 'utf-8');
    expect(loadManifest(dir)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    const dir = path.join(tmpDir(), 'plugins', 'malformed');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'plugin.json'), 'not json', 'utf-8');
    expect(loadManifest(dir)).toBeNull();
  });
});