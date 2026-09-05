import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { TemplateEngine } from '../../../HELIX/src/scaffolding/template-engine.js';
import { goodTemplateYaml, minimalTemplateYaml } from '../../fixtures/template-files.js';

const tmp: string[] = [];

function tmpFile(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-tpl-'));
  tmp.push(dir);
  const file = path.join(dir, name);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('template-engine — default templates', () => {
  it('ships a default template for every top-level project type', () => {
    for (const id of ['discord-bot', 'web-react', 'desktop-electron', 'desktop-tauri', 'mobile-flutter', 'mobile-react-native', 'game-godot', 'game-unity', 'game-rpgm', 'game-renpy', 'backend-rust', 'backend-go', 'backend-java', 'backend-python']) {
      expect(TemplateEngine.getDefaultTemplate(id)).not.toBeNull();
    }
  });

  it('returns null for unknown templates', () => {
    expect(TemplateEngine.getDefaultTemplate('nope')).toBeNull();
  });

  it('returns a defensive copy of all defaults', () => {
    const all = TemplateEngine.getAllDefaultTemplates();
    expect(Object.keys(all).length).toBeGreaterThan(10);
    expect(TemplateEngine.getAllDefaultTemplates()).not.toBe(all);
  });
});

describe('template-engine — file parsing', () => {
  it('parses a full YAML template', () => {
    const tpl = TemplateEngine.parseTemplateFile(tmpFile('good.yaml', goodTemplateYaml));
    expect(tpl.project_type).toBe('web');
    expect(tpl.framework).toBe('react');
    expect(tpl.language).toBe('typescript');
    expect(tpl.setup_command).toBe('npm install');
    expect(tpl.template_variables).toHaveLength(2);
  });

  it('parses a minimal YAML template without variables', () => {
    const tpl = TemplateEngine.parseTemplateFile(tmpFile('min.yaml', minimalTemplateYaml));
    expect(tpl.project_type).toBe('backend');
    expect(tpl.template_variables).toBeUndefined();
  });

  it('throws for a missing template file', () => {
    expect(() => TemplateEngine.parseTemplateFile(path.join(os.tmpdir(), 'missing.yaml'))).toThrow();
  });

  it('loadTemplate prefers a custom file and falls back to defaults', () => {
    const custom = TemplateEngine.loadTemplate('web-react', tmpFile('custom.yaml', goodTemplateYaml));
    expect(custom.framework).toBe('react');
    expect(custom.run_command).toBe('npm run dev');

    const fallback = TemplateEngine.loadTemplate('backend-python');
    expect(fallback.framework).toBe('fastapi');
  });

  it('loadTemplate throws for an unknown template without a file', () => {
    expect(() => TemplateEngine.loadTemplate('unknown-template')).toThrow();
  });
});

describe('template-engine — variable resolution and interpolation', () => {
  const tpl = TemplateEngine.loadTemplate('discord-bot');

  it('fills defaults for optional variables', () => {
    const { resolved, missing } = TemplateEngine.resolveVariables(tpl, { DISCORD_TOKEN: 'tok', CLIENT_ID: 'cid' });
    expect(resolved.DISCORD_TOKEN).toBe('tok');
    expect(resolved.CLIENT_ID).toBe('cid');
    expect(missing).toHaveLength(0);
  });

  it('reports missing required variables', () => {
    const { resolved, missing } = TemplateEngine.resolveVariables(tpl, {});
    expect(missing).toContain('DISCORD_TOKEN');
    expect(missing).toContain('CLIENT_ID');
    expect(resolved.GUILD_ID).toBeUndefined();
  });

  it('prefers provided values over defaults', () => {
    const web = TemplateEngine.loadTemplate('web-react');
    const { resolved } = TemplateEngine.resolveVariables(web, { PROJECT_NAME: 'my-app' });
    expect(resolved.PROJECT_NAME).toBe('my-app');
  });

  it('interpolates ${} placeholders and leaves unknown ones intact', () => {
    expect(TemplateEngine.interpolate('Greetings ${NAME}', { NAME: 'Ada' })).toBe('Greetings Ada');
    expect(TemplateEngine.interpolate('old ${UNKNOWN}', {})).toBe('old ${UNKNOWN}');
  });
});

describe('template-engine — binary and text processing', () => {
  it('classifies binary assets as non-text files', () => {
    for (const ext of ['.png', '.jpg', '.glb', '.zip', '.woff2']) {
      expect(TemplateEngine.isBinary(`asset${ext}`)).toBe(true);
    }
    expect(TemplateEngine.isBinary('source.ts')).toBe(false);
    expect(TemplateEngine.isBinary('README.md')).toBe(false);
  });

  it('processFile interpolates text and copies binary content', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-proc-'));
    tmp.push(dir);

    const textPath = path.join(dir, 'config.ts');
    fs.writeFileSync(textPath, 'export const name = "${APP_NAME}";', 'utf-8');
    const textResult = TemplateEngine.processFile(textPath, { APP_NAME: 'helix' });
    expect(textResult.isBinary).toBe(false);
    expect(String(textResult.content)).toBe('export const name = "helix";');

    const binaryPath = path.join(dir, 'img.png');
    fs.writeFileSync(binaryPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const binResult = TemplateEngine.processFile(binaryPath, {});
    expect(binResult.isBinary).toBe(true);
    expect(Buffer.isBuffer(binResult.content)).toBe(true);
    expect((binResult.content as Buffer).length).toBe(4);
  });
});