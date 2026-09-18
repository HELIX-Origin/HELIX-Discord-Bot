import { appDisplayName, type AppDeps } from '../../app.js';
import { renderTopBar } from './topbar.js';
import { renderFooter } from './footer.js';

export function renderAdminHtml(deps: AppDeps, userId: number | null): string {
  const appName = appDisplayName(deps);
  const appIconUrl = deps.bot?.getAppIconUrl() || null;
  const features = deps.config.features;

  return `<!DOCTYPE html>
<html lang="en" class="dashboard-theme">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel · ${appName}</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root { --bg: #0b0f19; --card-bg: rgba(17, 24, 39, 0.85); --card-inner: #111827; --border: #1f2937; --text: #f3f4f6; --text-muted: #9ca3af; --primary: #06b6d4; --discord: #5865F2; }
    html.light { --bg: #e8ecf2; --card-bg: rgba(248, 250, 252, 0.95); --card-inner: #ffffff; --border: #cbd5e1; --text: #1e293b; --text-muted: #475569; --primary: #0284c7; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    .container { max-width: 1280px; width: 100%; margin: 0 auto; padding: 1.5rem; flex: 1; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .card-title { font-size: 1.125rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: all 0.15s; min-height: 44px; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-ghost { background: var(--card-inner); color: var(--text); border-color: var(--border); }
    .btn-ghost:hover { background: rgba(255,255,255,0.08); }
    .btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }
    .btn-danger:hover { background: rgba(239,68,68,0.3); color: #fff; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; border-radius: 0.5rem; min-height: 36px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: var(--card-inner); border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; }
    .stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .stat-value { font-size: 1.875rem; font-weight: 800; color: var(--primary); margin-top: 0.5rem; }
    .log-container { max-height: 500px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
    .log-entry { background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; }
    .log-level { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.45rem; border-radius: 0.375rem; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; }
    .badge-red { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .badge-amber { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .badge-green { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
    .badge-gray { background: rgba(156,163,175,0.12); color: #9ca3af; border: 1px solid var(--border); }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
    .form-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    select { width: 100%; background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--text); outline: none; min-height: 44px; }
  </style>
</head>
<body>
  ${renderTopBar(deps, userId, { active: 'admin' })}
  <div class="container">
    <!-- Runtime Diagnostics -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fa-solid fa-chart-line" style="color: var(--primary);"></i> Runtime Diagnostics</div>
        <button onclick="loadStats()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Total Feeds</div><div class="stat-value" id="stat-feeds">-</div></div>
        <div class="stat-card"><div class="stat-label">Entries Delivered</div><div class="stat-value" id="stat-sent">-</div></div>
        <div class="stat-card"><div class="stat-label">Registered Users</div><div class="stat-value" id="stat-users">-</div></div>
        <div class="stat-card"><div class="stat-label">Database Size</div><div class="stat-value" id="stat-db">-</div></div>
        <div class="stat-card"><div class="stat-label">Process Uptime</div><div class="stat-value" id="stat-uptime">-</div></div>
        <div class="stat-card"><div class="stat-label">Memory RSS</div><div class="stat-value" id="stat-rss">-</div></div>
        <div class="stat-card"><div class="stat-label">Heap Used</div><div class="stat-value" id="stat-heap">-</div></div>
        <div class="stat-card"><div class="stat-label">Node.js</div><div class="stat-value" id="stat-node">-</div></div>
        <div class="stat-card"><div class="stat-label">Platform</div><div class="stat-value" id="stat-platform">-</div></div>
      </div>
    </div>

    <!-- Developer Actions -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fa-solid fa-bolt" style="color: var(--primary);"></i> Developer Actions</div>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        <button onclick="syncCommands()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-arrow-right-arrow-left"></i> Sync Discord Commands</button>
        <button onclick="optimizeDb()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-database"></i> Optimize SQLite DB</button>
        <button onclick="pollFeeds()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-rss"></i> Poll All Feeds Now</button>
      </div>
    </div>

    <!-- Service Logs -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fa-solid fa-list-ul" style="color: var(--primary);"></i> Service Logs</div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <select id="log-level" onchange="loadLogs()">
            <option value="">All levels</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
            <option value="debug">debug</option>
          </select>
          <select id="log-limit" onchange="loadLogs()">
            <option value="50">50</option>
            <option value="100" selected>100</option>
            <option value="200">200</option>
            <option value="500">500</option>
          </select>
          <button onclick="loadLogs()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
        </div>
      </div>
      <div id="admin-logs" class="log-container">Loading logs...</div>
    </div>
  </div>
  ${renderFooter(deps, { dashboardEnabled: features.dashboardEnabled })}
  <script>
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) return;
        const stats = await res.json();
        document.getElementById('stat-feeds').textContent = stats.feedCount ?? '-';
        document.getElementById('stat-sent').textContent = stats.sentCount ?? '-';
        document.getElementById('stat-users').textContent = stats.userCount ?? '-';
        document.getElementById('stat-db').textContent = Math.round((stats.dbSizeBytes || 0) / 1024) + ' KB';
        if (typeof stats.processUptimeSeconds === 'number') {
          const s = stats.processUptimeSeconds;
          const d = Math.floor(s / 86400);
          const h = Math.floor((s % 86400) / 3600);
          const m = Math.floor((s % 3600) / 60);
          document.getElementById('stat-uptime').textContent = (d ? d + 'd ' : '') + h + 'h ' + m + 'm';
        }
        document.getElementById('stat-rss').textContent = Math.round(stats.memoryRssBytes / 1048576) + ' MB';
        document.getElementById('stat-heap').textContent = Math.round(stats.memoryHeapUsedBytes / 1048576) + ' MB';
        document.getElementById('stat-node').textContent = stats.nodeVersion || '-';
        document.getElementById('stat-platform').textContent = stats.platform || '-';
      } catch {}
    }

    function formatUptime(ms) {
      const s = Math.floor(ms / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      return (d ? d + 'd ' : '') + h + 'h ' + m + 'm';
    }

    async function loadLogs() {
      const container = document.getElementById('admin-logs');
      const level = document.getElementById('log-level').value;
      const limit = document.getElementById('log-limit').value;
      if (!container) return;
      try {
        container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text-muted);">Loading logs...</div>';
        const res = await fetch('/api/admin/activity?limit=' + limit + (level ? '&level=' + level : ''));
        if (!res.ok) return;
        const logs = await res.json();
        if (!logs.length) { container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text-muted);">No log entries found.</div>'; return; }
        container.innerHTML = logs.map(a => {
          const lvl = (a.level || 'info').toLowerCase();
          const badge = lvl === 'error' ? 'badge-red' : lvl === 'warn' ? 'badge-amber' : lvl === 'info' ? 'badge-green' : 'badge-gray';
          const time = a.ts ? new Date(a.ts).toLocaleString() : '-';
          const actor = a.userId != null ? 'User #' + a.userId : 'System';
          return '<div class="log-entry">' +
            '<div style="display:flex;align-items:center;gap:0.5rem;"><span class="log-level ' + badge + '">' + lvl + '</span>' +
            '<span class="log-level badge-gray">' + (a.source || 'system') + '</span>' +
            '<span style="font-weight:600;font-size:0.8125rem;">' + a.message + '</span></div>' +
            '<div style="font-size:0.6875rem;color:var(--text-dim);font-family:monospace;">' + time + ' · Actor: ' + actor + '</div>' +
          '</div>';
        }).join('');
      } catch {
        container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text-muted);">Failed to load logs.</div>';
      }
    }

    async function syncCommands() {
      await postAction('/api/admin/bot/sync-commands', 'Discord slash commands synced successfully.', 'Failed to sync Discord slash commands.');
    }
    async function optimizeDb() {
      await postAction('/api/admin/db/optimize', 'SQLite database optimized.', 'Failed to optimize the database.');
    }
    async function pollFeeds() {
      await postAction('/api/admin/feeds/poll-all', 'All feeds polled.', 'Failed to poll feeds.');
    }

    async function postAction(url, okMsg, failMsg) {
      try {
        const res = await fetch(url, { method: 'POST' });
        if (res.ok) { alert(okMsg); loadStats(); loadLogs(); }
        else { let msg = failMsg; try { const j = await res.json(); if (j && j.error) msg += ': ' + j.error; } catch {} alert(msg); }
      } catch { alert(failMsg); }
    }

    // Initialize
    loadStats();
    loadLogs();
  </script>
</body>
</html>`;
}
