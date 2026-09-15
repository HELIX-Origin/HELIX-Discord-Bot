## ✅ Phase 8 — Dashboard UX Updates (Complete)

All Dashboard UX updates from the issue checklist are complete and verified:

- **Login button restored** in the top bar on all pages (was accidentally lost during rebuild).
- **Theme toggle removed** — theme & color scheme are configured entirely via `.env` (`DASHBOARD_THEME`/`DASHBOARD_COLOR_SCHEME`), so lower-end machines can run lightweight themes while higher-end machines can use enhanced ones.
- **Removed the "All" type option** for supported feeds — users pick specific feeds/sources via the existing capability cards.
- **Free Games customization top bar removed** — just the enable/disable cards remain.
- **Settings page made public with an owner-only section** — each guild admin configures their guild's feed settings (poll rate, thread keepalive timing, thread support toggle, feed/forum channel targets); host-level settings are hidden behind an owner-only area.
- **Path-based routing** implemented: `/guilds`, `/dashboard/{guildId}[/{page}]` with in-memory `history.pushState` navigation (instant sub-page switches, zero server round-trips).
- **Dev Tools relocated** to user badge dropdown (owner/team only), no longer a sidebar tab — the Admin page (`/admin`) already existed with full functionality.

Verified: `npm run check` + `npm run build` pass.