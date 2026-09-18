export function renderFeedsTab(): string {
  return `
    <!-- TAB: NEWS & RSS (add by URL + catalog + RSS/scrape feeds) -->
    <section id="tab-rss" class="tab-pane active">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="section-title"><i class="fa-solid fa-rss" style="color: var(--primary);"></i> News &amp; RSS Feeds</div>
          <div class="section-desc">Add an RSS/Atom feed by URL, enable a ready-made feed, or scrape a webpage — delivered to a channel or its own forum thread.</div>
        </div>
        <button onclick="triggerGuildPoll()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-bolt"></i> Check Now</button>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-plus-circle" style="color: var(--primary);"></i> Add RSS / Scrape Feed by URL</div>
          <div class="card-desc">Deliver an RSS/Atom feed — or a scraped webpage — into a channel or its own forum thread.</div>
        </div>
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Feed Name</label>
            <input type="text" id="add-rss-name" placeholder="E.g., TechCrunch News">
          </div>
          <div class="form-group">
            <label class="form-label">Feed URL</label>
            <input type="text" id="add-rss-url" placeholder="https://example.com/rss.xml" style="font-family: monospace;">
          </div>
          <div class="form-group">
            <label class="form-label">Topic</label>
            <input type="text" id="add-rss-topic" list="feed-topic-options" placeholder="E.g., News, Technology, Entertainment, Other">
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Target</label>
            <select id="add-rss-target" class="form-input"><option value="">(none)</option></select>
          </div>
        </div>
        <datalist id="feed-topic-options">
          <option value="News">
          <option value="Technology">
          <option value="Entertainment">
          <option value="Gaming">
          <option value="Programming">
          <option value="Science &amp; Space">
          <option value="Artificial Intelligence">
          <option value="Cybersecurity">
          <option value="Cryptocurrency">
          <option value="Business &amp; Finance">
          <option value="Sports">
          <option value="Reddit">
          <option value="Free Games">
          <option value="Stream Alerts">
          <option value="Other">
        </datalist>
        <div class="form-group" style="margin-top: 0.5rem;">
          <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="add-rss-scrape" onchange="toggleScrapeFields('rss')">
            <span>Scrape webpage (HTML selector mode)</span>
          </label>
        </div>
        <div id="rss-scrape-fields" style="display: none;">
          <div class="form-grid" style="margin-top: 0.5rem;">
            <div class="form-group">
              <label class="form-label">Item Selector</label>
              <input type="text" id="add-rss-scrape-item" placeholder="article">
            </div>
            <div class="form-group">
              <label class="form-label">Title Selector</label>
              <input type="text" id="add-rss-scrape-title" placeholder="h2 a">
            </div>
            <div class="form-group">
              <label class="form-label">Link Selector</label>
              <input type="text" id="add-rss-scrape-link" placeholder="a">
            </div>
            <div class="form-group">
              <label class="form-label">Description Selector (optional)</label>
              <input type="text" id="add-rss-scrape-desc" placeholder=".summary">
            </div>
          </div>
        </div>
        <button onclick="submitAddRssFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem;"><i class="fa-solid fa-plus"></i> Add RSS Feed</button>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-newspaper" style="color: var(--amber);"></i> News Feeds Catalog</div>
          <div class="card-desc">One-click add top news, tech, gaming, science, and developer feeds. Configure each feed's delivery target from its setup page.</div>
        </div>
        <div id="presets-list-container" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div class="empty-state">Loading news feeds catalog...</div>
        </div>
      </div>

      <div class="card">
        <div>
          <div class="card-title"><i class="fa-solid fa-rss" style="color: var(--primary);"></i> News &amp; RSS Feeds</div>
          <div class="card-desc">All RSS and scrape feeds for this server, grouped by topic. Click the settings cog to manage each feed.</div>
        </div>
        <div id="feeds-topic-groups" style="display: flex; flex-direction: column; gap: 1.25rem; margin-top: 0.75rem;">
          <div class="empty-state">Loading feeds...</div>
        </div>
      </div>
    </section>

    <!-- TAB: FEED SETUP (per-feed detail page) -->
    <section id="feed-detail-view" class="tab-pane">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <button onclick="closeFeedDetail()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-arrow-left"></i> Back</button>
      </div>
      <div id="feed-detail-content"></div>
    </section>
  `;
}
