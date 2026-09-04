import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('HELIX Bot Structure & Package Integrity', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const botDir = path.resolve(projectRoot, 'HELIX');

  it('has a dedicated package.json at /HELIX/package.json', () => {
    const pkgPath = path.resolve(botDir, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(['helix', '@helix/bot', '@helix-cli/bot']).toContain(pkg.name);
    expect(pkg.main).toBe('./index.ts');
    expect(pkg.scripts.start).toBeDefined();
  });

  it('contains /HELIX/src as the root for the discord bot client, db, commands, and plugins', () => {
    const srcDir = path.resolve(botDir, 'src');
    expect(fs.existsSync(srcDir)).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'client.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'server.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'env.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'config.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'db', 'database.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'handlers', 'command-handler.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'handlers', 'slash-handler.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'handlers', 'event-handler.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'plugins', 'registry.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'plugins', 'plugin-loader.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'scaffolding', 'template-engine.ts'))).toBe(true);
  });

  it('contains /HELIX/dashboard as the root for the companion web dashboard', () => {
    const dashDir = path.resolve(botDir, 'dashboard');
    expect(fs.existsSync(dashDir)).toBe(true);
    expect(fs.existsSync(path.resolve(dashDir, 'router.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(dashDir, 'auth', 'config.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(dashDir, 'api', 'stats.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(dashDir, 'ui', 'html.ts'))).toBe(true);
  });

  it('contains /HELIX/index.ts as the entrypoint to launch both bot and dashboard', () => {
    const indexPath = path.resolve(botDir, 'index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('launchBotAndDashboard');
  });
});
