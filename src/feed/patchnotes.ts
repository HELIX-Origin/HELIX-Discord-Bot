import { fetchRaw } from './fetch.js';
import { decodeHtmlEntities, stripHtml } from './parser.js';

export interface PatchNoteItem {
  id: string;
  gameTitle: string;
  patchTitle: string;
  version?: string | null;
  url: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string;
}

export const POPULAR_STEAM_GAMES: Record<string, { name: string; appId: string }> = {
  cs2: { name: 'Counter-Strike 2', appId: '730' },
  dota2: { name: 'Dota 2', appId: '570' },
  rust: { name: 'Rust', appId: '252490' },
  helldivers2: { name: 'Helldivers 2', appId: '553850' },
  apex: { name: 'Apex Legends', appId: '1172470' },
  cyberpunk: { name: 'Cyberpunk 2077', appId: '1091500' },
  bg3: { name: "Baldur's Gate 3", appId: '1086940' },
  terraria: { name: 'Terraria', appId: '105600' },
  dbd: { name: 'Dead by Daylight', appId: '381210' },
  warframe: { name: 'Warframe', appId: '230410' },
  nomansky: { name: "No Man's Sky", appId: '275850' },
};

/**
 * Fetches game patch notes and update announcements from the Steam News API.
 */
async function fetchSteamPatchNotes(appId: string, gameName?: string): Promise<PatchNoteItem[]> {
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${encodeURIComponent(appId)}&count=10&maxlength=800&format=json`;

  try {
    const res = await fetchRaw(url, { timeoutMs: 10_000 });
    if (res.status < 200 || res.status >= 300 || !res.text) {
      return [];
    }

    const data = JSON.parse(res.text) as {
      appnews?: {
        appid: number;
        newsitems?: Array<{
          gid: string;
          title: string;
          url: string;
          is_external_url: boolean;
          author: string;
          contents: string;
          feedlabel: string;
          date: number;
          feedname: string;
          feed_type: number;
          appid: number;
        }>;
      };
    };

    const items = data.appnews?.newsitems || [];
    const resolvedGameName = gameName || `Steam App ${appId}`;

    return items.map((item) => {
      const cleanContents = decodeHtmlEntities(stripHtml(item.contents) ?? '').replace(/\{STEAM_CLAN_IMAGE\}[^\s]+/g, '').trim();
      const summary = cleanContents.length > 300 ? `${cleanContents.slice(0, 297)}...` : cleanContents;

      // Extract image URL from BBCode or HTML if present
      const imgMatch = /\{STEAM_CLAN_IMAGE\}\/([^\s]+)/.exec(item.contents) || /https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp)/i.exec(item.contents);
      const imageUrl = imgMatch ? (imgMatch[0].startsWith('{STEAM_CLAN_IMAGE}') ? `https://clan.akamai.steamstatic.com/images/${imgMatch[1]}` : imgMatch[0]) : null;

      // Version number regex match if present in title
      const versionMatch = /\bv?(\d+\.\d+(?:\.\d+)?(?:[a-zA-Z0-9_-]+)?)\b/.exec(item.title);

      return {
        id: `steam_patch_${item.gid}`,
        gameTitle: resolvedGameName,
        patchTitle: decodeHtmlEntities(item.title),
        version: versionMatch ? versionMatch[1] : null,
        url: item.url || `https://store.steampowered.com/news/app/${appId}/view/${item.gid}`,
        summary: summary || 'No patch summary provided.',
        imageUrl,
        publishedAt: new Date(item.date * 1000).toISOString(),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Main patch notes dispatcher.
 */
export async function fetchPatchNotes(feedUrl: string): Promise<PatchNoteItem[]> {
  const clean = feedUrl.replace(/^patchnotes:\/\//i, '').trim().toLowerCase();

  // Preset match
  const preset = POPULAR_STEAM_GAMES[clean];
  if (preset) {
    return fetchSteamPatchNotes(preset.appId, preset.name);
  }

  // Raw Steam AppID match: steam:730 or bare number 730
  const steamAppMatch = /^(?:steam:)?(\d+)$/.exec(clean);
  if (steamAppMatch?.[1]) {
    return fetchSteamPatchNotes(steamAppMatch[1]);
  }

  return [];
}
