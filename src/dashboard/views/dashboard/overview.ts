export interface OverviewOptions {
  dbSizeBytes: number;
}

export function renderOverviewTab(options: OverviewOptions): string {
  const { dbSizeBytes } = options;
  const dbKb = Math.round(dbSizeBytes / 1024);

  return `
    <section id="tab-overview" class="tab-pane">
      <div>
        <div class="section-title"><i class="fa-solid fa-chart-pie" style="color: var(--primary);"></i> Server Overview</div>
        <div class="section-desc">Active syndication stats, delivery status, and diagnostic health for the selected server.</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Feeds</div>
          <div class="stat-value" id="stat-total-feeds">0</div>
          <div class="stat-sub">Configured for this server</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Feeds</div>
          <div class="stat-value" style="color: #10b981;" id="stat-active-feeds">0</div>
          <div class="stat-sub">Enabled and syndicating</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">RSS Feeds</div>
          <div class="stat-value" style="color: var(--amber);" id="stat-rss-feeds">0</div>
          <div class="stat-sub">News &amp; custom RSS</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Reddit Feeds</div>
          <div class="stat-value" style="color: #ff4500;" id="stat-reddit-feeds">0</div>
          <div class="stat-sub">Subreddit streams</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Free Games</div>
          <div class="stat-value" style="color: #10b981;" id="stat-freegames-feeds">0</div>
          <div class="stat-sub">Store giveaway drops</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Stream Alerts</div>
          <div class="stat-value" style="color: #9146ff;" id="stat-streamalerts-feeds">0</div>
          <div class="stat-sub">YouTube &amp; Twitch alerts</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Database Storage</div>
          <div class="stat-value" style="color: #5865F2;">${dbKb} KB</div>
          <div class="stat-sub">Native SQLite persistence</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title"><i class="fa-solid fa-clock-rotate-left" style="color: var(--primary);"></i> Recent Activity &amp; Logs</div>
            <div class="card-desc">System logs, delivery notifications, and parser events</div>
          </div>
          <button onclick="loadOverviewTab()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-rotate-right"></i> Refresh</button>
        </div>
        <div id="activity-list" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 340px; overflow-y: auto;">
          <div class="empty-state">Loading recent activity...</div>
        </div>
      </div>
    </section>
  `;
}
