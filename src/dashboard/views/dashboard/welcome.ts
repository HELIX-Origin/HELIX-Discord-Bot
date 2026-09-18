export function renderWelcomeTab(): string {
  return `
    <!-- TAB: WELCOME -->
    <section id="tab-welcome" class="tab-pane">
      <div>
        <div class="section-title"><i class="fa-solid fa-hand-sparkles" style="color: #10b981;"></i> Welcome Message</div>
        <div class="section-desc">Send a customizable message when a new member joins. Mirrors the <code style="color: var(--primary);">/welcome</code> command.</div>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-hand-wave" style="color: var(--primary);"></i> Welcome Settings</div>
          <div class="card-desc">Supports placeholders: <code style="color: var(--primary);">{user}</code> <code style="color: var(--primary);">{server}</code> <code style="color: var(--primary);">{membercount}</code> <code style="color: var(--primary);">{mention}</code></div>
        </div>
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Welcome Channel</label>
            <select id="admin-welcome-channel"><option value="">-- Disabled --</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Format</label>
            <select id="admin-welcome-embed">
              <option value="0">Plain text</option>
              <option value="1">Embed</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top: 0.75rem;">
          <label class="form-label">Message (Markdown supported)</label>
          <textarea id="admin-welcome-message" rows="4" spellcheck="false" placeholder="Welcome {mention} to **{server}**! We are now {membercount} members. 🎉"></textarea>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem;">
        <span id="welcome-save-status" style="font-size: 0.8125rem; color: #10b981; display: none;"></span>
        <button onclick="saveWelcomeTab()" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Welcome</button>
      </div>
    </section>
  `;
}
