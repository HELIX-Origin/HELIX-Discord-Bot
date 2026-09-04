import { describe, it, expect } from 'vitest';
import { getMessage, createEmbed, formatError, formatSuccess } from '../../HELIX/src/handlers/message-handler.js';

describe('Message Handler & Formatting Engine', () => {
  it('loads raw message strings by nested path', () => {
    const genericErr = getMessage('errors.generic');
    expect(genericErr).toContain('unexpected error');

    const permDenied = getMessage('errors.permission_denied');
    expect(permDenied).toContain('permission');
  });

  it('interpolates variables into message strings', () => {
    const cmdNotFound = getMessage('errors.command_not_found', {}, '!');
    expect(cmdNotFound).toContain('!help');

    const invalidArg = getMessage('errors.invalid_argument', { arg: 'amount', value: 'abc' });
    expect(invalidArg).toContain('amount');
    expect(invalidArg).toContain('abc');
  });

  it('falls back gracefully to default text when key is not found', () => {
    const missing = getMessage('nonexistent.key', {}, '>', 'Custom fallback message');
    expect(missing).toBe('Custom fallback message');
  });

  it('constructs an EmbedBuilder from JSON embed schema', () => {
    const embed = createEmbed('moderation.ban.embed', {
      target: 'User123',
      moderatorId: '9876543210',
      reason: 'Rule violation',
    });

    expect(embed).toBeDefined();
    const data = embed.toJSON();
    expect(data.title).toBe('🔨 Member Banned');
    expect(data.fields).toHaveLength(3);
    expect(data.fields?.[0].value).toBe('User123');
    expect(data.fields?.[1].value).toBe('<@9876543210>');
    expect(data.fields?.[2].value).toBe('Rule violation');
    expect(data.color).toBeDefined();
  });

  it('formats standardized error embeds', () => {
    const errEmbed = formatError('errors.rate_limited');
    expect(errEmbed).toBeDefined();
    const data = errEmbed.toJSON();
    expect(data.title).toBe('❌ Error');
    expect(data.description).toContain('running commands too quickly');
  });

  it('formats standardized success embeds', () => {
    const successEmbed = formatSuccess('Saved', 'Server settings have been saved.');
    expect(successEmbed).toBeDefined();
    const data = successEmbed.toJSON();
    expect(data.title).toBe('Saved');
    expect(data.description).toBe('Server settings have been saved.');
  });
});
