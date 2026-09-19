export const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; transition: background-color 0.2s, color 0.2s; }
  .card { background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
  .card-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .card-title { font-size: 1rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
  .card-desc { font-size: 0.8125rem; color: var(--text-muted); }
  .section-title { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem; }
  .section-desc { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.75rem; }
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
  .badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.45rem; border-radius: 0.375rem; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; }
  .badge-green { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
  .badge-red { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
  .badge-gray { background: rgba(156,163,175,0.12); color: #9ca3af; border: 1px solid var(--border); }
  .badge-amber { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
  .hidden { display: none !important; }
  .empty-state { padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }
`;

export const colorSchemeMode = `
  html.light { color-scheme: light; }
  html.dark, html.glassmorphism, html.cyberpunk, html.dracula, html.nord, html.emerald { color-scheme: dark; }
`;
