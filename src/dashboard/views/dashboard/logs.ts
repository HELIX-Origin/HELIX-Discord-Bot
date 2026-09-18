export function renderLogsTab(): string {
  return `
    <!-- TAB: LOGS -->
    <section id="tab-logs" class="tab-pane">
      <div>
        <div class="section-title"><i class="fa-solid fa-scroll" style="color: var(--amber);"></i> Log Channels</div>
        <div class="section-desc">Route audit and moderation events to dedicated channels, and choose which events are sent to each.</div>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-scroll" style="color: var(--primary);"></i> Log Settings</div>
          <div class="card-desc">Audit events cover settings, welcome, ticket, and feed changes. Moderation events are emitted by moderation commands.</div>
        </div>
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Audit Log Channel</label>
            <select id="admin-audit-channel"><option value="">-- None --</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Moderation Log Channel</label>
            <select id="admin-modlog-channel"><option value="">-- None --</option></select>
          </div>
        </div>
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Audit Events</label>
            <div id="admin-audit-events" class="admin-events-list"><div class="empty-state">Loading...</div></div>
          </div>
          <div class="form-group">
            <label class="form-label">Moderation Events</label>
            <div id="admin-modlog-events" class="admin-events-list"><div class="empty-state">Loading...</div></div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem;">
        <span id="logs-save-status" style="font-size: 0.8125rem; color: #10b981; display: none;"></span>
        <button onclick="saveLogsTab()" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Logs</button>
      </div>
    </section>
  `;
}
