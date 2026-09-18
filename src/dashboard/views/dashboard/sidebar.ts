export interface SidebarOptions {
  isHost: boolean;
  redditAvailable: boolean;
}

export function renderSidebar(options: SidebarOptions): string {
  const { isHost, redditAvailable } = options;

  return `
    <nav class="sidebar">
      <div>
        <!-- Active Server Banner / Switcher -->
        <div class="sidebar-guild-banner" id="sidebar-guild-banner">
          <div class="sidebar-guild-info">
            <img id="sidebar-guild-icon" class="sidebar-guild-img hidden" src="" alt="Server Icon">
            <div class="sidebar-guild-avatar-fallback" id="sidebar-guild-avatar-fallback">
              <i class="fa-solid fa-server"></i>
            </div>
            <div class="sidebar-guild-meta">
              <span class="sidebar-guild-name" id="sidebar-guild-name">Select Server</span>
              <span class="sidebar-guild-sub">Active Guild</span>
            </div>
          </div>
          <button onclick="clearGuild(event)" class="btn btn-ghost btn-xs" title="Switch Server">
            <i class="fa-solid fa-arrow-right-arrow-left"></i>
          </button>
        </div>

        <!-- Section: General -->
        <div class="nav-section">
          <div class="nav-section-title"><i class="fa-solid fa-compass"></i> General</div>
          <div class="tab-list">
            <button onclick="switchTab('overview')" id="tab-btn-overview" class="tab-btn">
              <i class="fa-solid fa-chart-pie" style="color: var(--primary);"></i> <span>Overview</span>
            </button>
            <button onclick="switchTab('guildadmin')" id="tab-btn-guildadmin" class="tab-btn">
              <i class="fa-solid fa-shield-halved" style="color: #6366f1;"></i> <span>Server Admin</span>
            </button>
          </div>
        </div>

        <!-- Section: Feed Subscriptions -->
        <div class="nav-section">
          <div class="nav-section-title"><i class="fa-solid fa-rss"></i> Feeds &amp; Alerts</div>
          <div class="tab-list">
            <button onclick="switchTab('rss')" id="tab-btn-rss" class="tab-btn active">
              <i class="fa-solid fa-newspaper" style="color: var(--amber);"></i> <span>News &amp; RSS</span>
            </button>
            <button onclick="switchTab('reddit')" id="tab-btn-reddit" class="tab-btn" ${
              redditAvailable ? '' : 'disabled title="Reddit feeds are disabled — add cookies.json to the repo root"'
            }>
              <i class="fa-brands fa-reddit" style="color: #ff4500;"></i> <span>Reddit</span> ${
                redditAvailable
                  ? ''
                  : '<i class="fa-solid fa-lock" style="color: var(--text-dim); margin-left: 0.25rem; font-size: 0.625rem;"></i>'
              }
            </button>
            <button onclick="switchTab('freegames')" id="tab-btn-freegames" class="tab-btn">
              <i class="fa-solid fa-gift" style="color: #10b981;"></i> <span>Free Games</span>
            </button>
            <button onclick="switchTab('streamalerts')" id="tab-btn-streamalerts" class="tab-btn">
              <i class="fa-solid fa-satellite-dish" style="color: #9146ff;"></i> <span>Stream Alerts</span>
            </button>
          </div>
        </div>



        <!-- Section: System -->
        ${
          isHost
            ? `<div class="nav-section">
          <div class="nav-section-title"><i class="fa-solid fa-sliders"></i> System</div>
          <div class="tab-list">
            <button onclick="switchTab('settings')" id="tab-btn-settings" class="tab-btn">
              <i class="fa-solid fa-gear" style="color: var(--text-dim);"></i> <span>Settings</span>
            </button>
          </div>
        </div>`
            : ''
        }
      </div>

      <div class="sidebar-footer">
        <a href="/dashboard" onclick="clearGuild(event)" id="change-server-link"><i class="fa-solid fa-server"></i> Servers</a>
        <span>&middot;</span>
        <a href="/privacy">Privacy</a>
        <span>&middot;</span>
        <a href="/tos">Terms</a>
      </div>
    </nav>
  `;
}
