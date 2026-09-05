import { describe, it, expect, vi, afterEach } from 'vitest';
import { logs } from '../../../HELIX/src/handlers/logs-handler.js';
import { getMessage, reloadMessages } from '../../../HELIX/src/handlers/message-handler.js';

describe('logs-handler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs info/success/warn/error to the console', () => {
    const info = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    logs.info('info line');
    logs.success('success line');
    logs.warn('warn line');
    logs.title('Title');
    logs.divider();
    expect(info).toHaveBeenCalledTimes(5);
    logs.error('boom');
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('debug output is gated behind the DEBUG flag', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logs.debug('hidden');
    expect(spy).not.toHaveBeenCalled();

    process.env.DEBUG = '1';
    logs.debug('visible');
    expect(spy).toHaveBeenCalledTimes(1);
    delete process.env.DEBUG;
  });

  it('titles and dividers are visually distinct', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logs.title('SECTION');
    logs.divider();
    const lines = spy.mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => l.includes('SECTION'))).toBe(true);
    expect(lines.some((l) => l.includes('─'))).toBe(true);
  });

  it('keeps message-handler integration intact after logging', () => {
    reloadMessages();
    expect(getMessage('errors.generic')).toContain('error');
  });
});