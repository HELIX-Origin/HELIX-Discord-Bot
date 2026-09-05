import { describe, it, expect, afterAll } from 'vitest';
import { renderDashboardHtml } from '../../../HELIX/dashboard/ui/html.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';
import { withTempDbEnvironment } from '../../helpers/db.js';
import { EnvSandbox } from '../../helpers/env.js';

const env = withTempDbEnvironment();
const sandbox = new EnvSandbox();
sandbox.set('NEXTAUTH_URL', undefined);
sandbox.set('NEXTAUTH_SECRET', undefined);
sandbox.set('PORT', '4321');

describe('dashboard/ui/html', () => {
  it('renders a complete dashboard shell', () => {
    const html = renderDashboardHtml();
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(1000);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>HELIX Discord Bot Dashboard</title>');
    expect(html).toContain('</html>');
  });

  it('includes live stats, session, and plugin sections', () => {
    const html = renderDashboardHtml();
    expect(html).toContain('fetchStats');
    expect(html).toContain('session-table-body');
    expect(html).toContain('revokeSession');
  });

  it('embeds the env PORT in client code', () => {
    const html = renderDashboardHtml();
    expect(html).toContain('4321');
  });
});

afterAll(() => {
  sandbox.restore();
  BotDatabase.getInstance().close();
  env.cleanup();
});