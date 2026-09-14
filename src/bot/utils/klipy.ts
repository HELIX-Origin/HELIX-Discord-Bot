export interface KlipyGifResponse {
  url: string;
  title?: string;
  tags?: string[];
}

export interface KlipyCategoriesResponse {
  categories: string[];
}

interface SimpleLogger {
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
}

const POPULAR_TAGS = [
  'anime',
  'jojo',
  'waifu',
  'slap',
  'gintama',
  'doggo',
  'cat',
  'hug',
  'kiss',
  'pat',
  'bonk',
  'cuddle',
  'tickle',
  'pet',
  'poke',
  'baka',
  'smug',
  'cry',
  'angry',
  'meme',
  'blush',
  'bite',
  'highfive',
  'kill',
  'lick',
  'nom',
  'peck',
  'punch',
  'wave',
  'wink',
  'yeet',
];

export class KlipyClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly logger: SimpleLogger;

  constructor(apiKey: string, logger: SimpleLogger, baseUrl = 'https://api.klipy.dev') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.logger = logger;
  }

  private async request<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        this.logger.warn('KLIPY API request failed', { path, status: res.status });
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      this.logger.warn('KLIPY API request error', { path, err: (err as Error).message });
      return null;
    }
  }

  async getRandomGif(): Promise<string | null> {
    const data = await this.request<KlipyGifResponse>('/random');
    return data?.url ?? null;
  }

  async getCategoryGif(tag: string): Promise<string | null> {
    const data = await this.request<KlipyGifResponse>(`/random?tag=${encodeURIComponent(tag)}`);
    return data?.url ?? null;
  }

  getPopularTags(): string[] {
    return POPULAR_TAGS;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}
