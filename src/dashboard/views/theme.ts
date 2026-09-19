import { type AppDeps } from '../../app.js';
import { darkTheme } from './themes/dark.js';
import { lightTheme } from './themes/light.js';
import { glassmorphismTheme } from './themes/glassmorphism.js';
import { cyberpunkTheme } from './themes/cyberpunk.js';
import { draculaTheme } from './themes/dracula.js';
import { nordTheme } from './themes/nord.js';
import { emeraldTheme } from './themes/emerald.js';
import { baseStyles, colorSchemeMode } from './themes/shared.js';

export interface ThemeInfo {
  id: string;
  name: string;
  icon: string;
}

export function getThemeInfo(theme?: string): ThemeInfo {
  const t = (theme || '').trim().toLowerCase();
  if (t === 'glass' || t === 'glassmorphism') {
    return { id: 'glassmorphism', name: 'Glassmorphism', icon: 'fa-solid fa-wand-magic-sparkles' };
  }
  if (t === 'light') {
    return { id: 'light', name: 'Light', icon: 'fa-solid fa-sun' };
  }
  if (t === 'cyberpunk') {
    return { id: 'cyberpunk', name: 'Cyberpunk', icon: 'fa-solid fa-bolt' };
  }
  if (t === 'dracula') {
    return { id: 'dracula', name: 'Dracula', icon: 'fa-solid fa-skull' };
  }
  if (t === 'nord') {
    return { id: 'nord', name: 'Nord', icon: 'fa-solid fa-snowflake' };
  }
  if (t === 'emerald') {
    return { id: 'emerald', name: 'Emerald', icon: 'fa-solid fa-tree' };
  }
  return { id: 'dark', name: 'Dark', icon: 'fa-solid fa-moon' };
}

export function resolveThemeAndScheme(deps: AppDeps): { theme: ThemeInfo } {
  const theme = getThemeInfo(deps.config.defaultTheme);
  return { theme };
}

export function getThemeCss(): string {
  return `
    ${darkTheme}
    ${lightTheme}
    ${glassmorphismTheme}
    ${cyberpunkTheme}
    ${draculaTheme}
    ${nordTheme}
    ${emeraldTheme}
    ${colorSchemeMode}
  `;
}

export function getBaseStyles(): string {
  return baseStyles;
}
