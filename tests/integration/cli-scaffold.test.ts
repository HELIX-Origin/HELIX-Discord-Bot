import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { executeScaffold } from '../../HELIX/src/scaffolding/scaffold.js';

describe('Scaffolding Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('scaffolds baseline and language files in dry-run mode without disk writes', async () => {
    const projectName = path.join(tempDir, 'dry-run-app');

    await executeScaffold(
      'discord-bot',
      projectName,
      { DISCORD_TOKEN: 'mock-token', CLIENT_ID: '123' },
      { dryRun: true, skipInstall: true, skipGit: true }
    );

    expect(fs.existsSync(projectName)).toBe(false);
  });

  it('scaffolds complete files on disk when dryRun is false', async () => {
    const projectName = path.join(tempDir, 'actual-app');

    await executeScaffold(
      'discord-bot',
      projectName,
      { DISCORD_TOKEN: 'mock-token', CLIENT_ID: '123' },
      { dryRun: false, skipInstall: true, skipGit: true }
    );

    expect(fs.existsSync(projectName)).toBe(true);
    expect(fs.existsSync(path.join(projectName, 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectName, '.env.example'))).toBe(true);
    expect(fs.existsSync(path.join(projectName, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectName, 'src', 'index.ts'))).toBe(true);

    const envContent = fs.readFileSync(path.join(projectName, '.env.example'), 'utf-8');
    expect(envContent).toContain('DISCORD_TOKEN=mock-token');
  });
});
