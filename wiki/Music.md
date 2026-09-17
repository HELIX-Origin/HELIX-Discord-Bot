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

## ⚙️ External Lavalink v4 Server Connection

HELIX Discord Bot connects exclusively to an external Lavalink v4 server as a WebSocket client:
- Set `LAVA_HOST`, `LAVA_PORT`, `LAVA_PASS`, and `LAVA_SECURE` in `.env`.
- Supports any standard Lavalink v4 instance (local, remote VPS, or hosted provider).
- Uses the `ws` package for reliable WebSocket connection with proper Discord Authorization headers.

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
LAVA_HOST=127.0.0.1
LAVA_PORT=2333
LAVA_PASS=youshallnotpass
LAVA_SECURE=false
```

---

## 🛠️ Troubleshooting

See [Troubleshooting → Lavalink / Music Playback Issues](Troubleshooting.md) for common problems:
- Lavalink connection refused / WebSocket errors
- Authorization header or password mismatches
- Voice gateway connection errors

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HELIX Discord Bot Process                 │
│  ┌─────────────┐    ┌──────────────────┐                    │
│  │ Discord Bot │───▶│ LavalinkManager  │                    │
│  │ (Gateway)   │    │ (Native WS v4)   │                    │
│  └─────────────┘    └──────────────────┘                    │
│         │                    │                              │
│         │                    ▼                              │
│         │           ┌──────────────────┐                    │
│         └──────────▶│ External Lavalink│                    │
│                     │ v4 Server (WS)   │                    │
│                     └──────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

- **LavalinkManager** (`src/bot/music/lavalink.ts`): Native Lavalink v4 WebSocket client using `ws` (fire-and-forget ops: `play`, `stop`, `pause`, `seek`, `volume`, `filters`, `destroy`, `voiceUpdate`).
- **VoiceGateway** (`src/bot/bot.ts`): Discord voice state updates → Lavalink `voiceUpdate` op.
- **Client-side queue**: Lavalink holds no queue state; bot manages queue/history/shuffle/loop and auto-advance on `TrackEndEvent`.