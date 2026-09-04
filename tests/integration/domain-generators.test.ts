import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { executeScaffold } from '../../HELIX/src/scaffolding/scaffold.js';

describe('Domain Generators & CI/CD Pipelines Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-domain-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('scaffolds complete Discord bot with slash command scripts', async () => {
    const projectDir = path.join(tempDir, 'test-discord-bot');
    await executeScaffold(
      'discord-bot',
      projectDir,
      { DISCORD_TOKEN: 'token-xyz', CLIENT_ID: 'client-123' },
      { dryRun: false, skipInstall: true, skipGit: true }
    );

    expect(fs.existsSync(path.join(projectDir, 'src', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'deploy-commands.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'commands', 'ping.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'commands', 'info.ts'))).toBe(true);
  });

  it('scaffolds complete React web application with Vite and GitHub Actions CI', async () => {
    const projectDir = path.join(tempDir, 'test-react-app');
    await executeScaffold(
      'web',
      projectDir,
      { PROJECT_NAME: 'test-react-app' },
      { template: 'web-react', dryRun: false, skipInstall: true, skipGit: true, gitPlatform: 'github' }
    );

    expect(fs.existsSync(path.join(projectDir, 'vite.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'App.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.github', 'workflows', 'ci.yml'))).toBe(true);

    const ciContent = fs.readFileSync(path.join(projectDir, '.github', 'workflows', 'ci.yml'), 'utf-8');
    expect(ciContent).toContain('npm run build');
  });

  it('scaffolds Godot 4 game engine project with project.godot and GDScript', async () => {
    const projectDir = path.join(tempDir, 'test-godot-game');
    await executeScaffold(
      'game-engine',
      projectDir,
      { GAME_TITLE: 'SuperHelix' },
      { template: 'game-godot', dryRun: false, skipInstall: true, skipGit: true }
    );

    expect(fs.existsSync(path.join(projectDir, 'project.godot'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'scripts', 'player.gd'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'scenes', 'main.tscn'))).toBe(true);
  });

  it('scaffolds Rust backend project with Axum and Cargo.toml', async () => {
    const projectDir = path.join(tempDir, 'test-rust-service');
    await executeScaffold(
      'backend',
      projectDir,
      { CRATE_NAME: 'test_rust_service' },
      { template: 'backend-rust', dryRun: false, skipInstall: true, skipGit: true }
    );

    expect(fs.existsSync(path.join(projectDir, 'Cargo.toml'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'main.rs'))).toBe(true);
  });

  it('scaffolds Python FastAPI service with pyproject.toml and main.py', async () => {
    const projectDir = path.join(tempDir, 'test-python-service');
    await executeScaffold(
      'backend',
      projectDir,
      { PROJECT_NAME: 'test_python_service' },
      { template: 'backend-python', dryRun: false, skipInstall: true, skipGit: true }
    );

    expect(fs.existsSync(path.join(projectDir, 'pyproject.toml'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, 'src', 'app', 'main.py'))).toBe(true);
  });
});
