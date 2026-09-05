import { getNextAuthConfig } from '../auth/config.js';
import { BotDatabase } from '../../src/db/database.js';
import { resolveBotInviteUrl } from '../../src/server.js';
import { getBotToken, getCallbackUrl, getInviteUrl, getClientId } from '../../src/env.js';

export function renderDashboardHtml(): string {
  const config = getNextAuthConfig();
  const dbStats = BotDatabase.getInstance().getStats();
  const botTokenSet = !!getBotToken();
  const callbackUrl = getCallbackUrl();
  const inviteUrl = resolveBotInviteUrl(getInviteUrl(), callbackUrl, getClientId());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HELIX Discord Bot Dashboard</title>
  <link rel="icon" type="image/jpeg" href="/icon.jpg">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #0b0f19; color: #f3f4f6; }
    .glass { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(55, 65, 81, 0.5); }
    .glow-cyan { text-shadow: 0 0 12px rgba(6, 182, 212, 0.6); }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #111827; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
  </style>
</head>
<body class="min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
  <!-- Top Navigation -->
  <header class="glass sticky top-0 z-50 border-b border-gray-800 px-6 py-3.5 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/30 border border-cyan-500/30 shrink-0 bg-gray-900 flex items-center justify-center">
        <img src="/icon.jpg" alt="HELIX Bot" class="h-full w-full object-cover" onerror="this.outerHTML='<span class=\\'text-xl\\'>🧬</span>'">
      </div>
      <div>
        <h1 class="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
          HELIX <span class="text-cyan-400">Discord Bot</span>
        </h1>
        <p class="text-xs text-gray-400">Zero-AI Developer Assistant & Plugin Ecosystem</p>
      </div>
    </div>

    <!-- Bot & NextAuth Status Pills -->
    <div class="flex items-center space-x-3">
      <a href="https://github.com/HELIX-Origin/HELIX-Discord-Bot" target="_blank" class="hidden sm:inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition border border-gray-700">
        <i class="fa-brands fa-github mr-1.5"></i> GitHub
      </a>
      <span id="bot-status-pill" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${botTokenSet ? 'bg-green-900/60 text-green-300 border border-green-700' : 'bg-red-900/60 text-red-300 border border-red-700'}">
        <span class="h-2 w-2 rounded-full ${botTokenSet ? 'bg-green-400 animate-pulse' : 'bg-red-400'} mr-2"></span>
        <span id="bot-status-text">${botTokenSet ? 'Bot Online' : 'Token Missing'}</span>
      </span>
      <span id="gateway-ping-badge" class="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800">
        <i class="fa-solid fa-wifi mr-1.5 text-xs text-cyan-400"></i> <span id="gateway-ping-text">Gateway: Direct</span>
      </span>
      <span class="hidden lg:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800">
        <i class="fa-solid fa-database mr-1.5 text-xs text-emerald-400"></i> SQLite: 0ms lag (${Math.round(dbStats.sizeBytes / 1024)} KB)
      </span>
      ${inviteUrl ? `<a href="${inviteUrl}" target="_blank" class="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"><i class="fa-brands fa-discord mr-1.5"></i> Add to Discord</a>` : ''}
    </div>
  </header>

  <!-- Main Container -->
  <div class="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
    <!-- Sidebar Navigation -->
    <nav class="w-64 glass rounded-2xl p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-7.5rem)] sticky top-20">
      <div class="space-y-1.5">
        <button onclick="switchTab('overview')" id="tab-btn-overview" class="tab-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition text-white bg-cyan-600/20 text-cyan-300 border border-cyan-500/30">
          <i class="fa-solid fa-chart-line w-5"></i> Overview
        </button>
        <button onclick="switchTab('broadcast')" id="tab-btn-broadcast" class="tab-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800/80">
          <i class="fa-solid fa-bullhorn w-5"></i> Direct Broadcast
        </button>
        <button onclick="switchTab('plugins')" id="tab-btn-plugins" class="tab-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800/80">
          <i class="fa-solid fa-puzzle-piece w-5"></i> Language Plugins
        </button>
        <button onclick="switchTab('scaffold')" id="tab-btn-scaffold" class="tab-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800/80">
          <i class="fa-solid fa-cubes w-5"></i> Scaffolding Studio
        </button>
        <button onclick="switchTab('sessions')" id="tab-btn-sessions" class="tab-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800/80">
          <i class="fa-solid fa-users-gear w-5"></i> Member Sessions
        </button>
        <button onclick="switchTab('guilds')" id="tab-btn-guilds" class="tab-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800/80">
          <i class="fa-solid fa-server w-5"></i> Guild Configuration
        </button>
        <button onclick="switchTab('config')" id="tab-btn-config" class="tab-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition text-gray-400 hover:text-white hover:bg-gray-800/80">
          <i class="fa-solid fa-sliders w-5"></i> NextAuth & URLs
        </button>
      </div>

      <div class="p-3 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-gray-400 space-y-1.5">
        <div class="flex justify-between"><span>Architecture:</span><span class="text-cyan-400 font-semibold">Zero-AI Bot</span></div>
        <div class="flex justify-between"><span>NextAuth:</span><span class="text-indigo-400 font-mono">v4 / Auth.js</span></div>
        <div class="flex justify-between"><span>Database:</span><span class="text-emerald-400 font-mono">SQLite (node:sqlite)</span></div>
        <div class="flex justify-between"><span>Version:</span><span class="text-gray-300 font-mono">0.1.0</span></div>
      </div>
    </nav>

    <!-- Tab Contents -->
    <main class="flex-1 space-y-6 min-w-0">
      <!-- 1. OVERVIEW TAB -->
      <section id="tab-overview" class="tab-content space-y-6">
        <!-- Stat Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass p-5 rounded-2xl border border-gray-800">
            <span class="text-xs font-semibold uppercase text-gray-400 tracking-wider">Connected Guilds</span>
            <div class="text-3xl font-extrabold text-cyan-400 mt-2" id="stat-guild-count">${dbStats.guildCount}</div>
            <span class="text-xs text-gray-500 mt-1 block">Live Discord servers</span>
          </div>
          <div class="glass p-5 rounded-2xl border border-gray-800">
            <span class="text-xs font-semibold uppercase text-gray-400 tracking-wider">Member Sessions</span>
            <div class="text-3xl font-extrabold text-blue-400 mt-2" id="stat-session-count">${dbStats.sessionCount}</div>
            <span class="text-xs text-gray-500 mt-1 block">Authenticated users</span>
          </div>
          <div class="glass p-5 rounded-2xl border border-gray-800">
            <span class="text-xs font-semibold uppercase text-gray-400 tracking-wider">Scaffolds Planned</span>
            <div class="text-3xl font-extrabold text-indigo-400 mt-2" id="stat-scaffold-count">${dbStats.scaffoldCount}</div>
            <span class="text-xs text-gray-500 mt-1 block">Blueprints generated</span>
          </div>
          <div class="glass p-5 rounded-2xl border border-gray-800">
            <span class="text-xs font-semibold uppercase text-gray-400 tracking-wider">SQLite DB Engine</span>
            <div class="text-3xl font-extrabold text-emerald-400 mt-2">${Math.round(dbStats.sizeBytes / 1024)} KB</div>
            <span class="text-xs text-gray-500 mt-1 block">Local synchronous storage</span>
          </div>
        </div>

        <!-- Direct Live Activity Feed -->
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-cyan-400"></i> Recent Scaffolding & Bot Activity
            </h2>
            <button onclick="fetchStats()" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition flex items-center gap-1.5 border border-gray-700">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
          <div id="live-scaffold-feed" class="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
            <div class="text-gray-500 py-4 text-center">Loading recent activity...</div>
          </div>
        </div>

        <!-- Quick Actions & Community Links -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-terminal text-cyan-400"></i> Bot Control Center
            </h2>
            <div class="space-y-2.5">
              <button onclick="switchTab('broadcast')" class="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition flex items-center justify-between shadow-lg shadow-cyan-600/20">
                <span>Instant Channel Announcement</span> <i class="fa-solid fa-bullhorn"></i>
              </button>
              <button onclick="switchTab('plugins')" class="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-sm transition flex items-center justify-between border border-gray-700">
                <span>Explore Language Plugins</span> <i class="fa-solid fa-puzzle-piece text-indigo-400"></i>
              </button>
              <button onclick="switchTab('scaffold')" class="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-sm transition flex items-center justify-between border border-gray-700">
                <span>Launch Scaffolding Studio</span> <i class="fa-solid fa-cubes text-cyan-400"></i>
              </button>
            </div>
          </div>

          <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-book-open text-indigo-400"></i> Ecosystem Repositories
            </h2>
            <div class="space-y-3 text-xs">
              <a href="https://github.com/HELIX-Origin/HELIX-Discord-Bot" target="_blank" class="block p-3 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-cyan-500/50 transition">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-white flex items-center gap-1.5"><i class="fa-brands fa-github text-cyan-400"></i> HELIX-Origin/HELIX-Discord-Bot</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-gray-500"></i>
                </div>
                <p class="text-gray-400 mt-1">Core Discord bot, command handlers, ticketing engine, and SQLite database.</p>
              </a>

              <a href="https://github.com/HELIX-Origin/HELIX-Plugin-Template" target="_blank" class="block p-3 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-indigo-500/50 transition">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-white flex items-center gap-1.5"><i class="fa-solid fa-puzzle-piece text-indigo-400"></i> HELIX-Origin/HELIX-Plugin-Template</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Template</span>
                </div>
                <p class="text-gray-400 mt-1">Official GitHub starter boilerplate for building community language plugins.</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. DIRECT BROADCAST TAB -->
      <section id="tab-broadcast" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-bullhorn text-cyan-400"></i> Direct Channel Announcement
            </h2>
            <p class="text-xs text-gray-400 mt-1">Send announcements directly through the Discord gateway to any text channel the bot has access to.</p>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Target Discord Channel ID</label>
              <input type="text" id="broadcast-channel-id" placeholder="e.g. 123456789012345678" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Broadcast Message Content</label>
              <textarea id="broadcast-message" rows="4" placeholder="Enter message to announce in Discord server..." class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"></textarea>
            </div>
            <div class="flex justify-end">
              <button onclick="submitBroadcast()" id="broadcast-btn" class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-sm text-white transition flex items-center gap-2 shadow-lg shadow-cyan-600/20">
                <i class="fa-solid fa-paper-plane"></i> Send Instant Broadcast
              </button>
            </div>
            <div id="broadcast-status" class="hidden p-3 rounded-xl text-xs font-mono"></div>
          </div>
        </div>
      </section>

      <!-- 3. LANGUAGE PLUGINS TAB -->
      <section id="tab-plugins" class="tab-content hidden space-y-6">
        <!-- Official Plugin Template Banner -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/40 to-gray-900 border border-indigo-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">Template Repository</span>
              <h3 class="text-base font-bold text-white">Build Your Own HELIX Plugin</h3>
            </div>
            <p class="text-xs text-gray-300">Fork or generate from <code class="text-cyan-300 font-mono">HELIX-Origin/HELIX-Plugin-Template</code> to create custom AST linters, debug engines, and source providers.</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <a href="https://github.com/HELIX-Origin/HELIX-Plugin-Template/generate" target="_blank" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Use Template
            </a>
            <a href="https://github.com/HELIX-Origin/HELIX-Plugin-Template" target="_blank" class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs transition flex items-center gap-1.5 border border-gray-700">
              <i class="fa-brands fa-github"></i> View Repo
            </a>
          </div>
        </div>

        <!-- Live Registered Plugins -->
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-puzzle-piece text-cyan-400"></i> Active Language Plugins
              </h2>
              <p class="text-xs text-gray-400">Plugins loaded in-memory providing AST linting, code explanation, and diagnostic intelligence.</p>
            </div>
            <button onclick="fetchStats()" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition flex items-center gap-1.5 border border-gray-700">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>

          <div id="plugin-list-container" class="space-y-3">
            <div class="text-gray-500 py-4 text-center font-mono text-xs">Loading active plugins...</div>
          </div>
        </div>

        <!-- Built-in Supported Languages Grid -->
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-code text-indigo-400"></i> 13 Built-in Languages Shipped
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs text-gray-300 font-mono">
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>TypeScript</span><span class="text-cyan-400 text-[10px]">.ts, .tsx</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>JavaScript</span><span class="text-cyan-400 text-[10px]">.js, .jsx</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>Python</span><span class="text-cyan-400 text-[10px]">.py</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>Rust</span><span class="text-cyan-400 text-[10px]">.rs</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>Go</span><span class="text-cyan-400 text-[10px]">.go</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>Java</span><span class="text-cyan-400 text-[10px]">.java</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>C#</span><span class="text-cyan-400 text-[10px]">.cs</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>GDScript</span><span class="text-cyan-400 text-[10px]">.gd</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>Lua</span><span class="text-cyan-400 text-[10px]">.lua</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>PHP</span><span class="text-cyan-400 text-[10px]">.php</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>SQL</span><span class="text-cyan-400 text-[10px]">.sql</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>HTML/CSS</span><span class="text-cyan-400 text-[10px]">.html, .css</span></div>
            <div class="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex justify-between items-center"><span>Dart / Flutter</span><span class="text-cyan-400 text-[10px]">.dart</span></div>
          </div>
        </div>
      </section>

      <!-- 4. SCAFFOLDING STUDIO TAB -->
      <section id="tab-scaffold" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-5">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-cubes text-cyan-400"></i> Visual Scaffolding Studio
            </h2>
            <p class="text-xs text-gray-400 mt-1">Select from the 17 multi-framework templates to generate codebases and project blueprints.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-2">Project Name</label>
              <input type="text" id="scaffold-name" placeholder="my-awesome-app" value="helix-starter-app" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-2">Framework & Template</label>
              <select id="scaffold-template" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500">
                <optgroup label="Web Frameworks">
                  <option value="web-react">Web • React 19 + Vite (TypeScript)</option>
                  <option value="web-vue">Web • Vue 3 + Vite (TypeScript)</option>
                  <option value="web-app">Web • Vanilla HTML5/CSS/JS + Vite</option>
                </optgroup>
                <optgroup label="Discord Bots">
                  <option value="discord-bot">Discord Bot • discord.js v14 (TypeScript)</option>
                </optgroup>
                <optgroup label="Desktop Frameworks">
                  <option value="desktop-tauri">Desktop • Tauri v2 (Rust + TypeScript)</option>
                  <option value="desktop-electron">Desktop • Electron Context-Isolation (TypeScript)</option>
                  <option value="desktop-app">Desktop • Multi-window Desktop Suite</option>
                </optgroup>
                <optgroup label="Mobile Frameworks">
                  <option value="mobile-flutter">Mobile • Flutter + Riverpod (Dart)</option>
                  <option value="mobile-react-native">Mobile • React Native / Expo Router (TypeScript)</option>
                </optgroup>
                <optgroup label="Game Engines">
                  <option value="game-godot">Game Engine • Godot 4 (GDScript)</option>
                  <option value="game-unity">Game Engine • Unity LTS (C#)</option>
                  <option value="game-rpgm">Game Engine • RPG Maker MZ/MV (JavaScript)</option>
                  <option value="game-renpy">Game Engine • Ren'Py Visual Novel (Python)</option>
                </optgroup>
                <optgroup label="Backend Frameworks">
                  <option value="backend-rust">Backend • Rust Axum + Tokio</option>
                  <option value="backend-python">Backend • Python FastAPI + uv</option>
                  <option value="backend-go">Backend • Go 1.22+ ServeMux</option>
                  <option value="backend-java">Backend • Java 21 + Spring Boot 3</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-800">
            <label class="inline-flex items-center text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" id="scaffold-dryrun" checked class="mr-2 rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-0">
              Dry-run preview (preview planned file tree without writing to disk)
            </label>
            <button onclick="submitScaffold()" id="scaffold-btn" class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-sm text-white transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20">
              <i class="fa-solid fa-play"></i> Generate Blueprint
            </button>
          </div>

          <div id="scaffold-result" class="hidden p-5 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-folder-tree text-cyan-400"></i> Generated Files Manifest (<span id="scaffold-file-count">0</span> files):
              </h3>
              <span id="scaffold-dryrun-badge" class="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">Dry-Run</span>
            </div>
            <div id="scaffold-files-list" class="max-h-64 overflow-y-auto font-mono text-xs text-gray-300 space-y-1.5 bg-black/50 p-3.5 rounded-xl border border-gray-800/80"></div>
          </div>
        </div>
      </section>

      <!-- 5. MEMBER SESSIONS TAB -->
      <section id="tab-sessions" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-users-gear text-blue-400"></i> Member Authentication Sessions
              </h2>
              <p class="text-xs text-gray-400">Active Discord OAuth2 sessions stored securely in SQLite.</p>
            </div>
            <button onclick="fetchStats()" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition flex items-center gap-1.5 border border-gray-700">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>

          <div class="rounded-xl border border-gray-800 overflow-hidden bg-gray-900/90">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-800/70 text-gray-400 uppercase font-semibold border-b border-gray-800">
                <tr>
                  <th class="p-3">User Identifier</th>
                  <th class="p-3">Provider</th>
                  <th class="p-3">Last Active</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="session-table-body" class="divide-y divide-gray-800 font-mono">
                <tr>
                  <td colspan="4" class="p-4 text-center text-gray-500 font-sans">Loading member sessions...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- 6. GUILD CONFIGURATION TAB -->
      <section id="tab-guilds" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-5">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-server text-cyan-400"></i> Guild Settings & Routing
              </h2>
              <p class="text-xs text-gray-400">Configure command prefix, support ticket hub, and moderation channels for connected servers.</p>
            </div>
            <button onclick="fetchGuilds()" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition flex items-center gap-1.5 border border-gray-700">
              <i class="fa-solid fa-rotate-right"></i> Refresh Guilds
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-2">Select Guild</label>
              <select id="guild-selector" onchange="onGuildSelect()" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="global">Global Defaults (All Guilds)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-2">Command Prefix</label>
              <input type="text" id="guild-prefix" placeholder=">" value=">" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-2">Tickets Hub Channel ID</label>
              <input type="text" id="guild-tickets-hub" placeholder="e.g. 123456789012345678" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-gray-400 mb-2">Mod Log Channel ID</label>
              <input type="text" id="guild-mod-log" placeholder="e.g. 123456789012345678" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500">
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-gray-800">
            <span id="guild-save-status" class="text-xs font-mono text-gray-400"></span>
            <button onclick="saveGuildConfig()" id="guild-save-btn" class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-sm text-white transition flex items-center gap-2 shadow-lg shadow-cyan-600/20">
              <i class="fa-solid fa-floppy-disk"></i> Save Guild Configuration
            </button>
          </div>
        </div>
      </section>

      <!-- 7. NEXTAUTH & CONFIG TAB -->
      <section id="tab-config" class="tab-content hidden space-y-6">
        <div class="glass p-6 rounded-2xl border border-gray-800 space-y-4">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-sliders text-indigo-400"></i> NextAuth & Environment Infrastructure
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
              <span class="font-bold text-cyan-400">NEXTAUTH_URL</span>
              <p class="text-xs text-gray-400">Public canonical URL where clients connect to this dashboard.</p>
              <div class="font-mono text-xs text-gray-300 bg-black/40 p-2.5 rounded-lg border border-gray-800 break-all">${config.url}</div>
            </div>
            <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
              <span class="font-bold text-blue-400">NEXTAUTH_INTERNAL_URL</span>
              <p class="text-xs text-gray-400">Loopback URL used by dashboard server-side connections.</p>
              <div class="font-mono text-xs text-gray-300 bg-black/40 p-2.5 rounded-lg border border-gray-800 break-all">${config.internalUrl}</div>
            </div>
            <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
              <span class="font-bold text-emerald-400">Discord OAuth2 Callback</span>
              <p class="text-xs text-gray-400">Target redirect URI configured in Discord Developer Portal.</p>
              <div class="font-mono text-xs text-gray-300 bg-black/40 p-2.5 rounded-lg border border-gray-800 break-all">${config.url}/api/auth/callback/discord</div>
            </div>
            <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
              <span class="font-bold text-amber-400">SQLite Database Path</span>
              <p class="text-xs text-gray-400">Internal disk location of bot state and settings database.</p>
              <div class="font-mono text-xs text-gray-300 bg-black/40 p-2.5 rounded-lg border border-gray-800 break-all">${dbStats.dbPath}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    let globalGuildsData = {};

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

      if (tabId === 'guilds') {
        fetchGuilds();
      }
    }

    async function submitScaffold() {
      const projectName = document.getElementById('scaffold-name').value.trim();
      const templateId = document.getElementById('scaffold-template').value;
      const dryRun = document.getElementById('scaffold-dryrun').checked;
      const btn = document.getElementById('scaffold-btn');

      if (!projectName) {
        alert('Please enter a project name.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

      try {
        const res = await fetch('/api/dashboard/scaffold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectName, templateId, dryRun })
        });
        const data = await res.json();
        document.getElementById('scaffold-result').classList.remove('hidden');
        document.getElementById('scaffold-file-count').textContent = (data.files || []).length;
        document.getElementById('scaffold-dryrun-badge').textContent = data.dryRun ? 'Dry-Run Preview' : 'Written to Disk';
        
        const list = document.getElementById('scaffold-files-list');
        list.innerHTML = (data.files || []).map(f => \`
          <div class="flex items-center gap-2">
            <i class="fa-regular fa-file-code text-cyan-400"></i>
            <span>\${f}</span>
          </div>
        \`).join('');
        fetchStats();
      } catch (err) {
        alert('Scaffold error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Generate Blueprint';
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
          statusDiv.className = 'p-3 rounded-xl text-xs font-mono bg-green-950/60 text-green-300 border border-green-800';
          statusDiv.textContent = '✔ Broadcast dispatched instantly to Discord channel: ' + channelId;
          document.getElementById('broadcast-message').value = '';
          fetchStats();
        } else {
          statusDiv.className = 'p-3 rounded-xl text-xs font-mono bg-red-950/60 text-red-300 border border-red-800';
          statusDiv.textContent = '✖ ' + (data.error || 'Broadcast failed');
        }
      } catch (err) {
        statusDiv.classList.remove('hidden');
        statusDiv.className = 'p-3 rounded-xl text-xs font-mono bg-red-950/60 text-red-300 border border-red-800';
        statusDiv.textContent = '✖ Network error: ' + err.message;
      } finally {
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Instant Broadcast';
        btn.disabled = false;
      }
    }

    async function revokeSession(userId, provider) {
      if (!confirm('Are you sure you want to revoke authentication session for: ' + userId + '?')) return;
      try {
        const res = await fetch('/api/dashboard/bot/revoke-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, provider })
        });
        const data = await res.json();
        if (data.success) {
          fetchStats();
        } else {
          alert('Failed to revoke session: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function fetchGuilds() {
      try {
        const res = await fetch('/api/dashboard/guilds');
        const data = await res.json();
        globalGuildsData = data;
        const selector = document.getElementById('guild-selector');
        selector.innerHTML = '<option value="global">Global Defaults (All Guilds)</option>';
        (data.liveGuilds || []).forEach(g => {
          const opt = document.createElement('option');
          opt.value = g.id;
          opt.textContent = g.name + ' (' + g.id + ')';
          selector.appendChild(opt);
        });
        onGuildSelect();
      } catch {}
    }

    function onGuildSelect() {
      const selected = document.getElementById('guild-selector').value;
      const settings = (globalGuildsData.guildSettings || {})[selected] || {};
      document.getElementById('guild-prefix').value = settings.prefix || '>';
      document.getElementById('guild-tickets-hub').value = settings.ticketsHubChannelId || '';
      document.getElementById('guild-mod-log').value = settings.modLogChannelId || '';
    }

    async function saveGuildConfig() {
      const guildId = document.getElementById('guild-selector').value;
      const prefix = document.getElementById('guild-prefix').value.trim() || '>';
      const ticketsHubChannelId = document.getElementById('guild-tickets-hub').value.trim() || null;
      const modLogChannelId = document.getElementById('guild-mod-log').value.trim() || null;
      const statusSpan = document.getElementById('guild-save-status');

      statusSpan.textContent = 'Saving...';
      try {
        const res = await fetch('/api/dashboard/guilds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, prefix, ticketsHubChannelId, modLogChannelId })
        });
        const data = await res.json();
        if (data.success) {
          statusSpan.className = 'text-xs font-mono text-green-400';
          statusSpan.textContent = '✔ Settings saved for ' + guildId;
          fetchGuilds();
        } else {
          statusSpan.className = 'text-xs font-mono text-red-400';
          statusSpan.textContent = '✖ ' + (data.error || 'Failed to save');
        }
      } catch (err) {
        statusSpan.className = 'text-xs font-mono text-red-400';
        statusSpan.textContent = '✖ ' + err.message;
      }
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        
        if (data.database) {
          document.getElementById('stat-session-count').textContent = data.database.sessionCount || 0;
          document.getElementById('stat-scaffold-count').textContent = data.database.scaffoldCount || 0;
          document.getElementById('stat-guild-count').textContent = data.database.guildCount || 0;
        }

        if (data.bot) {
          const statusPill = document.getElementById('bot-status-pill');
          const statusText = document.getElementById('bot-status-text');
          if (statusPill && statusText) {
            if (data.bot.isReady) {
              statusPill.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/60 text-green-300 border border-green-700';
              statusText.textContent = 'Bot Online';
            } else if (data.bot.status === 'configured') {
              statusPill.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/60 text-yellow-300 border border-yellow-700';
              statusText.textContent = 'Connecting...';
            } else {
              statusPill.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-900/60 text-red-300 border border-red-700';
              statusText.textContent = 'Offline';
            }
          }

          const pingText = document.getElementById('gateway-ping-text');
          if (pingText) {
            if (typeof data.bot.gatewayLatencyMs === 'number' && data.bot.gatewayLatencyMs >= 0) {
              pingText.textContent = 'Gateway: ' + data.bot.gatewayLatencyMs + 'ms';
            } else if (data.bot.isReady) {
              pingText.textContent = 'Gateway: Connected';
            } else {
              pingText.textContent = 'Gateway: Offline';
            }
          }
        }

        // Render Recent Scaffolds Feed
        const feedContainer = document.getElementById('live-scaffold-feed');
        if (feedContainer && data.recentScaffolds && data.recentScaffolds.length > 0) {
          feedContainer.innerHTML = data.recentScaffolds.map(s => \`
            <div class="p-3 rounded-xl bg-gray-900/90 border border-gray-800/80 flex justify-between items-center hover:border-cyan-500/40 transition">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-cyan-400 font-bold">\${s.projectName}</span>
                  <span class="text-gray-500 text-[10px]">• \${s.templateId}</span>
                </div>
                <div class="text-gray-400 text-xs">Generated by \${s.userId}</div>
              </div>
              <span class="text-[10px] text-gray-500 shrink-0">\${s.timestamp}</span>
            </div>
          \`).join('');
        } else if (feedContainer) {
          feedContainer.innerHTML = '<div class="text-gray-500 py-3 text-center">No recent scaffolding operations recorded yet.</div>';
        }

        // Render Active Plugins List
        const pluginContainer = document.getElementById('plugin-list-container');
        if (pluginContainer && data.plugins && data.plugins.list) {
          pluginContainer.innerHTML = data.plugins.list.map(p => \`
            <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-cyan-500/40 transition">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm">\${p.name}</span>
                  <span class="text-xs font-mono text-cyan-400">(\${p.id})</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">v\${p.version}</span>
                </div>
                <div class="text-xs text-gray-400 font-mono">Extensions: \${(p.fileExtensions || []).join(', ')}</div>
              </div>
              <div class="flex flex-wrap gap-1.5">
                \${(p.capabilities || []).map(c => \`<span class="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 text-[10px] font-mono border border-cyan-800/80">\${c}</span>\`).join('')}
              </div>
            </div>
          \`).join('');
        }

        // Render Sessions Table
        const sessionTbody = document.getElementById('session-table-body');
        if (sessionTbody) {
          if (data.userSessions && data.userSessions.length > 0) {
            sessionTbody.innerHTML = data.userSessions.map(s => \`
              <tr class="hover:bg-gray-800/40 transition">
                <td class="p-3 text-white font-medium">\${s.userId || s.id}</td>
                <td class="p-3 text-cyan-400">\${s.provider || 'discord'}</td>
                <td class="p-3 text-gray-400 text-[11px]">\${s.createdAt || 'Active'}</td>
                <td class="p-3 text-right">
                  <button onclick="revokeSession('\${s.userId || s.id}', '\${s.provider || 'discord'}')" class="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 text-red-300 text-[11px] border border-red-800 transition">Revoke</button>
                </td>
              </tr>
            \`).join('');
          } else {
            sessionTbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500 font-sans">No active sessions in SQLite. Authenticate via Discord OAuth2 to register.</td></tr>';
          }
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
