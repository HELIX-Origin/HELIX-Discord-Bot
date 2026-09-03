import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Bot Subsystem Structure & Package Integrity', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const botDir = path.resolve(projectRoot, 'bot');

  it('has a dedicated package.json at /bot/package.json', () => {
    const pkgPath = path.resolve(botDir, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBe('@helix-cli/bot');
    expect(pkg.main).toBe('./index.ts');
    expect(pkg.scripts.start).toBeDefined();
  });

  it('contains /bot/src as the root for the discord bot client, db, and dist', () => {
    const srcDir = path.resolve(botDir, 'src');
    expect(fs.existsSync(srcDir)).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'client.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'server.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'deploy.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'db', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'commands', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'utils', 'logger', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(srcDir, 'dist'))).toBe(true);
  });

  it('contains /bot/dashboard as the root for the companion web dashboard', () => {
    const dashDir = path.resolve(botDir, 'dashboard');
    expect(fs.existsSync(dashDir)).toBe(true);
    expect(fs.existsSync(path.resolve(dashDir, 'router.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(dashDir, 'auth', 'config.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(dashDir, 'api', 'stats.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(dashDir, 'ui', 'html.ts'))).toBe(true);
  });

  it('contains /bot/index.ts as the entrypoint to launch both bot and dashboard', () => {
    const indexPath = path.resolve(botDir, 'index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('launchBotAndDashboard');
  });
});
