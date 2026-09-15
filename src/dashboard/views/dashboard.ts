import { appDisplayName, type AppDeps } from '../../app.js';
import { isOwnerUser, isAdminOrOwner, canUserAccessDashboard } from '../routes/shared.js';
import { getThemeInfo, getColorSchemeInfo } from './theme.js';

export { getThemeInfo, getColorSchemeInfo } from './theme.js';

export interface DashboardRoute {
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
  const colorScheme = getColorSchemeInfo(deps.config.dashboardColorScheme);
  const publicBaseUrl = deps.config.publicBaseUrl || null;
  const internalUrl = deps.config.internalUrl;
  const botInviteUrl = deps.config.clientId
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(deps.config.clientId)}&scope=bot%20applications.commands&permissions=586263558272`
    : null;

  // Permission check for logged in Discord users without server manage permissions
  if (userId !== null && !canUserAccessDashboard(userId, deps)) {
    return `<!DOCTYPE html>
<html lang="en" class="${theme.id} scheme-${colorScheme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Denied · ${appName}</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root, html.dark {
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.85);
      --card-inner: #111827;
      --border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #06b6d4;
    }
    html.light {
      --bg: #e8ecf2;
      --card-bg: rgba(248, 250, 252, 0.95);
      --card-inner: #ffffff;
      --border: #cbd5e1;
      --text: #1e293b;
      --text-muted: #475569;
      --primary: #0284c7;
    }
    html.glassmorphism {
      --bg: #0a0d18;
      --card-bg: rgba(18, 24, 43, 0.55);
      --card-inner: rgba(255, 255, 255, 0.04);
      --border: rgba(255, 255, 255, 0.12);
      --text: #ffffff;
      --text-muted: #cbd5e1;
      --primary: #a855f7;
    }
    html.glassmorphism body {
      background: radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.16), transparent 35%),
                  radial-gradient(circle at 85% 20%, rgba(6, 182, 212, 0.16), transparent 35%),
                  radial-gradient(circle at 50% 85%, rgba(236, 72, 153, 0.14), transparent 45%),
                  #0a0d18;
      background-attachment: fixed;
    }
    html.cyberpunk {
      --bg: #05050a;
      --card-bg: rgba(14, 14, 24, 0.92);
      --card-inner: #0a0a12;
      --border: rgba(0, 240, 255, 0.25);
      --text: #fcee0a;
      --text-muted: #e2e8f0;
      --primary: #00f0ff;
    }
    html.dracula {
      --bg: #282a36;
      --card-bg: rgba(40, 42, 54, 0.92);
      --card-inner: #21222c;
      --border: #44475a;
      --text: #f8f8f2;
      --text-muted: #bd93f9;
      --primary: #ff79c6;
    }
    html.nord {
      --bg: #2e3440;
      --card-bg: rgba(46, 52, 64, 0.95);
      --card-inner: #3b4252;
      --border: #434c5e;
      --text: #eceff4;
      --text-muted: #d8dee9;
      --primary: #88c0d0;
    }
    html.emerald {
      --bg: #041712;
      --card-bg: rgba(6, 38, 28, 0.9);
      --card-inner: #07261d;
      --border: #134e3a;
      --text: #ecfdf5;
      --text-muted: #a7f3d0;
      --primary: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.25rem; padding: 2rem; max-width: 440px; text-align: center; backdrop-filter: blur(16px); }
    .icon { display: inline-flex; width: 3.5rem; height: 3.5rem; align-items: center; justify-content: center; border-radius: 1rem; background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 1.5rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; background: var(--card-inner); color: var(--text); font-size: 0.875rem; font-weight: 600; text-decoration: none; border: 1px solid var(--border); cursor: pointer; }
    .btn:hover { border-color: var(--primary); color: var(--primary); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon"><i class="fa-solid fa-lock"></i></div>
    <h1>Manage Channels Required</h1>
    <p>Access to the dashboard is restricted to Discord server owners and administrators with <strong>Manage Channels</strong> permission.</p>
    <button onclick="logout()" class="btn"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out</button>
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
  const dbStats = deps.db.stats();

  return `<!DOCTYPE html>
<html lang="en" class="${theme.id} scheme-${colorScheme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} · Feed Syndication</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root, html.dark {
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.85);
      --card-inner: #111827;
      --border: #1f2937;
      --border-hover: #374151;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --primary: #06b6d4;
      --primary-hover: #0891b2;
      --primary-bg: rgba(6, 182, 212, 0.12);
      --primary-border: rgba(6, 182, 212, 0.35);
      --discord: #5865F2;
      --discord-hover: #4752C4;
      --amber: #f59e0b;
      --emerald: #10b981;
      --red: #ef4444;
      --shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    html.light {
      --bg: #e8ecf2;
      --card-bg: rgba(248, 250, 252, 0.95);
      --card-inner: #ffffff;
      --border: #cbd5e1;
      --border-hover: #94a3b8;
      --text: #1e293b;
      --text-muted: #475569;
      --text-dim: #64748b;
      --primary: #0284c7;
      --primary-hover: #0369a1;
      --primary-bg: rgba(14, 165, 233, 0.12);
      --primary-border: rgba(14, 165, 233, 0.35);
      --shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    html.glassmorphism {
      --bg: #0a0d18;
      --card-bg: rgba(18, 24, 43, 0.55);
      --card-inner: rgba(255, 255, 255, 0.04);
      --border: rgba(255, 255, 255, 0.12);
      --border-hover: rgba(168, 85, 247, 0.5);
      --text: #ffffff;
      --text-muted: #cbd5e1;
      --text-dim: #94a3b8;
      --primary: #a855f7;
      --primary-hover: #9333ea;
      --primary-bg: rgba(168, 85, 247, 0.2);
      --primary-border: rgba(168, 85, 247, 0.45);
      --shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }
    html.glassmorphism body {
      background: radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.16), transparent 35%),
                  radial-gradient(circle at 85% 20%, rgba(6, 182, 212, 0.16), transparent 35%),
                  radial-gradient(circle at 50% 85%, rgba(236, 72, 153, 0.14), transparent 45%),
                  #0a0d18;
      background-attachment: fixed;
    }
    html.glassmorphism .card,
    html.glassmorphism nav.sidebar,
    html.glassmorphism header {
      backdrop-filter: blur(20px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
    }
    html.glassmorphism .stat-card,
    html.glassmorphism .feed-item,
    html.glassmorphism input[type="text"],
    html.glassmorphism select,
    html.glassmorphism textarea {
      background: rgba(255, 255, 255, 0.04) !important;
      backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }
    html.glassmorphism select {
      background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
        linear-gradient(135deg, var(--text-muted) 50%, transparent 50%) !important;
      background-position: calc(100% - 1.3rem) calc(1em + 0.35rem), calc(100% - 0.95rem) calc(1em + 0.35rem) !important;
      background-size: 0.4rem 0.4rem !important;
      background-repeat: no-repeat !important;
    }
    html.glassmorphism select option,
    html.glassmorphism select optgroup {
      background: #151b2e;
      color: var(--text);
    }
    html.cyberpunk {
      --bg: #05050a;
      --card-bg: rgba(14, 14, 24, 0.92);
      --card-inner: #0a0a12;
      --border: rgba(0, 240, 255, 0.25);
      --border-hover: #00f0ff;
      --text: #fcee0a;
      --text-muted: #e2e8f0;
      --text-dim: #8b9bb4;
      --primary: #00f0ff;
      --primary-hover: #00c8d6;
      --primary-bg: rgba(0, 240, 255, 0.16);
      --primary-border: rgba(0, 240, 255, 0.5);
      --amber: #fcee0a;
      --red: #ff0055;
      --emerald: #00ff9f;
      --shadow: 0 0 20px rgba(0, 240, 255, 0.15);
    }
    html.cyberpunk body {
      background: linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px),
                  #05050a;
      background-size: 32px 32px;
      background-attachment: fixed;
    }
    html.dracula {
      --bg: #282a36;
      --card-bg: rgba(40, 42, 54, 0.92);
      --card-inner: #21222c;
      --border: #44475a;
      --border-hover: #bd93f9;
      --text: #f8f8f2;
      --text-muted: #bd93f9;
      --text-dim: #6272a4;
      --primary: #ff79c6;
      --primary-hover: #ff92d0;
      --primary-bg: rgba(255, 121, 198, 0.15);
      --primary-border: rgba(255, 121, 198, 0.45);
      --emerald: #50fa7b;
      --amber: #f1fa8c;
      --red: #ff5555;
      --shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    html.nord {
      --bg: #2e3440;
      --card-bg: rgba(46, 52, 64, 0.95);
      --card-inner: #3b4252;
      --border: #434c5e;
      --border-hover: #88c0d0;
      --text: #eceff4;
      --text-muted: #d8dee9;
      --text-dim: #7b88a1;
      --primary: #88c0d0;
      --primary-hover: #81a1c1;
      --primary-bg: rgba(136, 192, 208, 0.15);
      --primary-border: rgba(136, 192, 208, 0.4);
      --emerald: #a3be8c;
      --amber: #ebcb8b;
      --red: #bf616a;
      --shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }
    html.emerald {
      --bg: #041712;
      --card-bg: rgba(6, 38, 28, 0.9);
      --card-inner: #07261d;
      --border: #134e3a;
      --border-hover: #10b981;
      --text: #ecfdf5;
      --text-muted: #a7f3d0;
      --text-dim: #34d399;
      --primary: #10b981;
      --primary-hover: #059669;
      --primary-bg: rgba(16, 185, 129, 0.16);
      --primary-border: rgba(16, 185, 129, 0.45);
      --shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    /* Native control chrome (select dropdowns, checkboxes, scrollbars) follows the theme. */
    html.light { color-scheme: light; }
    html.dark, html.glassmorphism, html.cyberpunk, html.dracula, html.nord, html.emerald { color-scheme: dark; }

    /* Color Scheme Overrides */
    html.scheme-purple, html[class*="scheme-purple"] {
      --primary: #a855f7 !important;
      --primary-hover: #9333ea !important;
      --primary-bg: rgba(168, 85, 247, 0.15) !important;
      --primary-border: rgba(168, 85, 247, 0.4) !important;
    }
    html.scheme-blue, html[class*="scheme-blue"] {
      --primary: #3b82f6 !important;
      --primary-hover: #2563eb !important;
      --primary-bg: rgba(59, 130, 246, 0.15) !important;
      --primary-border: rgba(59, 130, 246, 0.4) !important;
    }
    html.scheme-emerald, html[class*="scheme-emerald"] {
      --primary: #10b981 !important;
      --primary-hover: #059669 !important;
      --primary-bg: rgba(16, 185, 129, 0.15) !important;
      --primary-border: rgba(16, 185, 129, 0.4) !important;
    }
    html.scheme-rose, html[class*="scheme-rose"] {
      --primary: #f43f5e !important;
      --primary-hover: #e11d48 !important;
      --primary-bg: rgba(244, 63, 94, 0.15) !important;
      --primary-border: rgba(244, 63, 94, 0.4) !important;
    }
    html.scheme-amber, html[class*="scheme-amber"] {
      --primary: #f59e0b !important;
      --primary-hover: #d97706 !important;
      --primary-bg: rgba(245, 158, 11, 0.15) !important;
      --primary-border: rgba(245, 158, 11, 0.4) !important;
    }
    html.scheme-indigo, html[class*="scheme-indigo"] {
      --primary: #6366f1 !important;
      --primary-hover: #4f46e5 !important;
      --primary-bg: rgba(99, 102, 241, 0.15) !important;
      --primary-border: rgba(99, 102, 241, 0.4) !important;
    }
    html.scheme-crimson, html[class*="scheme-crimson"] {
      --primary: #ef4444 !important;
      --primary-hover: #dc2626 !important;
      --primary-bg: rgba(239, 68, 68, 0.15) !important;
      --primary-border: rgba(239, 68, 68, 0.4) !important;
    }
    html.scheme-teal, html[class*="scheme-teal"] {
      --primary: #14b8a6 !important;
      --primary-hover: #0d9488 !important;
      --primary-bg: rgba(20, 184, 166, 0.15) !important;
      --primary-border: rgba(20, 184, 166, 0.4) !important;
    }
    html.scheme-sunset, html[class*="scheme-sunset"] {
      --primary: #ff6b6b !important;
      --primary-hover: #fa5252 !important;
      --primary-bg: rgba(255, 107, 107, 0.15) !important;
      --primary-border: rgba(255, 107, 107, 0.4) !important;
    }
    html.scheme-cyan, html[class*="scheme-cyan"] {
      --primary: #06b6d4 !important;
      --primary-hover: #0891b2 !important;
      --primary-bg: rgba(6, 182, 212, 0.15) !important;
      --primary-border: rgba(6, 182, 212, 0.4) !important;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; transition: background-color 0.2s, color 0.2s; }

    /* Header */
    header { position: sticky; top: 0; z-index: 50; background: var(--card-bg); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .header-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
    .brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--text); }
    .brand-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; background: linear-gradient(135deg, #06b6d4, #3b82f6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(6,182,212,0.3); flex-shrink: 0; }
    .brand-title { font-size: 1.125rem; font-weight: 800; letter-spacing: -0.02em; }
    .brand-title span { color: var(--primary); }
    .brand-sub { font-size: 0.75rem; color: var(--text-muted); }
    .guild-pill { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.875rem; border-radius: 9999px; background: var(--card-inner); border: 1px solid var(--border); color: var(--text); font-size: 0.875rem; font-weight: 600; }
    .guild-pill img { width: 1.5rem; height: 1.5rem; border-radius: 50%; object-fit: cover; }
    .nav-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

    /* Layout */
    .container { max-width: 1280px; width: 100%; margin: 0 auto; padding: 1rem; flex: 1; display: flex; gap: 1.25rem; }
    @media (max-width: 860px) { .container { flex-direction: column; padding: 0.875rem; gap: 1rem; } }

    /* Sidebar Navigation */
    nav.sidebar { width: 240px; flex-shrink: 0; background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 1.25rem; padding: 0.875rem; display: flex; flex-direction: column; justify-content: space-between; height: calc(100vh - 6.5rem); position: sticky; top: 5rem; }
    @media (max-width: 860px) {
      nav.sidebar { width: 100%; height: auto; position: static; }
      .tab-list { flex-direction: row !important; overflow-x: auto; gap: 0.5rem; padding-bottom: 0.25rem; scrollbar-width: none; }
      .tab-list::-webkit-scrollbar { display: none; }
      .tab-btn { width: auto !important; white-space: nowrap; min-height: 44px; }
      .tab-btn i { margin-right: 0; }
      .tab-btn span { display: none; }
      .sidebar-footer { display: none !important; }
    }
    .tab-list { display: flex; flex-direction: column; gap: 0.375rem; }
    .tab-btn { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--text-muted); background: transparent; border: 1px solid transparent; cursor: pointer; text-align: left; transition: all 0.15s; min-height: 44px; }
    .tab-btn:hover { background: rgba(255,255,255,0.05); color: var(--text); }
    .tab-btn.active { color: var(--primary); background: var(--primary-bg); border-color: var(--primary-border); }
    .sidebar-footer { padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.75rem; color: var(--text-dim); display: flex; justify-content: space-between; }
    .sidebar-footer a { color: var(--text-muted); text-decoration: none; }
    .sidebar-footer a:hover { color: var(--primary); }

    /* Main Content */
    main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1.25rem; }
    .tab-pane { display: none; flex-direction: column; gap: 1.25rem; }
    .tab-pane.active { display: flex; }

    /* Cards & Components */
    .card { background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .card-title { font-size: 1rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
    .card-desc { font-size: 0.8125rem; color: var(--text-muted); }

    /* Guild Selection */
    .guild-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    @media (max-width: 480px) { .guild-grid { grid-template-columns: 1fr; } }
    @media (min-width: 481px) and (max-width: 860px) { .guild-grid { grid-template-columns: repeat(2, 1fr); } }
    .guild-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; transition: border-color 0.15s, transform 0.15s; }
    .guild-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .guild-icon { width: 4.5rem; height: 4.5rem; border-radius: 1rem; object-fit: cover; background: var(--card-inner); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--text-muted); }
    .guild-name { font-size: 1.125rem; font-weight: 700; color: var(--text); }

    /* Category Grid */
    .category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; align-items: start; }
    @media (max-width: 1100px) { .category-grid { grid-template-columns: 1fr; } }
    .category-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .category-card.rss { border-top: 4px solid var(--primary); }
    .category-card.reddit { border-top: 4px solid #ff4500; }
    .category-card.freegames { border-top: 4px solid #10b981; }
    .category-card.streamalerts { border-top: 4px solid #9146ff; }
    .category-header { display: flex; align-items: center; gap: 0.75rem; }
    .category-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .category-icon.rss { background: rgba(6, 182, 212, 0.15); color: var(--primary); }
    .category-icon.reddit { background: rgba(255, 69, 0, 0.15); color: #ff4500; }
    .category-icon.freegames { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .category-icon.streamalerts { background: rgba(145, 70, 255, 0.15); color: #9146ff; }
    .category-title { font-size: 1.125rem; font-weight: 800; }
    .target-readout { font-size: 0.75rem; color: var(--text-muted); background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.5rem 0.75rem; }

    /* Grid layout */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .stat-card { background: var(--card-inner); border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; }
    .stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .stat-value { font-size: 1.875rem; font-weight: 800; color: var(--primary); margin-top: 0.5rem; }
    .stat-sub { font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem; }

    /* Form Controls */
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    input[type="text"], select, textarea { width: 100%; background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--text); outline: none; transition: border-color 0.15s; min-height: 44px; }
    select {
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      padding-right: 2.5rem !important;
      background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
        linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
      background-position: calc(100% - 1.3rem) calc(1em + 0.35rem), calc(100% - 0.95rem) calc(1em + 0.35rem);
      background-size: 0.4rem 0.4rem;
      background-repeat: no-repeat;
    }
    select option, select optgroup { background: var(--card-inner); color: var(--text); }
    select option:disabled { color: var(--text-dim); }
    input[type="checkbox"], input[type="radio"] { accent-color: var(--primary); width: 1.125rem; height: 1.125rem; cursor: pointer; }
    input[type="text"]:focus, select:focus, textarea:focus { border-color: var(--primary); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: all 0.15s; min-height: 44px; }
    .btn-primary { background: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(6,182,212,0.25); }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-discord { background: var(--discord); color: #fff; }
    .btn-discord:hover { background: var(--discord-hover); }
    .btn-ghost { background: var(--card-inner); color: var(--text-muted); border-color: var(--border); }
    .btn-ghost:hover { background: rgba(255,255,255,0.08); color: var(--text); }
    .btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }
    .btn-danger:hover { background: rgba(239,68,68,0.3); color: #fff; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; border-radius: 0.5rem; min-height: 36px; }
    .btn-block { width: 100%; }

    /* Feed & List Items */
    .feed-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .feed-pill { background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.875rem; padding: 0.625rem 0.875rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
    .feed-details { min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
    .feed-name-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .feed-name { font-weight: 700; font-size: 0.875rem; color: var(--text); }
    .feed-url { font-size: 0.75rem; color: var(--text-dim); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 360px; }
    .feed-meta { font-size: 0.6875rem; color: var(--text-dim); }
    .badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.45rem; border-radius: 0.375rem; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; }
    .badge-green { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
    .badge-red { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .badge-gray { background: rgba(156,163,175,0.12); color: #9ca3af; border: 1px solid var(--border); }
    .badge-amber { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }

    /* Interval Pills */
    .interval-group { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .interval-btn { padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.75rem; font-weight: 600; background: var(--card-inner); border: 1px solid var(--border); color: var(--text-muted); cursor: pointer; transition: all 0.15s; min-height: 40px; }
    .interval-btn:hover { background: rgba(255,255,255,0.05); color: var(--text); }
    .interval-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }

    .empty-state { padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }

    /* User Dropdown */
    .user-menu { position: relative; }
    .user-menu-trigger { display: inline-flex; align-items: center; gap: 0.5rem; }
    .user-menu.open .user-menu-trigger i.fa-chevron-down { transform: rotate(180deg); }
    .user-menu-list { position: absolute; right: 0; top: calc(100% + 0.5rem); min-width: 200px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.875rem; padding: 0.375rem; box-shadow: 0 16px 40px rgba(0,0,0,0.35); display: flex; flex-direction: column; gap: 0.125rem; opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity 0.15s, transform 0.15s, visibility 0.15s; z-index: 60; }
    .user-menu.open .user-menu-list { opacity: 1; visibility: visible; transform: translateY(0); }
    .user-menu-item { display: flex; align-items: center; gap: 0.625rem; width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.625rem; font-size: 0.8125rem; font-weight: 600; color: var(--text); background: transparent; border: none; cursor: pointer; text-align: left; text-decoration: none; }
    .user-menu-item i { width: 1.125rem; text-align: center; color: var(--text-muted); }
    .user-menu-item:hover { background: rgba(255,255,255,0.06); }
    .user-menu-logout, .user-menu-logout i { color: #f87171; }

    /* Utility */
    .section-title { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem; }
    .section-desc { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.75rem; }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <!-- Header -->
  <header>
    <div class="header-left">
      <a href="/dashboard" class="brand">
        ${
          appIconUrl
            ? `<img src="${appIconUrl}" alt="${appName}" style="width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">`
            : `<div class="brand-icon"><i class="fa-solid fa-rss"></i></div>`
        }
        <div>
          <div class="brand-title">${appName}</div>
          <div class="brand-sub">Discord Feed Syndication</div>
        </div>
      </a>
      <div id="current-guild-pill" class="guild-pill hidden">
        <img id="current-guild-icon" src="" alt="">
        <span id="current-guild-name">Server</span>
      </div>
    </div>

    <div class="nav-actions">
      <span class="badge badge-gray" title="Active Theme: ${theme.name}${colorScheme.id !== 'default' ? ` · Scheme: ${colorScheme.name}` : ''} (Configured via .env)" style="padding: 0.4rem 0.75rem; font-size: 0.75rem;">
        <i class="${theme.icon}" style="color: var(--primary); margin-right: 0.25rem;"></i> ${theme.name}${colorScheme.id !== 'default' ? ` <span style="opacity: 0.7; font-size: 0.6875rem;">(${colorScheme.name})</span>` : ''}
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
          <a href="/guilds" role="menuitem" class="user-menu-item"><i class="fa-solid fa-server"></i> <span>Guilds</span></a>
          ${
            isOwner && deps.config.features.adminPanelEnabled
              ? `<a href="/admin" role="menuitem" class="user-menu-item"><i class="fa-solid fa-screwdriver-wrench"></i> <span>Admin Panel</span></a>`
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
    <!-- Guild Selection View -->
    <div id="guild-selection-view" class="tab-pane active" style="width: 100%;">
      <div>
        <div class="section-title"><i class="fa-solid fa-server" style="color: var(--primary);"></i> Select a Server</div>
        <div class="section-desc">Choose a Discord server to manage its feeds and delivery channels.</div>
      </div>
      <div id="guild-grid" class="guild-grid">
        <div class="empty-state">Loading servers...</div>
      </div>
      <div id="guild-empty-state" class="empty-state hidden">
        <div style="font-size: 1.25rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-robot"></i></div>
        <div>No manageable servers found. Make sure the bot has been added to a server where you have <strong>Manage Channels</strong> permission.</div>
        ${botInviteUrl ? `<div style="margin-top: 1rem;"><a href="${botInviteUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-discord"><i class="fa-brands fa-discord"></i> Invite Bot</a></div>` : ''}
      </div>
    </div>

    <!-- Dashboard View -->
    <div id="dashboard-view" class="tab-pane" style="width: 100%; flex-direction: row;">
      <!-- Sidebar -->
      <nav class="sidebar">
        <div class="tab-list">
          <button onclick="switchTab('feeds')" id="tab-btn-feeds" class="tab-btn active">
            <i class="fa-solid fa-rss"></i> <span>Feeds</span>
          </button>
          <button onclick="switchTab('overview')" id="tab-btn-overview" class="tab-btn">
            <i class="fa-solid fa-chart-line"></i> <span>Overview</span>
          </button>
          <button onclick="switchTab('categories')" id="tab-btn-categories" class="tab-btn">
            <i class="fa-solid fa-layer-group"></i> <span>Categories</span>
          </button>
          <button onclick="switchTab('news')" id="tab-btn-news" class="tab-btn">
            <i class="fa-solid fa-newspaper" style="color: var(--amber);"></i> <span>News</span>
          </button>
          <button onclick="switchTab('guildadmin')" id="tab-btn-guildadmin" class="tab-btn">
            <i class="fa-solid fa-user-shield" style="color: var(--primary);"></i> <span>Guild Admin</span>
          </button>
          ${
            deps.config.features.lavaEnabled
              ? `<button onclick="switchTab('music')" id="tab-btn-music" class="tab-btn">
            <i class="fa-solid fa-music" style="color: #10b981;"></i> <span>Music</span>
          </button>`
              : ''
          }
          ${
            isHost
              ? `<button onclick="switchTab('settings')" id="tab-btn-settings" class="tab-btn">
            <i class="fa-solid fa-sliders"></i> <span>Settings</span>
          </button>`
              : ''
          }
        </div>

        <div class="sidebar-footer">
          <a href="/dashboard" onclick="clearGuild(event)" id="change-server-link">Change Server</a>
          <span>&middot;</span>
          <a href="/privacy">Privacy</a>
          <span>&middot;</span>
          <a href="/tos">Terms</a>
        </div>
      </nav>

      <!-- Main View -->
      <main>
        <!-- TAB 1: FEEDS -->
        <section id="tab-feeds" class="tab-pane active">
          <div id="feeds-topic-view">
            <div>
              <div class="section-title"><i class="fa-solid fa-rss" style="color: var(--primary);"></i> Feeds</div>
              <div class="section-desc">All feeds for this server, organized by topic. Pause, resume, or remove feeds, and jump to delivery settings in the Categories tab.</div>
            </div>
            <div id="feeds-topic-groups" style="display: flex; flex-direction: column; gap: 1.25rem;">
              <div class="empty-state">Loading feeds...</div>
            </div>
          </div>
          <div id="feed-detail-view" style="display: none;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
              <button onclick="closeFeedDetail()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-arrow-left"></i> Back to Feeds</button>
            </div>
            <div id="feed-detail-content"></div>
          </div>
        </section>

        <!-- TAB 2: OVERVIEW -->
        <section id="tab-overview" class="tab-pane active">
          <div>
            <div class="section-title"><i class="fa-solid fa-chart-pie" style="color: var(--primary);"></i> Server Overview</div>
            <div class="section-desc">Feeds and delivery status for the selected server.</div>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Feeds</div>
              <div class="stat-value" id="stat-total-feeds">0</div>
              <div class="stat-sub">In this server</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Active Feeds</div>
              <div class="stat-value" style="color: #10b981;" id="stat-active-feeds">0</div>
              <div class="stat-sub">Enabled and polling</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">RSS Feeds</div>
              <div class="stat-value" id="stat-rss-feeds">0</div>
              <div class="stat-sub">News & custom RSS</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Reddit Feeds</div>
              <div class="stat-value" style="color: #ff4500;" id="stat-reddit-feeds">0</div>
              <div class="stat-sub">Subreddits</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Free Games Feeds</div>
              <div class="stat-value" style="color: #10b981;" id="stat-freegames-feeds">0</div>
              <div class="stat-sub">Daily game drops</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Stream Alert Feeds</div>
              <div class="stat-value" style="color: #9146ff;" id="stat-streamalerts-feeds">0</div>
              <div class="stat-sub">YouTube & Twitch live</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Database Engine</div>
              <div class="stat-value" style="color: #5865F2;">${Math.round(dbStats.dbSizeBytes / 1024)} KB</div>
              <div class="stat-sub">SQLite persistence</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title"><i class="fa-solid fa-clock-rotate-left" style="color: var(--primary);"></i> Recent Activity</div>
                <div class="card-desc">System logs, delivery notifications, and parser status</div>
              </div>
              <button onclick="loadOverviewTab()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
            </div>
            <div id="activity-list" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 320px; overflow-y: auto;">
              <div class="empty-state">Loading recent activity...</div>
            </div>
          </div>
        </section>

        <!-- TAB 2: CATEGORIES -->
        <section id="tab-categories" class="tab-pane">
          <div>
            <div class="section-title"><i class="fa-solid fa-layer-group" style="color: var(--primary);"></i> Feed Categories</div>
            <div class="section-desc">Configure delivery targets and manage feeds for each category in this server.</div>
          </div>

          <div id="category-targets-grid" class="category-grid">
            <!-- RSS Card -->
            <div class="category-card rss">
              <div class="category-header">
                <div class="category-icon rss"><i class="fa-solid fa-rss"></i></div>
                <div>
                  <div class="category-title" style="color: var(--primary);">RSS</div>
                  <div class="card-desc">News, blogs, and custom RSS/Atom feeds</div>
                </div>
              </div>
              <div class="target-readout" id="rss-target-readout">Loading target...</div>
              <div class="form-group">
                <label class="form-label">Target Channel</label>
                <select id="rss-target-channel"></select>
              </div>
              <div class="form-group">
                <label class="form-label">Target Forum Thread Channel (optional)</label>
                <select id="rss-target-thread"></select>
              </div>
              <div style="display: flex; justify-content: flex-end;">
                <button onclick="saveCategoryTarget('rss')" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Save Target</button>
              </div>

              <div style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 0.25rem;">
                <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-plus-circle" style="color: var(--primary);"></i> Add RSS Feed</div>
                <div class="form-grid" style="margin-top: 0.75rem;">
                  <div class="form-group">
                    <label class="form-label">Feed Name</label>
                    <input type="text" id="add-rss-name" placeholder="E.g., TechCrunch News">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Feed URL</label>
                    <input type="text" id="add-rss-url" placeholder="https://example.com/rss.xml" style="font-family: monospace;">
                  </div>
                    <div class="form-group">
                      <label class="form-label">Topic</label>
                      <input type="text" id="add-rss-topic" list="feed-topic-options" placeholder="E.g., News, Technology, Entertainment, Other">
                    </div>
                </div>
                <datalist id="feed-topic-options">
                  <option value="News">
                  <option value="Technology">
                  <option value="Entertainment">
                  <option value="Gaming">
                  <option value="Programming">
                  <option value="Science &amp; Space">
                  <option value="Artificial Intelligence">
                  <option value="Cybersecurity">
                  <option value="Cryptocurrency">
                  <option value="Business &amp; Finance">
                  <option value="Sports">
                  <option value="Reddit">
                  <option value="Free Games">
                  <option value="Stream Alerts">
                  <option value="Other">
                </datalist>
                <div class="form-group" style="margin-top: 0.5rem;">
                  <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="add-rss-scrape" onchange="toggleScrapeFields('rss')">
                    <span>Scrape webpage (HTML selector mode)</span>
                  </label>
                </div>
                <div id="rss-scrape-fields" style="display: none;">
                  <div class="form-grid" style="margin-top: 0.5rem;">
                    <div class="form-group">
                      <label class="form-label">Item Selector</label>
                      <input type="text" id="add-rss-scrape-item" placeholder="article">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Title Selector</label>
                      <input type="text" id="add-rss-scrape-title" placeholder="h2 a">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Link Selector</label>
                      <input type="text" id="add-rss-scrape-link" placeholder="a">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Description Selector (optional)</label>
                      <input type="text" id="add-rss-scrape-desc" placeholder=".summary">
                    </div>
                  </div>
                </div>
                <button onclick="submitAddRssFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem;"><i class="fa-solid fa-plus"></i> Add RSS Feed</button>
              </div>

              <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-list" style="color: var(--primary);"></i> RSS Feeds</div>
                <div id="rss-feeds-list" class="feed-list" style="margin-top: 0.75rem;">
                  <div class="empty-state">Loading feeds...</div>
                </div>
              </div>
            </div>

            <!-- Reddit Card -->
            <div class="category-card reddit">
              <div class="category-header">
                <div class="category-icon reddit"><i class="fa-brands fa-reddit"></i></div>
                <div>
                  <div class="category-title" style="color: #ff4500;">Reddit</div>
                  <div class="card-desc">Subreddit image and RSS feeds</div>
                </div>
              </div>
              <div class="target-readout" id="reddit-target-readout">Loading target...</div>
              <div class="form-group">
                <label class="form-label">Target Channel</label>
                <select id="reddit-target-channel"></select>
              </div>
              <div class="form-group">
                <label class="form-label">Target Forum Thread Channel (optional)</label>
                <select id="reddit-target-thread"></select>
              </div>
              <div style="display: flex; justify-content: flex-end;">
                <button onclick="saveCategoryTarget('reddit')" class="btn btn-primary btn-sm" style="background: #ff4500; border-color: #ff4500;"><i class="fa-solid fa-floppy-disk"></i> Save Target</button>
              </div>

              <div style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 0.25rem;">
                <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-brands fa-reddit" style="color: #ff4500;"></i> Add Reddit Feed</div>
                <div class="form-grid" style="margin-top: 0.75rem;">
                  <div class="form-group">
                    <label class="form-label">Subreddit</label>
                    <input type="text" id="add-reddit-sub" placeholder="e.g. wallpapers" oninput="handleRedditSubInput(this.value)">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Display Name (optional)</label>
                    <input type="text" id="add-reddit-name" placeholder="Reddit · r/wallpapers">
                  </div>
                </div>
                <div class="form-group" style="margin-top: 0.5rem;">
                  <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="add-reddit-image-mode" checked>
                    <span>Pure image mode (images/GIFs only)</span>
                  </label>
                </div>
                <button onclick="submitAddRedditFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem; background: #ff4500; border-color: #ff4500;"><i class="fa-brands fa-reddit"></i> Add Reddit Feed</button>
              </div>

              <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-brands fa-reddit" style="color: #ff4500;"></i> Reddit Feeds</div>
                <div id="reddit-feeds-list" class="feed-list" style="margin-top: 0.75rem;">
                  <div class="empty-state">Loading feeds...</div>
                </div>
              </div>
            </div>

            <!-- Free Games Card -->
            <div class="category-card freegames">
              <div class="category-header">
                <div class="category-icon freegames"><i class="fa-solid fa-gift"></i></div>
                <div>
                  <div class="category-title" style="color: #10b981;">Free Games</div>
                  <div class="card-desc">Epic, Steam, GOG, and more</div>
                </div>
              </div>
              <div class="target-readout" id="freegames-target-readout">Loading target...</div>
              <div class="form-group">
                <label class="form-label">Target Channel</label>
                <select id="freegames-target-channel"></select>
              </div>
              <div class="form-group">
                <label class="form-label">Target Forum Thread Channel (optional)</label>
                <select id="freegames-target-thread"></select>
              </div>
              <div style="display: flex; justify-content: flex-end;">
                <button onclick="saveCategoryTarget('freegames')" class="btn btn-primary btn-sm" style="background: #10b981; border-color: #10b981;"><i class="fa-solid fa-floppy-disk"></i> Save Target</button>
              </div>

              <div style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 0.25rem;">
                <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-gift" style="color: #10b981;"></i> Add Free Games Feed</div>
                <div class="form-grid" style="margin-top: 0.75rem;">
                  <div class="form-group">
                    <label class="form-label">Platform</label>
                    <select id="add-freegames-platform" onchange="handleFreeGamesPlatformChange(this.value)">
                      <option value="all">All Platforms</option>
                      <option value="epic">Epic Games Store</option>
                      <option value="steam">Steam Giveaways</option>
                      <option value="gog">GOG Promotions</option>
                      <option value="indiegala">IndieGala Freebies</option>
                      <option value="humble">Humble Bundle</option>
                      <option value="itchio">Itch.io Freebies</option>
                      <option value="ubisoft">Ubisoft Giveaways</option>
                      <option value="prime">Prime Gaming</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Display Name (optional)</label>
                    <input type="text" id="add-freegames-name" placeholder="Free Games · All Stores">
                  </div>
                </div>
                <button onclick="submitAddFreeGamesFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem; background: #10b981; border-color: #10b981;"><i class="fa-solid fa-gift"></i> Add Free Games Feed</button>
              </div>

              <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-list-check" style="color: #10b981;"></i> Free Games Feeds</div>
                <div id="freegames-feeds-list" class="feed-list" style="margin-top: 0.75rem;">
                  <div class="empty-state">Loading feeds...</div>
                </div>
              </div>
            </div>

            <!-- Stream Alerts Card -->
            <div class="category-card streamalerts">
              <div class="category-header">
                <div class="category-icon streamalerts"><i class="fa-solid fa-satellite-dish"></i></div>
                <div>
                  <div class="category-title" style="color: #9146ff;">Stream Alerts</div>
                  <div class="card-desc">YouTube uploads & Twitch live alerts</div>
                </div>
              </div>
              <div class="target-readout" id="streamalerts-target-readout">Loading target...</div>
              <div class="form-group">
                <label class="form-label">Target Channel</label>
                <select id="streamalerts-target-channel"></select>
              </div>
              <div class="form-group">
                <label class="form-label">Target Forum Thread Channel (optional)</label>
                <select id="streamalerts-target-thread"></select>
              </div>
              <div style="display: flex; justify-content: flex-end;">
                <button onclick="saveCategoryTarget('streamalerts')" class="btn btn-primary btn-sm" style="background: #9146ff; border-color: #9146ff;"><i class="fa-solid fa-floppy-disk"></i> Save Target</button>
              </div>

              <div style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 0.25rem;">
                <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-video" style="color: #9146ff;"></i> Add Stream Alert Feed</div>
                <div class="form-grid" style="margin-top: 0.75rem;">
                  <div class="form-group">
                    <label class="form-label">Platform</label>
                    <select id="add-streamalerts-platform" onchange="handleStreamAlertsPlatformChange(this.value)">
                      <option value="youtube">YouTube</option>
                      <option value="twitch">Twitch</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Channel Handle</label>
                    <input type="text" id="add-streamalerts-handle" placeholder="e.g. @channel or twitch.tv/name">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Display Name (optional)</label>
                    <input type="text" id="add-streamalerts-name" placeholder="YouTube · @channel">
                  </div>
                </div>
                <button onclick="submitAddStreamAlertFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem; background: #9146ff; border-color: #9146ff;"><i class="fa-solid fa-video"></i> Add Stream Alert</button>
              </div>

              <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-tower-broadcast" style="color: #9146ff;"></i> Stream Alert Feeds</div>
                <div id="streamalerts-feeds-list" class="feed-list" style="margin-top: 0.75rem;">
                  <div class="empty-state">Loading feeds...</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- TAB 3: NEWS FEEDS CATALOG -->
        <section id="tab-news" class="tab-pane">
          <div class="card">
            <div>
              <div class="card-title"><i class="fa-solid fa-newspaper" style="color: var(--amber);"></i> News Feeds Catalog</div>
              <div class="card-desc">One-click subscribe to top news, tech, gaming, science, and developer feeds. Presets are added as RSS feeds in this server using the RSS category target.</div>
            </div>
            <div id="presets-list-container" style="display: flex; flex-direction: column; gap: 1.25rem;">
              <div class="empty-state">Loading news feeds catalog...</div>
            </div>
          </div>
        </section>

        <!-- TAB: GUILD ADMIN -->
        <section id="tab-guildadmin" class="tab-pane">
          <div>
            <div class="section-title"><i class="fa-solid fa-user-shield" style="color: var(--primary);"></i> Guild Admin</div>
            <div class="section-desc">Roles, feature toggles, command prefix, and thread delivery for this server. Mirrors the <code style="color: var(--primary);">/set</code> command.</div>
          </div>

          <div class="card">
            <div>
              <div class="card-title"><i class="fa-solid fa-user-tag" style="color: var(--primary);"></i> Roles</div>
              <div class="card-desc">DJ role gates music commands. Admin role can manage feeds and bot settings.</div>
            </div>
            <div class="form-grid" style="margin-top: 0.75rem;">
              <div class="form-group">
                <label class="form-label">DJ Role</label>
                <select id="admin-dj-role"><option value="">-- No DJ role --</option></select>
              </div>
              <div class="form-group">
                <label class="form-label">Admin Role</label>
                <select id="admin-admin-role"><option value="">-- No Admin role --</option></select>
              </div>
            </div>
          </div>

          <div class="card">
            <div>
              <div class="card-title"><i class="fa-solid fa-toggle-on" style="color: var(--primary);"></i> Features</div>
              <div class="card-desc">Enable or disable features for this server.</div>
            </div>
            <div id="admin-features-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
              <div class="empty-state">Loading features...</div>
            </div>
          </div>

          <div class="card">
            <div>
              <div class="card-title"><i class="fa-solid fa-hashtag" style="color: var(--primary);"></i> Command Prefix</div>
              <div class="card-desc">Optional text prefix for commands. Leave empty for slash-commands only.</div>
            </div>
            <div class="form-group" style="margin-top: 0.75rem; max-width: 240px;">
              <input type="text" id="admin-prefix" maxlength="16" placeholder="e.g. !  ?  .">
            </div>
          </div>

          <div class="card">
            <div>
              <div class="card-title"><i class="fa-solid fa-tower-broadcast" style="color: var(--primary);"></i> Thread Delivery</div>
              <div class="card-desc">Deliver each feed into its own thread inside a forum channel (one thread per feed).</div>
            </div>
            <div class="form-grid" style="margin-top: 0.75rem;">
              <div class="form-group">
                <label class="form-label">Thread Delivery</label>
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                  <input type="checkbox" id="admin-threads-enabled">
                  <span>Enabled</span>
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">Forum Channels</label>
                <select id="admin-forum-channels" multiple size="4" style="width: 100%;">
                  <option value="">-- No forum channels available --</option>
                </select>
                <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Hold Ctrl/Cmd to select multiple.</span>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <span id="admin-save-status" style="font-size: 0.8125rem; color: #10b981; display: none;"></span>
            <button onclick="saveGuildAdmin()" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Settings</button>
          </div>
        </section>

<!-- TAB: MUSIC (Lavalink Queue) -->
        ${
          deps.config.features.lavaEnabled
            ? `<section id="tab-music" class="tab-pane">
          <div>
            <div class="section-title"><i class="fa-solid fa-music" style="color: #10b981;"></i> Music & Queue</div>
            <div class="section-desc">Live playback and queue management for this server via Lavalink.</div>
          </div>

          <div id="music-queue-view" style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div class="empty-state">Loading player state...</div>
          </div>
        </section>`
            : ''
        }

        <!-- TAB 4: SETTINGS (ADMIN ONLY) -->
        ${
          isHost
            ? `<section id="tab-settings" class="tab-pane">
          <div class="card">
            <div>
              <div class="card-title"><i class="fa-solid fa-sliders" style="color: var(--primary);"></i> System Settings</div>
              <div class="card-desc">Public endpoint and OAuth redirect resolution. Configured entirely via environment variables in <code style="color: var(--primary);">.env</code>.</div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Public URL</label>
                <input type="text" value="${publicBaseUrl || 'Not set (falls back to INTERNAL_URL)'}" disabled style="opacity: 0.85; cursor: not-allowed;" title="Configured via the PUBLIC_URL environment variable">
                <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem;">Configured via <code style="color: var(--primary);">PUBLIC_URL</code> in <code style="color: var(--primary);">.env</code>. If unset, the internal URL is used so local-only instances still work.</span>
              </div>
              <div class="form-group">
                <label class="form-label">Internal URL</label>
                <input type="text" value="${internalUrl}" disabled style="opacity: 0.85; cursor: not-allowed;" title="Configured via the INTERNAL_URL environment variable">
                <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem;">Configured via <code style="color: var(--primary);">INTERNAL_URL</code> in <code style="color: var(--primary);">.env</code>. The bot binds here and Discord OAuth callbacks resolve to <code style="color: var(--text-muted);">PUBLIC_URL</code> when set, otherwise this internal address.</span>
              </div>
              <div class="form-group">
                <label class="form-label">Active Dashboard Theme &amp; Color Scheme</label>
                <input type="text" value="${theme.name} (${theme.id}) &bull; ${colorScheme.name} (${colorScheme.id})" disabled style="opacity: 0.85; cursor: not-allowed;" title="Configured via DASHBOARD_THEME and DASHBOARD_COLOR_SCHEME environment variables">
                <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem;">Configured via <code style="color: var(--primary);">DASHBOARD_THEME</code> and <code style="color: var(--primary);">DASHBOARD_COLOR_SCHEME</code> in <code style="color: var(--primary);">.env</code>. Themes: <code style="color: var(--text-muted);">glassmorphism</code>, <code style="color: var(--text-muted);">dark</code>, <code style="color: var(--text-muted);">light</code>, <code style="color: var(--text-muted);">cyberpunk</code>, <code style="color: var(--text-muted);">dracula</code>, <code style="color: var(--text-muted);">nord</code>, <code style="color: var(--text-muted);">emerald</code>. Color Schemes: <code style="color: var(--text-muted);">cyan</code>, <code style="color: var(--text-muted);">purple</code>, <code style="color: var(--text-muted);">blue</code>, <code style="color: var(--text-muted);">emerald</code>, <code style="color: var(--text-muted);">rose</code>, <code style="color: var(--text-muted);">amber</code>, <code style="color: var(--text-muted);">indigo</code>, <code style="color: var(--text-muted);">crimson</code>, <code style="color: var(--text-muted);">teal</code>, <code style="color: var(--text-muted);">sunset</code>.</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title"><i class="fa-solid fa-users" style="color: var(--primary);"></i> Registered Users &amp; Discord App Team</div>
                <div class="card-desc">All Discord Application team members automatically have administrative privileges.</div>
              </div>
              <button onclick="loadUsersList()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
            </div>
            <div id="users-list-container" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div class="empty-state">Loading users...</div>
            </div>
          </div>
        </section>`
            : ''
        }
      </main>
    </div>
  </div>

  <script>
    // Sanitizer
    function esc(s) {
      if (s === null || s === undefined) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function guildIconUrl(guildId, icon) {
      if (!icon) return null;
      return 'https://cdn.discordapp.com/icons/' + esc(guildId) + '/' + esc(icon) + '.png';
    }

    // State caches
    let currentGuildId = null;
    let currentGuild = null;
    let cachedGuilds = [];
    let cachedCategories = null;
    let cachedPresets = [];
    let activeTabName = 'feeds';
    let currentFeedDetailId = null;

    // Path-based routing helpers
    // Regex pattern as string to avoid template string parsing issues
    const DASHBOARD_ROUTE_REGEX = '^/dashboard/([^/]+)(?:/([^/]+))?(?:/([^/]+))?$';
    function getPathRoute() {
      var path = window.location.pathname;
      if (path === '/guilds' || path === '/guilds/') return { view: 'guilds' };
      var match = path.match(new RegExp(DASHBOARD_ROUTE_REGEX));
      if (match) {
        return { view: 'dashboard', guildId: match[1], page: match[2] || 'feeds', feedId: match[3] || null };
      }
      if (path === '/admin' || path === '/admin/') return { view: 'admin' };
      return { view: 'guilds' };
    }

    function navigateTo(path) {
      window.history.pushState({}, '', path);
      applyRoute();
    }

    function applyRoute() {
      const route = getPathRoute();
      if (route.view === 'guilds') {
        currentGuildId = null;
        currentGuild = null;
        document.getElementById('guild-selection-view')?.classList.add('active');
        document.getElementById('dashboard-view')?.classList.remove('active');
        loadGuildSelection();
      } else if (route.view === 'dashboard') {
        currentGuildId = route.guildId;
        document.getElementById('guild-selection-view')?.classList.remove('active');
        document.getElementById('dashboard-view')?.classList.add('active');
        loadGuildDashboard();
        if (route.page === 'feed' && route.feedId) {
          switchTab('feeds');
          openFeedDetail(Number(route.feedId));
        } else if (route.page && ['feeds', 'overview', 'categories', 'news', 'guildadmin', 'music', 'settings'].includes(route.page)) {
          switchTab(route.page);
        }
      } else if (route.view === 'admin') {
        // Admin page handled by separate /admin route
        window.location.href = '/admin';
      }
    }

    // Tab Switching
    function switchTab(tabId) {
      activeTabName = tabId;
      currentFeedDetailId = null;
      var detail = document.getElementById('feed-detail-view');
      var topicView = document.getElementById('feeds-topic-view');
      if (detail) detail.style.display = 'none';
      if (topicView) topicView.style.display = 'block';
      document.querySelectorAll('#dashboard-view .tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

      const target = document.getElementById('tab-' + tabId);
      const btn = document.getElementById('tab-btn-' + tabId);
      if (target) target.classList.add('active');
      if (btn) btn.classList.add('active');

      // Update URL without reload
      const path = currentGuildId ? '/dashboard/' + currentGuildId + '/' + tabId : '/guilds';
      window.history.pushState({}, '', '/dashboard/' + currentGuildId + '/' + tabId);

      if (tabId === 'feeds') loadFeedsTab();
      else if (tabId === 'overview') loadOverviewTab();
      else if (tabId === 'categories') loadCategoriesTab();
      else if (tabId === 'news') loadNewsTab();
      else if (tabId === 'guildadmin') loadGuildAdminTab();
      else if (tabId === 'music') loadMusicTab();
      else if (tabId === 'settings') loadSettingsTab();
    }

    function clearGuild(event) {
      if (event) event.preventDefault();
      navigateTo('/guilds');
    }

    function selectGuild(guildId) {
      navigateTo('/dashboard/' + guildId);
    }

    // Auth & Logout
    async function logout() {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
      window.location.href = '/login';
    }

    function checkAuth(res) {
      if (res.status === 401) {
        if (confirm('You must be logged in with Discord to perform this action. Go to login page?')) {
          window.location.href = '/login';
        }
        return false;
      }
      return true;
    }

    // User Profile
    async function loadUserProfile() {
      try {
        const res = await fetch('/api/auth/me', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.authenticated && data.user) {
          const el = document.getElementById('user-display-name');
          if (el) el.textContent = data.user.displayName || data.user.username || 'Discord User';
        }
      } catch {}
    }

    // Guild selection
    async function loadGuildSelection() {
      const grid = document.getElementById('guild-grid');
      const empty = document.getElementById('guild-empty-state');
      if (!grid || !empty) return;
      try {
        const res = await fetch('/api/guilds', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return;
        const data = await res.json();
        cachedGuilds = data.guilds || [];
        if (!cachedGuilds.length) {
          grid.innerHTML = '';
          empty.classList.remove('hidden');
          return;
        }
        empty.classList.add('hidden');
        grid.innerHTML = cachedGuilds.map(g => {
          const icon = guildIconUrl(g.id, g.icon);
          return '<div class="guild-card">' +
            (icon ? '<img class="guild-icon" src="' + icon + '" alt="' + esc(g.name) + '">' : '<div class="guild-icon"><i class="fa-solid fa-server"></i></div>') +
            '<div class="guild-name">' + esc(g.name) + '</div>' +
            '<button onclick="selectGuild(&quot;' + esc(g.id) + '&quot;)" class="btn btn-primary"><i class="fa-solid fa-gear"></i> Manage Server</button>' +
          '</div>';
        }).join('');
      } catch {
        grid.innerHTML = '<div class="empty-state">Failed to load servers.</div>';
      }
    }

    function setupGuildHeader() {
      const pill = document.getElementById('current-guild-pill');
      const iconEl = document.getElementById('current-guild-icon');
      const nameEl = document.getElementById('current-guild-name');
      if (!pill || !nameEl) return;
      if (currentGuild) {
        nameEl.textContent = currentGuild.name || 'Server';
        const icon = guildIconUrl(currentGuild.guildId || currentGuild.id, currentGuild.icon);
        if (icon && iconEl) {
          iconEl.src = icon;
          iconEl.alt = currentGuild.name || 'Server';
          iconEl.classList.remove('hidden');
        } else if (iconEl) {
          iconEl.src = '';
          iconEl.classList.add('hidden');
        }
        pill.classList.remove('hidden');
      } else {
        pill.classList.add('hidden');
      }
    }

    function getGuildName(guildId) {
      const g = cachedGuilds.find(x => x.id === guildId);
      return g ? g.name : (currentGuild ? currentGuild.name : guildId);
    }

    async function loadGuildDashboard() {
      const selectionView = document.getElementById('guild-selection-view');
      const dashboardView = document.getElementById('dashboard-view');
      if (selectionView) selectionView.classList.remove('active');
      if (dashboardView) dashboardView.classList.add('active');

      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/categories', { signal: AbortSignal.timeout(6000) });
        if (res.status === 403 || res.status === 401) {
          alert('You do not have permission to manage this server.');
          clearGuild();
          return;
        }
        if (!res.ok) {
          alert('Could not load server configuration.');
          clearGuild();
          return;
        }
        cachedCategories = await res.json();
        currentGuild = { guildId: cachedCategories.guildId, name: cachedCategories.name, icon: cachedCategories.icon };
        setupGuildHeader();
        populateCategoryTargets();
        loadOverviewTab();
      } catch {
        alert('Failed to load server configuration.');
        clearGuild();
      }
    }

    function populateCategoryTargetSelect(selectId, channels, currentId, placeholder) {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      let html = '<option value="">' + esc(placeholder) + '</option>';
      if (channels && channels.length) {
        channels.forEach(ch => {
          const selected = ch.id === currentId ? 'selected' : '';
          html += '<option value="' + esc(ch.id) + '" ' + selected + '>#' + esc(ch.name) + '</option>';
        });
      }
      sel.innerHTML = html;
    }

    function populateCategoryTargets() {
      if (!cachedCategories) return;
      const textChannels = cachedCategories.textChannels || [];
      const forumChannels = cachedCategories.forumChannels || [];
      const targets = cachedCategories.categories || [];
      const getTarget = (cat) => targets.find(t => t.category === cat) || { channelId: null, threadChannelId: null };

      ['rss', 'reddit', 'freegames', 'streamalerts'].forEach(cat => {
        const target = getTarget(cat);
        populateCategoryTargetSelect(cat + '-target-channel', textChannels, target.channelId, '-- Select Channel --');
        populateCategoryTargetSelect(cat + '-target-thread', forumChannels, target.threadChannelId, '-- No Forum Thread --');
        updateTargetReadout(cat, target, textChannels, forumChannels);
      });
    }

    function channelNameById(channels, id) {
      if (!id) return null;
      const ch = (channels || []).find(c => c.id === id);
      return ch ? '#' + ch.name : '#' + id.slice(-6);
    }

    function updateTargetReadout(category, target, textChannels, forumChannels) {
      const el = document.getElementById(category + '-target-readout');
      if (!el) return;
      const channel = channelNameById(textChannels, target.channelId) || 'none';
      const thread = channelNameById(forumChannels, target.threadChannelId) || 'none';
      el.innerHTML = 'Channel: <strong>' + esc(channel) + '</strong> &middot; Thread: <strong>' + esc(thread) + '</strong>';
    }

    async function saveCategoryTarget(category) {
      if (!currentGuildId) return;
      const channelSel = document.getElementById(category + '-target-channel');
      const threadSel = document.getElementById(category + '-target-thread');
      const channelId = channelSel ? channelSel.value || null : null;
      const threadChannelId = threadSel ? threadSel.value || null : null;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/categories/' + encodeURIComponent(category), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId, threadChannelId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (cachedCategories && cachedCategories.categories) {
            const idx = cachedCategories.categories.findIndex(t => t.category === category);
            if (idx >= 0) cachedCategories.categories[idx] = data;
            else cachedCategories.categories.push(data);
          }
          populateCategoryTargets();
          alert('Saved ' + category + ' target for this server.');
        } else {
          alert((data && data.error) || 'Failed to save target.');
        }
      } catch {
        alert('Network error saving target.');
      }
    }

    function categoryForFeed(feed) {
      const t = feed.feedType;
      if (t === 'reddit') return 'reddit';
      if (t === 'rss' || t === 'scrape') return 'rss';
      if (t && t.startsWith('free_games')) return 'freegames';
      if (t === 'youtube' || t === 'twitch') return 'streamalerts';
      return null;
    }

    async function loadGuildFeeds() {
      try {
        const res = await fetch('/api/feeds', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return [];
        const feeds = await res.json();
        return Array.isArray(feeds) ? feeds.filter(f => f.guildId === currentGuildId) : [];
      } catch {
        return [];
      }
    }

    function renderFeedPill(f) {
      const isReddit = f.feedType === 'reddit';
      const isFreeGames = f.feedType === 'free_games' || (f.feedType && f.feedType.startsWith('free_games'));
      const isScrape = f.feedType === 'scrape';
      const isStreamAlert = f.feedType === 'youtube' || f.feedType === 'twitch';
      let typeBadge = '<span class="badge badge-gray"><i class="fa-solid fa-rss"></i> RSS</span>';
      if (isReddit) typeBadge = '<span class="badge" style="background: rgba(255,69,0,0.15); color: #ff4500; border: 1px solid rgba(255,69,0,0.3);"><i class="fa-brands fa-reddit"></i> Reddit</span>';
      else if (isFreeGames) typeBadge = '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);"><i class="fa-solid fa-gift"></i> Free Games</span>';
      else if (isScrape) typeBadge = '<span class="badge badge-amber"><i class="fa-solid fa-code"></i> Scraper</span>';
      else if (isStreamAlert) typeBadge = '<span class="badge" style="background: rgba(145,70,255,0.15); color: #9146ff; border: 1px solid rgba(145,70,255,0.3);"><i class="fa-solid fa-video"></i> Stream</span>';
      const statusBadge = f.enabled
        ? '<span class="badge badge-green">Active</span>'
        : '<span class="badge badge-gray">Paused</span>';
      const lastPolled = f.lastCheckedAt ? new Date(f.lastCheckedAt).toLocaleString() : 'Never polled';
      return '<div class="feed-pill" style="cursor: pointer;" onclick="openFeedDetail(' + f.id + ')">' +
        '<div class="feed-details">' +
          '<div class="feed-name-row">' +
            '<span class="feed-name">' + esc(f.name) + '</span>' +
            typeBadge +
            statusBadge +
          '</div>' +
          '<div class="feed-url">' + esc(f.url) + '</div>' +
          '<div class="feed-meta">Checked: ' + lastPolled + '</div>' +
        '</div>' +
        '<div style="display: flex; gap: 0.375rem; flex-shrink: 0;" onclick="event.stopPropagation()">' +
          '<button onclick="toggleFeed(' + f.id + ', ' + (f.enabled ? 'false' : 'true') + ')" class="btn btn-ghost btn-sm" title="' + (f.enabled ? 'Pause' : 'Resume') + '">' +
            '<i class="fa-solid ' + (f.enabled ? 'fa-pause' : 'fa-play') + '"></i>' +
          '</button>' +
          '<button onclick="deleteFeed(' + f.id + ')" class="btn btn-danger btn-sm" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
        '</div>' +
      '</div>';
    }

    async function renderCategoryFeeds(category) {
      const container = document.getElementById(category + '-feeds-list');
      if (!container) return;
      container.innerHTML = '<div class="empty-state">Loading feeds...</div>';
      const feeds = await loadGuildFeeds();
      const categoryFeeds = feeds.filter(f => categoryForFeed(f) === category);
      if (!categoryFeeds.length) {
        container.innerHTML = '<div class="empty-state">No ' + category + ' feeds for this server yet.</div>';
        return;
      }
      container.innerHTML = categoryFeeds.map(renderFeedPill).join('');
    }

    async function loadCategoriesTab() {
      if (!cachedCategories && currentGuildId) {
        await loadGuildDashboard();
        return;
      }
      populateCategoryTargets();
      await Promise.all(['rss', 'reddit', 'freegames', 'streamalerts'].map(renderCategoryFeeds));
    }

    // TAB 1: FEEDS
    const FEED_TOPIC_ORDER = ['News', 'Technology', 'Entertainment', 'Gaming', 'Programming', 'Science & Space', 'Artificial Intelligence', 'Cybersecurity', 'Cryptocurrency', 'Business & Finance', 'Sports', 'Reddit', 'Free Games', 'Stream Alerts'];

    function feedTopicOf(f) {
      if (f.topic && String(f.topic).trim()) {
        const stored = String(f.topic).trim();
        if (stored === 'World News' || stored === 'US News') return 'News';
        return stored;
      }
      const t = f.feedType || 'rss';
      if (t === 'reddit') return 'Reddit';
      if (t.indexOf('free_games') === 0) return 'Free Games';
      if (t === 'youtube' || t === 'twitch') return 'Stream Alerts';
      return 'Other';
    }

    function topicIcon(topic) {
      const map = {
        'News': 'fa-newspaper',
        'Technology': 'fa-microchip',
        'Entertainment': 'fa-film',
        'Gaming': 'fa-gamepad',
        'Programming': 'fa-code',
        'Science & Space': 'fa-flask',
        'Artificial Intelligence': 'fa-robot',
        'Cybersecurity': 'fa-shield-halved',
        'Cryptocurrency': 'fa-coins',
        'Business & Finance': 'fa-chart-line',
        'Sports': 'fa-futbol',
        'Reddit': 'fa-brands fa-reddit',
        'Free Games': 'fa-gift',
        'Stream Alerts': 'fa-tower-broadcast'
      };
      return map[topic] || 'fa-rss';
    }

    function topicColor(topic) {
      const map = {
        'News': '#3b82f6',
        'Technology': '#6366f1',
        'Entertainment': '#ec4899',
        'Gaming': '#8b5cf6',
        'Programming': '#f59e0b',
        'Science & Space': '#06b6d4',
        'Artificial Intelligence': '#0ea5e9',
        'Cybersecurity': '#ef4444',
        'Cryptocurrency': '#fbbf24',
        'Business & Finance': '#10b981',
        'Sports': '#22c55e',
        'Reddit': '#ff4500',
        'Free Games': '#16a34a',
        'Stream Alerts': '#9146ff'
      };
      return map[topic] || 'var(--text-dim)';
    }

    async function loadFeedsTab() {
      if (!currentGuildId) return;
      const container = document.getElementById('feeds-topic-groups');
      if (!container) return;
      container.innerHTML = '<div class="empty-state">Loading feeds...</div>';
      const feeds = await loadGuildFeeds();
      const groups = {};
      feeds.forEach(feed => {
        const topic = feedTopicOf(feed);
        (groups[topic] = groups[topic] || []).push(feed);
      });
      const topics = Object.keys(groups);
      if (!topics.length) {
        container.innerHTML = '<div class="empty-state">No feeds for this server yet. Add feeds from the Categories tab, or enable ready-made feeds from the News tab.</div>';
        return;
      }
      topics.sort((a, b) => {
        if (a === b) return 0;
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        const ia = FEED_TOPIC_ORDER.indexOf(a);
        const ib = FEED_TOPIC_ORDER.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      });
      container.innerHTML = topics.map(t => {
        const list = groups[t];
        return '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title"><i class="fa-solid ' + topicIcon(t) + '" style="color: ' + topicColor(t) + ';"></i> ' + esc(t) + '</div>' +
              '<div class="card-desc">' + (list.length === 1 ? '1 feed' : list.length + ' feeds') + ' in this topic</div>' +
            '</div>' +
          '</div>' +
          '<div class="feed-list" style="margin-top: 0.75rem;">' + list.map(renderFeedPill).join('') + '</div>' +
        '</div>';
      }).join('');
    }

    // TAB 2: OVERVIEW
    async function loadOverviewTab() {
      const activityEl = document.getElementById('activity-list');
      const totalEl = document.getElementById('stat-total-feeds');
      const activeEl = document.getElementById('stat-active-feeds');
      const rssEl = document.getElementById('stat-rss-feeds');
      const redditEl = document.getElementById('stat-reddit-feeds');
      const freegamesEl = document.getElementById('stat-freegames-feeds');
      const streamalertsEl = document.getElementById('stat-streamalerts-feeds');

      try {
        const [feeds, statsRes] = await Promise.all([
          loadGuildFeeds(),
          fetch('/api/stats', { signal: AbortSignal.timeout(5000) })
        ]);
        const total = feeds.length;
        const active = feeds.filter(f => f.enabled).length;
        const rss = feeds.filter(f => categoryForFeed(f) === 'rss').length;
        const reddit = feeds.filter(f => categoryForFeed(f) === 'reddit').length;
        const freegames = feeds.filter(f => categoryForFeed(f) === 'freegames').length;
        const streamalerts = feeds.filter(f => categoryForFeed(f) === 'streamalerts').length;
        if (totalEl) totalEl.textContent = String(total);
        if (activeEl) activeEl.textContent = String(active);
        if (rssEl) rssEl.textContent = String(rss);
        if (redditEl) redditEl.textContent = String(reddit);
        if (freegamesEl) freegamesEl.textContent = String(freegames);
        if (streamalertsEl) streamalertsEl.textContent = String(streamalerts);

        if (activityEl && statsRes.ok) {
          const data = await statsRes.json();
          if (data.activity && data.activity.length) {
            activityEl.innerHTML = data.activity.map(a => {
              const color = a.level === 'error' ? '#ef4444' : a.level === 'warn' ? '#f59e0b' : 'var(--primary)';
              return '<div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">' +
                '<div style="display: flex; align-items: center; gap: 0.5rem;">' +
                  '<i class="fa-solid fa-circle" style="color: ' + color + '; font-size: 0.5rem;"></i>' +
                  '<span style="color: var(--text);">' + esc(a.message) + '</span>' +
                '</div>' +
                '<span style="font-size: 0.6875rem; color: var(--text-dim); font-family: monospace;">' + esc(a.ts) + '</span>' +
              '</div>';
            }).join('');
          } else {
            activityEl.innerHTML = '<div class="empty-state">No recent activity recorded yet.</div>';
          }
        } else if (activityEl) {
          activityEl.innerHTML = '<div class="empty-state">Could not load activity.</div>';
        }
      } catch {
        if (activityEl) activityEl.innerHTML = '<div class="empty-state">Could not load activity.</div>';
      }
    }

    // Feed actions
    async function toggleFeed(id, enabled) {
      try {
        const res = await fetch('/api/feeds/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled })
        });
        if (!checkAuth(res)) return;
        refreshCurrentTab();
      } catch {}
    }

    async function deleteFeed(id) {
      if (!confirm('Are you sure you want to remove this feed?')) return;
      try {
        const res = await fetch('/api/feeds/' + id, { method: 'DELETE' });
        if (!checkAuth(res)) return;
        closeFeedDetail();
        refreshCurrentTab();
      } catch {}
    }

    function feedTypeBadge(f) {
      if (f.feedType === 'reddit') return '<span class="badge" style="background: rgba(255,69,0,0.15); color: #ff4500; border: 1px solid rgba(255,69,0,0.3);"><i class="fa-brands fa-reddit"></i> Reddit</span>';
      if (f.feedType === 'free_games' || (f.feedType && f.feedType.startsWith('free_games'))) return '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);"><i class="fa-solid fa-gift"></i> Free Games</span>';
      if (f.feedType === 'scrape') return '<span class="badge badge-amber"><i class="fa-solid fa-code"></i> Scraper</span>';
      if (f.feedType === 'youtube' || f.feedType === 'twitch') return '<span class="badge" style="background: rgba(145,70,255,0.15); color: #9146ff; border: 1px solid rgba(145,70,255,0.3);"><i class="fa-solid fa-video"></i> Stream</span>';
      return '<span class="badge badge-gray"><i class="fa-solid fa-rss"></i> RSS</span>';
    }

    function channelOptionsForSelect(selectedId, includeNone) {
      // Use cachedCategories' channel lists when loaded; otherwise empty.
      var text = (cachedCategories && cachedCategories.textChannels) || [];
      var forum = (cachedCategories && cachedCategories.forumChannels) || [];
      var opts = '';
      if (includeNone) opts += '<option value="">(none)</option>';
      text.forEach(function(ch) {
        opts += '<option value="' + esc(ch.id) + '"' + (ch.id === selectedId ? ' selected' : '') + '>#' + esc(ch.name) + '</option>';
      });
      forum.forEach(function(ch) {
        opts += '<option value="' + esc(ch.id) + '"' + (ch.id === selectedId ? ' selected' : '') + '>&#128172; ' + esc(ch.name) + ' (Forum)</option>';
      });
      return opts;
    }

    function topicDatalistOptions(selectedTopic) {
      var opts = '';
      FEED_TOPIC_ORDER.forEach(function(t) {
        opts += '<option value="' + esc(t) + '"' + (t === selectedTopic ? ' selected' : '') + '>' + esc(t) + '</option>';
      });
      return opts;
    }

    function renderFeedDetail(f) {
      var topic = feedTopicOf(f);
      var enabled = !!f.enabled;
      var typeDisplay = feedTypeBadge(f);
      var urlDisplay = f.feedType === 'free_games' || (f.feedType && f.feedType.startsWith('free_games'))
        ? 'Platform feed (auto-managed)'
        : esc(f.url);
      return '<div class="card">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title"><i class="fa-solid ' + topicIcon(topic) + '" style="color: ' + topicColor(topic) + ';"></i> ' + esc(f.name) + '</div>' +
            '<div class="card-desc">' + typeDisplay + ' &middot; ' + (enabled ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-gray">Paused</span>') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="form-grid" style="margin-top: 1rem;">' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-name">Feed name</label>' +
            '<input type="text" id="edit-feed-name" class="form-input" value="' + esc(f.name) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-topic">Topic</label>' +
            '<input type="text" id="edit-feed-topic" list="edit-feed-topic-options" class="form-input" value="' + esc(topic === 'Other' ? '' : topic) + '">' +
            '<datalist id="edit-feed-topic-options">' + topicDatalistOptions(topic) + '</datalist>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-url">Feed URL</label>' +
            '<input type="text" id="edit-feed-url" class="form-input" value="' + urlDisplay + '"' + (f.feedType === 'free_games' || (f.feedType && f.feedType.startsWith('free_games')) ? ' disabled' : '') + '>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-channel">Deliver to channel</label>' +
            '<select id="edit-feed-channel" class="form-input">' + channelOptionsForSelect(f.channelId, true) + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-enable">Status</label>' +
            '<label style="display: flex; align-items: center; gap: 0.5rem; padding-top: 0.25rem;">' +
              '<input type="checkbox" id="edit-feed-enable"' + (enabled ? ' checked' : '') + '> ' +
              (enabled ? 'Feed is active' : 'Feed is paused') +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="feed-meta" style="margin-top: 0.75rem;">' +
          'Created: ' + (f.createdAt ? new Date(f.createdAt).toLocaleString() : 'Unknown') +
          (f.lastCheckedAt ? ' &middot; Last checked: ' + new Date(f.lastCheckedAt).toLocaleString() : ' &middot; Never polled') +
          (f.threadChannelId ? ' &middot; Thread: <code>' + esc(f.threadChannelId) + '</code>' : '') +
        '</div>' +
        '<div style="display: flex; gap: 0.5rem; margin-top: 1.25rem;">' +
          '<button onclick="saveFeedDetail(' + f.id + ')" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>' +
          '<button onclick="deleteFeed(' + f.id + ')" class="btn btn-danger"><i class="fa-solid fa-trash"></i> Delete Feed</button>' +
        '</div>' +
        '<div id="feed-detail-status" style="margin-top: 0.75rem; color: #10b981; display: none;">Saved successfully.</div>' +
      '</div>';
    }

    function openFeedDetail(feedId) {
      currentFeedDetailId = feedId;
      var container = document.getElementById('feeds-topic-view');
      var detail = document.getElementById('feed-detail-view');
      if (!container || !detail || !currentGuildId) return;
      loadGuildFeeds().then(function(list) {
        var feed = list.find(function(x) { return x.id === feedId; });
        if (!feed) { closeFeedDetail(); return; }
        var content = document.getElementById('feed-detail-content');
        if (content) content.innerHTML = renderFeedDetail(feed);
        container.style.display = 'none';
        detail.style.display = 'block';
        window.history.pushState({}, '', '/dashboard/' + currentGuildId + '/feed/' + feedId);
        populateFeedChannelSelect(feedId, feed.channelId);
      });
    }

    async function populateFeedChannelSelect(feedId, currentChannelId) {
      var selectEl = document.getElementById('edit-feed-channel');
      if (!selectEl) return;
      var channels = null;
      if (cachedCategories && (cachedCategories.textChannels || cachedCategories.forumChannels)) {
        channels = cachedCategories;
      } else {
        try {
          var res = await fetch('/api/guilds/' + currentGuildId + '/categories', { signal: AbortSignal.timeout(6000) });
          if (!res.ok) return;
          var data = await res.json();
          if (data && (data.textChannels || data.forumChannels)) channels = data;
        } catch (e) {}
      }
      if (!channels || !channels.textChannels) return;
      cachedCategories = channels;
      selectEl.innerHTML = channelOptionsForSelect(currentChannelId || '', true);
    }

    function closeFeedDetail() {
      currentFeedDetailId = null;
      var container = document.getElementById('feeds-topic-view');
      var detail = document.getElementById('feed-detail-view');
      if (container) container.style.display = 'block';
      if (detail) detail.style.display = 'none';
      if (currentGuildId) {
        window.history.pushState({}, '', '/dashboard/' + currentGuildId + '/feeds');
        loadFeedsTab();
      }
    }

    async function saveFeedDetail(feedId) {
      var nameEl = document.getElementById('edit-feed-name');
      var topicEl = document.getElementById('edit-feed-topic');
      var urlEl = document.getElementById('edit-feed-url');
      var channelEl = document.getElementById('edit-feed-channel');
      var enableEl = document.getElementById('edit-feed-enable');
      if (!nameEl || !channelEl || !enableEl) return;
      var payload = {
        name: nameEl.value.trim() || null,
        topic: topicEl ? topicEl.value.trim() || null : null,
        channelId: channelEl.value || null,
        enabled: enableEl.checked
      };
      if (urlEl && !urlEl.disabled && urlEl.value.trim()) {
        payload.url = urlEl.value.trim();
      }
      try {
        var res = await fetch('/api/feeds/' + feedId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000)
        });
        if (!checkAuth(res)) return;
        if (!res.ok) {
          var err = await res.json().catch(function() { return {}; });
          alert(err.error || 'Failed to save feed.');
          return;
        }
        var statusEl = document.getElementById('feed-detail-status');
        if (statusEl) { statusEl.style.display = 'block'; setTimeout(function() { statusEl.style.display = 'none'; }, 4000); }
        refreshCurrentTab();
      } catch (e) {
        alert('Failed to save feed.');
      }
    }

    function refreshCurrentTab() {
      if (currentFeedDetailId) { openFeedDetail(currentFeedDetailId); return; }
      if (activeTabName === 'feeds') loadFeedsTab();
      else if (activeTabName === 'overview') loadOverviewTab();
      else if (activeTabName === 'categories') loadCategoriesTab();
      else if (activeTabName === 'news') loadNewsTab();
      else if (activeTabName === 'guildadmin') loadGuildAdminTab();
      else if (activeTabName === 'music') loadMusicTab();
    }

    // RSS
    function toggleScrapeFields(category) {
      const box = document.getElementById(category + '-scrape-fields');
      const chk = document.getElementById('add-' + category + '-scrape');
      if (box) box.style.display = chk && chk.checked ? 'block' : 'none';
    }

    async function submitAddRssFeed() {
      if (!currentGuildId) return;
      const nameInput = document.getElementById('add-rss-name');
      const urlInput = document.getElementById('add-rss-url');
      const topicInput = document.getElementById('add-rss-topic');
      const scrapeChk = document.getElementById('add-rss-scrape');
      const name = nameInput ? nameInput.value.trim() : '';
      const url = urlInput ? urlInput.value.trim() : '';
      const topic = topicInput ? topicInput.value.trim() || null : null;
      if (!name || !url) return alert('Please enter both feed name and URL.');

      let feedType = 'rss';
      let scrape = null;
      if (scrapeChk && scrapeChk.checked) {
        const item = document.getElementById('add-rss-scrape-item');
        const title = document.getElementById('add-rss-scrape-title');
        const link = document.getElementById('add-rss-scrape-link');
        const desc = document.getElementById('add-rss-scrape-desc');
        if (!item.value.trim() || !title.value.trim() || !link.value.trim()) {
          return alert('Please fill in item, title, and link selectors for scrape mode.');
        }
        feedType = 'scrape';
        scrape = {
          item: item.value.trim(),
          title: title.value.trim(),
          link: link.value.trim(),
          description: desc.value.trim() || undefined
        };
      }

      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, topic, feedType, scrape, guildId: currentGuildId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (nameInput) nameInput.value = '';
          if (urlInput) urlInput.value = '';
          if (topicInput) topicInput.value = '';
          if (scrapeChk) scrapeChk.checked = false;
          toggleScrapeFields('rss');
          renderCategoryFeeds('rss');
          if (activeTabName === 'feeds') loadFeedsTab();
        } else {
          alert(data.error || 'Failed to add feed');
        }
      } catch (err) {
        alert('Network error adding feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // Reddit
    function cleanSubredditName(raw) {
      let s = (raw || '').trim();
      if (s.includes('reddit.com/r/')) s = s.split('reddit.com/r/')[1];
      else if (s.includes('reddit.com/user/')) s = s.split('reddit.com/user/')[1];
      s = s.split('?')[0].split('#')[0].split('/')[0].split('.')[0];
      if (s.startsWith('r/')) s = s.slice(2);
      if (s.startsWith('u/')) s = s.slice(2);
      return s.trim();
    }

    function handleRedditSubInput(val) {
      const nameInput = document.getElementById('add-reddit-name');
      if (!nameInput) return;
      const clean = cleanSubredditName(val);
      if (clean && (!nameInput.value || nameInput.value.startsWith('Reddit · r/'))) {
        nameInput.placeholder = 'Reddit · r/' + clean;
      }
    }

    async function submitAddRedditFeed() {
      if (!currentGuildId) return;
      const subInput = document.getElementById('add-reddit-sub');
      const nameInput = document.getElementById('add-reddit-name');
      const imageModeChk = document.getElementById('add-reddit-image-mode');
      const rawSub = subInput ? subInput.value.trim() : '';
      if (!rawSub) return alert('Please enter a subreddit name.');
      const cleanSub = cleanSubredditName(rawSub);
      const url = 'https://www.reddit.com/r/' + cleanSub + '/.rss';
      const feedType = imageModeChk && imageModeChk.checked ? 'reddit' : 'rss';
      const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Reddit · r/' + cleanSub;

      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, feedType, guildId: currentGuildId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (subInput) subInput.value = '';
          if (nameInput) nameInput.value = '';
          renderCategoryFeeds('reddit');
        } else {
          alert(data.error || 'Failed to add Reddit feed');
        }
      } catch (err) {
        alert('Network error adding Reddit feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // Free Games
    const FREEGAMES_PLATFORMS = [
      { key: 'all', name: 'Free Games · All Stores' },
      { key: 'epic', name: 'Free Games · Epic Games Store' },
      { key: 'steam', name: 'Free Games · Steam Giveaways' },
      { key: 'gog', name: 'Free Games · GOG Promotions' },
      { key: 'indiegala', name: 'Free Games · IndieGala Freebies' },
      { key: 'humble', name: 'Free Games · Humble Bundle' },
      { key: 'itchio', name: 'Free Games · Itch.io Freebies' },
      { key: 'ubisoft', name: 'Free Games · Ubisoft Giveaways' },
      { key: 'prime', name: 'Free Games · Prime Gaming' }
    ];

    function handleFreeGamesPlatformChange(val) {
      const nameInput = document.getElementById('add-freegames-name');
      if (!nameInput) return;
      const found = FREEGAMES_PLATFORMS.find(p => p.key === val);
      if (found && (!nameInput.value || nameInput.value.startsWith('Free Games ·'))) {
        nameInput.placeholder = found.name;
      }
    }

    async function submitAddFreeGamesFeed() {
      if (!currentGuildId) return;
      const platSelect = document.getElementById('add-freegames-platform');
      const nameInput = document.getElementById('add-freegames-name');
      const platformKey = platSelect ? platSelect.value : 'all';
      let name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        const found = FREEGAMES_PLATFORMS.find(p => p.key === platformKey);
        name = found ? found.name : 'Free Games · All Stores';
      }
      const feedType = platformKey === 'all' ? 'free_games' : ('free_games_' + platformKey);
      const url = 'freegames://' + platformKey;

      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, feedType, guildId: currentGuildId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (nameInput) nameInput.value = '';
          renderCategoryFeeds('freegames');
        } else {
          alert(data.error || 'Failed to add Free Games feed');
        }
      } catch (err) {
        alert('Network error adding Free Games feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // Stream Alerts
    function cleanStreamHandle(raw) {
      let s = (raw || '').trim();
      s = s.replace(/^https?:[/][/]/gi, '');
      s = s.replace(/^(www[.])?(youtube[.]com|youtu[.]be|twitch[.]tv)[/]/gi, '');
      s = s.replace(/^@/, '');
      s = s.split('?')[0].split('#')[0].split('/')[0].trim();
      return s;
    }

    function handleStreamAlertsPlatformChange(val) {
      const nameInput = document.getElementById('add-streamalerts-name');
      if (!nameInput) return;
      nameInput.placeholder = val === 'youtube' ? 'YouTube · @channel' : 'Twitch · channel';
    }

    async function submitAddStreamAlertFeed() {
      if (!currentGuildId) return;
      const platformSel = document.getElementById('add-streamalerts-platform');
      const handleInput = document.getElementById('add-streamalerts-handle');
      const nameInput = document.getElementById('add-streamalerts-name');
      const platform = platformSel ? platformSel.value : 'youtube';
      const handle = cleanStreamHandle(handleInput ? handleInput.value : '');
      if (!handle) return alert('Please enter a channel handle or username.');
      const url = platform === 'youtube'
        ? 'https://www.youtube.com/@' + handle
        : 'https://www.twitch.tv/' + handle;
      let name = nameInput ? nameInput.value.trim() : '';
      if (!name) name = platform === 'youtube' ? 'YouTube · @' + handle : 'Twitch · ' + handle;

      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, feedType: platform, guildId: currentGuildId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (handleInput) handleInput.value = '';
          if (nameInput) nameInput.value = '';
          renderCategoryFeeds('streamalerts');
        } else {
          alert(data.error || 'Failed to add stream alert feed');
        }
      } catch (err) {
        alert('Network error adding stream alert feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // TAB 4: NEWS FEEDS
    async function loadNewsTab() {
      const container = document.getElementById('presets-list-container');
      if (!container) return;
      container.innerHTML = '<div class="empty-state">Loading news feeds catalog...</div>';
      try {
        const res = await fetch('/api/presets', { signal: AbortSignal.timeout(6000) });
        if (!res.ok) {
          container.innerHTML = '<div class="empty-state">Could not load news feeds catalog.</div>';
          return;
        }
        const presets = await res.json();
        if (!Array.isArray(presets) || !presets.length) {
          container.innerHTML = '<div class="empty-state">No presets available.</div>';
          return;
        }
        cachedPresets = presets;

        const groups = {};
        presets.forEach(p => {
          const cat = p.category || 'General';
          (groups[cat] = groups[cat] || []).push(p);
        });

        let fullHtml = '';
        for (const cat of Object.keys(groups)) {
          const items = groups[cat] || [];
          let itemsHtml = '';
          for (const p of items) {
            const addedBadge = p.alreadyAdded
              ? '<span class="badge badge-green">Added</span>'
              : '<span class="badge badge-amber">Preset</span>';
            const btnHtml = p.alreadyAdded
              ? '<button disabled class="btn btn-ghost btn-sm" style="opacity: 0.6; cursor: default;"><i class="fa-solid fa-check"></i> Added</button>'
              : '<button data-preset-id="' + esc(p.id) + '" onclick="enablePreset(this.dataset.presetId)" class="btn btn-primary btn-sm"><i class="fa-solid fa-bolt"></i> Enable</button>';

            itemsHtml += '<div class="feed-pill">' +
              '<div class="feed-details">' +
                '<div class="feed-name-row">' +
                  '<span class="feed-name">' + esc(p.name) + '</span>' +
                  addedBadge +
                '</div>' +
                '<div style="font-size: 0.8125rem; color: var(--text-muted);">' + esc(p.description) + '</div>' +
                '<div class="feed-url">' + esc(p.url) + '</div>' +
              '</div>' +
              '<div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">' +
                btnHtml +
              '</div>' +
            '</div>';
          }

          fullHtml += '<div style="display: flex; flex-direction: column; gap: 0.5rem;">' +
            '<div style="font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; color: var(--amber); display: flex; align-items: center; gap: 0.375rem;"><i class="fa-solid fa-folder-open"></i> ' + esc(cat) + '</div>' +
            '<div class="feed-list">' + itemsHtml + '</div>' +
          '</div>';
        }

        container.innerHTML = fullHtml;
      } catch {
        container.innerHTML = '<div class="empty-state">Failed to load news feeds catalog.</div>';
      }
    }

    async function enablePreset(presetId) {
      if (!currentGuildId) return;
      const preset = cachedPresets.find(p => p.id === presetId);
      if (!preset) return;
      if (!cachedCategories) {
        alert('Server configuration is still loading. Please wait a moment and try again.');
        return;
      }
      const rssTarget = (cachedCategories.categories || []).find(t => t.category === 'rss');
      if (!rssTarget || !rssTarget.channelId) {
        alert('Please configure an RSS target channel for this server in the Categories tab before subscribing to news presets.');
        return;
      }
      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: preset.name, url: preset.url, topic: preset.category, feedType: 'rss', guildId: currentGuildId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          alert('Enabled "' + preset.name + '".');
          loadNewsTab();
        } else {
          alert(data.error || 'Failed to enable feed');
        }
      } catch (err) {
        alert('Network error enabling feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // TAB 5: SETTINGS (ADMIN)
    async function loadUsersList() {
      const container = document.getElementById('users-list-container');
      if (!container) return;
      try {
        const res = await fetch('/api/settings/users', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const users = await res.json();
        if (!Array.isArray(users) || !users.length) {
          container.innerHTML = '<div class="empty-state">No registered users found.</div>';
          return;
        }
        container.innerHTML = users.map(u => {
          const roleBadge = (u.role === 'owner' || u.role === 'admin')
            ? '<span class="badge badge-amber"><i class="fa-solid fa-crown"></i> App Team</span>'
            : '<span class="badge badge-gray"><i class="fa-solid fa-user"></i> Member</span>';

          return '<div class="feed-pill">' +
            '<div class="feed-details">' +
              '<div class="feed-name-row">' +
                '<span class="feed-name">' + esc(u.displayName || 'Discord User') + '</span>' +
                roleBadge +
              '</div>' +
              '<div class="feed-meta">User ID: #' + u.id + ' &middot; Feeds: ' + u.feedCount + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      } catch {
        if (container) container.innerHTML = '<div class="empty-state">Failed to load users list.</div>';
      }
    }
    const GUILD_ADMIN_FEATURES = [
      { key: 'feeds', label: 'Feeds', desc: 'RSS, Reddit, and Free Games polling' },
      { key: 'streamalerts', label: 'Stream Alerts', desc: 'YouTube & Twitch live/upload alerts' },
      { key: 'threads', label: 'Threads', desc: 'Per-feed forum thread delivery' },
      { key: 'music', label: 'Music', desc: 'Lavalink voice playback' },
      { key: 'gifs', label: 'GIF Commands', desc: '/gif and action-style GIF commands' },
    ];

    function populateRoleSelect(selectId, roles, currentRoleId, placeholder) {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      let html = '<option value="">' + esc(placeholder) + '</option>';
      (roles || []).forEach(r => {
        const selected = r.id === currentRoleId ? 'selected' : '';
        const colorDot = r.color && r.color !== 0 ? ' <span style="color:#' + Number(r.color).toString(16).padStart(6, '0') + ';">&#9679;</span>' : '';
        html += '<option value="' + esc(r.id) + '" ' + selected + '>' + esc(r.name) + colorDot + '</option>';
      });
      sel.innerHTML = html;
    }

    async function loadGuildAdminTab() {
      if (!currentGuildId) return;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return;
        if (!res.ok) {
          const featuresEl = document.getElementById('admin-features-list');
          if (featuresEl) featuresEl.innerHTML = '<div class="empty-state">Could not load guild settings.</div>';
          return;
        }
        const data = await res.json();

        populateRoleSelect('admin-dj-role', data.guildRoles || [], data.roles && data.roles.djRoleId, '-- No DJ role --');
        populateRoleSelect('admin-admin-role', data.guildRoles || [], data.roles && data.roles.adminRoleId, '-- No Admin role --');

        const featuresEl = document.getElementById('admin-features-list');
        if (featuresEl) {
          featuresEl.innerHTML = GUILD_ADMIN_FEATURES.map(f => {
            const enabled = !!(data.features && data.features[f.key]);
            return '<div class="feed-pill" style="cursor: default;">' +
              '<label style="flex: 1; cursor: pointer; display: flex; align-items: center; gap: 0.75rem;">' +
                '<input type="checkbox" data-feature="' + f.key + '"' + (enabled ? ' checked' : '') + '>' +
                '<div class="feed-details">' +
                  '<div class="feed-name" style="font-weight: 600;">' + esc(f.label) + '</div>' +
                  '<div class="feed-meta">' + esc(f.desc) + '</div>' +
                '</div>' +
              '</label>' +
            '</div>';
          }).join('');
        }

        const prefixEl = document.getElementById('admin-prefix');
        if (prefixEl) prefixEl.value = data.prefix || '';

        const threadsEl = document.getElementById('admin-threads-enabled');
        if (threadsEl) threadsEl.checked = !!data.threadsEnabled;

        const forumSel = document.getElementById('admin-forum-channels');
        if (forumSel) {
          const forumChannels = data.forumChannels || [];
          const selectedIds = data.forumChannelIds || [];
          if (!forumChannels.length) {
            forumSel.innerHTML = '<option value="">-- No forum channels available --</option>';
            forumSel.disabled = true;
          } else {
            forumSel.disabled = false;
            forumSel.innerHTML = forumChannels.map(ch => {
              const selected = selectedIds.indexOf(ch.id) !== -1 ? 'selected' : '';
              return '<option value="' + esc(ch.id) + '" ' + selected + '>#' + esc(ch.name) + '</option>';
            }).join('');
          }
        }
      } catch {
        const featuresEl = document.getElementById('admin-features-list');
        if (featuresEl) featuresEl.innerHTML = '<div class="empty-state">Failed to load guild settings.</div>';
      }
    }

    async function saveGuildAdmin() {
      if (!currentGuildId) return;
      const statusEl = document.getElementById('admin-save-status');
      if (statusEl) statusEl.style.display = 'none';

      const djRoleId = document.getElementById('admin-dj-role') ? document.getElementById('admin-dj-role').value || null : null;
      const adminRoleId = document.getElementById('admin-admin-role') ? document.getElementById('admin-admin-role').value || null : null;

      const features = {};
      document.querySelectorAll('#admin-features-list input[data-feature]').forEach(chk => {
        features[chk.getAttribute('data-feature')] = chk.checked;
      });

      const prefix = document.getElementById('admin-prefix') ? document.getElementById('admin-prefix').value.trim() : '';
      const threadsEnabled = document.getElementById('admin-threads-enabled') ? document.getElementById('admin-threads-enabled').checked : false;

      const forumSel = document.getElementById('admin-forum-channels');
      const forumChannelIds = forumSel ? Array.from(forumSel.selectedOptions).map(o => o.value).filter(v => v.length > 0) : [];

      const body = { djRoleId, adminRoleId, prefix, features, threadsEnabled, forumChannelIds };
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000)
        });
        if (!checkAuth(res)) return;
        if (res.ok) {
          if (statusEl) {
            statusEl.style.display = 'inline';
            statusEl.textContent = 'Settings saved successfully.';
            setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
          }
          refreshCurrentTab();
        } else {
          let msg = 'Failed to save settings.';
          try {
            const j = await res.json();
            if (j && j.error) msg = j.error;
          } catch {}
          alert(msg);
        }
      } catch {
        alert('Failed to save settings.');
      }
    }

    // Music & Queue
    function fmtDur(ms) {
      if (ms === null || ms === undefined || ms < 0 || !isFinite(ms)) return '--:--';
      const total = Math.floor(ms / 1000);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      return h > 0
        ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
        : m + ':' + String(s).padStart(2, '0');
    }

    async function musicAction(action, extra) {
      if (!currentGuildId) return false;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/music/' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(extra || {}),
          signal: AbortSignal.timeout(10000)
        });
        if (!checkAuth(res)) return false;
        if (!res.ok) {
          let msg = 'Failed to run action.';
          try {
            const j = await res.json();
            if (j && j.error) msg = j.error;
          } catch {}
          alert(msg);
        } else {
          loadMusicTab();
        }
        return res.ok;
      } catch {
        alert('Failed to reach Lavalink.');
        return false;
      }
    }

    function musicControlBtn(action, icon, title, color) {
      return '<button onclick="musicAction(\\'' + action + '\\')" class="btn btn-ghost btn-sm" title="' + title + '" style="color: ' + (color || 'var(--text-muted)') + ';"><i class="fa-solid ' + icon + '"></i></button>';
    }

    async function loadMusicTab() {
      if (!currentGuildId) return;
      const container = document.getElementById('music-queue-view');
      if (!container) return;
      container.innerHTML = '<div class="empty-state">Loading player state...</div>';

      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/music', {
          signal: AbortSignal.timeout(6000)
        });
        if (!checkAuth(res)) return;
        const data = await res.json();

        container.innerHTML = renderMusicQueue(data);
      } catch {
        container.innerHTML = '<div class="empty-state">Could not reach Lavalink. Ensure LAVA_ENABLED and Lavalink credentials are configured.</div>';
      }
    }

    function renderMusicQueue(data) {
      if (data && data.active === false) {
        return '<div class="empty-state"><i class="fa-solid fa-circle-info"></i> Nothing is playing in this server yet. Use <code style="color: #10b981;">/play</code> in a voice channel to start music.</div>';
      }
      if (!data || !data.active || !data.current) {
        return '<div class="empty-state"><i class="fa-solid fa-music"></i> No active player session for this server.</div>';
      }

      const cur = data.current;
      const track = cur.track || {};
      const total = track.length || 0;
      const pos = Math.min(data.position || 0, total || 0);
      const pct = total > 0 ? Math.min(Math.round((pos / total) * 100), 100) : 0;

      const transport = [
        musicControlBtn('pause', 'fa-pause', 'Pause', '#f59e0b'),
        musicControlBtn('resume', 'fa-play', 'Resume', '#10b981'),
        musicControlBtn('skip', 'fa-forward-step', 'Skip', '#06b6d4'),
        musicControlBtn('stop', 'fa-stop', 'Stop & clear queue', '#ef4444')
      ].join('');

      const nowPlaying =
        '<div class="card">' +
        '<div class="card-header">' +
          '<div><div class="card-title"><i class="fa-solid fa-compact-disc" style="color: #10b981;"></i> Now Playing</div>' +
          '<div class="card-desc">' + (data.paused ? '<span style="color: #f59e0b;">Paused</span>' : '<span style="color: #10b981;">Playing</span>') + ' &middot; channel ' + (data.channelId ? '<code style="color: var(--text-muted);">' + esc(data.channelId) + '</code>' : 'N/A') + '</div></div>' +
          '<div style="display: flex; align-items: center; gap: 0.25rem;">' + transport + '</div>' +
        '</div>' +
        '<div style="display: flex; gap: 1rem; margin-top: 1rem; align-items: flex-start;">' +
          (track.artworkUrl ? '<img src="' + esc(track.artworkUrl) + '" alt="" style="width: 96px; height: 96px; border-radius: 10px; object-fit: cover; flex-shrink: 0;">' : '<div style="width: 96px; height: 96px; border-radius: 10px; background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2)); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i class="fa-solid fa-music" style="font-size: 2rem; color: var(--text-dim);"></i></div>') +
          '<div style="flex: 1; min-width: 0;">' +
            '<div style="font-weight: 700; font-size: 1.0625rem; word-break: break-word;">' + esc(track.title || 'Unknown track') + '</div>' +
            '<div style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;">' + esc(track.author || 'Unknown artist') + '</div>' +
            '<div style="margin-top: 0.75rem;">' +
              '<div style="display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--text-dim); margin-bottom: 0.25rem;"><span>' + fmtDur(pos) + '</span><span>' + fmtDur(total) + '</span></div>' +
              '<div style="height: 6px; border-radius: 3px; background: var(--border); overflow: hidden;"><div style="height: 100%; width: ' + pct + '%; background: linear-gradient(90deg, #10b981, #06b6d4);"></div></div>' +
            '</div>' +
            '<div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; align-items: center;">' +
              '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);"><i class="fa-solid fa-user"></i> ' + esc(cur.requester || 'unknown') + '</span>' +
              '<span class="badge" style="background: rgba(6,182,212,0.15); color: #06b6d4; border: 1px solid rgba(6,182,212,0.3);">Volume ' + (data.volume || 100) + '%</span>' +
              '<span class="badge" style="background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3);"><i class="fa-solid fa-repeat"></i> ' + esc(data.loop || 'none') + '</span>' +
              '<span class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3);"><i class="fa-solid fa-shuffle"></i> ' + (data.shuffled ? 'Shuffled' : 'In order') + '</span>' +
              (track.uri ? '<a href="' + esc(track.uri) + '" target="_blank" rel="noopener noreferrer" style="font-size: 0.8125rem; color: var(--primary);"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open source</a>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem;">' +
          '<div class="form-group" style="flex: 1; min-width: 120px;">' +
            '<label class="form-label">Volume</label>' +
            '<input type="range" min="0" max="200" value="' + (data.volume || 100) + '" oninput="this.nextElementSibling.textContent = this.value + \\'%\\'" onchange="musicAction(\\'volume\\', { level: Number(this.value) })">' +
            '<span style="font-size: 0.6875rem; color: var(--text-dim);">' + (data.volume || 100) + '%</span>' +
          '</div>' +
          '<div class="form-group" style="flex: 1; min-width: 140px;">' +
            '<label class="form-label">Loop Mode</label>' +
            '<select onchange="musicAction(\\'loop\\', { mode: this.value })">' +
              '<option value="none"' + (data.loop === 'none' ? ' selected' : '') + '>Off</option>' +
              '<option value="track"' + (data.loop === 'track' ? ' selected' : '') + '>Track</option>' +
              '<option value="queue"' + (data.loop === 'queue' ? ' selected' : '') + '>Queue</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group" style="flex: 1; min-width: 140px;">' +
            '<label class="form-label">Shuffle</label>' +
            '<div style="display: flex; gap: 0.5rem;">' +
              '<button onclick="musicAction(\\'shuffle\\')" class="btn btn-ghost btn-sm" style="color: #f59e0b;"><i class="fa-solid fa-shuffle"></i> On</button>' +
              '<button onclick="musicAction(\\'unshuffle\\')" class="btn btn-ghost btn-sm" style="color: var(--text-muted);"><i class="fa-solid fa-shuffle"></i> Off</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-group" style="flex: 1; min-width: 120px;">' +
            '<label class="form-label">Seek (minutes)</label>' +
            '<div style="display: flex; gap: 0.5rem;">' +
              '<input type="number" id="music-seek-min" min="0" step="0.1" value="0" style="max-width: 110px;">' +
              '<button onclick="musicAction(\\'seek\\', { position: Math.round(Number(document.getElementById(\\'music-seek-min\\').value) * 60000) })" class="btn btn-ghost btn-sm" style="color: #06b6d4;"><i class="fa-solid fa-forward"></i> Seek</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

      const queueEls = (data.queue || []).map(function (item, i) {
        const t = item.track || {};
        return '<div class="feed-pill">' +
          '<div class="feed-details">' +
            '<div class="feed-name-row"><span class="feed-name">' + (i + 1) + '. ' + esc(t.title || 'Unknown track') + '</span>' +
            '<span class="badge" style="background: rgba(6,182,212,0.15); color: #06b6d4; border: 1px solid rgba(6,182,212,0.3);">' + fmtDur(t.length) + '</span></div>' +
            '<div class="feed-url">' + esc(t.author || '') + (t.uri ? ' &middot; <a href="' + esc(t.uri) + '" target="_blank" rel="noopener noreferrer" style="color: var(--primary);">source</a>' : '') + '</div>' +
            '<div class="feed-meta">Requested by ' + esc(item.requester || 'unknown') + '</div>' +
          '</div>' +
          '<div>' +
            '<button onclick="musicAction(\\'remove\\', { position: ' + (i + 1) + ' })" class="btn btn-ghost btn-sm" title="Remove" style="color: #ef4444;"><i class="fa-solid fa-xmark"></i></button>' +
            '<button onclick="musicAction(\\'skip\\' )" class="btn btn-ghost btn-sm" title="Play now" style="color: #10b981;"><i class="fa-solid fa-play"></i></button>' +
          '</div>' +
        '</div>';
      }).join('');

      const queueSection =
        '<div class="card">' +
        '<div class="card-header">' +
          '<div><div class="card-title"><i class="fa-solid fa-list-ol" style="color: var(--primary);"></i> Up Next</div>' +
          '<div class="card-desc">' + (data.queue || []).length + ' track(s) in queue</div></div>' +
          '<button onclick="musicAction(\\'clear\\')" class="btn btn-ghost btn-sm" style="color: #ef4444;"><i class="fa-solid fa-broom"></i> Clear Queue</button>' +
        '</div>' +
        '<div id="music-queue-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">' +
          (queueEls.length ? queueEls : '<div class="empty-state">Queue is empty.</div>') +
        '</div>' +
      '</div>';

      return nowPlaying + queueSection;
    }

    // Initialize on page load
    loadUserProfile();

    // User dropdown toggle
    (function () {
      var trigger = document.getElementById('user-menu-trigger');
      var box = document.getElementById('user-menu');
      if (trigger && box) {
        trigger.addEventListener('click', function (e) {
          e.stopPropagation();
          box.classList.toggle('open');
          trigger.setAttribute('aria-expanded', box.classList.contains('open') ? 'true' : 'false');
        });
        document.addEventListener('click', function () {
          box.classList.remove('open');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
        box.addEventListener('click', function (e) { e.stopPropagation(); });
      }
    })();

    // Handle browser back/forward
    window.addEventListener('popstate', applyRoute);

    // Initial route resolution
    applyRoute();
  </script>
</body>
</html>`;
}
