import { appDisplayName, type AppDeps } from '../../app.js';
import { renderTopBar } from './topbar.js';
import { renderFooter } from './footer.js';

export function renderGuildsHtml(deps: AppDeps, userId: number | null): string {
  const appName = appDisplayName(deps);
  const appIconUrl = deps.bot?.getAppIconUrl() || null;
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
    .guild-grid { display: grid; grid-template-columns: 1fr; gap: 0.625rem; padding: 1.5rem; max-width: 720px; margin: 0 auto; width: 100%; }
    .guild-pill { background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.875rem; padding: 0.875rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; transition: border-color 0.15s; }
    .guild-pill:hover { border-color: var(--primary); }
    .guild-pill-left { display: flex; align-items: center; gap: 0.875rem; min-width: 0; }
    .guild-icon { width: 2.75rem; height: 2.75rem; border-radius: 0.625rem; object-fit: cover; background: var(--card-inner); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: var(--text-muted); flex-shrink: 0; }
    .guild-name { font-size: 1rem; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .guild-sub { font-size: 0.8125rem; color: var(--text-muted); }
    .guild-pill-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 0.875rem; border-radius: 0.625rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border); text-decoration: none; transition: all 0.15s; min-height: 38px; background: var(--card-inner); color: var(--text); }
    .btn:hover { border-color: var(--primary); color: var(--primary); }
    .btn-primary { background: var(--primary); color: #fff; border-color: transparent; }
    .btn-primary:hover { background: var(--primary, #0284c7); }
    .btn-discord { background: var(--discord); color: #fff; border-color: transparent; }
    .empty-state { padding: 3rem 1rem; text-align: center; color: var(--text-muted); font-size: 1rem; }
    .section-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; text-align: center; }
    .section-desc { text-align: center; color: var(--text-muted); margin-bottom: 2rem; }
  </style>
</head>
<body>
  ${renderTopBar(deps, userId, { active: 'guilds' })}
  <div style="max-width:720px; margin: 0 auto; width: 100%; padding: 2rem 1.5rem 0;">
    <h1 class="section-title" style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">Select a Discord Server</h1>
    <p class="section-desc" style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">Choose a server to manage. Servers the bot isn&rsquo;t in yet can be invited with the <i class="fa-brands fa-discord"></i> button.</p>
  </div>
  <div class="guild-grid" id="guild-grid">
    <div class="empty-state">Loading servers...</div>
  </div>
  ${renderFooter(deps, { dashboardEnabled: features.dashboardEnabled })}
  <script>
    function guildIconUrl(id, icon) {
      return icon ? 'https://cdn.discordapp.com/icons/' + id + '/' + icon + '.png' : '';
    }
    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    async function loadGuilds() {
      const grid = document.getElementById('guild-grid');
      if (!grid) return;
      try {
        const res = await fetch('/api/guilds');
        if (res.status === 401) { window.location.href = '/login'; return; }
        const data = await res.json();
        const guilds = data.guilds || [];
        if (!guilds.length) {
          grid.innerHTML = '<div class="empty-state">No servers found. Use the <strong>Invite Bot</strong> button above to add the bot to a server you can manage.</div>';
          return;
        }
        grid.innerHTML = guilds.map(g => {
          const icon = guildIconUrl(g.id, g.icon);
          const iconHtml = icon ? '<img class="guild-icon" src="' + icon + '" alt="' + esc(g.name) + '">' : '<div class="guild-icon"><i class="fa-solid fa-server"></i></div>';
          const badges = [];
          if (g.botIn) badges.push('<span class="guild-sub">Bot in server</span>');
          if (g.canManage) badges.push('<span class="guild-sub">Manage</span>');
          const manageBtn = g.canManage && g.botIn
            ? '<a href="/dashboard/' + encodeURIComponent(g.id) + '" class="btn btn-primary" title="Manage server"><i class="fa-solid fa-gear"></i> Manage</a>'
            : '<span class="btn" title="You do not have permission to manage this server" style="opacity: 0.45; cursor: not-allowed;"><i class="fa-solid fa-gear"></i> Manage</span>';
          const inviteBtn = g.canInvite && g.inviteUrl
            ? '<a href="' + g.inviteUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-discord" title="Invite bot to this server"><i class="fa-brands fa-discord"></i> Invite</a>'
            : '<span class="btn" title="No permission to invite the bot here" style="opacity: 0.45; cursor: not-allowed;"><i class="fa-brands fa-discord"></i> Invite</span>';
          return '<div class="guild-pill">' +
            '<div class="guild-pill-left">' +
            iconHtml +
            '<div style="min-width:0;"><div class="guild-name">' + esc(g.name) + '</div>' +
            (badges.length ? '<div style="display:flex; gap:0.75rem;">' + badges.join('') + '</div>' : '') +
            '</div></div>' +
            '<div class="guild-pill-actions">' + manageBtn + inviteBtn + '</div>' +
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
