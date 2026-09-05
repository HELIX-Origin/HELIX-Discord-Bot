import crypto from 'node:crypto';
import { getPort, getDashboardPort, getNextAuthUrl, getNextAuthInternalUrl, getNextAuthSecret, getClientId, getClientSecret } from '../../src/env.js';

export interface NextAuthConfig {
  url: string;
  internalUrl: string;
  secret: string;
  clientId: string;
  clientSecret: string;
}

export function resolveInternalUrl(rawInternal?: string, port: number = getDashboardPort()): string {
  if (!rawInternal) {
    return `http://localhost:${port}`;
  }
  let target = rawInternal.replace(/\/$/, '');

  try {
    const parsed = new URL(target.includes('://') ? target : `http://${target}`);
    // If port is omitted, automatically attach the dashboard port
    if (!parsed.port) {
      parsed.port = String(port);
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return `http://localhost:${port}`;
  }
}

export function getNextAuthConfig(): NextAuthConfig {
  const url = getNextAuthUrl();
  const internalUrl = getNextAuthInternalUrl();
  const secret = getNextAuthSecret();
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  return { url, internalUrl, secret, clientId, clientSecret };
}

export function createSessionToken(user: { id: string; name: string; email?: string }): string {
  const config = getNextAuthConfig();
  const payload = {
    ...user,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): any | null {
  if (!token) return null;
  const config = getNextAuthConfig();
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', config.secret)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}
