import { getThemeInfo } from './dashboard.js';
import { renderFooter } from './footer.js';
import {
  getAllCommandMetadata,
  getCategorizedCommands,
  type CommandHelpMetadata,
} from '../../bot/handlers/registry.js';
import { loadAllCommands } from '../../bot/handlers/loader.js';

const CATEGORY_LABELS: Record<string, string> = {
  feeds: 'Feeds & Alerts',
  admin: 'Administration',
  mod: 'Moderation',
  utility: 'Utility',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  feeds: '📰',
  admin: '🛡️',
  mod: '⚖️',
  utility: '🔧',
};

function renderUsage(meta: CommandHelpMetadata): string {
  if (meta.usage) return meta.usage;
  if (meta.subcommands && meta.subcommands.length > 0) {
    return `/${meta.name} ${meta.subcommands.map((s) => `[${s.name}]`).join(' ')}`;
  }
  if (meta.options && meta.options.length > 0) {
    return `/${meta.name} ${meta.options.map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`)).join(' ')}`;
  }
  return `/${meta.name}`;
}

function renderOptions(meta: CommandHelpMetadata): string {
  if (!meta.options || meta.options.length === 0) return '';
  const items = meta.options
    .map(
      (o) =>
        `<li style="margin-bottom: 0.25rem;"><code style="background: rgba(0,0,0,0.4); padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-family: monospace; color: var(--primary);">${o.name}${o.required ? '*' : ''}</code> — ${o.description}</li>`,
    )
    .join('');
  return `<ul style="margin: 0.5rem 0 0 1.25rem; padding-left: 1rem; font-size: 0.8125rem; color: var(--text-muted);">${items}</ul>`;
}

function renderExamples(meta: CommandHelpMetadata): string {
  if (!meta.examples || meta.examples.length === 0) return '';
  const items = meta.examples
    .map(
      (ex) =>
        `<li style="margin-bottom: 0.25rem;"><code style="background: rgba(0,0,0,0.4); padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-family: monospace; color: var(--text);">${ex}</code></li>`,
    )
    .join('');
  return `<ul style="margin: 0.5rem 0 0 1.25rem; padding-left: 1rem; font-size: 0.8125rem;">${items}</ul>`;
}

function renderCommandCard(meta: CommandHelpMetadata): string {
  const emoji = CATEGORY_EMOJIS[meta.category] ?? '💡';
  return `<div style="background: var(--card-inner); border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; margin-bottom: 1rem;">
    <div style="display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.5rem;">
      <span style="font-size: 1rem;">${emoji}</span>
      <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text); margin: 0;"><code style="background: rgba(0,0,0,0.4); padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-family: monospace; color: var(--primary);">/${meta.name}</code></h3>
    </div>
    ${
      meta.usage && meta.usage !== `/${meta.name}`
        ? `<p style="margin-bottom: 0.5rem;"><code style="background: rgba(0,0,0,0.4); padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-family: monospace; color: var(--text);">${renderUsage(meta)}</code></p>`
        : ''
    }
    <p style="color: var(--text-muted); line-height: 1.55; margin-bottom: 0.5rem;">${meta.description}</p>
    ${renderOptions(meta)}
    ${
      meta.examples && meta.examples.length > 0
        ? `<p style="margin: 0.75rem 0 0.25rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Examples</p>${renderExamples(meta)}`
        : ''
    }
  </div>`;
}

/**
 * Public read-only command catalog page.
 * Visible to everyone — including users who are not logged in.
 */
export async function renderCommandsHtml(
  appName: string,
  appIconUrl?: string | null,
  themeConfig?: string,
): Promise<string> {
  await loadAllCommands();
  const allMeta = getAllCommandMetadata();
  const categorized = getCategorizedCommands();
  const theme = getThemeInfo(themeConfig);

  const total = allMeta.length;
  const counts: Record<string, number> = {};
  for (const [cat, cmds] of Object.entries(categorized)) {
    counts[cat] = cmds.length;
  }

  const order: Array<keyof typeof categorized> = ['feeds', 'admin', 'mod', 'utility'];
  const sections = order
    .filter((cat) => (categorized[cat] ?? []).length > 0)
    .map((cat) => {
      const label = CATEGORY_LABELS[cat] ?? String(cat);
      const emoji = CATEGORY_EMOJIS[cat] ?? '💡';
      const cards = (categorized[cat] ?? []).map(renderCommandCard).join('');
      return `<section style="margin-bottom: 2.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">${emoji} ${label} <span style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); background: var(--card-inner); border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 9999px;">${counts[cat]}</span></h2>
        ${cards}
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en" class="${theme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commands · ${appName}</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root, html.dark {
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.85);
      --card-inner: #111827;
      --border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #06b6d4;
    }
    html.light {
      --bg: #e8ecf2;
      --card-bg: rgba(248, 250, 252, 0.95);
      --card-inner: #ffffff;
      --border: #cbd5e1;
      --text: #1e293b;
      --text-muted: #475569;
      --primary: #0284c7;
    }
    html.glassmorphism {
      --bg: #0a0d18;
      --card-bg: rgba(18, 24, 43, 0.55);
      --card-inner: rgba(255, 255, 255, 0.04);
      --border: rgba(255, 255, 255, 0.12);
      --text: #ffffff;
      --text-muted: #cbd5e1;
      --primary: #a855f7;
    }
    html.glassmorphism body {
      background: radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.18), transparent 35%),
                  radial-gradient(circle at 85% 20%, rgba(6, 182, 212, 0.18), transparent 35%),
                  radial-gradient(circle at 50% 85%, rgba(236, 72, 153, 0.15), transparent 45%),
                  #0a0d18;
      background-attachment: fixed;
    }
    html.glassmorphism .card {
      backdrop-filter: blur(20px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
    }
    html.cyberpunk {
      --bg: #05050a;
      --card-bg: rgba(14, 14, 24, 0.92);
      --card-inner: #0a0a12;
      --border: rgba(0, 240, 255, 0.25);
      --text: #fcee0a;
      --text-muted: #e2e8f0;
      --primary: #00f0ff;
    }
    html.dracula {
      --bg: #282a36;
      --card-bg: rgba(40, 42, 54, 0.92);
      --card-inner: #21222c;
      --border: #44475a;
      --text: #f8f8f2;
      --text-muted: #bd93f9;
      --primary: #ff79c6;
    }
    html.nord {
      --bg: #2e3440;
      --card-bg: rgba(46, 52, 64, 0.95);
      --card-inner: #3b4252;
      --border: #434c5e;
      --text: #eceff4;
      --text-muted: #d8dee9;
      --primary: #88c0d0;
    }
    html.emerald {
      --bg: #041712;
      --card-bg: rgba(6, 38, 28, 0.9);
      --card-inner: #07261d;
      --border: #134e3a;
      --text: #ecfdf5;
      --text-muted: #a7f3d0;
      --primary: #10b981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.25rem; padding: 2.5rem; max-width: 920px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); backdrop-filter: blur(16px); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.5rem; background: var(--card-inner); color: var(--text); font-size: 0.8125rem; font-weight: 600; text-decoration: none; border: 1px solid var(--border); }
    .btn:hover { border-color: var(--primary); color: var(--primary); }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <a href="/" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text); text-decoration: none; font-weight: 800; font-size: 1.1rem;">
        ${
          appIconUrl
            ? `<img src="${appIconUrl}" alt="${appName}" style="width: 1.75rem; height: 1.75rem; border-radius: 0.5rem; object-fit: cover;">`
            : `<i class="fa-solid fa-rss" style="color: var(--primary);"></i>`
        } ${appName}
      </a>
      <div style="display: flex; gap: 0.5rem;">
        <a href="/" class="btn"><i class="fa-solid fa-house"></i> Home</a>
        <a href="/dashboard" class="btn"><i class="fa-solid fa-gauge"></i> Dashboard</a>
      </div>
    </div>
    <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem;">📖 Command Reference</h1>
    <p style="color: var(--text-muted); margin-bottom: 2rem; line-height: 1.6;">A complete, read-only reference of all ${total} available commands. Commands marked with a <code style="background: rgba(0,0,0,0.4); padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-family: monospace; color: var(--primary);">*</code> on an option are required.</p>
    ${sections}
    ${renderFooter(appName)}
  </div>
</body>
</html>`;
}
