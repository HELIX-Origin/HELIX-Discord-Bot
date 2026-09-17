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

## ⚙️ Running Lavalink v4 Alongside the Bot

HELIX provides turnkey tooling to run a dedicated local Lavalink v4 server directly alongside the bot:

### 1. Requirements
- **Java 17+** (Java 21 recommended):
  - Debian/Ubuntu: `sudo apt update && sudo apt install -y openjdk-21-jre-headless`
  - Windows: Download and install OpenJDK 21 from [Adoptium](https://adoptium.net/)

### 2. Auto-Download and Run
HELIX includes an automated downloader script that fetches the latest official Lavalink v4 jar:
```bash
# Auto-download Lavalink.jar if not already present:
npm run lavalink:download

# Start the local Lavalink server:
npm run lavalink
```

### 3. Preconfigured Template & Plugins
The provided template [`lavalink/application.yml.example`](../lavalink/application.yml.example) (renamed to `application.yml` or auto-initialized on first run) comes preconfigured with:
- **`youtube-plugin`** (`dev.lavalink.youtube:youtube-plugin:1.18.2`): Official Lavalink YouTube source with Android & Web clients.
- **`lavasrc-plugin`** (`com.github.topi314.lavasrc:lavasrc-plugin:4.8.3`): Spotify track and playlist resolution using credentials from `.env`.

### 4. 24/7 systemd Service on Linux
To keep Lavalink running alongside the bot 24/7 on Ubuntu/Debian VPS:
```bash
sudo chmod +x scripts/install-lavalink-service.sh
sudo ./scripts/install-lavalink-service.sh
```

---

## ⚙️ External Lavalink v4 Server Connection

HELIX connects to Lavalink v4 over standard WebSocket and REST:
- Set `LAVA_HOST=127.0.0.1`, `LAVA_PORT=2333`, `LAVA_PASS=youshallnotpass`, and `LAVA_SECURE=false` in `.env` for local hosting.
- Supports any standard Lavalink v4 instance (local, remote VPS, or hosted provider).
- Uses the native WebSocket client with proper Discord Authorization headers.

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