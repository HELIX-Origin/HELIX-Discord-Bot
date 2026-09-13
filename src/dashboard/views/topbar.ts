import { appDisplayName, type AppDeps } from '../../app.js';
import { isOwnerUser } from '../routes/shared.js';

export interface TopBarOptions {
  /** Logical location the topbar is being rendered on. Used to highlight the active nav item. */
  active?: 'guilds' | 'dashboard' | 'admin' | 'landing' | 'legal' | 'login';
  /** Render the (empty, JS-filled) current-guild pill slot. Used by the per-guild dashboard shell. */
  showGuildPill?: boolean;
}

/**
 * Shared top navigation bar used by the landing page, login/legal pages, and
 * every authenticated dashboard view. Renders the app brand, an optional bot
 * invite button, and either a "Log In with Discord" button or a user badge
 * dropdown (Guilds / Admin / Log Out).
 *
 * The fragment is fully self-contained (its own <style> and tiny <script>) so it
 * can be embedded into pages that already ship their own theme styles.
 */
export function renderTopBar(deps: AppDeps, userId: number | null, opts: TopBarOptions = {}): string {
  const appName = appDisplayName(deps);
  const appIconUrl = deps.bot?.getAppIconUrl() || null;
  const botInviteUrl = deps.config.clientId
    ? `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(deps.config.clientId)}&scope=bot%20applications.commands&permissions=586263558272`
    : null;
  const showInvite = opts.active !== 'login' && botInviteUrl !== null;
  const userBadge = userId !== null;
  const isOwner = isOwnerUser(userId, deps);
  const features = deps.config.features;
  const homeHref = userBadge && features.dashboardEnabled ? '/guilds' : '/';

  const brandMark = appIconUrl
    ? `<img src="${appIconUrl}" alt="${appName}" class="topbar-brand-img">`
    : `<div class="topbar-brand-icon"><i class="fa-solid fa-rss"></i></div>`;

  const inviteButton = showInvite
    ? `<a href="${botInviteUrl}" target="_blank" rel="noopener noreferrer" class="topbar-btn topbar-btn-discord">
        <i class="fa-brands fa-discord"></i> <span class="topbar-btn-text">Invite Bot</span>
      </a>`
    : '';

  const guildsMenuItem = features.dashboardEnabled
    ? `<a href="/guilds" role="menuitem" class="topbar-menu-item${opts.active === 'guilds' ? ' active' : ''}">
        <i class="fa-solid fa-server"></i> <span>Guilds</span>
      </a>`
    : '';

  const adminMenuItem =
    features.adminPanelEnabled && isOwner
      ? `<a href="/admin" role="menuitem" class="topbar-menu-item${opts.active === 'admin' ? ' active' : ''}">
        <i class="fa-solid fa-screwdriver-wrench"></i> <span>Admin</span>
      </a>`
      : '';

  const right: string = userBadge
    ? `<div class="topbar-user" id="topbar-user">
        <button type="button" class="topbar-user-trigger" id="topbar-user-trigger" aria-haspopup="true" aria-expanded="false">
          <span class="topbar-user-label"><i class="fa-solid fa-user"></i> <span class="topbar-user-name" id="topbar-user-display-name">Discord User</span></span>
          <i class="fa-solid fa-chevron-down topbar-user-caret"></i>
        </button>
        <div class="topbar-user-menu" id="topbar-user-menu" role="menu">
          ${guildsMenuItem}
          ${adminMenuItem}
          <button type="button" role="menuitem" class="topbar-menu-item topbar-menu-logout" onclick="topbarLogout()">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> <span>Log Out</span>
          </button>
        </div>
      </div>`
    : `<a href="/api/auth/discord" class="topbar-btn topbar-btn-discord">
        <i class="fa-brands fa-discord"></i> <span class="topbar-btn-text">Log In with Discord</span>
      </a>`;

  const guildPill =
    opts.showGuildPill && features.dashboardEnabled
      ? `<div id="current-guild-pill" class="topbar-guild-pill hidden">
        <img id="current-guild-icon" src="" alt="">
        <span id="current-guild-name">Server</span>
      </div>`
      : '';

  return `<style>
    .topbar { position: sticky; top: 0; z-index: 50; background: var(--card-bg); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
    .topbar-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
    .topbar-brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--text); }
    .topbar-brand-img { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
    .topbar-brand-icon { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; background: linear-gradient(135deg, #06b6d4, #3b82f6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1rem; box-shadow: 0 4px 12px rgba(6,182,212,0.3); flex-shrink: 0; }
    .topbar-brand-title { font-size: 1.125rem; font-weight: 800; letter-spacing: -0.02em; }
    .topbar-brand-sub { font-size: 0.75rem; color: var(--text-muted); }
    .topbar-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
    .topbar-guild-pill { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.875rem; border-radius: 9999px; background: var(--card-inner); border: 1px solid var(--border); color: var(--text); font-size: 0.875rem; font-weight: 600; }
    .topbar-guild-pill img { width: 1.5rem; height: 1.5rem; border-radius: 50%; object-fit: cover; }
    .topbar-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: all 0.15s; min-height: 40px; }
    .topbar-btn-discord { background: var(--discord, #5865F2); color: #fff; }
    .topbar-btn-discord:hover { background: var(--discord-hover, #4752C4); }
    .topbar-user { position: relative; }
    .topbar-user-trigger { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.875rem; border-radius: 0.75rem; background: var(--card-inner); border: 1px solid var(--border); color: var(--text); font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s; }
    .topbar-user-trigger:hover { border-color: var(--primary); }
    .topbar-user-caret { font-size: 0.75rem; color: var(--text-muted); transition: transform 0.15s; }
    .topbar-user.open .topbar-user-caret { transform: rotate(180deg); }
    .topbar-user-menu { position: absolute; right: 0; top: calc(100% + 0.5rem); min-width: 200px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 0.875rem; padding: 0.375rem; box-shadow: 0 16px 40px rgba(0,0,0,0.35); display: flex; flex-direction: column; gap: 0.125rem; opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity 0.15s, transform 0.15s, visibility 0.15s; backdrop-filter: blur(16px); z-index: 60; }
    .topbar-user.open .topbar-user-menu { opacity: 1; visibility: visible; transform: translateY(0); }
    .topbar-menu-item { display: flex; align-items: center; gap: 0.625rem; width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.625rem; font-size: 0.8125rem; font-weight: 600; color: var(--text); background: transparent; border: none; cursor: pointer; text-align: left; text-decoration: none; }
    .topbar-menu-item i { width: 1.125rem; text-align: center; color: var(--text-muted); }
    .topbar-menu-item:hover { background: rgba(255,255,255,0.06); }
    .topbar-menu-item.active { color: var(--primary); }
    .topbar-menu-item.active i { color: var(--primary); }
    .topbar-menu-logout { color: #f87171; }
    .topbar-menu-logout i { color: #f87171; }
    .hidden { display: none !important; }
  </style>
  <header class="topbar">
    <div class="topbar-left">
      <a href="${homeHref}" class="topbar-brand">
        ${brandMark}
        <div>
          <div class="topbar-brand-title">${appName}</div>
          <div class="topbar-brand-sub">Discord Feed Syndication</div>
        </div>
      </a>
      ${guildPill}
    </div>
    <div class="topbar-actions">
      ${inviteButton}
      ${right}
    </div>
  </header>
  <script>
    (function () {
      var trigger = document.getElementById('topbar-user-trigger');
      var box = document.getElementById('topbar-user');
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
      async function topbarLogout() {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
        window.location.href = '/login';
      }
      window.topbarLogout = topbarLogout;
      async function topbarLoadUserProfile() {
        try {
          const res = await fetch('/api/auth/me', { signal: AbortSignal.timeout(5000) });
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.authenticated && data.user) {
            const el = document.getElementById('topbar-user-display-name');
            if (el) el.textContent = data.user.displayName || data.user.username || 'Discord User';
          }
        } catch {}
      }
      topbarLoadUserProfile();
    })();
  </script>`;
}
