export function renderGuildAdminTab(): string {
  return `
    <!-- TAB: GUILD ADMIN -->
    <section id="tab-guildadmin" class="tab-pane">
      <div>
        <div class="section-title"><i class="fa-solid fa-shield-halved" style="color: #6366f1;"></i> Server Administration</div>
        <div class="section-desc">Manage roles, feature flags, and command prefix for this server. Mirrors the <code style="color: var(--primary);">/set</code> command.</div>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-user-tag" style="color: var(--primary);"></i> Roles</div>
          <div class="card-desc">DJ role gates music commands. Admin role can manage feeds and bot configuration.</div>
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
          <div class="card-title"><i class="fa-solid fa-toggle-on" style="color: var(--primary);"></i> Feature Modules</div>
          <div class="card-desc">Enable or disable specific features for this server.</div>
        </div>
        <div id="admin-features-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
          <div class="empty-state">Loading features...</div>
        </div>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-terminal" style="color: var(--primary);"></i> Command Toggles</div>
          <div class="card-desc">Enable or disable specific slash commands for this server. Mirrors <code style="color: var(--primary);">/server command</code>.</div>
        </div>
        <div id="admin-commands-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.5rem; margin-top: 0.75rem; max-height: 380px; overflow-y: auto; padding-right: 0.25rem;">
          <div class="empty-state">Loading commands...</div>
        </div>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-hashtag" style="color: var(--primary);"></i> Command Prefix</div>
          <div class="card-desc">Optional text prefix for message commands. Leave empty for slash-commands only.</div>
        </div>
        <div class="form-group" style="margin-top: 0.75rem; max-width: 240px;">
          <input type="text" id="admin-prefix" maxlength="16" placeholder="e.g. !  ?  .">
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem;">
        <span id="admin-save-status" style="font-size: 0.8125rem; color: #10b981; display: none;"></span>
        <button onclick="saveGuildAdmin()" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Settings</button>
      </div>
    </section>
  `;
}
