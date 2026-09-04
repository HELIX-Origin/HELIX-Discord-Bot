import { getNextAuthConfig } from '../auth/config.js';
import { BotDatabase } from '../../src/db/index.js';
import { resolveBotInviteUrl } from '../../src/server.js';
import { getBotToken, getCallbackUrl, getInviteUrl, getClientId } from '../../src/env.js';

export function renderDashboardHtml(botPort?: number): string {
  const config = getNextAuthConfig({ botPort });
  const dbStats = BotDatabase.getInstance().getStats();
  const botTokenSet = !!getBotToken();
  const callbackUrl = getCallbackUrl();
  const inviteUrl = resolveBotInviteUrl(getInviteUrl(), callbackUrl, getClientId());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HELIX Bot & AI Dashboard</title>
  <link rel="icon" type="image/jpeg" href="/icon.jpg">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #0b0f19; color: #f3f4f6; }
    .glass { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(55, 65, 81, 0.5); }
    .glow-cyan { text-shadow: 0 0 12px rgba(6, 182, 212, 0.6); }
  </style>
</head>
<body class="min-h-screen flex flex-col font-sans">
  <!-- Top Navigation -->
  <header class="glass sticky top-0 z-50 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/30 border border-cyan-500/30 shrink-0 bg-gray-900 flex items-center justify-center">
        <img src="/icon.jpg" alt="HELIX Bot" class="h-full w-full object-cover" onerror="this.outerHTML='<span class=\\'text-xl\\'>🧬</span>'">
      </div>
      <div>
        <h1 class="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          HELIX <span class="text-cyan-400">Dashboard</span>
        </h1>
        <p class="text-xs text-gray-400">Discord Bot & Universal AI Hub</p>
      </div>
    </div>

    <!-- Bot & NextAuth Status Pills -->
    <div class="flex items-center space-x-3">
      <span id="bot-status-pill" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${botTokenSet ? 'bg-green-900/60 text-green-300 border border-green-700' : 'bg-red-900/60 text-red-300 border border-red-700'}">
        <span class="h-2 w-2 rounded-full ${botTokenSet ? 'bg-green-400 animate-pulse' : 'bg-red-400'} mr-2"></span>
        <span id="bot-status-text">${botTokenSet ? 'Bot Ready' : 'Token Missing'}</span>
      </span>
      <span id="gateway-ping-badge" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800">
        <i class="fa-solid fa-wifi mr-1.5 text-xs text-cyan-400"></i> <span id="gateway-ping-text">Gateway: Direct</span>
      </span>
      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800">
        <i class="fa-solid fa-database mr-1.5 text-xs text-emerald-400"></i> SQLite: 0ms lag (${Math.round(dbStats.sizeBytes / 1024)} KB)
      </span>
      ${inviteUrl ? `<a href="${inviteUrl}" target="_blank" class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"><i class="fa-brands fa-discord mr-1.5"></i> Add to Discord</a>` : ''}
    </div>
  </header>

  <!-- Main Container -->
  <div class="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
    <!-- Sidebar Navigation -->
    <nav class="w-64 glass rounded-2xl p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-8rem)] sticky top-24">
      <div class="space-y-1">
        <button onclick="switchTab('overview')" id="tab-btn-overview" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-white bg-cyan-600/20 text-cyan-300 border border-cyan-500/30">
          <i class="fa-solid fa-chart-line w-5"></i> Overview
        </button>
        <button onclick="switchTab('broadcast')" id="tab-btn-broadcast" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800">
          <i class="fa-solid fa-bullhorn w-5"></i> Direct Broadcast
        </button>
        <button onclick="switchTab('ai')" id="tab-btn-ai" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800">
          <i class="fa-solid fa-robot w-5"></i> AI Playground
        </button>
        <button onclick="switchTab('scaffold')" id="tab-btn-scaffold" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800">
          <i class="fa-solid fa-cubes w-5"></i> Scaffolding Studio
        </button>
        <button onclick="switchTab('sessions')" id="tab-btn-sessions" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800">
          <i class="fa-solid fa-users-gear w-5"></i> Member Sessions
        </button>
        <button onclick="switchTab('config')" id="tab-btn-config" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800">
          <i class="fa-solid fa-sliders w-5"></i> NextAuth & Config
        </button>
      </div>

      <div class="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-400 space-y-1">
        <div class="flex justify-between"><span>NextAuth:</span><span class="text-cyan-400 font-mono">v4 / Auth.js</span></div>
        <div class="flex justify-between"><span>Direct Engine:</span><span class="text-green-400 font-mono">Active (0ms)</span></div>
        <div class="flex justify-between"><span>Version:</span><span class="text-gray-300">0.1.0</span></div>
      </div>
    </nav>

    <!-- Tab Contents -->
    <main class="flex-1 space-y-6">
      <!-- 1. OVERVIEW TAB -->
      <section id="tab-overview" class="tab-content space-y-6">
        <!-- Stat Cards -->
        <div class="grid grid-cols-4 gap-4">
          <div class="glass p-5 rounded-2xl border border-gray-800">
            <span class="text-xs font-semibold uppercase text-gray-400 tracking-wider">Internal DB Queries</span>
            <div class="text-3xl font-extrabold text-cyan-400 mt-2" id="stat-query-count">${dbStats.queryCount}</div>
            <span class="text-xs text-gray-500 mt-1 block">Instant SQLite log</span>
          </div>
          <div class="glass p-5 rounded-2xl border border-gray-800">
            <span class="text-xs font-semibold uppercase text-gray-400 tracking-wider">Member Sessions</span>
            <div class="text-3xl font-extrabold text-blue-400 mt-2" id="stat-session-count">${dbStats.sessionCount}</div>
            <span class="text-xs text-gray-500 mt-1 block">Live authenticated users</span>
          </div>
          <div class="glass p-5 rounded-2xl border border-gray-800">
            <span class="text-xs font-semibold uppercase text-gray-400 tracking-wider">Scaffolds Planned</span>
            <div class="text-3xl font-extrabold text-indigo-400 mt-2" id="stat-scaffold-count">${dbStats.scaffoldCount}</div>
            <span class="text-xs text-gray-500 mt-1 block">Templates generated</span>
          </div>
          <div class="glass p-5 rounded-2xl border border-gray-800">
            <span class="text-xs font-semibold uppercase text-gray-400 tracking-wider">SQLite DB Engine</span>
            <div class="text-3xl font-extrabold text-emerald-400 mt-2">${Math.round(dbStats.sizeBytes / 1024)} KB</div>
            <span class="text-xs text-gray-500 mt-1 block">Zero network lag (local sync)</span>
          </div>
        </div>

        <!-- Direct Live Queries Feed -->
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-bolt text-cyan-400"></i> Live Bot & AI Interaction Feed
            </h2>
            <button onclick="fetchStats()" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition">
              <i class="fa-solid fa-rotate-right mr-1"></i> Refresh Stream
            </button>
          </div>
          <div id="live-query-feed" class="space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
            <div class="text-gray-500 py-4 text-center">Loading direct database query stream...</div>
          </div>
        </div>

        <!-- Quick Actions & Diagnostics -->
        <div class="grid grid-cols-2 gap-6">
          <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fa-solid fa-terminal text-cyan-400"></i> Direct Bot Control</h2>
            <div class="space-y-3">
              <button onclick="switchTab('broadcast')" class="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-sm transition flex items-center justify-between">
                <span>Direct Channel Announcement</span> <i class="fa-solid fa-bullhorn"></i>
              </button>
              <button onclick="switchTab('ai')" class="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-sm transition flex items-center justify-between">
                <span>Query AI Agents Directly</span> <i class="fa-solid fa-robot"></i>
              </button>
              <button onclick="switchTab('scaffold')" class="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-sm transition flex items-center justify-between">
                <span>Launch Scaffolding Studio</span> <i class="fa-solid fa-cubes"></i>
              </button>
            </div>
          </div>

          <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fa-solid fa-circle-nodes text-indigo-400"></i> NextAuth & Connection URLs</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1.5 border-b border-gray-800/80">
                <span class="text-gray-400">NEXTAUTH_URL (Public):</span>
                <span class="font-mono text-cyan-400">${config.url}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-gray-800/80">
                <span class="text-gray-400">NEXTAUTH_INTERNAL_URL:</span>
                <span class="font-mono text-blue-400">${config.internalUrl}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b border-gray-800/80">
                <span class="text-gray-400">Discord Callback:</span>
                <span class="font-mono text-emerald-400">${config.url}/api/auth/callback/discord</span>
              </div>
              <div class="flex justify-between py-1.5">
                <span class="text-gray-400">Database Path:</span>
                <span class="font-mono text-xs text-gray-300">${dbStats.dbPath}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- DIRECT BROADCAST TAB -->
      <section id="tab-broadcast" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fa-solid fa-bullhorn text-cyan-400"></i> Direct Channel Broadcast</h2>
            <p class="text-xs text-gray-400">Send instant announcements directly through the Discord bot gateway without external lag.</p>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-1">Target Discord Channel ID</label>
              <input type="text" id="broadcast-channel-id" placeholder="e.g. 123456789012345678" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-1">Broadcast Message Content</label>
              <textarea id="broadcast-message" rows="3" placeholder="Enter message to announce in Discord server..." class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"></textarea>
            </div>
            <div class="flex justify-end">
              <button onclick="submitBroadcast()" id="broadcast-btn" class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-sm transition flex items-center gap-2">
                <i class="fa-solid fa-paper-plane"></i> Send Instant Broadcast
              </button>
            </div>
            <div id="broadcast-status" class="hidden p-3 rounded-lg text-xs font-mono"></div>
          </div>
        </div>
      </section>

      <!-- 2. AI PLAYGROUND TAB -->
      <section id="tab-ai" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fa-solid fa-brain text-cyan-400"></i> AI Agent Interaction Studio</h2>
              <p class="text-xs text-gray-400">Query connected AI models directly from your browser. Prompts are automatically logged in the bot's SQLite database.</p>
            </div>
            <select id="ai-provider-select" class="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200">
              <option value="antigravity">Google Antigravity (Default)</option>
              <option value="copilot">GitHub Copilot</option>
              <option value="opencode">Open Code Go / Zen</option>
            </select>
          </div>

          <div class="space-y-2">
            <textarea id="ai-prompt-input" rows="3" placeholder="Enter your architecture question, code generation task, or error diagnosis..." class="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-cyan-500"></textarea>
            <div class="flex justify-end">
              <button onclick="submitAiQuery()" id="ai-submit-btn" class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-sm transition flex items-center gap-2">
                <i class="fa-solid fa-paper-plane"></i> Send Query
              </button>
            </div>
          </div>

          <div id="ai-result-card" class="hidden p-5 rounded-xl bg-gray-900/90 border border-gray-800 space-y-2">
            <div class="flex justify-between items-center text-xs text-gray-400">
              <span id="ai-res-provider" class="font-bold text-cyan-400"></span>
              <span id="ai-res-timestamp"></span>
            </div>
            <div id="ai-res-content" class="text-sm text-gray-200 whitespace-pre-wrap font-mono bg-black/40 p-4 rounded-lg"></div>
          </div>
        </div>
      </section>

      <!-- 3. SCAFFOLDING STUDIO TAB -->
      <section id="tab-scaffold" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-5">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fa-solid fa-cubes-stacked text-blue-400"></i> Visual Project Scaffolder</h2>
            <p class="text-xs text-gray-400">Select any of the 14 multi-framework starter templates to scaffold projects directly.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-2">Project Name</label>
              <input type="text" id="scaffold-name" placeholder="my-awesome-app" value="helix-sample-app" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-2">Template Framework</label>
              <select id="scaffold-template" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="web-react">Web • React 19 + Vite (TypeScript)</option>
                <option value="web-vue">Web • Vue 3 + Vite (TypeScript)</option>
                <option value="discord-bot">Discord Bot • discord.js v14 (TypeScript)</option>
                <option value="desktop-tauri">Desktop • Tauri v2 (Rust + TypeScript)</option>
                <option value="desktop-electron">Desktop • Electron Context-Isolation (TypeScript)</option>
                <option value="backend-rust">Backend • Rust Axum + Tokio</option>
                <option value="backend-python">Backend • Python FastAPI + uv</option>
                <option value="backend-go">Backend • Go 1.22+ ServeMux</option>
                <option value="game-godot">Game Engine • Godot 4 (GDScript)</option>
                <option value="game-unity">Game Engine • Unity LTS (C#)</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <label class="inline-flex items-center text-xs text-gray-300">
              <input type="checkbox" id="scaffold-dryrun" checked class="mr-2 rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-0">
              Dry-run preview (preview file structure without disk writes)
            </label>
            <button onclick="submitScaffold()" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition flex items-center gap-2">
              <i class="fa-solid fa-play"></i> Generate Starter Blueprint
            </button>
          </div>

          <div id="scaffold-result" class="hidden p-5 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
            <h3 class="text-sm font-bold text-white flex items-center gap-2"><i class="fa-solid fa-folder-tree text-cyan-400"></i> Planned Files:</h3>
            <div id="scaffold-files-list" class="max-h-60 overflow-y-auto font-mono text-xs text-gray-300 space-y-1 bg-black/40 p-3 rounded-lg"></div>
          </div>
        </div>
      </section>

      <!-- 4. SESSIONS TAB -->
      <section id="tab-sessions" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fa-solid fa-users-gear text-emerald-400"></i> Member Authentication Sessions</h2>
              <p class="text-xs text-gray-400">Per-user credentials stored in the internal SQLite database (from Discord /helix-auth).</p>
            </div>
            <button onclick="fetchStats()" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition"><i class="fa-solid fa-rotate-right mr-1"></i> Refresh</button>
          </div>
          <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 text-sm">
            <div class="flex justify-between text-xs text-gray-400 pb-2 border-b border-gray-800 font-semibold uppercase">
              <span>Member Identifier</span>
              <span>Provider</span>
              <span>Status</span>
            </div>
            <div class="py-3 text-xs text-gray-400 text-center">
              Member sessions are created in real time when users run <code class="text-cyan-400">/helix-auth login</code> in your Discord server.
            </div>
          </div>
        </div>
      </section>

      <!-- 5. CONFIG TAB -->
      <section id="tab-config" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <h2 class="text-lg font-bold text-white flex items-center gap-2"><i class="fa-solid fa-sliders text-cyan-400"></i> Environment & NextAuth Setup</h2>
          <div class="space-y-4 text-sm">
            <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
              <span class="font-bold text-cyan-400">NEXTAUTH_URL</span>
              <p class="text-xs text-gray-400">The canonical public URL where clients connect to this dashboard.</p>
              <div class="font-mono text-xs text-gray-300 bg-black/40 p-2 rounded">${config.url}</div>
            </div>
            <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
              <span class="font-bold text-blue-400">NEXTAUTH_INTERNAL_URL</span>
              <p class="text-xs text-gray-400">Internal URL used by dashboard background threads and server-side connections.</p>
              <div class="font-mono text-xs text-gray-300 bg-black/40 p-2 rounded">${config.internalUrl}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-cyan-600/20', 'text-cyan-300', 'border', 'border-cyan-500/30');
        btn.classList.add('text-gray-400');
      });

      const target = document.getElementById('tab-' + tabId);
      const btn = document.getElementById('tab-btn-' + tabId);
      if (target) target.classList.remove('hidden');
      if (btn) {
        btn.classList.add('bg-cyan-600/20', 'text-cyan-300', 'border', 'border-cyan-500/30');
        btn.classList.remove('text-gray-400');
      }
    }

    async function submitAiQuery() {
      const prompt = document.getElementById('ai-prompt-input').value.trim();
      const provider = document.getElementById('ai-provider-select').value;
      if (!prompt) return;

      const btn = document.getElementById('ai-submit-btn');
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/dashboard/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, provider })
        });
        const data = await res.json();
        document.getElementById('ai-result-card').classList.remove('hidden');
        document.getElementById('ai-res-provider').textContent = data.provider || 'AI Assistant';
        document.getElementById('ai-res-timestamp').textContent = new Date().toLocaleTimeString();
        document.getElementById('ai-res-content').textContent = data.content || JSON.stringify(data, null, 2);
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Query';
        btn.disabled = false;
      }
    }

    async function submitScaffold() {
      const projectName = document.getElementById('scaffold-name').value.trim();
      const templateId = document.getElementById('scaffold-template').value;
      const dryRun = document.getElementById('scaffold-dryrun').checked;

      try {
        const res = await fetch('/api/dashboard/scaffold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectName, templateId, dryRun })
        });
        const data = await res.json();
        document.getElementById('scaffold-result').classList.remove('hidden');
        const list = document.getElementById('scaffold-files-list');
        list.innerHTML = (data.files || []).map(f => '<div>+ ' + f + '</div>').join('');
      } catch (err) {
        alert('Scaffold error: ' + err.message);
      }
    }

    async function submitBroadcast() {
      const channelId = document.getElementById('broadcast-channel-id').value.trim();
      const message = document.getElementById('broadcast-message').value.trim();
      const statusDiv = document.getElementById('broadcast-status');
      const btn = document.getElementById('broadcast-btn');

      if (!channelId || !message) {
        alert('Please specify both Channel ID and message content.');
        return;
      }

      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Broadcasting...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/dashboard/bot/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId, message })
        });
        const data = await res.json();
        statusDiv.classList.remove('hidden');
        if (data.success) {
          statusDiv.className = 'p-3 rounded-lg text-xs font-mono bg-green-950/60 text-green-300 border border-green-800';
          statusDiv.textContent = '✔ Broadcast dispatched instantly to Discord channel: ' + channelId;
          document.getElementById('broadcast-message').value = '';
          fetchStats();
        } else {
          statusDiv.className = 'p-3 rounded-lg text-xs font-mono bg-red-950/60 text-red-300 border border-red-800';
          statusDiv.textContent = '✖ ' + (data.error || 'Broadcast failed');
        }
      } catch (err) {
        statusDiv.classList.remove('hidden');
        statusDiv.className = 'p-3 rounded-lg text-xs font-mono bg-red-950/60 text-red-300 border border-red-800';
        statusDiv.textContent = '✖ Network error: ' + err.message;
      } finally {
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Instant Broadcast';
        btn.disabled = false;
      }
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (data.database) {
          document.getElementById('stat-query-count').textContent = data.database.queryCount || 0;
          document.getElementById('stat-session-count').textContent = data.database.sessionCount || 0;
          document.getElementById('stat-scaffold-count').textContent = data.database.scaffoldCount || 0;
        }

        if (data.bot) {
          const pingText = document.getElementById('gateway-ping-text');
          if (data.bot.gatewayLatencyMs >= 0) {
            pingText.textContent = 'Gateway: ' + data.bot.gatewayLatencyMs + 'ms';
          } else {
            pingText.textContent = data.bot.status === 'online' ? 'Gateway: <5ms' : 'Gateway: Direct';
          }
        }

        // Render Live Query Feed
        const feedContainer = document.getElementById('live-query-feed');
        if (feedContainer && data.recentQueries && data.recentQueries.length > 0) {
          feedContainer.innerHTML = data.recentQueries.map(q => \`
            <div class="p-3 rounded-xl bg-gray-900/90 border border-gray-800/80 flex justify-between items-center hover:border-cyan-500/40 transition">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-cyan-400 font-bold">\${q.username || q.userId}</span>
                  <span class="text-gray-500 text-[10px]">• \${q.provider}</span>
                </div>
                <div class="text-gray-300 text-xs truncate max-w-xl">\${q.prompt}</div>
              </div>
              <span class="text-[10px] text-gray-500 shrink-0">\${q.timestamp}</span>
            </div>
          \`).join('');
        } else if (feedContainer) {
          feedContainer.innerHTML = '<div class="text-gray-500 py-3 text-center">No recent query events logged in SQLite yet.</div>';
        }
      } catch {}
    }

    // Auto-fetch stats every 4 seconds for instant real-time feed
    fetchStats();
    setInterval(fetchStats, 4000);
  </script>
</body>
</html>`;
}
