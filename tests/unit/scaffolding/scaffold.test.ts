import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeScaffold } from '../../../HELIX/src/scaffolding/scaffold.js';

describe('executeScaffold', () => {
  it('fails fast when required template variables are missing', async () => {
    const target = path.join(os.tmpdir(), `hx-scaffold-missing-${Date.now()}`);
    const result = await executeScaffold('web', target, {}, { template: 'discord-bot' });
    expect(result.success).toBe(false);
    expect(result.writtenFiles).toHaveLength(0);
  });

  it('generates a dry-run manifest without writing to disk', async () => {
    const target = path.join(os.tmpdir(), `hx-scaffold-dry-${Date.now()}`);
    const result = await executeScaffold('web', target, { PROJECT_NAME: 'demo' }, {
      template: 'web-react',
      dryRun: true,
      skipInstall: true,
      skipGit: true,
    });
    expect(result.success).toBe(true);
    expect(result.targetDir).toBe(target);
    expect(result.writtenFiles.length).toBeGreaterThanOrEqual(3);
    expect(fs.existsSync(target)).toBe(false);
  });

  it('writes a complete project scaffold into a temp directory', async () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'hx-scaffold-e2e-'));
    const projectName = path.join(target, 'demo-bot');
    try {
      const result = await executeScaffold('discord-bot', projectName, {
        DISCORD_TOKEN: 'tok',
        CLIENT_ID: 'cid',
      }, {
        template: 'discord-bot',
        skipInstall: true,
        skipGit: true,
        dryRun: false,
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(projectName, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectName, '.gitignore'))).toBe(true);
      expect(fs.existsSync(path.join(projectName, '.env.example'))).toBe(true);
      const envExample = fs.readFileSync(path.join(projectName, '.env.example'), 'utf-8');
      expect(envExample).toContain('DISCORD_TOKEN=tok');
      expect(envExample).toContain('CLIENT_ID=cid');
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it('injects CI files when a git platform is requested', async () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'hx-scaffold-ci-'));
    try {
      const result = await executeScaffold('web', path.join(target, 'ci-app'), { PROJECT_NAME: 'ci' }, {
        template: 'web-react',
        gitPlatform: 'github',
        dryRun: true,
      });
      expect(result.success).toBe(true);
      expect(result.writtenFiles.some((f) => f.endsWith('.github') || f.includes('workflows'))).toBe(true);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it('handles backend templates through the domain generators', async () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'hx-scaffold-backend-'));
    try {
      const result = await executeScaffold('backend', path.join(target, 'svc'), {}, {
        template: 'backend-python',
        dryRun: true,
      });
      expect(result.success).toBe(true);
      const files = result.writtenFiles.join('\n');
      expect(files).toContain('pyproject.toml');
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });
});