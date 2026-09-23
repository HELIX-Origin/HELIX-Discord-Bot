export function renderTicketsTab(): string {
  return `
    <!-- TAB: TICKETS -->
    <section id="tab-tickets" class="tab-pane">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="section-title"><i class="fa-solid fa-ticket" style="color: #6366f1;"></i> Ticket Support</div>
          <div class="section-desc">Users click a button in the ticket channel to open a support thread. Ticket managers are added to every ticket automatically.</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span id="tickets-save-status" style="font-size: 0.8125rem; color: #10b981; display: none;"></span>
          <button onclick="saveTicketsTab()" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Save Tickets</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem; align-items: start;">
        <!-- Routing & Message Configuration Card -->
        <div class="card">
          <div>
            <div class="card-title"><i class="fa-solid fa-sliders" style="color: #6366f1;"></i> Ticket Channel &amp; Role Routing</div>
            <div class="card-desc">Configure where the button is posted and which channels receive transcripts and logs.</div>
          </div>
          <div class="form-grid" style="margin-top: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Ticket Channel (button message)</label>
              <select id="admin-ticket-channel" onchange="updateTicketPreview()"><option value="">-- Disabled --</option></select>
            </div>
            <div class="form-group">
              <label class="form-label">Format</label>
              <select id="admin-ticket-embed" onchange="updateTicketPreview()">
                <option value="0">Plain text</option>
                <option value="1">Embed</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ticket Manager Role</label>
              <select id="admin-ticket-manager-role" onchange="updateTicketPreview()"><option value="">-- None --</option></select>
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
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-label">Ticket Message (Hosts the Open Ticket button)</label>
              <span style="font-size: 0.6875rem; color: var(--text-dim);">Markdown supported</span>
            </div>
            <textarea id="admin-ticket-message" rows="4" spellcheck="false" placeholder="Click the button below to open a support ticket in {server}." oninput="updateTicketPreview()"></textarea>
          </div>
          <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.625rem; padding: 0.75rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.75rem;">
            <div style="font-weight: 700; color: var(--text); margin-bottom: 0.25rem;"><i class="fa-solid fa-tags" style="color: #6366f1;"></i> Available Placeholders</div>
            <div><code>{server}</code> — Server name</div>
            <div><code>{role}</code> — Ticket manager role mention (e.g. <strong>@Support</strong>)</div>
            <div><code>{channel}</code> — Ticket channel mention (e.g. <strong>#tickets</strong>)</div>
            <div><code>{membercount}</code> — Total server member count</div>
            <div><code>{user}</code> — Username</div>
            <div><code>{mention}</code> — User mention ping</div>
          </div>
          <div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.625rem; padding: 0.75rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
            <div style="font-weight: 700; color: var(--text); margin-bottom: 0.25rem;"><i class="fa-solid fa-circle-info" style="color: #6366f1;"></i> How Tickets Work</div>
            <div>• This message is posted to the configured Ticket Channel with the <strong>Open Ticket</strong> button attached.</div>
            <div>• Clicking the button creates a private support thread with the user and assigned ticket managers.</div>
            <div>• When closed, transcripts and logs are forwarded to the designated channels.</div>
          </div>
        </div>

        <!-- Live Preview Card -->
        <div class="card">
          <div>
            <div class="card-title"><i class="fa-solid fa-eye" style="color: #6366f1;"></i> Live Button &amp; Message Preview</div>
            <div class="card-desc">Simulated view of the button prompt as it appears in the ticket channel.</div>
          </div>
          <div id="ticket-preview-container" class="discord-preview-container" style="margin-top: 0.5rem;">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>
    </section>
  `;
}
