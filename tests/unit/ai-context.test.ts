import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ContextDetector } from '../../src/core/ai/context-detector.js';
import { PromptSynthesizer } from '../../src/core/ai/prompt-synthesizer.js';
import { ProviderDispatcher } from '../../src/core/ai/provider-dispatcher.js';

describe('AI Context & Prompt Synthesis', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-ai-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('detects a Discord bot project from package.json', () => {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ dependencies: { 'discord.js': '^14.0.0' } })
    );

    const context = ContextDetector.detect(tempDir);
    expect(context.projectType).toBe('discord-bot');
    expect(context.framework).toBe('discord.js');
  });

  it('detects a Rust project from Cargo.toml', () => {
    fs.writeFileSync(path.join(tempDir, 'Cargo.toml'), '[package]\nname = "test"\n');

    const context = ContextDetector.detect(tempDir);
    expect(context.projectType).toBe('backend');
    expect(context.language).toBe('rust');
  });

  it('detects a Godot project from project.godot', () => {
    fs.writeFileSync(path.join(tempDir, 'project.godot'), 'config_version=5\n');

    const context = ContextDetector.detect(tempDir);
    expect(context.projectType).toBe('game-engine');
    expect(context.framework).toBe('godot');
  });

  it('synthesizes prompts with project context and system instructions', () => {
    const mockContext = {
      projectType: 'web',
      framework: 'react',
      language: 'typescript',
      dependencies: ['react', 'vite'],
      keyFiles: ['package.json'],
      hasGit: true,
    };

    const prompt = PromptSynthesizer.build('Add dark mode switch', mockContext);
    expect(prompt.systemPrompt).toContain('HELIX AI');
    expect(prompt.userPrompt).toContain('react');
    expect(prompt.userPrompt).toContain('Add dark mode switch');
  });

  it('selects an authenticated AI provider if available', () => {
    const provider = ProviderDispatcher.selectBestProvider();
    // In this user environment, Copilot and/or Antigravity are authenticated
    if (provider) {
      expect(provider.authenticated).toBe(true);
      expect(['copilot', 'antigravity', 'opencode']).toContain(provider.provider);
    }
  });
});
