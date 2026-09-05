import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executeScaffold } from '../../../HELIX/src/scaffolding/scaffold.js';
import { TemplateEngine, type ProjectTemplate } from '../../../HELIX/src/scaffolding/template-engine.js';

function tempProjectDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'helix-scaffold-e2e-'));
}

describe('integration — scaffold end-to-end', () => {
  it('scaffolds a complete web-react project into a temp directory', async () => {
    const target = path.join(tempProjectDir(), 'my-app');
    const result = await executeScaffold('web-react', target, { PROJECT_NAME: 'integration-app' }, { skipGit: true });
    expect(result.success).toBe(true);
    expect(result.templateName).toBe('web-react');

    expect(fs.existsSync(path.join(target, 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(target, '.gitignore'))).toBe(true);

    const readme = fs.readFileSync(path.join(target, 'README.md'), 'utf-8');
    expect(readme).toContain('my-app');
    expect(readme).toContain('web-react');

    const envExample = fs.readFileSync(path.join(target, '.env.example'), 'utf-8');
    expect(envExample).toContain('PROJECT_NAME=integration-app');

    const written = result.writtenFiles.map((f) => path.relative(target, f));
    expect(written).toContain('README.md');
    expect(written).toContain('.env.example');

    fs.rmSync(target, { recursive: true, force: true });
  });

  it('returns success false when required variables are missing', async () => {
    const target = tempProjectDir();
    const result = await executeScaffold('discord-bot', target, {}, { skipGit: true });
    expect(result.success).toBe(false);
    expect(result.writtenFiles).toEqual([]);
    fs.rmSync(target, { recursive: true, force: true });
  });

  it('dry-run reports files without writing them to disk', async () => {
    const target = tempProjectDir();
    const result = await executeScaffold('web-react', target, {}, { skipGit: true, dryRun: true });
    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.writtenFiles.length).toBeGreaterThan(3);
    expect(fs.existsSync(path.join(target, 'README.md'))).toBe(false);
    fs.rmSync(target, { recursive: true, force: true });
  });

  it('exposes every documented template through the engine', () => {
    const all = TemplateEngine.getAllDefaultTemplates();
    for (const name of ['discord-bot', 'web-react', 'web-vue', 'web', 'backend-rust', 'backend-go', 'mobile-flutter', 'desktop-tauri', 'game-godot', 'game-rpgm', 'game-renpy']) {
      expect(all[name], name).toBeDefined();
    }
    const t: ProjectTemplate = all['web-react'];
    expect(t.project_type).toBe('web');
    expect(t.framework).toBe('react');
  });

  it('interpolates variables only when provided', () => {
    expect(TemplateEngine.interpolate('Hello ${NAME}!', { NAME: 'HELIX' })).toBe('Hello HELIX!');
    expect(TemplateEngine.interpolate('Hello ${NAME}!', {})).toBe('Hello ${NAME}!');
    expect(TemplateEngine.isBinary('assets/icon.png')).toBe(true);
    expect(TemplateEngine.isBinary('src/app.ts')).toBe(false);
  });
});