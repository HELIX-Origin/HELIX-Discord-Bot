import { getThemeInfo, getThemeCss } from './theme.js';
import { renderFooter } from './footer.js';

export function renderLoginHtml(
  isRegister: boolean,
  botInviteUrl?: string | null,
  appName = 'HELIX Discord Bot',
  appIconUrl?: string | null,
  themeConfig?: string,
  dashboardEnabled = true,
): string {
  const title = isRegister ? 'Create Account' : 'Log In';
  const theme = getThemeInfo(themeConfig);

  return `<!DOCTYPE html>
<html lang="en" class="${theme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · ${appName}</title>
  ${appIconUrl ? `<link rel="icon" type="image/png" href="${appIconUrl}">` : ''}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    ${getThemeCss()}

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 1.25rem; padding: 2.25rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); backdrop-filter: blur(16px); }
    .brand-icon { width: 3.5rem; height: 3.5rem; border-radius: 1rem; background: linear-gradient(135deg, var(--primary), #3b82f6); display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 1.5rem; margin-bottom: 1rem; box-shadow: 0 8px 16px rgba(6,182,212,0.3); }
    .brand-img { width: 4.5rem; height: 4.5rem; border-radius: 1.25rem; object-fit: cover; margin-bottom: 1rem; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.25rem; }
    h1 span { color: var(--primary); }
    p { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.75rem; }
    .btn-discord { display: flex; align-items: center; justify-content: center; gap: 0.625rem; width: 100%; padding: 0.8125rem 1.25rem; border-radius: 0.75rem; background: var(--discord); color: #fff; font-size: 0.9375rem; font-weight: 600; text-decoration: none; transition: background 0.15s; }
    .btn-discord:hover { background: var(--discord-hover); }
    .invite-box { margin-top: 1.5rem; padding: 1rem; border-radius: 0.75rem; background: rgba(88,101,242,0.1); border: 1px solid rgba(88,101,242,0.25); text-align: left; }
    .invite-box h4 { font-size: 0.75rem; font-weight: 700; color: var(--text); margin-bottom: 0.25rem; }
    .invite-box p { font-size: 0.6875rem; color: var(--text-muted); margin-bottom: 0.75rem; }
    .btn-invite { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 0.5rem; background: var(--discord); color: #fff; font-size: 0.75rem; font-weight: 600; text-decoration: none; }
    .footer { margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-muted); }
    .footer a { color: var(--text-muted); text-decoration: none; }
    .footer a:hover { color: var(--primary); }
  </style>
</head>
<body>
  <div class="card">
    ${
      appIconUrl
        ? `<img src="${appIconUrl}" alt="${appName}" class="brand-img">`
        : `<div class="brand-icon"><i class="fa-solid fa-rss"></i></div>`
    }
    <h1>${appName}</h1>
    <p>Sign in with Discord to manage your feeds and server syndications.</p>

    <a href="/api/auth/discord" class="btn-discord">
      <i class="fa-brands fa-discord"></i> Continue with Discord
    </a>

    ${
      botInviteUrl
        ? `<div class="invite-box">
      <h4>Need the bot in your Discord server?</h4>
      <p>Invite the bot to your channels first so feeds can be delivered.</p>
      <a href="${botInviteUrl}" target="_blank" rel="noopener noreferrer" class="btn-invite">
        <i class="fa-brands fa-discord"></i> Invite Bot
      </a>
    </div>`
        : ''
    }

    ${renderFooter(appName, { dashboardEnabled })}
  </div>
</body>
</html>`;
}
