import type { ThemeInfo, ColorSchemeInfo } from '../theme.js';

export function renderDashboardStyles(_theme: ThemeInfo, _colorScheme: ColorSchemeInfo): string {
  return `
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
      --primary-bg: rgba(2, 132, 199, 0.12);
      --primary-border: rgba(2, 132, 199, 0.35);
      --discord: #5865F2;
      --discord-hover: #4752C4;
      --amber: #d97706;
      --emerald: #059669;
      --red: #dc2626;
      --shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    html.glassmorphism {
      --bg: #0a0d18;
      --card-bg: rgba(18, 24, 43, 0.55);
      --card-inner: rgba(255, 255, 255, 0.04);
      --border: rgba(255, 255, 255, 0.12);
      --border-hover: rgba(255, 255, 255, 0.25);
      --text: #ffffff;
      --text-muted: #cbd5e1;
      --text-dim: #94a3b8;
      --primary: #a855f7;
      --primary-hover: #9333ea;
      --primary-bg: rgba(168, 85, 247, 0.16);
      --primary-border: rgba(168, 85, 247, 0.4);
      --shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
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

    /* Native controls */
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
    header { position: sticky; top: 0; z-index: 50; background: var(--card-bg); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); padding: 0.75rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .header-left { display: flex; align-items: center; gap: 0.875rem; min-width: 0; }
    .brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--text); }
    .brand-icon { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; background: linear-gradient(135deg, var(--primary), #3b82f6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.05rem; box-shadow: 0 4px 12px rgba(6,182,212,0.3); flex-shrink: 0; }
    .brand-title { font-size: 1.0625rem; font-weight: 800; letter-spacing: -0.02em; }
    .brand-title span { color: var(--primary); }
    .brand-sub { font-size: 0.6875rem; color: var(--text-muted); font-weight: 500; }
    .guild-pill { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.3125rem 0.75rem; border-radius: 9999px; background: var(--card-inner); border: 1px solid var(--border); color: var(--text); font-size: 0.8125rem; font-weight: 600; }
    .guild-pill img { width: 1.25rem; height: 1.25rem; border-radius: 50%; object-fit: cover; }
    .nav-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

    /* Layout */
    .container { max-width: 1320px; width: 100%; margin: 0 auto; padding: 1.25rem; flex: 1; display: flex; gap: 1.25rem; }
    @media (max-width: 860px) { .container { flex-direction: column; padding: 0.875rem; gap: 1rem; } }

    /* Professional Categorized Sidebar */
    nav.sidebar {
      width: 250px;
      flex-shrink: 0;
      background: var(--card-bg);
      backdrop-filter: blur(14px);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 0.875rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: calc(100vh - 6.5rem);
      position: sticky;
      top: 5rem;
      overflow-y: auto;
    }
    @media (max-width: 860px) {
      nav.sidebar { width: 100%; height: auto; position: static; overflow: visible; }
      .nav-section { margin-bottom: 0.5rem !important; }
      .nav-section-title { display: none; }
      .tab-list { flex-direction: row !important; overflow-x: auto; gap: 0.375rem; padding-bottom: 0.25rem; scrollbar-width: none; }
      .tab-list::-webkit-scrollbar { display: none; }
      .tab-btn { width: auto !important; white-space: nowrap; min-height: 40px; }
      .tab-btn span { display: inline; }
      .sidebar-footer { display: none !important; }
      .sidebar-guild-banner { display: none !important; }
    }

    .sidebar-guild-banner {
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 0.875rem;
      padding: 0.625rem 0.75rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .sidebar-guild-info {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-width: 0;
    }
    .sidebar-guild-img {
      width: 1.875rem;
      height: 1.875rem;
      border-radius: 0.5rem;
      object-fit: cover;
      flex-shrink: 0;
    }
    .sidebar-guild-avatar-fallback {
      width: 1.875rem;
      height: 1.875rem;
      border-radius: 0.5rem;
      background: var(--primary-bg);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      flex-shrink: 0;
    }
    .sidebar-guild-meta {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .sidebar-guild-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sidebar-guild-sub {
      font-size: 0.6875rem;
      color: var(--text-dim);
    }

    .nav-section {
      margin-bottom: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-dim);
      padding: 0.25rem 0.75rem 0.375rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .tab-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .tab-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5625rem 0.875rem;
      border-radius: 0.625rem;
      font-size: 0.84375rem;
      font-weight: 600;
      color: var(--text-muted);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease-in-out;
      min-height: 40px;
    }
    .tab-btn i {
      width: 1.25rem;
      text-align: center;
      font-size: 0.9375rem;
      flex-shrink: 0;
    }
    .tab-btn:hover {
      background: rgba(255,255,255,0.05);
      color: var(--text);
      transform: translateX(2px);
    }
    .tab-btn.active {
      color: var(--primary);
      background: var(--primary-bg);
      border-color: var(--primary-border);
      box-shadow: 0 0 14px var(--primary-bg);
      font-weight: 700;
    }

    .sidebar-footer {
      padding-top: 0.75rem;
      margin-top: 0.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.75rem;
      color: var(--text-dim);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sidebar-footer a { color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
    .sidebar-footer a:hover { color: var(--primary); }

    /* Main Content */
    main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1.25rem; }
    .tab-pane { display: none; flex-direction: column; gap: 1.25rem; }
    .tab-pane.active { display: flex; }

    /* Cards & Components */
    .card { background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: var(--shadow); }
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

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .stat-card { background: var(--card-inner); border: 1px solid var(--border); border-radius: 1rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text); line-height: 1.2; }
    .stat-sub { font-size: 0.75rem; color: var(--text-dim); }

    /* Forms & Inputs */
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); }
    input[type="text"], input[type="number"], select, textarea {
      width: 100%;
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 0.625rem;
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      color: var(--text);
      outline: none;
      transition: border-color 0.15s;
    }
    input[type="text"]:focus, input[type="number"]:focus, select:focus, textarea:focus { border-color: var(--primary); }
    input[type="checkbox"] { accent-color: var(--primary); width: 1.125rem; height: 1.125rem; cursor: pointer; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5625rem 1rem; border-radius: 0.625rem; font-size: 0.84375rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: all 0.15s; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-discord { background: var(--discord); color: #fff; }
    .btn-discord:hover { background: var(--discord-hover); }
    .btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .btn-danger:hover { background: #ef4444; color: #fff; }
    .btn-ghost { background: var(--card-inner); color: var(--text); border-color: var(--border); }
    .btn-ghost:hover { border-color: var(--border-hover); background: rgba(255,255,255,0.05); }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; border-radius: 0.5rem; }
    .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.6875rem; border-radius: 0.375rem; }
    .btn-block { width: 100%; }

    /* Feeds List & Pills */
    .feed-list { display: flex; flex-direction: column; gap: 0.625rem; }
    .feed-pill {
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 0.875rem;
      padding: 0.875rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      transition: border-color 0.15s, transform 0.15s;
    }
    .feed-pill:hover { border-color: var(--border-hover); }
    .feed-details { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; flex: 1; }
    .feed-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .feed-name { font-weight: 700; font-size: 0.9375rem; color: var(--text); }
    .feed-url { font-size: 0.75rem; color: var(--text-dim); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 500px; }
    .feed-meta { font-size: 0.6875rem; color: var(--text-dim); display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }

    /* Badges */
    .badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-green { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
    .badge-gray { background: rgba(107,114,128,0.15); color: #9ca3af; border: 1px solid rgba(107,114,128,0.3); }
    .badge-amber { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }

    /* User Menu Dropdown */
    .user-menu { position: relative; display: inline-block; }
    .user-menu-list {
      display: none;
      position: absolute;
      right: 0;
      top: calc(100% + 0.5rem);
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 0.875rem;
      padding: 0.375rem;
      min-width: 170px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
      z-index: 100;
      backdrop-filter: blur(16px);
    }
    .user-menu.open .user-menu-list { display: block; }
    .user-menu-item { display: flex; align-items: center; gap: 0.625rem; width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; color: var(--text); background: transparent; border: none; cursor: pointer; text-align: left; text-decoration: none; }
    .user-menu-item i { width: 1.125rem; text-align: center; color: var(--text-muted); }
    .user-menu-item:hover { background: rgba(255,255,255,0.06); }
    .user-menu-logout, .user-menu-logout i { color: #f87171 !important; }

    /* Utility */
    .section-title { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
    .section-desc { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.75rem; }
    .empty-state { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; background: var(--card-inner); border-radius: 1rem; border: 1px dashed var(--border); }
    .hidden { display: none !important; }
  `;
}
