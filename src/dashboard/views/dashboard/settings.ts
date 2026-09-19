interface SettingsOptions {
  publicBaseUrl: string | null;
  internalUrl: string;
  themeName: string;
  themeId: string;
}

export function renderSettingsTab(options: SettingsOptions): string {
  const { publicBaseUrl, internalUrl, themeName, themeId } = options;

  return `
    <!-- TAB: SETTINGS (ADMIN / OWNER ONLY) -->
    <section id="tab-settings" class="tab-pane">
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
            <label class="form-label">Active Dashboard Theme</label>
            <input type="text" value="${themeName} (${themeId})" disabled style="opacity: 0.85; cursor: not-allowed;" title="Configured via the DASHBOARD_THEME environment variable">
            <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem;">Configured via <code style="color: var(--primary);">DASHBOARD_THEME</code> in <code style="color: var(--primary);">.env</code>. Themes: <code style="color: var(--text-muted);">glassmorphism</code>, <code style="color: var(--text-muted);">dark</code>, <code style="color: var(--text-muted);">light</code>, <code style="color: var(--text-muted);">cyberpunk</code>, <code style="color: var(--text-muted);">dracula</code>, <code style="color: var(--text-muted);">nord</code>, <code style="color: var(--text-muted);">emerald</code>.</span>
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
    </section>
  `;
}
