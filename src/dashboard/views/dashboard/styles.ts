import { getThemeCss } from '../theme.js';

export function renderDashboardStyles(): string {
  return `
    ${getThemeCss()}

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
    .guild-grid { display: grid; grid-template-columns: 1fr; gap: 0.625rem; }
    .guild-pill { background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.875rem; padding: 0.875rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; transition: border-color 0.15s; }
    .guild-pill:hover { border-color: var(--primary); }
    .guild-pill-left { display: flex; align-items: center; gap: 0.875rem; min-width: 0; }
    .guild-pill-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
    .guild-icon { width: 2.75rem; height: 2.75rem; border-radius: 0.625rem; object-fit: cover; background: var(--card-inner); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: var(--text-muted); flex-shrink: 0; }
    .guild-name { font-size: 1rem; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .guild-sub { font-size: 0.8125rem; color: var(--text-muted); }

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
    input[type="text"], input[type="number"], textarea {
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
    select {
      width: 100%;
      background: var(--card-inner);
      background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
        linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
      background-position: calc(100% - 1.3rem) calc(1em + 0.35rem), calc(100% - 0.95rem) calc(1em + 0.35rem);
      background-size: 0.4rem 0.4rem;
      background-repeat: no-repeat;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      border: 1px solid var(--border);
      border-radius: 0.625rem;
      padding: 0.625rem 2.25rem 0.625rem 0.875rem;
      font-size: 0.875rem;
      color: var(--text);
      outline: none;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    select:hover { border-color: var(--border-hover); }
    select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-bg); }
    select option, select optgroup { background: var(--card-inner); color: var(--text); }
    input[type="text"]:focus, input[type="number"]:focus, textarea:focus { border-color: var(--primary); }
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
