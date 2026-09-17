import WebSocket from 'ws';
import type { Logger } from '../../util/logger.js';
import type { LavalinkConfig } from '../../config.js';

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

export interface VoiceGateway {
  joinChannel(guildId: string, channelId: string, deaf?: boolean, mute?: boolean): Promise<void>;
  leaveChannel(guildId: string): Promise<void>;
}

interface NormalizedLoadResult {
  loadType: string;
  data: Track[];
  playlistInfo?: unknown;
}

/**
 * Lavalink v4 client. Speaks the native Lavalink WS protocol (fire-and-forget
 * ops: play/stop/pause/seek/volume/filters/destroy/voiceUpdate) and REST
 * (loadtracks/info/stats). Queue, history, loop and shuffle are owned
 * client-side; track-end events advance the queue automatically.
 */
export class LavalinkManager {
  private readonly logger: Logger;
  private readonly config: LavalinkConfig;
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000;
  private readonly eventHandlers = new Map<string, Set<(data: unknown) => void>>();
  private readonly players = new Map<string, PlayerState>();
  private readonly voiceSessions = new Map<string, string>();
  private voiceConnector: VoiceGateway | null = null;

  constructor(config: LavalinkConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  setVoiceConnector(connector: VoiceGateway): void {
    this.voiceConnector = connector;
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

      const ws = new WebSocket(this.wsUrl, { headers: wsHeaders });
      this.ws = ws;

      const onOpen = () => {
        this.logger.info('Lavalink WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      const onReady = (data: unknown) => {
        const msg = data as { sessionId?: string; resumed?: boolean };
        this.sessionId = msg.sessionId ?? null;
        this.logger.info('Lavalink session ready', { sessionId: this.sessionId, resumed: msg.resumed ?? false });
      };

      const offReady = this.once('ready', onReady);

      ws.on('open', onOpen);

      ws.on('message', (data, isBinary) => {
        if (isBinary) return;
        try {
          const raw = data as unknown;
          const text = typeof raw === 'string' ? raw : Buffer.from(raw as string | Uint8Array).toString('utf8');
          this.handleMessage(JSON.parse(text));
        } catch (err) {
          this.logger.error('Failed to parse Lavalink message', { error: String(err) });
        }
      });

      ws.on('close', (code, reason) => {
        offReady();
        if (this.ws !== ws) return;
        this.ws = null;
        this.logger.warn('Lavalink WebSocket closed', { code, reason: reason.toString() });
        this.handleDisconnect();
      });

      ws.on('error', (err) => {
        offReady();
        const message = (err as Error & { message?: string }).message ?? String(err);
        this.logger.error('Lavalink WebSocket error', { error: message });
        reject(new Error(message));
      });

      setTimeout(() => {
        if (this.ws === ws && ws.readyState !== WebSocket.OPEN) {
          reject(new Error('Lavalink WebSocket connection timeout'));
        }
      }, 10000).unref();
    });
  }

  private once(event: string, handler: (data: unknown) => void): () => void {
    let off: (() => void) | null = null;
    off = this.on(event, (data) => {
      off?.();
      handler(data);
    });
    return () => off?.();
  }

  private handleDisconnect(): void {
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
    switch (msg.op) {
      case 'ready': {
        this.sessionId = (msg.sessionId as string) ?? null;
        this.emit('ready', data);
        return;
      }
      case 'playerUpdate':
        this.handlePlayerUpdate(data);
        return;
      case 'stats':
        this.emit('stats', data);
        return;
      case 'event':
        this.emit('event', data);
        if (msg.type === 'TrackEndEvent') {
          this.handleTrackEnd(data);
        }
        return;
      default:
        this.emit(msg.op as string, data);
    }
  }

  private handlePlayerUpdate(data: unknown): void {
    const msg = data as Record<string, unknown>;
    const guildId = msg.guildId as string;
    const player = this.players.get(guildId);
    if (player && msg.state) {
      const state = msg.state as Record<string, unknown>;
      if (typeof state.position === 'number') player.position = state.position;
      if (typeof state.paused === 'boolean') player.paused = state.paused;
    }
    this.emit('playerUpdate', data);
  }

  private handleTrackEnd(data: unknown): void {
    const msg = data as Record<string, unknown>;
    const guildId = msg.guildId as string;
    const reason = msg.reason as string;
    const player = this.players.get(guildId);
    if (!player) return;

    if (reason === 'replaced') return;

    const finished = player.current;
    if (finished) {
      player.history.push(finished);
      if (player.history.length > 50) player.history.shift();
    }

    if (reason === 'finished' && player.loop === 'track' && finished) {
      player.paused = false;
      player.position = 0;
      this.send({ op: 'play', guildId, track: finished.track.identifier });
      return;
    }

    const next = player.queue.shift() ?? null;
    if (next) {
      player.current = next;
      player.paused = false;
      player.position = 0;
      this.send({ op: 'play', guildId, track: next.track.identifier });
      return;
    }

    if (player.loop === 'queue' && player.history.length) {
      player.queue.push(...player.history);
      player.history = [];
      const first = player.queue.shift()!;
      player.current = first;
      player.paused = false;
      player.position = 0;
      this.send({ op: 'play', guildId, track: first.track.identifier });
      return;
    }

    player.current = null;
    player.position = 0;
    this.emit('queueEnd', { guildId });
  }

  private toTrack(raw: unknown): Track {
    const value = raw as {
      encoded?: string;
      identifier?: string;
      info?: {
        identifier?: string;
        title?: string;
        author?: string;
        length?: number;
        position?: number;
        isStream?: boolean;
        uri?: string;
        artworkUrl?: string | null;
        sourceName?: string;
      };
      title?: string;
      author?: string;
      length?: number;
      position?: number;
      isStream?: boolean;
      uri?: string;
      artworkUrl?: string | null;
      sourceName?: string;
    };

    if (value.info) {
      return {
        identifier: value.encoded ?? value.info.identifier ?? '',
        title: value.info.title ?? 'Unknown',
        author: value.info.author ?? 'Unknown',
        length: value.info.length ?? 0,
        position: value.info.position ?? 0,
        isStream: value.info.isStream ?? false,
        uri: value.info.uri ?? '',
        artworkUrl: value.info.artworkUrl ?? null,
        sourceName: value.info.sourceName ?? 'lavalink',
      };
    }

    return {
      identifier: value.encoded ?? value.identifier ?? '',
      title: value.title ?? 'Unknown',
      author: value.author ?? 'Unknown',
      length: value.length ?? 0,
      position: value.position ?? 0,
      isStream: value.isStream ?? false,
      uri: value.uri ?? '',
      artworkUrl: value.artworkUrl ?? null,
      sourceName: value.sourceName ?? 'lavalink',
    } as Track;
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
    if (this.players.has(guildId)) return;
    this.players.set(guildId, {
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
    });
  }

  async destroyPlayer(guildId: string): Promise<void> {
    this.send({ op: 'destroy', guildId });
    this.players.delete(guildId);
    this.voiceSessions.delete(guildId);
    if (this.voiceConnector) {
      try {
        await this.voiceConnector.leaveChannel(guildId);
      } catch (err) {
        this.logger.warn('Failed to leave voice channel', { guildId, error: String(err) });
      }
    }
  }

  async connectVoice(guildId: string, channelId: string, deaf = true, mute = false): Promise<void> {
    let player = this.players.get(guildId);
    if (!player) {
      await this.createPlayer(guildId);
      player = this.players.get(guildId)!;
    }
    player.channelId = channelId;
    if (this.voiceConnector) {
      await this.voiceConnector.joinChannel(guildId, channelId, deaf, mute);
    }
  }

  async disconnectVoice(guildId: string): Promise<void> {
    const player = this.players.get(guildId);
    if (player) player.channelId = null;
    if (this.voiceConnector) {
      try {
        await this.voiceConnector.leaveChannel(guildId);
      } catch (err) {
        this.logger.warn('Failed to leave voice channel', { guildId, error: String(err) });
      }
    }
  }

  async play(guildId: string, track: Track): Promise<void> {
    const player = this.players.get(guildId);
    if (player) {
      if (player.current) {
        player.history.push(player.current);
        if (player.history.length > 50) player.history.shift();
      }
      player.current = { track, requester: '', requestedAt: Date.now() };
      player.paused = false;
      player.position = 0;
    }
    this.send({ op: 'play', guildId, track: track.identifier });
  }

  async previous(guildId: string): Promise<QueueItem | null> {
    const player = this.players.get(guildId);
    if (!player || player.history.length === 0) return null;

    const prev = player.history.pop()!;
    if (player.current) {
      player.history.push(player.current);
      if (player.history.length > 50) player.history.shift();
    }
    player.current = prev;
    player.paused = false;
    player.position = 0;
    this.send({ op: 'play', guildId, track: prev.track.identifier });
    return prev;
  }

  async stop(guildId: string): Promise<void> {
    this.send({ op: 'stop', guildId });
  }

  async pause(guildId: string, pause: boolean): Promise<void> {
    this.send({ op: 'pause', guildId, pause });
    const player = this.players.get(guildId);
    if (player) player.paused = pause;
  }

  async seek(guildId: string, position: number): Promise<void> {
    this.send({ op: 'seek', guildId, position });
    const player = this.players.get(guildId);
    if (player) player.position = position;
  }

  async setVolume(guildId: string, volume: number): Promise<void> {
    this.send({ op: 'volume', guildId, volume });
    const player = this.players.get(guildId);
    if (player) player.volume = volume;
  }

  async setLoop(guildId: string, mode: 'none' | 'track' | 'queue'): Promise<void> {
    const player = this.players.get(guildId);
    if (player) player.loop = mode;
  }

  async setShuffle(guildId: string, shuffle: boolean): Promise<void> {
    const player = this.players.get(guildId);
    if (player) player.shuffled = shuffle;
  }

  async loadTracks(query: string): Promise<NormalizedLoadResult> {
    const raw = (await this.rest(`/v4/loadtracks?identifier=${encodeURIComponent(query)}`)) as {
      loadType: string;
      data?: { tracks?: unknown[]; info?: unknown } | unknown[];
    };

    const loadType = raw.loadType ?? 'empty';
    let data: Track[] = [];
    if (loadType === 'playlist' && raw.data && !Array.isArray(raw.data)) {
      data = ((raw.data as { tracks?: unknown[] }).tracks ?? []).map((t) => this.toTrack(t));
      return { loadType, data, playlistInfo: (raw.data as { info?: unknown }).info };
    }

    if (Array.isArray(raw.data)) {
      data = raw.data.map((t) => this.toTrack(t));
    }

    return { loadType, data };
  }

  async getStats(): Promise<LavalinkStats> {
    return this.rest('/v4/stats');
  }

  async getPlayer(guildId: string): Promise<PlayerState | null> {
    return this.players.get(guildId) ?? null;
  }

  async setFilter(guildId: string, filters: unknown): Promise<void> {
    this.send({ op: 'filters', guildId, filters });
  }

  handleVoiceStateUpdate(data: unknown): void {
    const msg = data as { guildId: string; sessionId?: string | null; channelId?: string | null };
    if (msg.sessionId) {
      this.voiceSessions.set(msg.guildId, msg.sessionId);
    } else {
      this.voiceSessions.delete(msg.guildId);
    }
    const player = this.players.get(msg.guildId);
    if (player) player.channelId = msg.channelId ?? null;
    this.emit('voiceStateUpdate', data);
  }

  handleVoiceServerUpdate(data: unknown): void {
    const msg = data as { token: string; guild_id: string; endpoint?: string };
    const sessionId = this.voiceSessions.get(msg.guild_id);
    if (!sessionId) {
      this.logger.warn('Voice server update received without a voice session', { guildId: msg.guild_id });
      return;
    }
    const endpoint = (msg.endpoint ?? '').replace(/^wss?:\/\//, '');
    this.send({
      op: 'voiceUpdate',
      guildId: msg.guild_id,
      sessionId,
      event: { token: msg.token, guild_id: msg.guild_id, endpoint },
    });
    this.emit('voiceServerUpdate', data);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}
