import { appDisplayName, type AppDeps } from '../../app.js';
import { isOwnerUser, isAdminOrOwner, canUserAccessDashboard, canUserManageGuild } from '../routes/shared.js';
import { getThemeInfo } from './theme.js';
import { renderDashboardStyles } from './dashboard/styles.js';
import { renderSidebar } from './dashboard/sidebar.js';
import { renderOverviewTab } from './dashboard/overview.js';
import { renderFeedsTab } from './dashboard/feeds.js';
import { renderSourcesTabs } from './dashboard/sources.js';
import { renderGuildAdminTab } from './dashboard/guildadmin.js';
import { renderSettingsTab } from './dashboard/settings.js';
import { renderWelcomeTab } from './dashboard/welcome.js';
import { renderTicketsTab } from './dashboard/tickets.js';
import { renderLogsTab } from './dashboard/logs.js';
import { renderCommandsTab } from './dashboard/commands.js';
import { renderClientScript } from './dashboard/client-script.js';
import { createRedditFeeds } from '../../feed/reddit.js';

export { getThemeInfo } from './theme.js';

interface DashboardRoute {
  view: 'guilds' | 'dashboard';
  guildId?: string;
  page?: string;
}

export function renderDashboardHtml(
  deps: AppDeps,
  userId: number | null,
  _route: DashboardRoute = { view: 'guilds' },
): string {
  const appName = appDisplayName(deps);
  const appIconUrl = deps.bot?.getAppIconUrl() || null;
  const theme = getThemeInfo(deps.config.defaultTheme);
  const publicBaseUrl = deps.config.publicBaseUrl || null;
  const internalUrl = deps.config.internalUrl;
  const botInviteUrl = deps.config.clientId
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(deps.config.clientId)}&scope=bot%20applications.commands&permissions=586263558272`
    : null;

  // Permission check for logged in Discord users without server manage permissions
  if (userId !== null && !canUserAccessDashboard(userId, deps)) {
    return `<!DOCTYPE html>
<html lang="en" class="${theme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Denied · ${appName}</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    ${renderDashboardStyles()}
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .denied-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.25rem; padding: 2rem; max-width: 440px; text-align: center; backdrop-filter: blur(16px); box-shadow: var(--shadow); }
    .denied-icon { display: inline-flex; width: 3.5rem; height: 3.5rem; align-items: center; justify-content: center; border-radius: 1rem; background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 1.5rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <div class="denied-card">
    <div class="denied-icon"><i class="fa-solid fa-lock"></i></div>
    <h1>Manage Channels Required</h1>
    <p>Access to the dashboard is restricted to Discord server owners and administrators with <strong>Manage Channels</strong> permission.</p>
    <button onclick="logout()" class="btn btn-ghost"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out</button>
  </div>
  <script>
    async function logout() {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
      window.location.href = '/login';
    }
  </script>
</body>
</html>`;
  }

  const isOwner = isOwnerUser(userId, deps);
  const isAdmin = !isOwner && isAdminOrOwner(userId, deps);
  const isHost = isOwner || isAdmin;
  const canManage =
    _route.view === 'dashboard' && _route.guildId && userId !== null
      ? canUserManageGuild(userId, _route.guildId, deps)
      : false;
  const dbStats = deps.db.stats();
  const redditAvailable = (deps.reddit ?? createRedditFeeds()).available();

  return `<!DOCTYPE html>
<html lang="en" class="${theme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} · Bot Management Dashboard</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    ${renderDashboardStyles()}
  </style>
</head>
<body>
  <!-- Top Navigation Bar -->
  <header>
    <div class="header-left">
      <a href="/dashboard" class="brand">
        ${
          appIconUrl
            ? `<img src="${appIconUrl}" alt="${appName}" style="width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">`
            : `<div class="brand-icon"><i class="fa-solid fa-robot"></i></div>`
        }
        <div>
          <div class="brand-title">${appName}</div>
          <div class="brand-sub">Discord Management Dashboard</div>
        </div>
      </a>
      <div id="current-guild-pill" class="guild-pill hidden">
        <img id="current-guild-icon" src="" alt="">
        <span id="current-guild-name">Server</span>
      </div>
    </div>

    <div class="nav-actions">
      <span class="badge badge-gray" title="Active Theme: ${theme.name} (Configured via DASHBOARD_THEME)" style="padding: 0.4rem 0.75rem; font-size: 0.75rem;">
        <i class="${theme.icon}" style="color: var(--primary); margin-right: 0.25rem;"></i> ${theme.name}
      </span>
      ${
        botInviteUrl
          ? `<a href="${botInviteUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-discord btn-sm">
        <i class="fa-brands fa-discord"></i> <span class="btn-text">Invite Bot</span>
      </a>`
          : ''
      }
      ${
        userId !== null
          ? `<div class="user-menu" id="user-menu">
        <button type="button" class="btn btn-ghost btn-sm user-menu-trigger" id="user-menu-trigger" aria-haspopup="true" aria-expanded="false">
          <i class="fa-solid fa-user" style="color: var(--primary);"></i> <span id="user-display-name">Discord User</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.6875rem; color: var(--text-muted);"></i>
        </button>
        <div class="user-menu-list" id="user-menu-list" role="menu">
          <a href="/guilds" role="menuitem" class="user-menu-item"><i class="fa-solid fa-server"></i> <span>Servers</span></a>
          ${
            isOwner && deps.config.features.adminPanelEnabled
              ? `<a href="/admin" role="menuitem" class="user-menu-item"><i class="fa-solid fa-screwdriver-wrench"></i> <span>Developer Tools</span></a>`
              : ''
          }
          <button type="button" role="menuitem" class="user-menu-item user-menu-logout" onclick="logout()"><i class="fa-solid fa-arrow-right-from-bracket"></i> <span>Log Out</span></button>
        </div>
      </div>`
          : `<a href="/api/auth/discord" class="btn btn-discord btn-sm"><i class="fa-brands fa-discord"></i> Log In with Discord</a>`
      }
    </div>
  </header>

  <!-- Container -->
  <div class="container">
    <!-- Server Selection View -->
    <div id="guild-selection-view" class="tab-pane active" style="width: 100%;">
      <div>
        <div class="section-title"><i class="fa-solid fa-server" style="color: var(--primary);"></i> Select a Discord Server</div>
        <div class="section-desc">Choose a server to manage feeds, roles, and automated delivery targets.</div>
      </div>
      <div id="guild-grid" class="guild-grid">
        <div class="empty-state">Loading servers...</div>
      </div>
      <div id="guild-empty-state" class="empty-state hidden">
        <div style="font-size: 1.25rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-robot"></i></div>
        <div>No manageable servers found. Make sure the bot is in a server where you have <strong>Manage Channels</strong> permission.</div>
        ${botInviteUrl ? `<div style="margin-top: 1rem;"><a href="${botInviteUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-discord"><i class="fa-brands fa-discord"></i> Invite Bot</a></div>` : ''}
      </div>
    </div>

    <!-- Active Server Dashboard View -->
    <div id="dashboard-view" class="tab-pane" style="width: 100%; flex-direction: row;">
      <!-- Categorized Sidebar Navigation -->
      ${renderSidebar({ isHost, redditAvailable, canManage })}

      <!-- Main Content Tabs -->
      <main>
        ${renderOverviewTab({ dbSizeBytes: dbStats.dbSizeBytes })}
        ${renderGuildAdminTab()}
        ${renderFeedsTab()}
        ${renderSourcesTabs(redditAvailable)}
        ${renderWelcomeTab()}
        ${renderTicketsTab()}
        ${renderLogsTab()}
        ${renderCommandsTab()}
        ${
          isHost
            ? renderSettingsTab({
                publicBaseUrl,
                internalUrl,
                themeName: theme.name,
                themeId: theme.id,
              })
            : ''
        }
      </main>
    </div>
  </div>

  <!-- Client Script -->
  <script>
    ${renderClientScript()}
  </script>
</body>
</html>`;
}
