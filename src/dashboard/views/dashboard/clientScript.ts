export function renderClientScript(): string {
  return `
    // Sanitizer
    function esc(s) {
      if (s === null || s === undefined) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function guildIconUrl(guildId, icon) {
      if (!icon) return null;
      return 'https://cdn.discordapp.com/icons/' + esc(guildId) + '/' + esc(icon) + '.png';
    }

    // State caches
    let currentGuildId = null;
    let currentGuild = null;
    let cachedGuilds = [];
    let cachedCategories = null;
    let cachedRoles = null;
    let cachedPresets = [];
    let activeTabName = 'overview';
    let currentFeedDetailId = null;

    // Path-based routing helpers
    const DASHBOARD_ROUTE_REGEX = '^/dashboard/([^/]+)(?:/([^/]+))?(?:/([^/]+))?$';
    function getPathRoute() {
      var path = window.location.pathname;
      if (path === '/guilds' || path === '/guilds/') return { view: 'guilds' };
      var match = path.match(new RegExp(DASHBOARD_ROUTE_REGEX));
      if (match) {
        return { view: 'dashboard', guildId: match[1], page: match[2] || 'overview', feedId: match[3] || null };
      }
      if (path === '/admin' || path === '/admin/') return { view: 'admin' };
      return { view: 'guilds' };
    }

    function navigateTo(path) {
      window.history.pushState({}, '', path);
      applyRoute();
    }

    function applyRoute() {
      const route = getPathRoute();
      if (route.view === 'guilds') {
        currentGuildId = null;
        currentGuild = null;
        document.getElementById('guild-selection-view')?.classList.add('active');
        document.getElementById('dashboard-view')?.classList.remove('active');
        loadGuildSelection();
      } else if (route.view === 'dashboard') {
        currentGuildId = route.guildId;
        document.getElementById('guild-selection-view')?.classList.remove('active');
        document.getElementById('dashboard-view')?.classList.add('active');
        loadGuildDashboard();
        if (route.page === 'feed' && route.feedId) {
          switchTab('rss');
          openFeedDetail(Number(route.feedId));
        } else if (route.page && ['manage-feeds', 'rss', 'reddit', 'freegames', 'streamalerts', 'overview', 'guildadmin', 'settings', 'welcome', 'tickets', 'logs', 'commands'].includes(route.page)) {
          switchTab(route.page);
        } else {
          switchTab('overview');
        }
      } else if (route.view === 'admin') {
        window.location.href = '/admin';
      }
    }

    // Tab Switching
    function switchTab(tabId) {
      activeTabName = tabId;
      currentFeedDetailId = null;
      document.querySelectorAll('#dashboard-view main > .tab-pane, #dashboard-view .tab-pane, #feed-detail-view').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

      const target = document.getElementById('tab-' + tabId);
      const btn = document.getElementById('tab-btn-' + tabId);
      if (target) target.classList.add('active');
      if (btn) btn.classList.add('active');

      // Update URL without page reload
      if (currentGuildId) {
        window.history.pushState({}, '', '/dashboard/' + currentGuildId + '/' + tabId);
      }

      if (tabId === 'manage-feeds') loadManageFeedsTab();
      else if (tabId === 'rss') loadRssTab();
      else if (tabId === 'reddit') loadSourceTab('reddit');
      else if (tabId === 'freegames') loadSourceTab('freegames');
      else if (tabId === 'streamalerts') loadSourceTab('streamalerts');
      else if (tabId === 'overview') loadOverviewTab();
      else if (tabId === 'guildadmin') loadGuildAdminTab();
      else if (tabId === 'settings') loadSettingsTab();
      else if (tabId === 'commands') loadCommandsTab();
      else if (tabId === 'welcome') loadWelcomeTab();
      else if (tabId === 'tickets') loadTicketsTab();
      else if (tabId === 'logs') loadLogsTab();
    }

    function setSidebarManage(canManage) {
      document.querySelectorAll('.manage-gated').forEach(el => {
        if (canManage) el.removeAttribute('hidden');
        else el.setAttribute('hidden', '');
      });
      if (!canManage && activeTabName !== 'commands' && activeTabName !== '') {
        switchTab('commands');
      }
    }

    function clearGuild(event) {
      if (event) event.preventDefault();
      navigateTo('/guilds');
    }

    function selectGuild(guildId) {
      navigateTo('/dashboard/' + guildId);
    }

    // Auth & Logout
    async function logout() {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
      window.location.href = '/login';
    }

    function checkAuth(res) {
      if (res.status === 401) {
        if (confirm('You must be logged in with Discord to perform this action. Go to login page?')) {
          window.location.href = '/login';
        }
        return false;
      }
      return true;
    }

    // User Profile
    async function loadUserProfile() {
      try {
        const res = await fetch('/api/auth/me', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.authenticated && data.user) {
          const el = document.getElementById('user-display-name');
          if (el) el.textContent = data.user.displayName || data.user.username || 'Discord User';
        }
      } catch {}
    }

    // Guild selection
    async function loadGuildSelection() {
      const grid = document.getElementById('guild-grid');
      const empty = document.getElementById('guild-empty-state');
      if (!grid || !empty) return;
      try {
        const res = await fetch('/api/guilds', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return;
        const data = await res.json();
        cachedGuilds = data.guilds || [];
        if (!cachedGuilds.length) {
          grid.innerHTML = '';
          empty.classList.remove('hidden');
          return;
        }
        empty.classList.add('hidden');
        grid.innerHTML = cachedGuilds.map(g => {
          const icon = guildIconUrl(g.id, g.icon);
          const iconHtml = icon ? '<img class="guild-icon" src="' + icon + '" alt="' + esc(g.name) + '">' : '<div class="guild-icon"><i class="fa-solid fa-server"></i></div>';
          const badges = [];
          if (g.botIn) badges.push('<span class="guild-sub">Bot in server</span>');
          if (g.canManage) badges.push('<span class="guild-sub">Manage</span>');
          const manageBtn = g.canManage && g.botIn
            ? '<button onclick="selectGuild(&quot;' + esc(g.id) + '&quot;)" class="btn btn-primary btn-sm" title="Manage server"><i class="fa-solid fa-gear"></i> Manage</button>'
            : '<span class="btn btn-sm" title="You do not have permission to manage this server" style="opacity: 0.45; cursor: not-allowed;"><i class="fa-solid fa-gear"></i> Manage</span>';
          const inviteBtn = g.canInvite && g.inviteUrl
            ? '<a href="' + esc(g.inviteUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-discord btn-sm" title="Invite bot to this server"><i class="fa-brands fa-discord"></i> Invite</a>'
            : '<span class="btn btn-sm" title="No permission to invite the bot here" style="opacity: 0.45; cursor: not-allowed;"><i class="fa-brands fa-discord"></i> Invite</span>';
          return '<div class="guild-pill">' +
            '<div class="guild-pill-left">' +
            iconHtml +
            '<div style="min-width:0;"><div class="guild-name">' + esc(g.name) + '</div>' +
            (badges.length ? '<div style="display:flex; gap:0.75rem;">' + badges.join('') + '</div>' : '') +
            '</div></div>' +
            '<div class="guild-pill-actions">' + manageBtn + inviteBtn + '</div>' +
          '</div>';
        }).join('');
      } catch {
        grid.innerHTML = '<div class="empty-state">Failed to load servers.</div>';
      }
    }

    function setupGuildHeader() {
      const pill = document.getElementById('current-guild-pill');
      const iconEl = document.getElementById('current-guild-icon');
      const nameEl = document.getElementById('current-guild-name');
      if (pill && nameEl) {
        if (currentGuild) {
          nameEl.textContent = currentGuild.name || 'Server';
          const icon = guildIconUrl(currentGuild.guildId || currentGuild.id, currentGuild.icon);
          if (icon && iconEl) {
            iconEl.src = icon;
            iconEl.alt = currentGuild.name || 'Server';
            iconEl.classList.remove('hidden');
          } else if (iconEl) {
            iconEl.src = '';
            iconEl.classList.add('hidden');
          }
          pill.classList.remove('hidden');
        } else {
          pill.classList.add('hidden');
        }
      }

      // Update sidebar banner
      const sidebarName = document.getElementById('sidebar-guild-name');
      const sidebarIcon = document.getElementById('sidebar-guild-icon');
      const fallback = document.getElementById('sidebar-guild-avatar-fallback');
      if (sidebarName) {
        sidebarName.textContent = (currentGuild && currentGuild.name) ? currentGuild.name : 'Select Server';
      }
      if (currentGuild && sidebarIcon && fallback) {
        const icon = guildIconUrl(currentGuild.guildId || currentGuild.id, currentGuild.icon);
        if (icon) {
          sidebarIcon.src = icon;
          sidebarIcon.classList.remove('hidden');
          fallback.classList.add('hidden');
        } else {
          sidebarIcon.src = '';
          sidebarIcon.classList.add('hidden');
          fallback.classList.remove('hidden');
        }
      }
    }

    function getGuildName(guildId) {
      const g = cachedGuilds.find(x => x.id === guildId);
      return g ? g.name : (currentGuild ? currentGuild.name : guildId);
    }

    async function loadGuildDashboard() {
      const selectionView = document.getElementById('guild-selection-view');
      const dashboardView = document.getElementById('dashboard-view');
      if (selectionView) selectionView.classList.remove('active');
      if (dashboardView) dashboardView.classList.add('active');

      const cached = cachedGuilds.find(g => g.id === currentGuildId);
      const canManage = !!(cached && cached.canManage);

      if (!canManage) {
        currentGuild = cached ? { guildId: cached.id, name: cached.name, icon: cached.icon } : { guildId: currentGuildId };
        cachedCategories = null;
        setupGuildHeader();
        setSidebarManage(false);
        switchTab('commands');
        return;
      }

      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/channels', { signal: AbortSignal.timeout(6000) });
        if (res.status === 401) {
          checkAuth(res);
          return;
        }
        if (!res.ok) {
          alert('Could not load server configuration.');
          clearGuild();
          return;
        }
        cachedCategories = await res.json();
        currentGuild = { guildId: cachedCategories.guildId, name: cachedCategories.name, icon: cachedCategories.icon };
        setupGuildHeader();
        setSidebarManage(true);
        populateAddTargetSelects();
        ensureRoles().then(populateAddRoleSelects);
        loadOverviewTab();
      } catch {
        alert('Failed to load server configuration.');
        clearGuild();
      }
    }

    function channelNameById(channels, id) {
      if (!id) return null;
      const ch = (channels || []).find(c => c.id === id);
      return ch ? '#' + ch.name : '#' + id.slice(-6);
    }

    async function ensureChannels() {
      if (cachedCategories && cachedCategories.textChannels) return;
      if (!currentGuildId) return;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/channels', { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (data) cachedCategories = data;
        }
      } catch {}
    }

    function populateAddTargetSelect(selectId, includeNone) {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      sel.innerHTML = channelOptionsForSelect('', includeNone);
    }

    function populateAddTargetSelects() {
      ['rss', 'reddit', 'freegames', 'streamalerts'].forEach(function(cat) {
        populateAddTargetSelect('add-' + cat + '-target', true);
      });
    }

    async function ensureRoles() {
      if (cachedRoles) return;
      if (!currentGuildId) return;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (data && data.guildRoles) cachedRoles = data.guildRoles;
        }
      } catch {}
    }

    function populateAddRoleSelects() {
      ['rss', 'reddit', 'freegames', 'streamalerts'].forEach(function(cat) {
        populateRoleSelect('add-' + cat + '-role', cachedRoles || [], '', '-- No role --');
      });
    }

    function targetFieldsFromValue(value) {
      return { channelId: value || null };
    }

    function categoryForFeed(feed) {
      const t = feed.feedType;
      if (t === 'reddit') return 'reddit';
      if (t === 'rss' || t === 'scrape') return 'rss';
      if (t && t.startsWith('free_games')) return 'freegames';
      if (t === 'youtube' || t === 'twitch') return 'streamalerts';
      return null;
    }

    async function loadGuildFeeds() {
      try {
        const res = await fetch('/api/feeds', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return [];
        const feeds = await res.json();
        return Array.isArray(feeds) ? feeds.filter(f => f.guildId === currentGuildId) : [];
      } catch {
        return [];
      }
    }

    function renderFeedPill(f) {
      const isReddit = f.feedType === 'reddit';
      const isFreeGames = f.feedType === 'free_games' || (f.feedType && f.feedType.startsWith('free_games'));
      const isScrape = f.feedType === 'scrape';
      const isStreamAlert = f.feedType === 'youtube' || f.feedType === 'twitch';
      let typeBadge = '<span class="badge badge-gray"><i class="fa-solid fa-rss"></i> RSS</span>';
      if (isReddit) typeBadge = '<span class="badge" style="background: rgba(255,69,0,0.15); color: #ff4500; border: 1px solid rgba(255,69,0,0.3);"><i class="fa-brands fa-reddit"></i> Reddit</span>';
      else if (isFreeGames) typeBadge = '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);"><i class="fa-solid fa-gift"></i> Free Games</span>';
      else if (isScrape) typeBadge = '<span class="badge badge-amber"><i class="fa-solid fa-code"></i> Scraper</span>';
      else if (isStreamAlert) typeBadge = '<span class="badge" style="background: rgba(145,70,255,0.15); color: #9146ff; border: 1px solid rgba(145,70,255,0.3);"><i class="fa-solid fa-video"></i> Stream</span>';
      const statusBadge = f.enabled
        ? '<span class="badge badge-green">Active</span>'
        : '<span class="badge badge-gray">Paused</span>';
      const lastPolled = f.lastCheckedAt ? new Date(f.lastCheckedAt).toLocaleString() : 'Never polled';
      return '<div class="feed-pill" style="cursor: pointer;" onclick="openFeedDetail(' + f.id + ')">' +
        '<div class="feed-details">' +
          '<div class="feed-name-row">' +
            '<span class="feed-name">' + esc(f.name) + '</span>' +
            typeBadge +
            statusBadge +
          '</div>' +
          '<div class="feed-url">' + esc(f.url) + '</div>' +
          '<div class="feed-meta">Checked: ' + lastPolled + '</div>' +
        '</div>' +
        '<div style="display: flex; gap: 0.375rem; flex-shrink: 0;" onclick="event.stopPropagation()">' +
          '<button onclick="triggerFeedPoll(' + f.id + ')" class="btn btn-ghost btn-sm" title="Check / Poll Now"><i class="fa-solid fa-bolt"></i></button>' +
          '<button onclick="openFeedDetail(' + f.id + ')" class="btn btn-ghost btn-sm" title="Feed settings"><i class="fa-solid fa-gear"></i></button>' +
          '<button onclick="toggleFeed(' + f.id + ', ' + (f.enabled ? 'false' : 'true') + ')" class="btn btn-ghost btn-sm" title="' + (f.enabled ? 'Pause' : 'Resume') + '">' +
            '<i class="fa-solid ' + (f.enabled ? 'fa-pause' : 'fa-play') + '"></i>' +
          '</button>' +
          '<button onclick="deleteFeed(' + f.id + ')" class="btn btn-danger btn-sm" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
        '</div>' +
      '</div>';
    }

    async function renderCategoryFeeds(category) {
      const container = document.getElementById(category + '-feeds-list');
      if (!container) return;
      container.innerHTML = '<div class="empty-state">Loading feeds...</div>';
      const feeds = await loadGuildFeeds();
      const categoryFeeds = feeds.filter(f => categoryForFeed(f) === category);
      if (!categoryFeeds.length) {
        container.innerHTML = '<div class="empty-state">No ' + category + ' feeds for this server yet.</div>';
        return;
      }
      container.innerHTML = categoryFeeds.map(renderFeedPill).join('');
    }

    var cachedAllGuildFeeds = [];

    async function loadManageFeedsTab() {
      if (!currentGuildId) return;
      var listEl = document.getElementById('manage-feeds-list');
      if (listEl) listEl.innerHTML = '<div class="empty-state">Loading feeds...</div>';
      cachedAllGuildFeeds = await loadGuildFeeds();
      filterManageFeeds();
    }

    function filterManageFeeds() {
      var listEl = document.getElementById('manage-feeds-list');
      var countEl = document.getElementById('manage-feeds-count');
      if (!listEl) return;

      var searchEl = document.getElementById('manage-feeds-search');
      var search = (searchEl ? searchEl.value : '').toLowerCase().trim();
      var catEl = document.getElementById('manage-feeds-category-filter');
      var cat = catEl ? catEl.value : 'all';
      var statusEl = document.getElementById('manage-feeds-status-filter');
      var status = statusEl ? statusEl.value : 'all';

      var filtered = cachedAllGuildFeeds.filter(function (f) {
        if (cat !== 'all' && categoryForFeed(f) !== cat) return false;
        if (status === 'active' && !f.enabled) return false;
        if (status === 'paused' && f.enabled) return false;
        if (search) {
          var name = (f.name || '').toLowerCase();
          var url = (f.url || '').toLowerCase();
          var topic = (f.topic || '').toLowerCase();
          if (!name.includes(search) && !url.includes(search) && !topic.includes(search)) return false;
        }
        return true;
      });

      if (countEl) {
        countEl.textContent = 'Showing ' + filtered.length + ' of ' + cachedAllGuildFeeds.length + ' feeds';
      }

      if (!filtered.length) {
        if (cachedAllGuildFeeds.length === 0) {
          listEl.innerHTML = '<div class="empty-state">No enabled feeds found for this server. You can enable feeds in the News &amp; RSS, Reddit, Free Games, or Stream Alerts tabs.</div>';
        } else {
          listEl.innerHTML = '<div class="empty-state">No feeds match your search or filter criteria.</div>';
        }
        return;
      }

      listEl.innerHTML = filtered.map(renderFeedPill).join('');
    }

    async function loadRssTab() {
      await ensureChannels();
      populateAddTargetSelects();
      await loadNewsTab();
    }

    async function loadSourceTab(category) {
      await ensureChannels();
      populateAddTargetSelect('add-' + category + '-target', true);
      await renderCategoryFeeds(category);
    }

    const FEED_TOPIC_ORDER = ['News', 'Technology', 'Entertainment', 'Gaming', 'Programming', 'Science & Space', 'Artificial Intelligence', 'Cybersecurity', 'Cryptocurrency', 'Business & Finance', 'Sports', 'Reddit', 'Free Games', 'Stream Alerts'];

    function feedTopicOf(f) {
      if (f.topic && String(f.topic).trim()) {
        const stored = String(f.topic).trim();
        if (stored === 'World News' || stored === 'US News') return 'News';
        return stored;
      }
      const t = f.feedType || 'rss';
      if (t === 'reddit') return 'Reddit';
      if (t.indexOf('free_games') === 0) return 'Free Games';
      if (t === 'youtube' || t === 'twitch') return 'Stream Alerts';
      return 'Other';
    }

    function topicIcon(topic) {
      const map = {
        'News': 'fa-newspaper',
        'Technology': 'fa-microchip',
        'Entertainment': 'fa-film',
        'Gaming': 'fa-gamepad',
        'Programming': 'fa-code',
        'Science & Space': 'fa-flask',
        'Artificial Intelligence': 'fa-robot',
        'Cybersecurity': 'fa-shield-halved',
        'Cryptocurrency': 'fa-coins',
        'Business & Finance': 'fa-chart-line',
        'Sports': 'fa-futbol',
        'Reddit': 'fa-brands fa-reddit',
        'Free Games': 'fa-gift',
        'Stream Alerts': 'fa-tower-broadcast'
      };
      return map[topic] || 'fa-rss';
    }

    function topicColor(topic) {
      const map = {
        'News': '#3b82f6',
        'Technology': '#6366f1',
        'Entertainment': '#ec4899',
        'Gaming': '#8b5cf6',
        'Programming': '#f59e0b',
        'Science & Space': '#06b6d4',
        'Artificial Intelligence': '#0ea5e9',
        'Cybersecurity': '#ef4444',
        'Cryptocurrency': '#fbbf24',
        'Business & Finance': '#10b981',
        'Sports': '#22c55e',
        'Reddit': '#ff4500',
        'Free Games': '#16a34a',
        'Stream Alerts': '#9146ff'
      };
      return map[topic] || 'var(--text-dim)';
    }

    async function loadFeedsTab() {
      if (!currentGuildId) return;
      const container = document.getElementById('feeds-topic-groups');
      if (!container) return;
      container.innerHTML = '<div class="empty-state">Loading feeds...</div>';
      const feeds = (await loadGuildFeeds()).filter(f => categoryForFeed(f) === 'rss');
      const groups = {};
      feeds.forEach(feed => {
        const topic = feedTopicOf(feed);
        (groups[topic] = groups[topic] || []).push(feed);
      });
      const topics = Object.keys(groups);
      if (!topics.length) {
        container.innerHTML = '<div class="empty-state">No News &amp; RSS feeds for this server yet. Add a custom feed above, or enable ready-made feeds from the catalog.</div>';
        return;
      }
      topics.sort((a, b) => {
        if (a === b) return 0;
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        const ia = FEED_TOPIC_ORDER.indexOf(a);
        const ib = FEED_TOPIC_ORDER.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      });
      container.innerHTML = topics.map(t => {
        const list = groups[t];
        return '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title"><i class="fa-solid ' + topicIcon(t) + '" style="color: ' + topicColor(t) + ';"></i> ' + esc(t) + '</div>' +
              '<div class="card-desc">' + (list.length === 1 ? '1 feed' : list.length + ' feeds') + ' in this topic</div>' +
            '</div>' +
          '</div>' +
          '<div class="feed-list" style="margin-top: 0.75rem;">' + list.map(renderFeedPill).join('') + '</div>' +
        '</div>';
      }).join('');
    }

    // Overview Tab
    async function loadOverviewTab() {
      const activityEl = document.getElementById('activity-list');
      const totalEl = document.getElementById('stat-total-feeds');
      const activeEl = document.getElementById('stat-active-feeds');
      const rssEl = document.getElementById('stat-rss-feeds');
      const redditEl = document.getElementById('stat-reddit-feeds');
      const freegamesEl = document.getElementById('stat-freegames-feeds');
      const streamalertsEl = document.getElementById('stat-streamalerts-feeds');

      try {
        const [feeds, statsRes] = await Promise.all([
          loadGuildFeeds(),
          fetch('/api/stats', { signal: AbortSignal.timeout(5000) })
        ]);
        const total = feeds.length;
        const active = feeds.filter(f => f.enabled).length;
        const rss = feeds.filter(f => categoryForFeed(f) === 'rss').length;
        const reddit = feeds.filter(f => categoryForFeed(f) === 'reddit').length;
        const freegames = feeds.filter(f => categoryForFeed(f) === 'freegames').length;
        const streamalerts = feeds.filter(f => categoryForFeed(f) === 'streamalerts').length;
        if (totalEl) totalEl.textContent = String(total);
        if (activeEl) activeEl.textContent = String(active);
        if (rssEl) rssEl.textContent = String(rss);
        if (redditEl) redditEl.textContent = String(reddit);
        if (freegamesEl) freegamesEl.textContent = String(freegames);
        if (streamalertsEl) streamalertsEl.textContent = String(streamalerts);

        if (activityEl && statsRes.ok) {
          const data = await statsRes.json();
          if (data.activity && data.activity.length) {
            activityEl.innerHTML = data.activity.map(a => {
              const color = a.level === 'error' ? '#ef4444' : a.level === 'warn' ? '#f59e0b' : 'var(--primary)';
              return '<div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">' +
                '<div style="display: flex; align-items: center; gap: 0.5rem;">' +
                  '<i class="fa-solid fa-circle" style="color: ' + color + '; font-size: 0.5rem;"></i>' +
                  '<span style="color: var(--text);">' + esc(a.message) + '</span>' +
                '</div>' +
                '<span style="font-size: 0.6875rem; color: var(--text-dim); font-family: monospace;">' + esc(a.ts) + '</span>' +
              '</div>';
            }).join('');
          } else {
            activityEl.innerHTML = '<div class="empty-state">No recent activity recorded yet.</div>';
          }
        } else if (activityEl) {
          activityEl.innerHTML = '<div class="empty-state">Could not load activity.</div>';
        }
      } catch {
        if (activityEl) activityEl.innerHTML = '<div class="empty-state">Could not load activity.</div>';
      }
    }

    // Feed actions
    async function triggerFeedPoll(id) {
      try {
        const res = await fetch('/api/feeds/' + id + '/poll', { method: 'POST' });
        if (!checkAuth(res)) return;
        if (res.ok) {
          const detailStatus = document.getElementById('feed-detail-status');
          if (detailStatus) {
            detailStatus.textContent = 'Check triggered successfully. Results will deliver to configured target.';
            detailStatus.style.display = 'block';
            setTimeout(function() { detailStatus.style.display = 'none'; }, 4000);
          } else {
            alert('Feed check triggered successfully.');
          }
          refreshCurrentTab();
        } else {
          alert('Failed to trigger feed check.');
        }
      } catch (err) {
        alert('Failed to trigger feed check.');
      }
    }

    async function triggerGuildPoll() {
      if (!currentGuildId) return;
      try {
        const res = await fetch('/api/guilds/' + currentGuildId + '/poll', { method: 'POST' });
        if (!checkAuth(res)) return;
        if (res.ok) {
          const data = await res.json();
          alert('Triggered check for ' + (data.polledCount || 'all') + ' feeds and alerts.');
          refreshCurrentTab();
        } else {
          alert('Failed to trigger feeds and alerts check.');
        }
      } catch (err) {
        alert('Failed to trigger feeds and alerts check.');
      }
    }

    async function toggleFeed(id, enabled) {
      try {
        const res = await fetch('/api/feeds/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled })
        });
        if (!checkAuth(res)) return;
        refreshCurrentTab();
      } catch {}
    }

    async function deleteFeed(id) {
      if (!confirm('Are you sure you want to remove this feed?')) return;
      try {
        const res = await fetch('/api/feeds/' + id, { method: 'DELETE' });
        if (!checkAuth(res)) return;
        closeFeedDetail();
        refreshCurrentTab();
      } catch {}
    }

    function feedTypeBadge(f) {
      if (f.feedType === 'reddit') return '<span class="badge" style="background: rgba(255,69,0,0.15); color: #ff4500; border: 1px solid rgba(255,69,0,0.3);"><i class="fa-brands fa-reddit"></i> Reddit</span>';
      if (f.feedType === 'free_games' || (f.feedType && f.feedType.startsWith('free_games'))) return '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);"><i class="fa-solid fa-gift"></i> Free Games</span>';
      if (f.feedType === 'scrape') return '<span class="badge badge-amber"><i class="fa-solid fa-code"></i> Scraper</span>';
      if (f.feedType === 'youtube' || f.feedType === 'twitch') return '<span class="badge" style="background: rgba(145,70,255,0.15); color: #9146ff; border: 1px solid rgba(145,70,255,0.3);"><i class="fa-solid fa-video"></i> Stream</span>';
      return '<span class="badge badge-gray"><i class="fa-solid fa-rss"></i> RSS</span>';
    }

    function channelOptionsForSelect(selectedId, includeNone) {
      var text = (cachedCategories && cachedCategories.textChannels) || [];
      var opts = '';
      if (includeNone) opts += '<option value="">(none)</option>';
      text.forEach(function(ch) {
        opts += '<option value="' + esc(ch.id) + '"' + (ch.id === selectedId ? ' selected' : '') + '>#' + esc(ch.name) + '</option>';
      });
      return opts;
    }

    function topicDatalistOptions(selectedTopic) {
      var opts = '';
      FEED_TOPIC_ORDER.forEach(function(t) {
        opts += '<option value="' + esc(t) + '"' + (t === selectedTopic ? ' selected' : '') + '>' + esc(t) + '</option>';
      });
      return opts;
    }

    function renderFeedDetail(f) {
      var topic = feedTopicOf(f);
      var enabled = !!f.enabled;
      var typeDisplay = feedTypeBadge(f);
      var urlDisplay = f.feedType === 'free_games' || (f.feedType && f.feedType.startsWith('free_games'))
        ? 'Platform feed (auto-managed)'
        : esc(f.url);
      return '<div class="card">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title"><i class="fa-solid ' + topicIcon(topic) + '" style="color: ' + topicColor(topic) + ';"></i> ' + esc(f.name) + '</div>' +
            '<div class="card-desc">' + typeDisplay + ' &middot; ' + (enabled ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-gray">Paused</span>') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="form-grid" style="margin-top: 1rem;">' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-name">Feed Name</label>' +
            '<input type="text" id="edit-feed-name" class="form-input" value="' + esc(f.name) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-topic">Topic</label>' +
            '<input type="text" id="edit-feed-topic" list="edit-feed-topic-options" class="form-input" value="' + esc(topic === 'Other' ? '' : topic) + '">' +
            '<datalist id="edit-feed-topic-options">' + topicDatalistOptions(topic) + '</datalist>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-url">Feed URL</label>' +
            '<input type="text" id="edit-feed-url" class="form-input" value="' + urlDisplay + '"' + (f.feedType === 'free_games' || (f.feedType && f.feedType.startsWith('free_games')) ? ' disabled' : '') + '>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-target">Delivery Target</label>' +
            '<select id="edit-feed-target" class="form-input">' + channelOptionsForSelect(f.channelId, true) + '</select>' +
            '<span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Posts are delivered to this channel. When Thread delivery is enabled for the server, a dedicated thread is auto-created and used instead.</span>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-role">Subscribed Role</label>' +
            '<select id="edit-feed-role" class="form-input"><option value="">-- No role --</option></select>' +
            '<span style="font-size: 0.6875rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">Optionally auto-subscribe a role to the dedicated thread so members with the role can follow updates.</span>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="edit-feed-enable">Status</label>' +
            '<label style="display: flex; align-items: center; gap: 0.5rem; padding-top: 0.25rem;">' +
              '<input type="checkbox" id="edit-feed-enable"' + (enabled ? ' checked' : '') + '> ' +
              (enabled ? 'Feed is active' : 'Feed is paused') +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="feed-meta" style="margin-top: 0.75rem;">' +
          'Created: ' + (f.createdAt ? new Date(f.createdAt).toLocaleString() : 'Unknown') +
          (f.lastCheckedAt ? ' &middot; Last checked: ' + new Date(f.lastCheckedAt).toLocaleString() : ' &middot; Never polled') +
          (f.threadChannelId ? ' &middot; Thread: <code>' + esc(f.threadChannelId) + '</code>' : '') +
        '</div>' +
        '<div style="display: flex; gap: 0.5rem; margin-top: 1.25rem; flex-wrap: wrap;">' +
          '<button onclick="saveFeedDetail(' + f.id + ')" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>' +
          '<button onclick="triggerFeedPoll(' + f.id + ')" class="btn btn-secondary"><i class="fa-solid fa-bolt"></i> Check Now</button>' +
          '<button onclick="deleteFeed(' + f.id + ')" class="btn btn-danger"><i class="fa-solid fa-trash"></i> Delete Feed</button>' +
        '</div>' +
        '<div id="feed-detail-status" style="margin-top: 0.75rem; color: #10b981; display: none;">Saved successfully.</div>' +
      '</div>';
    }

    function openFeedDetail(feedId) {
      currentFeedDetailId = feedId;
      var detail = document.getElementById('feed-detail-view');
      if (!detail || !currentGuildId) return;
      loadGuildFeeds().then(function(list) {
        var feed = list.find(function(x) { return x.id === feedId; });
        if (!feed) { closeFeedDetail(); return; }
        var content = document.getElementById('feed-detail-content');
        if (content) content.innerHTML = renderFeedDetail(feed);
        document.querySelectorAll('#dashboard-view main > .tab-pane, #dashboard-view .tab-pane, #feed-detail-view').forEach(function(el) { el.classList.remove('active'); });
        document.querySelectorAll('.tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
        detail.classList.add('active');
        window.history.pushState({}, '', '/dashboard/' + currentGuildId + '/feed/' + feedId);
        populateFeedTargetSelect(feed.channelId || '');
        populateFeedRoleSelect(feed.roleId || '');
      });
    }

    async function populateFeedTargetSelect(currentTargetId) {
      var selectEl = document.getElementById('edit-feed-target');
      if (!selectEl) return;
      await ensureChannels();
      selectEl.innerHTML = channelOptionsForSelect(currentTargetId || '', true);
    }

    async function populateFeedRoleSelect(currentRoleId) {
      var selectEl = document.getElementById('edit-feed-role');
      if (!selectEl) return;
      await ensureRoles();
      populateRoleSelect('edit-feed-role', cachedRoles || [], currentRoleId || '', '-- No role --');
    }

    function closeFeedDetail() {
      currentFeedDetailId = null;
      var detail = document.getElementById('feed-detail-view');
      if (detail) detail.classList.remove('active');
      switchTab(activeTabName || 'overview');
    }

    async function saveFeedDetail(feedId) {
      var nameEl = document.getElementById('edit-feed-name');
      var topicEl = document.getElementById('edit-feed-topic');
      var urlEl = document.getElementById('edit-feed-url');
      var targetEl = document.getElementById('edit-feed-target');
      var roleEl = document.getElementById('edit-feed-role');
      var enableEl = document.getElementById('edit-feed-enable');
      if (!nameEl || !targetEl || !enableEl) return;
      var targetValue = targetEl.value || null;
      var payload = {
        name: nameEl.value.trim() || null,
        topic: topicEl ? topicEl.value.trim() || null : null,
        channelId: targetValue,
        roleId: roleEl ? (roleEl.value || null) : undefined,
        enabled: enableEl.checked
      };
      if (urlEl && !urlEl.disabled && urlEl.value.trim()) {
        payload.url = urlEl.value.trim();
      }
      try {
        var res = await fetch('/api/feeds/' + feedId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000)
        });
        if (!checkAuth(res)) return;
        if (!res.ok) {
          var err = await res.json().catch(function() { return {}; });
          alert(err.error || 'Failed to save feed.');
          return;
        }
        var statusEl = document.getElementById('feed-detail-status');
        if (statusEl) { statusEl.style.display = 'block'; setTimeout(function() { statusEl.style.display = 'none'; }, 4000); }
        refreshCurrentTab();
      } catch (e) {
        alert('Failed to save feed.');
      }
    }

    function refreshCurrentTab() {
      if (currentFeedDetailId) { openFeedDetail(currentFeedDetailId); return; }
      if (activeTabName === 'manage-feeds') loadManageFeedsTab();
      else if (activeTabName === 'rss') loadRssTab();
      else if (activeTabName === 'reddit') loadSourceTab('reddit');
      else if (activeTabName === 'freegames') loadSourceTab('freegames');
      else if (activeTabName === 'streamalerts') loadSourceTab('streamalerts');
      else if (activeTabName === 'overview') loadOverviewTab();
      else if (activeTabName === 'guildadmin') loadGuildAdminTab();
      else if (activeTabName === 'settings') loadSettingsTab();
      else if (activeTabName === 'commands') loadCommandsTab();
      else if (activeTabName === 'welcome') loadWelcomeTab();
      else if (activeTabName === 'tickets') loadTicketsTab();
      else if (activeTabName === 'logs') loadLogsTab();
    }

    // Custom RSS / Scrape
    function toggleScrapeFields(category) {
      const box = document.getElementById(category + '-scrape-fields');
      const chk = document.getElementById('add-' + category + '-scrape');
      if (box) box.style.display = chk && chk.checked ? 'block' : 'none';
    }

    async function submitAddRssFeed() {
      if (!currentGuildId) return;
      const nameInput = document.getElementById('add-rss-name');
      const urlInput = document.getElementById('add-rss-url');
      const topicInput = document.getElementById('add-rss-topic');
      const scrapeChk = document.getElementById('add-rss-scrape');
      const name = nameInput ? nameInput.value.trim() : '';
      const url = urlInput ? urlInput.value.trim() : '';
      const topic = topicInput ? topicInput.value.trim() || null : null;
      const targetSel = document.getElementById('add-rss-target');
      const target = targetFieldsFromValue(targetSel ? targetSel.value : '');
      const roleSel = document.getElementById('add-rss-role');
      const roleId = roleSel ? (roleSel.value || null) : null;
      if (!name || !url) return alert('Please enter both feed name and URL.');

      let feedType = 'rss';
      let scrape = null;
      if (scrapeChk && scrapeChk.checked) {
        const item = document.getElementById('add-rss-scrape-item');
        const title = document.getElementById('add-rss-scrape-title');
        const link = document.getElementById('add-rss-scrape-link');
        const desc = document.getElementById('add-rss-scrape-desc');
        if (!item.value.trim() || !title.value.trim() || !link.value.trim()) {
          return alert('Please fill in item, title, and link selectors for scrape mode.');
        }
        feedType = 'scrape';
        scrape = {
          item: item.value.trim(),
          title: title.value.trim(),
          link: link.value.trim(),
          description: desc.value.trim() || undefined
        };
      }

      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, topic, feedType, scrape, guildId: currentGuildId, channelId: target.channelId, roleId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (nameInput) nameInput.value = '';
          if (urlInput) urlInput.value = '';
          if (topicInput) topicInput.value = '';
          if (scrapeChk) scrapeChk.checked = false;
          toggleScrapeFields('rss');
          loadFeedsTab();
          loadNewsTab();
        } else {
          alert(data.error || 'Failed to add feed');
        }
      } catch (err) {
        alert('Network error adding feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // Reddit
    function cleanSubredditName(raw) {
      let s = (raw || '').trim();
      if (s.includes('reddit.com/r/')) s = s.split('reddit.com/r/')[1];
      else if (s.includes('reddit.com/user/')) s = s.split('reddit.com/user/')[1];
      s = s.split('?')[0].split('#')[0].split('/')[0].split('.')[0];
      if (s.startsWith('r/')) s = s.slice(2);
      if (s.startsWith('u/')) s = s.slice(2);
      return s.trim();
    }

    function handleRedditSubInput(val) {
      const nameInput = document.getElementById('add-reddit-name');
      if (!nameInput) return;
      const clean = cleanSubredditName(val);
      if (clean && (!nameInput.value || nameInput.value.startsWith('Reddit · r/'))) {
        nameInput.placeholder = 'Reddit · r/' + clean;
      }
    }

    async function submitAddRedditFeed() {
      if (!currentGuildId) return;
      const subInput = document.getElementById('add-reddit-sub');
      const nameInput = document.getElementById('add-reddit-name');
      const imageModeChk = document.getElementById('add-reddit-image-mode');
      const rawSub = subInput ? subInput.value.trim() : '';
      if (!rawSub) return alert('Please enter a subreddit name.');
      const cleanSub = cleanSubredditName(rawSub);
      const url = 'https://www.reddit.com/r/' + cleanSub + '/.rss';
      const feedType = imageModeChk && imageModeChk.checked ? 'reddit' : 'rss';
      const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Reddit · r/' + cleanSub;
      const targetSel = document.getElementById('add-reddit-target');
      const target = targetFieldsFromValue(targetSel ? targetSel.value : '');
      const roleSel = document.getElementById('add-reddit-role');
      const roleId = roleSel ? (roleSel.value || null) : null;

      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, feedType, guildId: currentGuildId, channelId: target.channelId, roleId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (subInput) subInput.value = '';
          if (nameInput) nameInput.value = '';
          renderCategoryFeeds('reddit');
        } else {
          alert(data.error || 'Failed to add Reddit feed');
        }
      } catch (err) {
        alert('Network error adding Reddit feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // Free Games
    const FREEGAMES_PLATFORMS = [
      { key: 'all', name: 'Free Games · All Stores' },
      { key: 'epic', name: 'Free Games · Epic Games Store' },
      { key: 'steam', name: 'Free Games · Steam Giveaways' },
      { key: 'gog', name: 'Free Games · GOG Promotions' },
      { key: 'indiegala', name: 'Free Games · IndieGala Freebies' },
      { key: 'humble', name: 'Free Games · Humble Bundle' },
      { key: 'itchio', name: 'Free Games · Itch.io Freebies' },
      { key: 'ubisoft', name: 'Free Games · Ubisoft Giveaways' },
      { key: 'prime', name: 'Free Games · Prime Gaming' }
    ];

    function handleFreeGamesPlatformChange(val) {
      const nameInput = document.getElementById('add-freegames-name');
      if (!nameInput) return;
      const found = FREEGAMES_PLATFORMS.find(p => p.key === val);
      if (found && (!nameInput.value || nameInput.value.startsWith('Free Games ·'))) {
        nameInput.placeholder = found.name;
      }
    }

    async function submitAddFreeGamesFeed() {
      if (!currentGuildId) return;
      const platSelect = document.getElementById('add-freegames-platform');
      const nameInput = document.getElementById('add-freegames-name');
      const platformKey = platSelect ? platSelect.value : 'all';
      let name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        const found = FREEGAMES_PLATFORMS.find(p => p.key === platformKey);
        name = found ? found.name : 'Free Games · All Stores';
      }
      const feedType = platformKey === 'all' ? 'free_games' : ('free_games_' + platformKey);
      const url = 'freegames://' + platformKey;
      const targetSel = document.getElementById('add-freegames-target');
      const target = targetFieldsFromValue(targetSel ? targetSel.value : '');
      const roleSel = document.getElementById('add-freegames-role');
      const roleId = roleSel ? (roleSel.value || null) : null;

      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, feedType, guildId: currentGuildId, channelId: target.channelId, roleId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (nameInput) nameInput.value = '';
          renderCategoryFeeds('freegames');
        } else {
          alert(data.error || 'Failed to add Free Games feed');
        }
      } catch (err) {
        alert('Network error adding Free Games feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // Stream Alerts
    function cleanStreamHandle(raw) {
      let s = (raw || '').trim();
      s = s.replace(/^https?:[/][/]/gi, '');
      s = s.replace(/^(www[.])?(youtube[.]com|youtu[.]be|twitch[.]tv)[/]/gi, '');
      s = s.replace(/^@/, '');
      s = s.split('?')[0].split('#')[0].split('/')[0].trim();
      return s;
    }

    function handleStreamAlertsPlatformChange(val) {
      const nameInput = document.getElementById('add-streamalerts-name');
      if (!nameInput) return;
      nameInput.placeholder = val === 'youtube' ? 'YouTube · @channel' : 'Twitch · channel';
    }

    async function submitAddStreamAlertFeed() {
      if (!currentGuildId) return;
      const platformSel = document.getElementById('add-streamalerts-platform');
      const handleInput = document.getElementById('add-streamalerts-handle');
      const nameInput = document.getElementById('add-streamalerts-name');
      const platform = platformSel ? platformSel.value : 'youtube';
      const handle = cleanStreamHandle(handleInput ? handleInput.value : '');
      if (!handle) return alert('Please enter a channel handle or username.');
      const url = platform === 'youtube'
        ? 'https://www.youtube.com/@' + handle
        : 'https://www.twitch.tv/' + handle;
      let name = nameInput ? nameInput.value.trim() : '';
      if (!name) name = platform === 'youtube' ? 'YouTube · @' + handle : 'Twitch · ' + handle;
      const targetSel = document.getElementById('add-streamalerts-target');
      const target = targetFieldsFromValue(targetSel ? targetSel.value : '');
      const roleSel = document.getElementById('add-streamalerts-role');
      const roleId = roleSel ? (roleSel.value || null) : null;

      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, feedType: platform, guildId: currentGuildId, channelId: target.channelId, roleId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          if (handleInput) handleInput.value = '';
          if (nameInput) nameInput.value = '';
          renderCategoryFeeds('streamalerts');
        } else {
          alert(data.error || 'Failed to add stream alert feed');
        }
      } catch (err) {
        alert('Network error adding stream alert feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // News Feeds Presets Catalog
    async function loadNewsTab() {
      const container = document.getElementById('presets-list-container');
      if (!container) return;
      container.innerHTML = '<div class="empty-state">Loading news feeds catalog...</div>';
      try {
        const [presetsRes, feeds] = await Promise.all([
          fetch('/api/presets', { signal: AbortSignal.timeout(6000) }),
          loadGuildFeeds()
        ]);
        if (!presetsRes.ok) {
          container.innerHTML = '<div class="empty-state">Could not load news feeds catalog.</div>';
          return;
        }
        const presets = await presetsRes.json();
        if (!Array.isArray(presets) || !presets.length) {
          container.innerHTML = '<div class="empty-state">No presets available.</div>';
          return;
        }
        cachedPresets = presets;

        const groups = {};
        presets.forEach(p => {
          const cat = p.category || 'General';
          (groups[cat] = groups[cat] || []).push(p);
        });

        let fullHtml = '';
        for (const cat of Object.keys(groups)) {
          const items = groups[cat] || [];
          let itemsHtml = '';
          for (const p of items) {
            const existing = (feeds || []).find(f => f.url === p.url);
            if (existing) {
              itemsHtml += renderFeedPill(existing);
              continue;
            }
            const btnHtml = '<button data-preset-id="' + esc(p.id) + '" onclick="enablePreset(this.dataset.presetId)" class="btn btn-primary btn-sm"><i class="fa-solid fa-bolt"></i> Enable</button>';

            itemsHtml += '<div class="feed-pill">' +
              '<div class="feed-details">' +
                '<div class="feed-name-row">' +
                  '<span class="feed-name">' + esc(p.name) + '</span>' +
                  '<span class="badge badge-amber">Preset</span>' +
                '</div>' +
                '<div style="font-size: 0.8125rem; color: var(--text-muted);">' + esc(p.description) + '</div>' +
                '<div class="feed-url">' + esc(p.url) + '</div>' +
              '</div>' +
              '<div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">' +
                btnHtml +
              '</div>' +
            '</div>';
          }

          fullHtml += '<div style="display: flex; flex-direction: column; gap: 0.5rem;">' +
            '<div style="font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; color: var(--amber); display: flex; align-items: center; gap: 0.375rem;"><i class="fa-solid fa-folder-open"></i> ' + esc(cat) + '</div>' +
            '<div class="feed-list">' + itemsHtml + '</div>' +
          '</div>';
        }

        container.innerHTML = fullHtml;
      } catch {
        container.innerHTML = '<div class="empty-state">Failed to load news feeds catalog.</div>';
      }
    }

    async function enablePreset(presetId) {
      if (!currentGuildId) return;
      const preset = cachedPresets.find(p => p.id === presetId);
      if (!preset) return;
      try {
        const res = await fetch('/api/feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: preset.name, url: preset.url, topic: preset.category, feedType: 'rss', guildId: currentGuildId })
        });
        if (!checkAuth(res)) return;
        const data = await res.json();
        if (res.ok) {
          loadNewsTab();
          if (data && data.id) openFeedDetail(data.id);
        } else {
          alert(data.error || 'Failed to enable feed');
        }
      } catch (err) {
        alert('Network error enabling feed: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // Host Settings
    async function loadSettingsTab() {
      await loadUsersList();
    }

    async function loadUsersList() {
      const container = document.getElementById('users-list-container');
      if (!container) return;
      try {
        const res = await fetch('/api/settings/users', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return;
        const users = await res.json();
        if (!Array.isArray(users) || !users.length) {
          container.innerHTML = '<div class="empty-state">No registered users found.</div>';
          return;
        }
        container.innerHTML = users.map(u => {
          const roleBadge = (u.role === 'owner' || u.role === 'admin')
            ? '<span class="badge badge-amber"><i class="fa-solid fa-crown"></i> App Team</span>'
            : '<span class="badge badge-gray"><i class="fa-solid fa-user"></i> Member</span>';

          return '<div class="feed-pill">' +
            '<div class="feed-details">' +
              '<div class="feed-name-row">' +
                '<span class="feed-name">' + esc(u.displayName || 'Discord User') + '</span>' +
                roleBadge +
              '</div>' +
              '<div class="feed-meta">User ID: #' + u.id + ' &middot; Feeds: ' + u.feedCount + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      } catch {
        if (container) container.innerHTML = '<div class="empty-state">Failed to load users list.</div>';
      }
    }

    // Guild Admin
    const GUILD_ADMIN_FEATURES = [
      { key: 'feeds', label: 'Feeds', desc: 'RSS, Reddit, and Free Games polling' },
      { key: 'streamalerts', label: 'Stream Alerts', desc: 'YouTube & Twitch live/upload alerts' },
    ];

    function populateRoleSelect(selectId, roles, currentRoleId, placeholder) {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      let html = '<option value="">' + esc(placeholder) + '</option>';
      (roles || []).forEach(r => {
        const selected = r.id === currentRoleId ? 'selected' : '';
        const colorDot = r.color && r.color !== 0 ? ' <span style="color:#' + Number(r.color).toString(16).padStart(6, '0') + ';">&#9679;</span>' : '';
        html += '<option value="' + esc(r.id) + '" ' + selected + '>' + esc(r.name) + colorDot + '</option>';
      });
      sel.innerHTML = html;
    }

    function populateChannelSelect(selectId, channels, currentId, placeholder) {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      let html = '<option value="">' + esc(placeholder) + '</option>';
      (channels || []).forEach(ch => {
        const selected = ch.id === currentId ? 'selected' : '';
        html += '<option value="' + esc(ch.id) + '" ' + selected + '>#' + esc(ch.name) + '</option>';
      });
      sel.innerHTML = html;
    }

    function renderAdminEvents(containerId, keys, enabledList) {
      const box = document.getElementById(containerId);
      if (!box) return;
      if (!Array.isArray(enabledList)) enabledList = [];
      box.innerHTML = keys.map(key => {
        const on = enabledList.indexOf(key) !== -1;
        return '<label style="flex: 1; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; padding: 0.25rem 0;">' +
          '<input type="checkbox" data-event="' + esc(key) + '"' + (on ? ' checked' : '') + '> ' + esc(key) +
        '</label>';
      }).join('');
    }

    async function loadGuildAdminTab() {
      if (!currentGuildId) return;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return;
        if (!res.ok) {
          const featuresEl = document.getElementById('admin-features-list');
          if (featuresEl) featuresEl.innerHTML = '<div class="empty-state">Could not load guild settings.</div>';
          return;
        }
        const data = await res.json();

        populateRoleSelect('admin-admin-role', data.guildRoles || [], data.roles && data.roles.adminRoleId, '-- No Admin role --');

        const featuresEl = document.getElementById('admin-features-list');
        if (featuresEl) {
          featuresEl.innerHTML = GUILD_ADMIN_FEATURES.map(f => {
            const enabled = !!(data.features && data.features[f.key]);
            return '<div class="feed-pill" style="cursor: default;">' +
              '<label style="flex: 1; cursor: pointer; display: flex; align-items: center; gap: 0.75rem;">' +
                '<input type="checkbox" data-feature="' + f.key + '"' + (enabled ? ' checked' : '') + '>' +
                '<div class="feed-details">' +
                  '<div class="feed-name" style="font-weight: 600;">' + esc(f.label) + '</div>' +
                  '<div class="feed-meta">' + esc(f.desc) + '</div>' +
                '</div>' +
              '</label>' +
            '</div>';
          }).join('');
        }

        const commandsEl = document.getElementById('admin-commands-list');
        if (commandsEl && Array.isArray(data.commands)) {
          if (data.commands.length === 0) {
            commandsEl.innerHTML = '<div class="empty-state">No commands found.</div>';
          } else {
            commandsEl.innerHTML = data.commands.map(cmd => {
              const enabled = !cmd.disabled;
              return '<div class="feed-pill" style="cursor: default; padding: 0.5rem 0.75rem;">' +
                '<label style="flex: 1; cursor: pointer; display: flex; align-items: center; gap: 0.625rem;">' +
                  '<input type="checkbox" data-command="' + esc(cmd.name) + '"' + (enabled ? ' checked' : '') + '>' +
                  '<div class="feed-details" style="overflow: hidden;">' +
                    '<div class="feed-name" style="font-weight: 600; font-size: 0.875rem;">/' + esc(cmd.name) + ' <span style="font-size: 0.7rem; font-weight: 400; opacity: 0.7;">(' + esc(cmd.category) + ')</span></div>' +
                    '<div class="feed-meta" style="font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + esc(cmd.description || '') + '</div>' +
                  '</div>' +
                '</label>' +
              '</div>';
            }).join('');
          }
        }

        const prefixEl = document.getElementById('admin-prefix');
        if (prefixEl) prefixEl.value = data.prefix || '';
        const threadsEl = document.getElementById('admin-threads-enabled');
        if (threadsEl) threadsEl.checked = !!data.threadsEnabled;
      } catch {
        const featuresEl = document.getElementById('admin-features-list');
        if (featuresEl) featuresEl.innerHTML = '<div class="empty-state">Failed to load guild settings.</div>';
        const commandsEl = document.getElementById('admin-commands-list');
        if (commandsEl) commandsEl.innerHTML = '<div class="empty-state">Failed to load commands.</div>';
      }
    }

    async function loadWelcomeTab() {
      if (!currentGuildId) return;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return;
        if (!res.ok) return;
        const data = await res.json();
        const welcome = data.welcome || {};
        populateChannelSelect('admin-welcome-channel', data.textChannels || [], welcome.channelId, '-- Disabled --');
        const welcomeEmbedEl = document.getElementById('admin-welcome-embed');
        if (welcomeEmbedEl) welcomeEmbedEl.value = welcome.embed ? '1' : '0';
        const welcomeMsgEl = document.getElementById('admin-welcome-message');
        if (welcomeMsgEl) welcomeMsgEl.value = welcome.message || '';
      } catch {}
    }

    async function loadTicketsTab() {
      if (!currentGuildId) return;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return;
        if (!res.ok) return;
        const data = await res.json();
        const tickets = data.tickets || {};
        populateChannelSelect('admin-ticket-channel', data.textChannels || [], tickets.channelId, '-- Disabled --');
        populateRoleSelect('admin-ticket-manager-role', data.guildRoles || [], tickets.managerRoleId, '-- None --');
        populateChannelSelect('admin-ticket-transcript-channel', data.textChannels || [], tickets.transcriptChannelId, '-- None --');
        populateChannelSelect('admin-ticket-log-channel', data.textChannels || [], tickets.logChannelId, '-- None --');
        const ticketMsgEl = document.getElementById('admin-ticket-message');
        if (ticketMsgEl) ticketMsgEl.value = tickets.ticketMessage || tickets.message || tickets.welcomeMessage || '';
      } catch {}
    }

    async function loadLogsTab() {
      if (!currentGuildId) return;
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', { signal: AbortSignal.timeout(6000) });
        if (!checkAuth(res)) return;
        if (!res.ok) return;
        const data = await res.json();
        const logs = data.logs || {};
        populateChannelSelect('admin-audit-channel', data.textChannels || [], logs.auditLogChannelId, '-- None --');
        populateChannelSelect('admin-modlog-channel', data.textChannels || [], logs.modLogChannelId, '-- None --');
        renderAdminEvents('admin-audit-events', ['settings', 'welcome', 'tickets', 'feeds'], logs.auditLogEvents);
        renderAdminEvents('admin-modlog-events', ['warn', 'kick', 'ban', 'unban', 'mute', 'unmute', 'purge', 'slowmode', 'lock', 'unlock'], logs.modLogEvents);
      } catch {}
    }

    async function saveGuildAdmin() {
      if (!currentGuildId) return;
      const statusEl = document.getElementById('admin-save-status');
      if (statusEl) statusEl.style.display = 'none';

      const adminRoleId = document.getElementById('admin-admin-role') ? document.getElementById('admin-admin-role').value || null : null;

      const features = {};
      document.querySelectorAll('#admin-features-list input[data-feature]').forEach(chk => {
        features[chk.getAttribute('data-feature')] = chk.checked;
      });

      const commands = {};
      document.querySelectorAll('#admin-commands-list input[data-command]').forEach(chk => {
        commands[chk.getAttribute('data-command')] = chk.checked;
      });

      const prefix = document.getElementById('admin-prefix') ? document.getElementById('admin-prefix').value.trim() : '';
      const threadsEnabled = document.getElementById('admin-threads-enabled') ? document.getElementById('admin-threads-enabled').checked : undefined;

      const body = { adminRoleId, prefix, features, commands, threadsEnabled };
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000)
        });
        if (!checkAuth(res)) return;
        if (res.ok) {
          if (statusEl) {
            statusEl.style.display = 'inline';
            statusEl.textContent = 'Settings saved successfully.';
            setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
          }
          refreshCurrentTab();
        } else {
          let msg = 'Failed to save settings.';
          try {
            const j = await res.json();
            if (j && j.error) msg = j.error;
          } catch {}
          alert(msg);
        }
      } catch {
        alert('Failed to save settings.');
      }
    }

    async function saveWelcomeTab() {
      if (!currentGuildId) return;
      const statusEl = document.getElementById('welcome-save-status');
      if (statusEl) statusEl.style.display = 'none';
      const welcome = {
        channelId: document.getElementById('admin-welcome-channel') ? document.getElementById('admin-welcome-channel').value || null : null,
        message: document.getElementById('admin-welcome-message') ? document.getElementById('admin-welcome-message').value : '',
        embed: document.getElementById('admin-welcome-embed') ? document.getElementById('admin-welcome-embed').value === '1' : false,
      };
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ welcome }),
          signal: AbortSignal.timeout(10000)
        });
        if (!checkAuth(res)) return;
        if (res.ok) {
          if (statusEl) {
            statusEl.style.display = 'inline';
            statusEl.textContent = 'Welcome settings saved successfully.';
            setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
          }
        } else {
          let msg = 'Failed to save welcome settings.';
          try {
            const j = await res.json();
            if (j && j.error) msg = j.error;
          } catch {}
          alert(msg);
        }
      } catch {
        alert('Failed to save welcome settings.');
      }
    }

    async function saveTicketsTab() {
      if (!currentGuildId) return;
      const statusEl = document.getElementById('tickets-save-status');
      if (statusEl) statusEl.style.display = 'none';
      const tickets = {
        channelId: document.getElementById('admin-ticket-channel') ? document.getElementById('admin-ticket-channel').value || null : null,
        managerRoleId: document.getElementById('admin-ticket-manager-role') ? document.getElementById('admin-ticket-manager-role').value || null : null,
        transcriptChannelId: document.getElementById('admin-ticket-transcript-channel') ? document.getElementById('admin-ticket-transcript-channel').value || null : null,
        logChannelId: document.getElementById('admin-ticket-log-channel') ? document.getElementById('admin-ticket-log-channel').value || null : null,
        message: document.getElementById('admin-ticket-message') ? document.getElementById('admin-ticket-message').value : '',
        welcomeMessage: document.getElementById('admin-ticket-message') ? document.getElementById('admin-ticket-message').value : '',
      };
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickets }),
          signal: AbortSignal.timeout(10000)
        });
        if (!checkAuth(res)) return;
        if (res.ok) {
          if (statusEl) {
            statusEl.style.display = 'inline';
            statusEl.textContent = 'Ticket settings saved successfully.';
            setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
          }
        } else {
          let msg = 'Failed to save ticket settings.';
          try {
            const j = await res.json();
            if (j && j.error) msg = j.error;
          } catch {}
          alert(msg);
        }
      } catch {
        alert('Failed to save ticket settings.');
      }
    }

    async function saveLogsTab() {
      if (!currentGuildId) return;
      const statusEl = document.getElementById('logs-save-status');
      if (statusEl) statusEl.style.display = 'none';
      const collectEvents = (containerId) => {
        const names = [];
        document.querySelectorAll('#' + containerId + ' input[data-event]').forEach(chk => {
          if (chk.checked) names.push(chk.getAttribute('data-event'));
        });
        return names;
      };
      const logs = {
        auditLogChannelId: document.getElementById('admin-audit-channel') ? document.getElementById('admin-audit-channel').value || null : null,
        auditLogEvents: collectEvents('admin-audit-events'),
        modLogChannelId: document.getElementById('admin-modlog-channel') ? document.getElementById('admin-modlog-channel').value || null : null,
        modLogEvents: collectEvents('admin-modlog-events'),
      };
      try {
        const res = await fetch('/api/guilds/' + encodeURIComponent(currentGuildId) + '/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs }),
          signal: AbortSignal.timeout(10000)
        });
        if (!checkAuth(res)) return;
        if (res.ok) {
          if (statusEl) {
            statusEl.style.display = 'inline';
            statusEl.textContent = 'Log settings saved successfully.';
            setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
          }
        } else {
          let msg = 'Failed to save log settings.';
          try {
            const j = await res.json();
            if (j && j.error) msg = j.error;
          } catch {}
          alert(msg);
        }
      } catch {
        alert('Failed to save log settings.');
      }
    }

    async function loadCommandsTab() {
      const box = document.getElementById('commands-catalog');
      if (!box) return;
      const CATEGORY_LABELS = { feeds: 'Feeds & Alerts', admin: 'Administration', mod: 'Moderation', utility: 'Utility' };
      const CATEGORY_EMOJIS = { feeds: '📰', admin: '🛡️', mod: '⚖️', utility: '🔧' };
      try {
        const res = await fetch('/api/commands', { signal: AbortSignal.timeout(6000) });
        if (!res.ok) {
          box.innerHTML = '<div class="empty-state">Could not load commands.</div>';
          return;
        }
        const data = await res.json();
        if (!data.sections || !data.sections.length) {
          box.innerHTML = '<div class="empty-state">No commands available.</div>';
          return;
        }
        const escCmd = (s) => esc(s || '');
        box.innerHTML = data.sections.map(section => {
          const label = CATEGORY_LABELS[section.category] || section.category;
          const emoji = CATEGORY_EMOJIS[section.category] || '💡';
          const cards = section.commands.map(cmd => {
            const usage = cmd.usage && cmd.usage !== '/' + cmd.name
              ? '<p style="margin: 0 0 0.5rem;"><code style="background: rgba(0,0,0,0.4); padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-family: monospace; color: var(--text);">' + escCmd(cmd.usage) + '</code></p>'
              : '';
            const optionsHtml = (Array.isArray(cmd.options) && cmd.options.length)
              ? '<ul style="margin: 0.5rem 0 0 1.25rem; padding-left: 1rem; font-size: 0.8125rem; color: var(--text-muted);">' + cmd.options.map(o => '<li style="margin-bottom: 0.25rem;"><code style="background: rgba(0,0,0,0.4); padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-family: monospace; color: var(--primary);">' + escCmd(o.name) + (o.required ? '*' : '') + '</code> — ' + escCmd(o.description) + '</li>').join('') + '</ul>' : '';
            const examplesHtml = (Array.isArray(cmd.examples) && cmd.examples.length)
              ? '<p style="margin: 0.75rem 0 0.25rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Examples</p><ul style="margin: 0.5rem 0 0 1.25rem; padding-left: 1rem; font-size: 0.8125rem;">' + cmd.examples.map(ex => '<li style="margin-bottom: 0.25rem;"><code style="background: rgba(0,0,0,0.4); padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-family: monospace; color: var(--text);">' + escCmd(ex) + '</code></li>').join('') + '</ul>' : '';
            return '<div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; margin-bottom: 1rem;">' +
              '<div style="display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.5rem;">' +
                '<span style="font-size: 1rem;">' + emoji + '</span>' +
                '<h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text); margin: 0;"><code style="background: rgba(0,0,0,0.4); padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-family: monospace; color: var(--primary);">/' + escCmd(cmd.name) + '</code></h3>' +
              '</div>' +
              usage +
              '<p style="color: var(--text-muted); line-height: 1.55; margin-bottom: 0.5rem;">' + escCmd(cmd.description) + '</p>' +
              optionsHtml + examplesHtml +
            '</div>';
          }).join('');
          return '<div style="margin-bottom: 2rem;">' +
            '<h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">' + emoji + ' ' + label + ' <span style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); background: var(--card-inner); border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 9999px;">' + section.commands.length + '</span></h2>' +
            cards +
          '</div>';
        }).join('');
      } catch {
        box.innerHTML = '<div class="empty-state">Failed to load commands.</div>';
      }
    }

    // Initialize on page load
    loadUserProfile();

    // User dropdown toggle
    (function () {
      var trigger = document.getElementById('user-menu-trigger');
      var box = document.getElementById('user-menu');
      if (trigger && box) {
        trigger.addEventListener('click', function (e) {
          e.stopPropagation();
          box.classList.toggle('open');
          trigger.setAttribute('aria-expanded', box.classList.contains('open') ? 'true' : 'false');
        });
        document.addEventListener('click', function () {
          box.classList.remove('open');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
        box.addEventListener('click', function (e) { e.stopPropagation(); });
      }
    })();

    // Handle browser back/forward
    window.addEventListener('popstate', applyRoute);

    // Initial route resolution
    applyRoute();
  `;
}
