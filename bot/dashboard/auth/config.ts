import crypto from 'crypto';

export interface NextAuthConfig {
  url: string;
  internalUrl: string;
  secret: string;
  clientId: string;
  clientSecret: string;
}

export function resolveInternalUrl(rawInternal?: string, botPort: number = 5000): string {
  let target = rawInternal || process.env.NEXTAUTH_INTERNAL_URL || 'http://localhost';
  target = target.replace(/\/$/, '');

  try {
    const parsed = new URL(target.includes('://') ? target : `http://${target}`);
    // If port is omitted, automatically attach the dashboard/bot port so user doesn't need to specify it
    if (!parsed.port) {
      parsed.port = String(botPort);
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    // If URL parsing fails, default safely to http://localhost:<botPort>
    return `http://localhost:${botPort}`;
  }
}

export function getNextAuthConfig(options: { botPort?: number } = {}): NextAuthConfig {
  const botPort = options.botPort || (process.env.PORT ? parseInt(process.env.PORT, 10) : 5000);
  let publicUrl = (process.env.NEXTAUTH_URL || `http://localhost:${botPort}`).replace(/\/$/, '');

  // If publicUrl doesn't have a port specified and is localhost, automatically append the port
  try {
    const parsedPub = new URL(publicUrl.includes('://') ? publicUrl : `http://${publicUrl}`);
    if (!parsedPub.port && (parsedPub.hostname === 'localhost' || parsedPub.hostname === '127.0.0.1')) {
      parsedPub.port = String(botPort);
      publicUrl = parsedPub.toString().replace(/\/$/, '');
    }
  } catch {}

  const internalUrl = resolveInternalUrl(process.env.NEXTAUTH_INTERNAL_URL, botPort);
  const secret = process.env.NEXTAUTH_SECRET || 'helix_bot_dashboard_secret_key_32_bytes_min';
  const clientId = process.env.DISCORD_CLIENT_ID || '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';

  return {
    url: publicUrl,
    internalUrl,
    secret,
    clientId,
    clientSecret,
  };
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
