/**
 * src/dashboard/views/dashboard/github.ts
 *
 * Renders the GitHub Feeds dashboard tab:
 * - Add GitHub repository by slug ("owner/repo").
 * - Event selection checkboxes (Commits/Pushes, Releases & Tags, Pull Requests, Issues).
 * - Target Discord channel & optional role subscription.
 * - Real-time webhook configuration card for instant zero-delay updates.
 * - Feed listing with pause, poll, and delete controls.
 */

export function renderGitHubTab(): string {
  return `
    <!-- TAB: GITHUB FEEDS -->
    <section id="tab-github" class="tab-pane">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="section-title"><i class="fa-brands fa-github" style="color: #f0f6fc;"></i> GitHub Feeds</div>
          <div class="section-desc">Follow GitHub repositories with rich activity logs and event feeds — no webhooks required, with optional webhook support for instant delivery.</div>
        </div>
        <button onclick="triggerGuildPoll()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-bolt"></i> Check Now</button>
      </div>

      <!-- Add GitHub Feed Card -->
      <div class="card">
        <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-brands fa-github" style="color: #f0f6fc;"></i> Add GitHub Repository Feed</div>
        <div class="card-desc">Follow code commits, releases, pull requests, and issues from any public GitHub repository.</div>
        
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Repository Slug</label>
            <input type="text" id="add-github-slug" placeholder="e.g. HELIX-Origin/HELIX-Discord-Bot" oninput="handleGitHubSlugInput(this.value)">
            <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Format: <code>owner/repo</code> or full GitHub repository URL</span>
          </div>
          <div class="form-group">
            <label class="form-label">Display Name (optional)</label>
            <input type="text" id="add-github-name" placeholder="GitHub · owner/repo">
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Target</label>
            <select id="add-github-target" class="form-input">
              <option value="">(none)</option>
            </select>
            <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Pick a text channel (or dedicated thread if Thread delivery is on).</span>
          </div>
          <div class="form-group">
            <label class="form-label">Subscribed Role (optional)</label>
            <select id="add-github-role" class="form-input">
              <option value="">-- No role --</option>
            </select>
            <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Optionally ping this role on new activity.</span>
          </div>
        </div>

        <div style="margin-top: 1rem;">
          <label class="form-label" style="font-weight: 600; margin-bottom: 0.35rem; display: block;">Events to Follow</label>
          <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; background: rgba(0,0,0,0.15); padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid var(--border);">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; cursor: pointer;">
              <input type="checkbox" id="add-github-event-push" checked>
              <span>🔨 Commits &amp; Pushes</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; cursor: pointer;">
              <input type="checkbox" id="add-github-event-release" checked>
              <span>🚀 Releases &amp; Tags</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; cursor: pointer;">
              <input type="checkbox" id="add-github-event-pr" checked>
              <span>🔀 Pull Requests</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; cursor: pointer;">
              <input type="checkbox" id="add-github-event-issues" checked>
              <span>🐞 Issues</span>
            </label>
          </div>
        </div>

        <button onclick="submitAddGitHubFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 1rem; background: #24292e; border-color: #444c56; color: #f0f6fc;">
          <i class="fa-brands fa-github"></i> Add GitHub Feed
        </button>
      </div>

      <!-- Real-Time Webhooks Callout Card -->
      <div class="card" style="background: rgba(36, 41, 46, 0.3); border: 1px solid rgba(240, 246, 252, 0.1);">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <i class="fa-solid fa-bolt" style="color: var(--amber); margin-top: 0.25rem;"></i>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 0.875rem; color: var(--text);">Instant Real-Time Webhook (Optional)</div>
            <div style="font-size: 0.78125rem; color: var(--text-muted); line-height: 1.5; margin-top: 0.25rem;">
              HELIX automatically polls public GitHub repositories every minute with <strong>zero API keys or configuration needed</strong>. If you own or manage the repository and want <strong>instant 0-second real-time notifications</strong>, add a webhook in your GitHub repository settings:
            </div>
            <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span style="font-size: 0.75rem; color: var(--text-dim);">Payload URL:</span>
              <code style="background: rgba(0,0,0,0.4); padding: 0.25rem 0.5rem; border-radius: 0.35rem; font-family: monospace; font-size: 0.78125rem; color: var(--primary);" id="github-webhook-url">https://your-domain/api/feeds/webhooks/github</code>
              <span style="font-size: 0.75rem; color: var(--text-dim); margin-left: 0.5rem;">Content type: <code>application/json</code></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active GitHub Feeds List -->
      <div class="card">
        <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-brands fa-github" style="color: #f0f6fc;"></i> Active GitHub Feeds</div>
        <div id="github-feeds-list" class="feed-list" style="margin-top: 0.75rem;">
          <div class="empty-state">Loading feeds...</div>
        </div>
      </div>
    </section>
  `;
}
