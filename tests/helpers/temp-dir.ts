/**
 * OS-level temporary directory helpers for tests.
 * Keeps all generated artifacts out of the repository tree.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function createTempDir(prefix = 'helix-test-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function removeTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function writeText(filePath: string, content: string): string {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

export function writeBinary(filePath: string, data: Buffer): string {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, data);
  return filePath;
}

export function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}