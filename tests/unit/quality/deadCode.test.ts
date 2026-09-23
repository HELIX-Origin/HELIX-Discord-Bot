/**
 * tests/unit/quality/dead-code.test.ts
 *
 * Repo-wide structural guard: scans src/ for exported symbols that have
 * no references anywhere else in src/ or tests/ (leftover dead code).
 *
 * Exemptions:
 *   - src/bot/commands/**  (discovered dynamically by the command loader)
 *   - '_'-prefixed identifiers (explicit "internal" markers)
 *   - 'default' exports
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SRC_ROOT = join(PROJECT_ROOT, 'src');
const TESTS_ROOT = join(PROJECT_ROOT, 'tests');

const EXPORT_PATTERNS = [
  /\bexport\s+(?:async\s+)?(?:const|let|var|function|class|interface|type|enum|abstract\s+class)\s+([A-Za-z_$][\w$]*)/g,
  /\bexport\s*\{([^}]*)\}/g,
];

function collectTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTsFiles(full, out);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

function extractExports(content: string): Set<string> {
  const names = new Set<string>();
  for (const pattern of EXPORT_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      if (pattern.source.includes('\\{')) {
        for (const item of (match[1] ?? '').split(',')) {
          const name = item.trim().split(/\s+as\s+/)[0]?.trim();
          if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
        }
      } else if (match[1]) {
        names.add(match[1]);
      }
    }
  }
  return names;
}

function buildIdentifierIndex(files: string[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  const keywords = new Set(['export', 'import', 'default', 'from', 'type']);
  for (const file of files) {
    const content = readFileSyncSafe(file);
    const identifiers = content.matchAll(/\b[A-Za-z_$][\w$]*\b/g);
    for (const match of identifiers) {
      const name = match[0];
      if (keywords.has(name)) continue;
      if (!index.has(name)) index.set(name, new Set());
      index.get(name)!.add(file);
    }
  }
  return index;
}

function readFileSyncSafe(file: string): string {
  return readFileSync(file, 'utf8');
}

function isDynamicallyLoaded(relPath: string): boolean {
  return relPath.split(sep).join('/').startsWith('bot/commands/');
}

function relSrc(file: string): string {
  return relative(SRC_ROOT, file).split(sep).join('/');
}

describe('dead code scan', () => {
  const srcFiles = collectTsFiles(SRC_ROOT);
  const allFiles = [...srcFiles, ...collectTsFiles(TESTS_ROOT)];
  const identifierIndex = buildIdentifierIndex(allFiles);

  it('finds no unreferenced exported symbols', () => {
    const dead: string[] = [];
    for (const file of srcFiles) {
      const rel = relSrc(file);
      if (isDynamicallyLoaded(rel)) continue;
      const content = readFileSyncSafe(file);
      for (const name of extractExports(content)) {
        if (name.startsWith('_') || name === 'default') continue;
        const refs = identifierIndex.get(name);
        if (refs && refs.size > 1) continue;
        dead.push(`${rel}:${name}`);
      }
    }
    expect(dead.sort()).toEqual([]);
  });

  it('keeps live exports that are consumed by tests', () => {
    const refs = identifierIndex.get('defaultConfig');
    expect(refs && [...refs].some((file) => file.includes('config'))).toBe(true);
  });
});