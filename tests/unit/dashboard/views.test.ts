import { describe, it, expect } from 'vitest';
import { renderDashboardHtml } from '../../../src/dashboard/views/dashboard.js';
import type { AppDeps } from '../../../src/app.js';

function makeDeps(): AppDeps {
  return {
    config: {
      botName: 'HELIX',
      clientId: '123456789',
      defaultTheme: 'dark',
      publicBaseUrl: 'https://helix.example.com',
      internalUrl: 'http://localhost:3000',
      ownerIds: [1],
      adminIds: [1],
      features: {
        adminPanelEnabled: true,
      },
    },
    bot: {
      getAppName: () => 'HELIX',
      getAppIconUrl: () => 'https://cdn.example.com/icon.png',
    },
    repo: {
      getUserById: (id: number) => ({ id, role: 'owner', discordId: '123' }),
      getFeedsByGuild: () => [],
    },
    db: {
      stats: () => ({ dbSizeBytes: 102400 }),
    },
    reddit: {
      available: () => true,
    },
  } as unknown as AppDeps;
}

describe('renderDashboardHtml', () => {
  it('renders balanced HTML tags without unclosed or stray tags', () => {
    const deps = makeDeps();
    const html = renderDashboardHtml(deps, 1, { view: 'dashboard', guildId: 'guild-1' });

    // Count open/close tags for core structural elements
    const divOpen = (html.match(/<div(\s|>)/g) || []).length;
    const divClose = (html.match(/<\/div>/g) || []).length;
    expect(divOpen).toBe(divClose);

    const sectionOpen = (html.match(/<section(\s|>)/g) || []).length;
    const sectionClose = (html.match(/<\/section>/g) || []).length;
    expect(sectionOpen).toBe(sectionClose);

    const mainOpen = (html.match(/<main(\s|>)/g) || []).length;
    const mainClose = (html.match(/<\/main>/g) || []).length;
    expect(mainOpen).toBe(mainClose);
  });

  it('does not hardcode active class on tab-rss or tab-btn-rss', () => {
    const deps = makeDeps();
    const html = renderDashboardHtml(deps, 1, { view: 'dashboard', guildId: 'guild-1' });

    expect(html).not.toContain('id="tab-rss" class="tab-pane active"');
    expect(html).toContain('id="tab-rss" class="tab-pane"');
    expect(html).not.toContain('id="tab-btn-rss" class="tab-btn active"');
    expect(html).toContain('id="tab-btn-rss" class="tab-btn"');
  });

  it('contains all dashboard tab sections within main', () => {
    const deps = makeDeps();
    const html = renderDashboardHtml(deps, 1, { view: 'dashboard', guildId: 'guild-1' });

    const expectedTabs = [
      'tab-overview',
      'tab-guildadmin',
      'tab-manage-feeds',
      'tab-rss',
      'tab-reddit',
      'tab-freegames',
      'tab-streamalerts',
      'tab-welcome',
      'tab-tickets',
      'tab-logs',
      'tab-commands',
      'tab-settings',
    ];

    for (const tabId of expectedTabs) {
      expect(html).toContain(`id="${tabId}"`);
    }

    // Verify all expected tabs appear between <main> and </main>
    const mainStart = html.indexOf('<main>');
    const mainEnd = html.indexOf('</main>');
    expect(mainStart).toBeGreaterThan(-1);
    expect(mainEnd).toBeGreaterThan(mainStart);

    const mainContent = html.substring(mainStart, mainEnd);
    for (const tabId of expectedTabs) {
      expect(mainContent).toContain(`id="${tabId}"`);
    }
  });

  it('includes proper switchTab deactivation selector in client script', () => {
    const deps = makeDeps();
    const html = renderDashboardHtml(deps, 1, { view: 'dashboard', guildId: 'guild-1' });

    expect(html).toContain("document.querySelectorAll('#dashboard-view main > .tab-pane, #dashboard-view .tab-pane, #feed-detail-view')");
  });
});
