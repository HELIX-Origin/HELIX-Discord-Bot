export function renderWelcomeTab(): string {
  return `
    <!-- TAB: WELCOME -->
    <section id="tab-welcome" class="tab-pane">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="section-title"><i class="fa-solid fa-hand-sparkles" style="color: #10b981;"></i> Welcome Message</div>
          <div class="section-desc">Send a customizable message when a new member joins. Mirrors the <code style="color: var(--primary);">/welcome</code> command.</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span id="welcome-save-status" style="font-size: 0.8125rem; color: #10b981; display: none;"></span>
          <button onclick="saveWelcomeTab()" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Save Welcome</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem; align-items: start;">
        <!-- Configuration Card -->
        <div class="card">
          <div>
            <div class="card-title"><i class="fa-solid fa-sliders" style="color: var(--primary);"></i> Welcome Configuration</div>
            <div class="card-desc">Configure where and how the welcome message is sent to new arrivals.</div>
          </div>
          <div class="form-grid" style="margin-top: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Welcome Channel</label>
              <select id="admin-welcome-channel"><option value="">-- Disabled --</option></select>
            </div>
            <div class="form-group">
              <label class="form-label">Format</label>
              <select id="admin-welcome-embed" onchange="updateWelcomePreview()">
                <option value="0">Plain text</option>
                <option value="1">Embed</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="margin-top: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-label">Message Template</label>
              <span style="font-size: 0.6875rem; color: var(--text-dim);">Markdown supported</span>
            </div>
            <textarea id="admin-welcome-message" rows="5" spellcheck="false" placeholder="Welcome {mention} to **{server}**! We are now {membercount} members. 🎉" oninput="updateWelcomePreview()"></textarea>
          </div>
          <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.625rem; padding: 0.75rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
            <div style="font-weight: 700; color: var(--text); margin-bottom: 0.25rem;"><i class="fa-solid fa-tags" style="color: var(--primary);"></i> Available Placeholders</div>
            <div><code>{user}</code> — Username (e.g. <strong>NewMember</strong>)</div>
            <div><code>{mention}</code> — User mention ping (e.g. <strong>@NewMember</strong>)</div>
            <div><code>{server}</code> — Server name</div>
            <div><code>{membercount}</code> — Total server member count</div>
          </div>
        </div>

        <!-- Live Preview Card -->
        <div class="card">
          <div>
            <div class="card-title"><i class="fa-solid fa-eye" style="color: #10b981;"></i> Live Discord Preview</div>
            <div class="card-desc">Simulated view of the welcome announcement as it appears in the configured channel.</div>
          </div>
          <div id="welcome-preview-container" class="discord-preview-container" style="margin-top: 0.5rem;">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>
    </section>
  `;
}
