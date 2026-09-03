import fs from 'fs';
import path from 'path';
import { ProjectContext } from './context-detector.js';

export interface SynthesizedPrompt {
  systemPrompt: string;
  userPrompt: string;
  contextSummary: string;
}

export class PromptSynthesizer {
  /**
   * Build an AI prompt enriched with project context and architecture guidelines
   */
  public static build(
    userQuery: string,
    context: ProjectContext,
    rootDir: string = process.cwd()
  ): SynthesizedPrompt {
    const contextSummary = `Project Type: ${context.projectType} | Framework: ${context.framework} | Language: ${context.language}`;

    // Look up matching skill if available
    let skillSnippet = '';
    const skillsDir = path.join(rootDir, '.agents', 'skills');

    let matchingSkill = '';
    if (context.projectType === 'discord-bot') matchingSkill = 'discord-bot-setup.md';
    else if (context.framework === 'react') matchingSkill = 'react-development.md';
    else if (context.framework === 'vue') matchingSkill = 'vue-development.md';
    else if (context.framework === 'tauri') matchingSkill = 'tauri-setup.md';
    else if (context.framework === 'electron') matchingSkill = 'electron-setup.md';
    else if (context.framework === 'flutter') matchingSkill = 'flutter.md';
    else if (context.framework === 'godot') matchingSkill = 'godot.md';
    else if (context.language === 'rust') matchingSkill = 'rust.md';
    else if (context.language === 'go') matchingSkill = 'go.md';
    else if (context.language === 'python') matchingSkill = 'python.md';

    if (matchingSkill && fs.existsSync(path.join(skillsDir, matchingSkill))) {
      try {
        const content = fs.readFileSync(path.join(skillsDir, matchingSkill), 'utf-8');
        skillSnippet = `\n### Architectural Reference:\n${content.slice(0, 1500)}\n`;
      } catch {}
    }

    const systemPrompt = `You are HELIX AI, an intelligent coding assistant for ${context.projectType} projects (${context.framework} in ${context.language}).
Follow standard architecture, strict typing, and security best practices.`;

    const userPrompt = `Context:
- Project Type: ${context.projectType}
- Framework: ${context.framework}
- Language: ${context.language}
- Dependencies: ${context.dependencies.slice(0, 10).join(', ') || 'None detected'}
${skillSnippet}
Request:
${userQuery}
`;

    return { systemPrompt, userPrompt, contextSummary };
  }
}
