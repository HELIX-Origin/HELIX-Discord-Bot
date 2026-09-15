import type { Logger } from '../../util/logger.js';
import type { LavalinkConfig } from '../../config.js';

interface WebSocketOptions {
  headers?: Record<string, string>;
}

interface WebSocketConstructor {
  new (url: string | URL, protocols?: string | string[], options?: WebSocketOptions): WebSocket;
  new (url: string | URL, protocols?: string | string[]): WebSocket;
  readonly prototype: WebSocket;
  readonly CLOSED: number;
  readonly CLOSING: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
}

const WebSocketClient: WebSocketConstructor = WebSocket as unknown as WebSocketConstructor;

export interface Track {
  identifier: string;
  title: string;
  author: string;
  length: number;
  position: number;
  isStream: boolean;
  uri: string;
  artworkUrl: string | null;
  sourceName: string;
}

export interface QueueItem {
  track: Track;
  requester: string;
  requestedAt: number;
}

export interface PlayerState {
  guildId: string;
  channelId: string | null;
  queue: QueueItem[];
  current: QueueItem | null;
  history: QueueItem[];
  paused: boolean;
  volume: number;
  loop: 'none' | 'track' | 'queue';
  shuffled: boolean;
  position: number;
}

export interface LavalinkStats {
  players: number;
  playingPlayers: number;
  uptime: number;
  memory: {
    free: number;
    used: number;
    allocated: number;
    reservable: number;
  };
  cpu: {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
  };
  frameStats: {
    sent: number;
    nulled: number;
    deficit: number;
  };
}

export class LavalinkManager {
  private readonly logger: Logger;
  private readonly config: LavalinkConfig;
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private readonly pendingRequests = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (reason: unknown) => void; timeout: NodeJS.Timeout }
  >();
  private requestId = 0;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly eventHandlers = new Map<string, Set<(data: unknown) => void>>();
  private players = new Map<string, PlayerState>();

  constructor(config: LavalinkConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  get baseUrl(): string {
    const protocol = this.config.secure ? 'https' : 'http';
    return `${protocol}://${this.config.host}:${this.config.port}`;
  }

  get wsUrl(): string {
    const wsProtocol = this.config.secure ? 'wss' : 'ws';
    return `${wsProtocol}://${this.config.host}:${this.config.port}/v4/websocket`;
  }

  async connectWS(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info('Connecting to Lavalink', { url: this.wsUrl });

      const wsHeaders: Record<string, string> = {
        Authorization: this.config.password,
        'User-Id': 'helix-discord-bot',
        'Client-Name': 'HELIX Discord Bot',
        'Num-Shards': '1',
      };

      this.ws = new WebSocketClient(this.wsUrl, undefined, { headers: wsHeaders });

      this.ws.onopen = () => {
        this.logger.info('Lavalink WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      };

      this.ws.onclose = (event) => {
        this.logger.warn('Lavalink WebSocket closed', { code: event.code, reason: event.reason });
        this.stopHeartbeat();
        this.handleDisconnect();
      };

      this.ws.onerror = (error) => {
        this.logger.error('Lavalink WebSocket error', { error: String(error) });
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          this.logger.error('Failed to parse Lavalink message', { error: String(err), raw: event.data });
        }
      };

      setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          this.ws?.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ op: 'heartbeat' });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleDisconnect(): void {
    this.cleanupPendingRequests(new Error('Disconnected'));
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.info('Attempting to reconnect to Lavalink', { attempt: this.reconnectAttempts });
      setTimeout(() => this.connectWS().catch(() => {}), this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.logger.error('Max reconnect attempts reached');
      this.emit('disconnected', { permanent: true });
    }
  }

  private send(payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private handleMessage(data: unknown): void {
    const msg = data as Record<string, unknown>;
    if (msg.op === 'event') {
      this.emit(msg.type as string, data);
    } else if (msg.op === 'stats') {
      this.emit('stats', data);
    } else if (msg.op === 'playerUpdate') {
      this.handlePlayerUpdate(data);
    } else if (msg.op === 'ready') {
      this.sessionId = msg.sessionId as string;
      this.emit('ready', data);
    } else if (msg.op === 'error') {
      this.logger.error('Lavalink error', { data });
    }

    if (msg.requestId && this.pendingRequests.has(msg.requestId as string)) {
      const pending = this.pendingRequests.get(msg.requestId as string)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(msg.requestId as string);
      if (msg.error) {
        pending.reject(new Error(msg.error as string));
      } else {
        pending.resolve(msg.data);
      }
    }
  }

  private handlePlayerUpdate(data: unknown): void {
    const msg = data as Record<string, unknown>;
    const guildId = msg.guildId as string;
    const player = this.players.get(guildId);
    if (player && msg.state) {
      const state = msg.state as Record<string, unknown>;
      player.position = (state.position as number) ?? player.position;
      if (state.paused !== undefined) player.paused = state.paused as boolean;
    }
    this.emit('playerUpdate', data);
  }

  private makeRequest<T>(op: string, data: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'));
        return;
      }

      const requestId = String(++this.requestId);
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, 15000);

      this.pendingRequests.set(requestId, { resolve: resolve as (value: unknown) => void, reject, timeout });
      this.send({ op, requestId, ...(data as Record<string, unknown>) });
    });
  }

  on(event: string, handler: (data: unknown) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: (data: unknown) => void): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: unknown): void {
    this.eventHandlers.get(event)?.forEach((h) => {
      try {
        h(data);
      } catch (err) {
        this.logger.error('Event handler error', { event, error: String(err) });
      }
    });
  }

  private cleanupPendingRequests(error: Error): void {
    for (const [, { reject, timeout }] of this.pendingRequests) {
      clearTimeout(timeout);
      reject(error);
    }
    this.pendingRequests.clear();
  }

  private async rest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.config.password,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`REST ${res.status}: ${text}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  async createPlayer(guildId: string): Promise<void> {
    await this.makeRequest('createPlayer', { guildId });
    const player: PlayerState = {
      guildId,
      channelId: null,
      queue: [],
      current: null,
      history: [],
      paused: false,
      volume: 100,
      loop: 'none',
      shuffled: false,
      position: 0,
    };
    this.players.set(guildId, player);
  }

  async destroyPlayer(guildId: string): Promise<void> {
    await this.makeRequest('destroyPlayer', { guildId });
    this.players.delete(guildId);
  }

  async connectVoice(guildId: string, channelId: string, deaf = true, mute = false): Promise<void> {
    const player = this.players.get(guildId);
    if (!player) await this.createPlayer(guildId);
    await this.makeRequest('connect', { guildId, channelId, deaf, mute });
    this.players.get(guildId)!.channelId = channelId;
  }

  async disconnectVoice(guildId: string): Promise<void> {
    await this.makeRequest('disconnect', { guildId });
    const player = this.players.get(guildId);
    if (player) player.channelId = null;
  }

  async play(guildId: string, track: Track): Promise<void> {
    await this.makeRequest('play', { guildId, encodedTrack: track.identifier });
    const player = this.players.get(guildId);
    if (player) {
      if (player.current) {
        player.history.push(player.current);
        if (player.history.length > 50) player.history.shift();
      }
      player.current = { track, requester: '', requestedAt: Date.now() };
      player.paused = false;
    }
  }

  async previous(guildId: string): Promise<QueueItem | null> {
    const player = this.players.get(guildId);
    if (!player || player.history.length === 0) return null;

    const prev = player.history.pop()!;
    if (player.current) {
      player.history.push(player.current);
    }
    player.current = prev;
    player.paused = false;
    player.position = 0;
    await this.makeRequest('play', { guildId, encodedTrack: prev.track.identifier });
    return prev;
  }

  async stop(guildId: string): Promise<void> {
    await this.makeRequest('stop', { guildId });
    const player = this.players.get(guildId);
    if (player) {
      if (player.current) {
        player.history.push(player.current);
        if (player.history.length > 50) player.history.shift();
      }
      player.current = null;
      player.queue = [];
    }
  }

  async pause(guildId: string, pause: boolean): Promise<void> {
    await this.makeRequest('pause', { guildId, pause });
    const player = this.players.get(guildId);
    if (player) player.paused = pause;
  }

  async seek(guildId: string, position: number): Promise<void> {
    await this.makeRequest('seek', { guildId, position });
    const player = this.players.get(guildId);
    if (player) player.position = position;
  }

  async setVolume(guildId: string, volume: number): Promise<void> {
    await this.makeRequest('volume', { guildId, volume });
    const player = this.players.get(guildId);
    if (player) player.volume = volume;
  }

  async setLoop(guildId: string, mode: 'none' | 'track' | 'queue'): Promise<void> {
    await this.makeRequest('loop', { guildId, mode });
    const player = this.players.get(guildId);
    if (player) player.loop = mode;
  }

  async setShuffle(guildId: string, shuffle: boolean): Promise<void> {
    await this.makeRequest('shuffle', { guildId, shuffle });
    const player = this.players.get(guildId);
    if (player) player.shuffled = shuffle;
  }

  async loadTracks(query: string): Promise<{ loadType: string; data: Track[]; playlistInfo?: unknown }> {
    return this.rest(`/v4/loadtracks?identifier=${encodeURIComponent(query)}`);
  }

  async getStats(): Promise<LavalinkStats> {
    return this.rest('/v4/stats');
  }

  async getPlayer(guildId: string): Promise<PlayerState | null> {
    return this.players.get(guildId) ?? null;
  }

  async setFilter(guildId: string, filters: unknown): Promise<void> {
    await this.makeRequest('filters', { guildId, filters });
  }

  handleVoiceStateUpdate(data: unknown): void {
    this.emit('voiceStateUpdate', data);
  }

  handleVoiceServerUpdate(data: unknown): void {
    this.emit('voiceServerUpdate', data);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}
