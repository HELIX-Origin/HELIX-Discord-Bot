import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { startServer, LavalinkConfigError } from '@helix-origin/lavalink-server';
import type { ServerHandle } from '@helix-origin/lavalink-server';
import { createLogger } from '../../util/logger.js';
import type { Logger } from '../../util/logger.js';
import type { LavalinkConfig } from '../../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..');

/**
 * Embeds the Lavalink-Server npm package (official Lavalink v4 Java node):
 * - Ensures the shared server env is coherent with our client config (port, password).
 * - Requires Java 21 and a Lavalink.jar in the repo root (the Java supervisor spawns it
 *   with cwd = process.cwd(), so application.yml must live at the project root too).
 * - Never enables the server's interactive YouTube device flow.
 */
export class EmbeddedLavaServer {
  private handle: ServerHandle | null = null;
  private readonly logger: Logger;

  constructor(
    private readonly config: LavalinkConfig,
    private readonly dbDataDir: string,
    private readonly spotify: { clientId: string | null; clientSecret: string | null } = {
      clientId: null,
      clientSecret: null,
    },
  ) {
    this.logger = createLogger('lavalink-server');
  }

  isRunning(): boolean {
    return this.handle !== null;
  }

  async start(): Promise<void> {
    const jar = resolve(repoRoot, 'Lavalink.jar');
    if (!existsSync(jar)) {
      this.logger.error(
        'Lavalink.jar not found in project root — cannot run the embedded Lavalink server. ' +
          'Place the Lavalink v4 jar next to application.yml or set LAVA_EMBEDDED=false to use an external node.',
      );
      return;
    }

    if (!existsSync(resolve(process.cwd(), 'application.yml'))) {
      this.logger.warn('application.yml not found in the working directory; Lavalink node will use built-in defaults.');
    }

    const internalUrl = process.env['LAVA_INTERNAL_URL'] ?? `0.0.0.0:${this.config.port}`;
    process.env['LAVA_INTERNAL_URL'] = internalUrl;
    const sep = internalUrl.lastIndexOf(':');
    const internalHost = sep > 0 ? internalUrl.slice(0, sep) : '0.0.0.0';
    const internalPort = sep > 0 ? internalUrl.slice(sep + 1) : String(this.config.port);
    process.env['LAVA_INTERNAL_WS_URI'] ??= `ws://${internalHost}:${internalPort}/v4/websocket`;
    process.env['LAVA_PASS'] ??= this.config.password;

    try {
      const handle = await startServer({
        features: { dashboard: false, supervisor: true, youtubeOAuth: false },
        overrides: {
          pass: this.config.password,
          dbPath: resolve(this.dbDataDir, 'lavalink', 'database.db'),
          spotifyClientId: this.spotify.clientId ?? undefined,
          spotifyClientSecret: this.spotify.clientSecret ?? undefined,
        },
      });
      this.handle = handle;

      await new Promise<void>((onListening, onError) => {
        handle.server.once('error', onError);
        handle.server.once('listening', () => {
          handle.server.removeListener('error', onError);
          onListening();
        });
        const gatewayHost = handle.config.gatewayHost || '127.0.0.1';
        handle.server.listen(handle.config.gatewayPort, gatewayHost);
      });

      const gatewayPort = handle.config.gatewayPort;
      this.logger.info('Embedded Lavalink server is listening', {
        node: `127.0.0.1:${this.config.port}`,
        gateway: `127.0.0.1:${gatewayPort}`,
      });
    } catch (err) {
      this.handle = null;
      if (err instanceof LavalinkConfigError) {
        this.logger.error('Embedded Lavalink server config error', { message: err.message });
      } else {
        this.logger.error('Failed to start embedded Lavalink server', { error: String(err) });
      }
    }
  }

  async waitForReady(timeoutMs: number): Promise<boolean> {
    const base = `http://127.0.0.1:${this.config.port}`;
    const deadline = Date.now() + timeoutMs;
    let lastError = '';

    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${base}/v4/info`, {
          headers: { Authorization: this.config.password },
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          this.logger.info('Embedded Lavalink node is ready');
          return true;
        }
        lastError = `HTTP ${res.status}`;
      } catch (err) {
        lastError = (err as Error).message;
      }
      await new Promise((resolve) => setTimeout(resolve, 750));
    }

    this.logger.error('Embedded Lavalink node did not become ready in time', {
      timeoutMs,
      lastError,
      base,
    });
    return false;
  }

  async stop(): Promise<void> {
    if (!this.handle) return;
    const handle = this.handle;
    this.handle = null;
    try {
      await handle.stop();
      this.logger.info('Embedded Lavalink server stopped');
    } catch (err) {
      this.logger.error('Error stopping embedded Lavalink server', { error: String(err) });
    }
  }
}
