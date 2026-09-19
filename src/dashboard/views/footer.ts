import { appDisplayName, type AppDeps } from '../../app.js';

interface FooterOptions {
  /** Whether to include the Dashboard link (requires DASHBOARD_ENABLED). */
  dashboardEnabled?: boolean;
  /** Additional custom links to include. */
  extraLinks?: Array<{ href: string; label: string }>;
}

/**
 * Shared footer component used by landing, login, legal, and dashboard pages.
 * Accepts either a full AppDeps (to resolve live Discord app name) or an explicit appName string.
 */
export function renderFooter(depsOrAppName: AppDeps | string, opts: FooterOptions = {}): string {
  const appName = typeof depsOrAppName === 'string' ? depsOrAppName : appDisplayName(depsOrAppName);
  const { dashboardEnabled = true, extraLinks = [] } = opts;

  const links = [
    ...(dashboardEnabled ? [{ href: '/dashboard', label: 'Web Dashboard' }] : []),
    { href: '/commands', label: 'Command Reference' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/security', label: 'Security Policy' },
    { href: '/tos', label: 'Terms of Service' },
    ...extraLinks,
  ];

  const linksHtml = links.map((l) => `<a href="${l.href}">${l.label}</a>`).join(' &middot; ');

  return `<div class="footer">
    <div class="footer-links">${linksHtml}</div>
    <div>&copy; ${new Date().getFullYear()} ${appName} &bull; Powered by TypeScript, Node.js, native HTTP & SQLite</div>
  </div>`;
}
