import type { AppDeps } from '../../app.js';
import { renderTopBar } from '../views/topbar.js';
import { renderFooter } from '../views/footer.js';
import { appDisplayName } from '../../app.js';

export interface DashboardPageOptions {
  title: string;
  activeTab?: 'guilds' | 'dashboard' | 'admin' | 'landing' | 'legal' | 'login';
  showGuildPill?: boolean;
  content: string;
}

export function renderDashboardPage(deps: AppDeps, ctx: { userId: number | null }, opts: DashboardPageOptions): string {
  const appName = appDisplayName(deps);
  const appIconUrl = deps.bot?.getAppIconUrl() || null;
  const theme = getThemeInfo(deps.config.defaultTheme);
  const colorScheme = getColorSchemeInfo(deps.config.dashboardColorScheme);

  return `<!DOCTYPE html>
<html lang="en" class="${theme.id} scheme-${colorScheme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title} · ${appName}</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>${getBaseStyles()}</style>
</head>
<body>
  ${renderTopBar(deps, ctx.userId, { active: opts.activeTab, showGuildPill: opts.showGuildPill })}
  <div class="dashboard-container">
    ${opts.content}
  </div>
  ${renderFooter(deps, { dashboardEnabled: deps.config.features.dashboardEnabled })}
  <script>
    // Shared dashboard JS utilities
    (function() {
      // Auto-close dropdowns on outside click
      document.addEventListener('click', () => {
        document.querySelectorAll('.topbar-user').forEach(box => box.classList.remove('open'));
      });
    })();
  </script>
</body>
</html>`;
}

function getThemeInfo(theme?: string): { id: string; name: string; icon: string } {
  const t = (theme || '').trim().toLowerCase();
  if (t === 'glass' || t === 'glassmorphism')
    return { id: 'glassmorphism', name: 'Glassmorphism', icon: 'fa-solid fa-wand-magic-sparkles' };
  if (t === 'light') return { id: 'light', name: 'Light', icon: 'fa-solid fa-sun' };
  if (t === 'cyberpunk') return { id: 'cyberpunk', name: 'Cyberpunk', icon: 'fa-solid fa-bolt' };
  if (t === 'dracula') return { id: 'dracula', name: 'Dracula', icon: 'fa-solid fa-skull' };
  if (t === 'nord') return { id: 'nord', name: 'Nord', icon: 'fa-solid fa-snowflake' };
  if (t === 'emerald') return { id: 'emerald', name: 'Emerald', icon: 'fa-solid fa-tree' };
  return { id: 'dark', name: 'Dark', icon: 'fa-solid fa-moon' };
}

function getColorSchemeInfo(scheme?: string): { id: string; name: string } {
  const s = (scheme || '').trim().toLowerCase();
  if (s === 'purple' || s === 'amethyst') return { id: 'purple', name: 'Amethyst Purple' };
  if (s === 'blue' || s === 'ocean') return { id: 'blue', name: 'Ocean Blue' };
  if (s === 'emerald' || s === 'jade' || s === 'green') return { id: 'emerald', name: 'Emerald Green' };
  if (s === 'rose' || s === 'pink' || s === 'fuchsia') return { id: 'rose', name: 'Rose Pink' };
  if (s === 'amber' || s === 'gold' || s === 'yellow') return { id: 'amber', name: 'Amber Gold' };
  if (s === 'indigo' || s === 'violet') return { id: 'indigo', name: 'Indigo Violet' };
  if (s === 'crimson' || s === 'ruby' || s === 'red') return { id: 'crimson', name: 'Crimson Ruby' };
  if (s === 'teal' || s === 'aqua') return { id: 'teal', name: 'Teal Aqua' };
  if (s === 'sunset' || s === 'coral' || s === 'orange') return { id: 'sunset', name: 'Sunset Coral' };
  if (s === 'cyan' || s === 'electric') return { id: 'cyan', name: 'Electric Cyan' };
  return { id: 'default', name: 'Theme Default' };
}

function getBaseStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    .dashboard-container { flex: 1; padding: 1.5rem; max-width: 1280px; width: 100%; margin: 0 auto; }
    @media (max-width: 640px) { .dashboard-container { padding: 1rem; } }
  `;
}
