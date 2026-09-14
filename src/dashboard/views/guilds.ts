import { appDisplayName, type AppDeps } from '../../app.js';
import { renderTopBar } from './topbar.js';
import { renderFooter } from './footer.js';

export function renderGuildsHtml(deps: AppDeps, userId: number | null): string {
  const appName = appDisplayName(deps);
  const appIconUrl = deps.bot?.getAppIconUrl() || null;
  const botInviteUrl = deps.config.clientId
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(deps.config.clientId)}&scope=bot%20applications.commands&permissions=586263558272`
    : null;
  const features = deps.config.features;

  return `<!DOCTYPE html>
<html lang="en" class="dashboard-theme">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Select a Server · ${appName}</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root { --bg: #0b0f19; --card-bg: rgba(17, 24, 39, 0.85); --card-inner: #111827; --border: #1f2937; --text: #f3f4f6; --text-muted: #9ca3af; --primary: #06b6d4; --discord: #5865F2; }
    html.light { --bg: #e8ecf2; --card-bg: rgba(248, 250, 252, 0.95); --card-inner: #ffffff; --border: #cbd5e1; --text: #1e293b; --text-muted: #475569; --primary: #0284c7; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    .guild-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; padding: 1.5rem; max-width: 1280px; margin: 0 auto; width: 100%; }
    .guild-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; transition: border-color 0.15s, transform 0.15s; }
    .guild-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .guild-icon { width: 4.5rem; height: 4.5rem; border-radius: 1rem; object-fit: cover; background: var(--card-inner); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--text-muted); }
    .guild-name { font-size: 1.125rem; font-weight: 700; color: var(--text); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: all 0.15s; min-height: 44px; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-discord { background: var(--discord); color: #fff; }
    .empty-state { padding: 3rem 1rem; text-align: center; color: var(--text-muted); font-size: 1rem; }
    .section-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; text-align: center; }
    .section-desc { text-align: center; color: var(--text-muted); margin-bottom: 2rem; }
  </style>
</head>
<body>
  ${renderTopBar(deps, userId, { active: 'guilds' })}
  <div class="guild-grid" id="guild-grid">
    <div class="empty-state">Loading servers...</div>
  </div>
  ${renderFooter(deps, { dashboardEnabled: features.dashboardEnabled })}
  <script>
    async function loadGuilds() {
      const grid = document.getElementById('guild-grid');
      if (!grid) return;
      try {
        const res = await fetch('/api/guilds');
        if (res.status === 401) { window.location.href = '/login'; return; }
        const data = await res.json();
        const guilds = data.guilds || [];
        if (!guilds.length) {
          grid.innerHTML = '<div class="empty-state">No manageable servers found. Make sure the bot has been added to a server where you have <strong>Manage Channels</strong> permission.</div>';
          ${botInviteUrl ? `grid.innerHTML += '<div style="margin-top:1rem;"><a href="${botInviteUrl}" target="_blank" class="btn btn-discord"><i class="fa-brands fa-discord"></i> Invite Bot</a></div>';` : ''}
          return;
        }
        grid.innerHTML = guilds.map(g => {
          const icon = g.icon ? 'https://cdn.discordapp.com/icons/' + g.id + '/' + g.icon + '.png' : '';
          return '<div class="guild-card">' +
            (icon ? '<img class="guild-icon" src="' + icon + '" alt="' + g.name + '">' : '<div class="guild-icon"><i class="fa-solid fa-server"></i></div>') +
            '<div class="guild-name">' + g.name + '</div>' +
            '<a href="/dashboard/' + g.id + '" class="btn btn-primary"><i class="fa-solid fa-gear"></i> Manage Server</a>' +
          '</div>';
        }).join('');
      } catch {
        grid.innerHTML = '<div class="empty-state">Failed to load servers.</div>';
      }
    }
    loadGuilds();
  </script>
</body>
</html>`;
}
