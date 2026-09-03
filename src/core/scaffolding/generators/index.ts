import { FileToGenerate } from '../file-generator.js';
import { ProjectTemplate } from '../template-engine.js';
import { generateDiscordBotFiles } from './discord.js';
import { generateWebFiles } from './web.js';
import { generateDesktopFiles } from './desktop.js';
import { generateMobileFiles } from './mobile.js';
import { generateGameEngineFiles } from './games.js';
import { generateBackendFiles } from './backend.js';
import { generateCiPipelineFiles } from './ci.js';

export function getDomainFiles(
  templateName: string,
  projectName: string,
  template: ProjectTemplate,
  variables: Record<string, string>,
  gitPlatform?: 'github' | 'gitlab' | 'bitbucket' | 'none'
): FileToGenerate[] {
  const files: FileToGenerate[] = [];

  // Domain generator dispatch
  if (templateName === 'discord-bot' || template.project_type === 'discord-bot') {
    files.push(...generateDiscordBotFiles(projectName, variables));
  } else if (templateName === 'web-vue') {
    files.push(...generateWebFiles(projectName, 'vue', variables));
  } else if (templateName.startsWith('web') || template.project_type === 'web' || template.project_type === 'web-app') {
    files.push(...generateWebFiles(projectName, 'react', variables));
  } else if (templateName === 'desktop-tauri' || template.framework === 'tauri') {
    files.push(...generateDesktopFiles(projectName, 'tauri', variables));
  } else if (templateName.startsWith('desktop') || template.project_type === 'desktop' || template.project_type === 'desktop-app') {
    files.push(...generateDesktopFiles(projectName, 'electron', variables));
  } else if (templateName === 'mobile-flutter' || template.framework === 'flutter') {
    files.push(...generateMobileFiles(projectName, 'flutter', variables));
  } else if (templateName.startsWith('mobile') || template.project_type === 'mobile') {
    files.push(...generateMobileFiles(projectName, 'react-native', variables));
  } else if (templateName === 'game-godot' || template.framework === 'godot') {
    files.push(...generateGameEngineFiles(projectName, 'godot', variables));
  } else if (templateName === 'game-rpgm' || template.framework === 'rpg-maker') {
    files.push(...generateGameEngineFiles(projectName, 'rpgm', variables));
  } else if (templateName === 'game-renpy' || template.framework === 'renpy') {
    files.push(...generateGameEngineFiles(projectName, 'renpy', variables));
  } else if (templateName.startsWith('game') || template.project_type === 'game-engine') {
    files.push(...generateGameEngineFiles(projectName, 'unity', variables));
  } else if (templateName === 'backend-rust' || template.language === 'rust') {
    files.push(...generateBackendFiles(projectName, 'rust', variables));
  } else if (templateName === 'backend-go' || template.language === 'go') {
    files.push(...generateBackendFiles(projectName, 'go', variables));
  } else if (templateName === 'backend-java' || template.language === 'java') {
    files.push(...generateBackendFiles(projectName, 'java', variables));
  } else if (templateName.startsWith('backend') || template.project_type === 'backend') {
    files.push(...generateBackendFiles(projectName, 'python', variables));
  }

  // CI/CD pipeline injection
  if (gitPlatform && gitPlatform !== 'none') {
    files.push(...generateCiPipelineFiles(gitPlatform, template));
  }

  return files;
}

export * from './discord.js';
export * from './web.js';
export * from './desktop.js';
export * from './mobile.js';
export * from './games.js';
export * from './backend.js';
export * from './ci.js';
