export function renderManageFeedsTab(): string {
  return `
    <!-- TAB: MANAGE FEEDS (all enabled feeds across all categories) -->
    <section id="tab-manage-feeds" class="tab-pane">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="section-title"><i class="fa-solid fa-list-check" style="color: var(--primary);"></i> Manage Enabled Feeds</div>
          <div class="section-desc">Manage, filter, poll, configure, or pause all enabled feeds across all categories (News &amp; RSS, Reddit, Free Games, and Streams) for this server.</div>
        </div>
        <button onclick="triggerGuildPoll()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-bolt"></i> Check All Feeds</button>
      </div>

      <div class="card" style="margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
          <div style="flex: 1; min-width: 240px;">
            <input type="text" id="manage-feeds-search" oninput="filterManageFeeds()" placeholder="Filter feeds by name or URL..." style="width: 100%;">
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <select id="manage-feeds-category-filter" onchange="filterManageFeeds()" class="form-input" style="width: auto;">
              <option value="all">All Categories</option>
              <option value="rss">News &amp; RSS</option>
              <option value="reddit">Reddit</option>
              <option value="freegames">Free Games</option>
              <option value="streamalerts">Stream Alerts</option>
            </select>
            <select id="manage-feeds-status-filter" onchange="filterManageFeeds()" class="form-input" style="width: auto;">
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused Only</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div id="manage-feeds-count" style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.75rem;"></div>
        <div id="manage-feeds-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div class="empty-state">Loading feeds...</div>
        </div>
      </div>
    </section>
  `;
}
