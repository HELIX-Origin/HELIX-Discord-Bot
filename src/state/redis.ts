/**
 * Coordination layer for multi-instance feed delivery.
 *
 * Defaults to an in-memory implementation backed by ioredis-mock so the
 * service boots instantly with zero external infrastructure. When REDIS_URI is
 * configured, a real remote Redis server (ioredis) is used instead, enabling
 * deduplication and locking coordination across multiple bot instances.
 */
import RedisMock from 'ioredis-mock';
import { Redis } from 'ioredis';
import { createLogger } from '../util/logger.js';

export interface RedisCoordinator {
  readonly enabled: boolean;
  readonly instanceId: string;
  isEntrySent(feedId: number, entryId: string): Promise<boolean>;
  markEntrySent(feedId: number, entryId: string): Promise<void>;
  acquireLock(key: string, ttlMs: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
  close(): Promise<void>;
}

/**
 * Minimal Redis command surface shared by both ioredis and ioredis-mock. Kept
 * deliberately small so the coordinator is agnostic to the backing client.
 */
export interface RedisClientLike {
  sismember(key: string, member: string): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  set(key: string, value: string, mode: string, ttlSeconds: number, flag: string): Promise<unknown>;
  del(key: string): Promise<number>;
  quit(): Promise<'OK'>;
}

export class RedisCoordinatorImpl implements RedisCoordinator {
  readonly enabled = true;
  readonly instanceId: string;
  private degradedLogged = false;
  private readonly logger = createLogger('redis');

  constructor(
    private readonly client: RedisClientLike,
    instanceId?: string,
  ) {
    this.instanceId = instanceId ?? `drss-${randomId()}`;
  }

  static create(client?: RedisClientLike): RedisCoordinatorImpl {
    const mock = (client ?? new RedisMock()) as unknown as RedisClientLike;
    return new RedisCoordinatorImpl(mock);
  }

  private entryKey(feedId: number): string {
    return `drss:sent:${feedId}`;
  }

  private async safe<T>(fallback: T, op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch {
      if (!this.degradedLogged) {
        this.degradedLogged = true;
        this.logger.warn('Redis coordinator degraded; falling back to single-instance behavior');
      }
      return fallback;
    }
  }

  async isEntrySent(feedId: number, entryId: string): Promise<boolean> {
    return this.safe(false, async () => (await this.client.sismember(this.entryKey(feedId), entryId)) === 1);
  }

  async markEntrySent(feedId: number, entryId: string): Promise<void> {
    await this.safe(undefined, async () => {
      await this.client.sadd(this.entryKey(feedId), entryId);
    });
  }

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    return this.safe(true, async () => {
      const ttlSec = Math.max(1, Math.floor(ttlMs / 1000));
      const ok = await this.client.set(`drss:lock:${key}`, this.instanceId, 'EX', ttlSec, 'NX');
      return ok === 'OK';
    });
  }

  async releaseLock(key: string): Promise<void> {
    await this.safe(undefined, async () => {
      await this.client.del(`drss:lock:${key}`);
    });
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      /* ignore */
    }
  }
}

export async function createRedisCoordinator(
  redisUri?: string | null,
  logLevel?: import('../util/logger.js').LogLevel,
): Promise<RedisCoordinator | null> {
  const logger = createLogger('redis', logLevel);
  const uri = redisUri?.trim();

  // Remote Redis mode: only used when REDIS_URI is configured explicitly.
  // ioredis connects lazily and auto-reconnects; offline commands reject
  // immediately (enableOfflineQueue: false) so the coordinator degrades to
  // single-instance behavior through safe() instead of hanging.
  if (uri) {
    try {
      const client = new Redis(uri, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 10_000,
        tls: { rejectUnauthorized: false },
      });
      client.on('error', (err: Error) => {
        logger.warn('Remote Redis connection error', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
      const coordinator = new RedisCoordinatorImpl(client as unknown as RedisClientLike);
      logger.info('Remote Redis coordinator initialized', {
        instanceId: coordinator.instanceId,
        uri: sanitizeUri(uri),
      });
      return coordinator;
    } catch (err) {
      logger.warn('Failed to initialize remote Redis coordinator; continuing in standalone mode', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  try {
    const coordinator = RedisCoordinatorImpl.create();
    logger.info('In-memory Redis coordinator initialized with ioredis-mock', {
      instanceId: coordinator.instanceId,
    });
    return coordinator;
  } catch {
    logger.warn('Failed to initialize ioredis-mock coordinator; continuing in standalone mode');
    return null;
  }
}

function sanitizeUri(uri: string): string {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return uri;
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
