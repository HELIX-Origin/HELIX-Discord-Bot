export function renderSourcesTabs(redditAvailable: boolean): string {
  const redditSection = redditAvailable
    ? `      <div class="card">
        <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-brands fa-reddit" style="color: #ff4500;"></i> Add Reddit Feed</div>
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Subreddit</label>
            <input type="text" id="add-reddit-sub" placeholder="e.g. wallpapers" oninput="handleRedditSubInput(this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Display Name (optional)</label>
            <input type="text" id="add-reddit-name" placeholder="Reddit · r/wallpapers">
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Target</label>
            <select id="add-reddit-target" class="form-input">
              <option value="">(none)</option>
            </select>
            <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Pick a text channel. NSFW subreddits can only target age-restricted (NSFW) channels.</span>
          </div>
          <div class="form-group">
            <label class="form-label">Subscribed Role (optional)</label>
            <select id="add-reddit-role" class="form-input">
              <option value="">-- No role --</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top: 0.5rem;">
          <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="add-reddit-image-mode" checked>
            <span>Pure image mode (images/GIFs only)</span>
          </label>
        </div>
        <button onclick="submitAddRedditFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem; background: #ff4500; border-color: #ff4500;"><i class="fa-brands fa-reddit"></i> Add Reddit Feed</button>
      </div>`
    : `      <div class="card" style="border-color: rgba(255, 69, 0, 0.4);">
        <div class="card-title" style="font-size: 0.9375rem; color: #ff4500;"><i class="fa-solid fa-triangle-exclamation"></i> Reddit Feeds Disabled</div>
        <p style="font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; margin-top: 0.5rem;">
          Reddit feeds are disabled because no Reddit session cookie file was found. Place a <code style="font-size: 0.75rem;">cookies.json</code> (or <code style="font-size: 0.75rem;">cookies.txt</code>) file with a logged-in Reddit session in the repo root, or set <code style="font-size: 0.75rem;">REDDIT_COOKIES_FILE</code>, then restart the bot. See <code style="font-size: 0.75rem;">wiki/Reddit-Feeds.md</code>.
        </p>
        <p style="font-size: 0.75rem; color: var(--text-dim); line-height: 1.5;">Use a dedicated alt Reddit account when exporting your cookies to avoid bans on your primary account.</p>
      </div>`;

  return `
    <!-- TAB: REDDIT -->
    <section id="tab-reddit" class="tab-pane">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="section-title"><i class="fa-brands fa-reddit" style="color: #ff4500;"></i> Reddit Feeds</div>
          <div class="section-desc">Subreddit image and post streams delivered straight to your chosen text channel.</div>
        </div>
        <button onclick="triggerGuildPoll()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-bolt"></i> Check Now</button>
      </div>

      ${redditSection}

      <div class="card">
        <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-brands fa-reddit" style="color: #ff4500;"></i> Reddit Feeds</div>
        <div id="reddit-feeds-list" class="feed-list" style="margin-top: 0.75rem;">
          <div class="empty-state">Loading feeds...</div>
        </div>
      </div>
    </section>

    <!-- TAB: FREE GAMES -->
    <section id="tab-freegames" class="tab-pane">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="section-title"><i class="fa-solid fa-gift" style="color: #10b981;"></i> Free Games</div>
          <div class="section-desc">Automated giveaway alerts from Epic Games Store, Steam, GOG, and more.</div>
        </div>
        <button onclick="triggerGuildPoll()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-bolt"></i> Check Now</button>
      </div>

      <div class="card">
        <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-gift" style="color: #10b981;"></i> Add Free Games Feed</div>
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Platform</label>
            <select id="add-freegames-platform" onchange="handleFreeGamesPlatformChange(this.value)">
              <option value="all">All Platforms</option>
              <option value="epic">Epic Games Store</option>
              <option value="steam">Steam Giveaways</option>
              <option value="gog">GOG Promotions</option>
              <option value="indiegala">IndieGala Freebies</option>
              <option value="humble">Humble Bundle</option>
              <option value="itchio">Itch.io Freebies</option>
              <option value="ubisoft">Ubisoft Giveaways</option>
              <option value="prime">Prime Gaming</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Display Name (optional)</label>
            <input type="text" id="add-freegames-name" placeholder="Free Games · All Stores">
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Target</label>
            <select id="add-freegames-target" class="form-input">
              <option value="">(none)</option>
            </select>
            <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Pick a text channel.</span>
          </div>
          <div class="form-group">
            <label class="form-label">Subscribed Role (optional)</label>
            <select id="add-freegames-role" class="form-input">
              <option value="">-- No role --</option>
            </select>
          </div>
        </div>
        <button onclick="submitAddFreeGamesFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem; background: #10b981; border-color: #10b981;"><i class="fa-solid fa-gift"></i> Add Free Games Feed</button>
      </div>

      <div class="card">
        <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-list-check" style="color: #10b981;"></i> Free Games Feeds</div>
        <div id="freegames-feeds-list" class="feed-list" style="margin-top: 0.75rem;">
          <div class="empty-state">Loading feeds...</div>
        </div>
      </div>
    </section>

    <!-- TAB: STREAM ALERTS -->
    <section id="tab-streamalerts" class="tab-pane">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="section-title"><i class="fa-solid fa-satellite-dish" style="color: #9146ff;"></i> Stream Alerts</div>
          <div class="section-desc">YouTube uploads &amp; Twitch live stream notifications delivered to your community.</div>
        </div>
        <button onclick="triggerGuildPoll()" class="btn btn-ghost btn-sm"><i class="fa-solid fa-bolt"></i> Check Now</button>
      </div>

      <div class="card">
        <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-video" style="color: #9146ff;"></i> Add Stream Alert Feed</div>
        <div class="form-grid" style="margin-top: 0.75rem;">
          <div class="form-group">
            <label class="form-label">Platform</label>
            <select id="add-streamalerts-platform" onchange="handleStreamAlertsPlatformChange(this.value)">
              <option value="youtube">YouTube</option>
              <option value="twitch">Twitch</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Channel Handle</label>
            <input type="text" id="add-streamalerts-handle" placeholder="e.g. @channel or twitch.tv/name">
          </div>
          <div class="form-group">
            <label class="form-label">Display Name (optional)</label>
            <input type="text" id="add-streamalerts-name" placeholder="YouTube · @channel">
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Target</label>
            <select id="add-streamalerts-target" class="form-input">
              <option value="">(none)</option>
            </select>
            <span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Pick a text channel.</span>
          </div>
          <div class="form-group">
            <label class="form-label">Subscribed Role (optional)</label>
            <select id="add-streamalerts-role" class="form-input">
              <option value="">-- No role --</option>
            </select>
          </div>
        </div>
        <button onclick="submitAddStreamAlertFeed()" class="btn btn-primary btn-sm btn-block" style="margin-top: 0.75rem; background: #9146ff; border-color: #9146ff;"><i class="fa-solid fa-video"></i> Add Stream Alert</button>
      </div>

      <div class="card">
        <div class="card-title" style="font-size: 0.9375rem;"><i class="fa-solid fa-tower-broadcast" style="color: #9146ff;"></i> Stream Alert Feeds</div>
        <div id="streamalerts-feeds-list" class="feed-list" style="margin-top: 0.75rem;">
          <div class="empty-state">Loading feeds...</div>
        </div>
      </div>
    </section>
  `;
}
