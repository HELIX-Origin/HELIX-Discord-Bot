export function renderTicketsTab(): string {
  return `
    <!-- TAB: TICKETS -->
    <section id="tab-tickets" class="tab-pane">
      <div>
        <div class="section-title"><i class="fa-solid fa-ticket" style="color: #6366f1;"></i> Ticket Support</div>
        <div class="section-desc">Users click a button in the ticket channel to open a support thread. Ticket managers are added to every ticket automatically.</div>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-ticket" style="color: var(--primary);"></i> Ticket Settings</div>
          <div class="card-desc">Configure where the open-ticket button lives and how tickets are handled. Mirrors the <code style="color: var(--primary);">/ticket</code> command.</div>
        </div>
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Ticket Channel (button message)</label>
            <select id="admin-ticket-channel"><option value="">-- Disabled --</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Ticket Manager Role (auto-added to tickets)</label>
            <select id="admin-ticket-manager-role"><option value="">-- None --</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Transcript Channel (closed tickets)</label>
            <select id="admin-ticket-transcript-channel"><option value="">-- None --</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Ticket Log Channel</label>
            <select id="admin-ticket-log-channel"><option value="">-- None --</option></select>
          </div>
        </div>
        <div class="form-group" style="margin-top: 0.75rem;">
          <label class="form-label">Ticket Message (The message hosting the Open Ticket button)</label>
          <textarea id="admin-ticket-message" rows="3" spellcheck="false" placeholder="Click the button below to open a support ticket."></textarea>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem;">
        <span id="tickets-save-status" style="font-size: 0.8125rem; color: #10b981; display: none;"></span>
        <button onclick="saveTicketsTab()" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Tickets</button>
      </div>
    </section>
  `;
}
