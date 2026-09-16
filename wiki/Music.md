# 🎵 Music & Lavalink

HELIX Discord Bot includes a full-featured music playback system powered by **Lavalink v4**. It supports YouTube, Spotify, SoundCloud, Apple Music, Deezer, and more — with queue management, shuffle/loop/volume/seek controls, and a real-time dashboard queue page.

---

## 🎧 Supported Sources

| Source | Search / Direct URL | Notes |
| :--- | :--- | :--- |
| **YouTube** | `youtube:query` or `https://youtu.be/...` | Video, playlist, mix, live |
| **Spotify** | `spotify:track:...` or `https://open.spotify.com/...` | Track, album, playlist, artist |
| **SoundCloud** | `soundcloud:query` or `https://soundcloud.com/...` | Track, playlist, user |
| **Apple Music** | `applemusic:query` or `https://music.apple.com/...` | Track, album, playlist |
| **Deezer** | `deezer:query` or `https://www.deezer.com/...` | Track, album, playlist |
| **Bandcamp** | `bandcamp:query` or `https://bandcamp.com/...` | Track, album |
| **Vimeo** | `vimeo:query` or `https://vimeo.com/...` | Video |
| **Twitch** | `twitch:query` or `https://twitch.tv/...` | VOD, clip |
| **HTTP/HTTPS** | Direct audio file URL | `.mp3`, `.ogg`, `.flac`, `.wav`, `.m4a` |

> Uses Lavalink's built-in source managers and plugins. Spotify/Apple Music require `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` in `.env`.

---

## 🎮 Slash Commands

| Command | Options | Description |
| :--- | :--- | :--- |
| `/play` | `query: <string>` | Play music from any supported source. |
| `/queue` | *None* | Display the current music queue with pagination. |
| `/skip` | *None* | Skip the current track. |
| `/previous` | *None* | Play the previous track (history). |
| `/shuffle` | *None* | Shuffle the queue. |
| `/loop` | `mode: off \| track \| queue` | Set loop mode. |
| `/volume` | `level: <number>` | Set playback volume (0–100). |
| `/seek` | `position: <string>` | Seek to position (e.g., `1:30`, `2m30s`). |
| `/nowplaying` | *None* | Show currently playing track with progress bar. |
| `/pause` | *None* | Pause playback. |
| `/resume` | *None* | Resume playback. |
| `/stop` | *None* | Stop playback and clear queue. |
| `/leave` | *None* | Disconnect from voice channel. |

---

## ⚙️ Embedded vs External Lavalink

### Embedded Node (Default: `LAVA_EMBEDDED=true`)
- Ships as npm package `@helix-origin/lavalink-server` (pinned GitHub Release tarball, read-only).
- Bot bootstraps the Java node in-process and supervises it.
- **Requires**: Java 21+, `Lavalink.jar` in project root, `application.yml` in project root.
- Auto-downloads `Lavalink.jar` on first startup if missing.
- Configuration via `.env` (see [Configuration → Lavalink](Configuration.md)).
- No external services required.

### External Node (`LAVA_EMBEDDED=false`)
- Connect to your own Lavalink v4 server.
- Set `LAVA_HOST`, `LAVA_PORT`, `LAVA_PASS`, `LAVA_SECURE` in `.env`.
- You manage Java, Lavalink.jar, plugins, and scaling independently.

---

## 🎛️ Dashboard Queue Page

The web dashboard includes a **Music Queue** page (enabled when `LAVA_ENABLED=true`):
- Real-time queue visualization with track metadata (title, artist, duration, requester).
- Playback controls: play/pause, skip, stop, shuffle, loop, volume slider, seek bar.
- Queue management: remove tracks, clear queue, move tracks.
- Current track progress with live timestamp updates.

---

## 🔧 Configuration Reference

See [Configuration → Lavalink Music Configuration](Configuration.md) for the complete `.env` variable reference.

Key variables:
```env
LAVA_ENABLED=true
LAVA_EMBEDDED=true
LAVA_HOST=127.0.0.1
LAVA_PORT=2333
LAVA_PASS=youshallnotpass
LAVA_SECURE=false
LAVA_READY_TIMEOUT_MS=60000
LAVA_INTERNAL_URL=0.0.0.0:2333
LAVA_PUBLIC_URL=0.0.0.0:2333
GENIUS_ACCESS_TOKEN=        # Optional: lyrics
YOUTUBE_REFRESH_TOKEN=      # Optional: YouTube age-restricted
SPOTIFY_CLIENT_ID=          # Optional: Spotify
SPOTIFY_CLIENT_SECRET=      # Optional: Spotify
```

---

## 🛠️ Troubleshooting

See [Troubleshooting → Lavalink / Music Playback Issues](Troubleshooting.md) for common problems:
- Lavalink node not starting
- Connection refused / WebSocket errors
- No audio / track stuck
- Java missing / wrong version

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HELIX Discord Bot Process                 │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────┐  │
│  │ Discord Bot │───▶│ LavalinkManager  │───▶│ Lavalink v4│  │
│  │ (Gateway)   │    │ (Native WS v4)   │    │ Java Node  │  │
│  └─────────────┘    └──────────────────┘    └────────────┘  │
│         │                    │                    │          │
│         │                    ▼                    │          │
│         │           ┌──────────────┐             │          │
│         └──────────▶│ EmbeddedLava │─────────────┘          │
│                     │ Server (@h-  │                        │
│                     │  lx/l-s)     │                        │
│                     └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

- **LavalinkManager** (`src/bot/music/lavalink.ts`): Native Lavalink v4 WebSocket client (fire-and-forget ops: `play`, `stop`, `pause`, `seek`, `volume`, `filters`, `destroy`, `voiceUpdate`).
- **EmbeddedLavaServer** (`src/bot/music/embedded-lavalink.ts`): Spawns/supervises `@helix-origin/lavalink-server` (Java process), polls `/v4/info` for readiness.
- **VoiceGateway** (`src/bot/bot.ts`): Discord voice state updates → Lavalink `voiceUpdate` op.
- **Client-side queue**: Lavalink holds no queue state; bot manages queue/history/shuffle/loop and auto-advance on `TrackEndEvent`.