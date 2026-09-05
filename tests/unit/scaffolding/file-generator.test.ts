import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { FileGenerator, type FileToGenerate } from '../../../HELIX/src/scaffolding/file-generator.js';

describe('file-generator — baseline files', () => {
  it('creates README.md and .gitignore placeholders', () => {
    const baseline = FileGenerator.getBaselineFiles('my-project', 'web-react');
    expect(baseline.map((f) => f.relativePath).sort()).toEqual(['.gitignore', 'README.md']);
    const readme = baseline.find((f) => f.relativePath === 'README.md');
    expect(String(readme?.content)).toContain('# my-project');
    expect(String(readme?.content)).toContain('web-react');
  });
});

describe('file-generator — writeFiles', () => {
  it('returns paths without writing during dry runs', () => {
    const target = path.join(os.tmpdir(), 'hz-dry');
    const files: FileToGenerate[] = [{ relativePath: 'a.txt', content: 'x' }];
    const written = FileGenerator.writeFiles(target, files, true);
    expect(written).toHaveLength(1);
    expect(fs.existsSync(path.join(target, 'a.txt'))).toBe(false);
  });

  it('writes nested files and binary content on disk', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'hz-write-'));
    try {
      const files: FileToGenerate[] = [
        { relativePath: 'src/index.ts', content: 'export {};' },
        { relativePath: 'assets/logo.bin', content: Buffer.from([1, 2, 3]), isBinary: true },
      ];
      FileGenerator.writeFiles(target, files, false);

      expect(fs.readFileSync(path.join(target, 'src', 'index.ts'), 'utf-8')).toBe('export {};');
      expect(fs.readFileSync(path.join(target, 'assets', 'logo.bin'))).toEqual(Buffer.from([1, 2, 3]));
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it('treats string content as UTF-8 text even when marked binary', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'hz-write2-'));
    try {
      const files: FileToGenerate[] = [{ relativePath: 'weird.txt', content: 'plain', isBinary: true }];
      FileGenerator.writeFiles(target, files, false);
      expect(fs.readFileSync(path.join(target, 'weird.txt'), 'utf-8')).toBe('plain');
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });
});