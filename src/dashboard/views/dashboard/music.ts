export function renderMusicTab(): string {
  return `
    <!-- TAB: MUSIC (Lavalink Queue) -->
    <section id="tab-music" class="tab-pane">
      <div>
        <div class="section-title"><i class="fa-solid fa-music" style="color: #10b981;"></i> Music Player &amp; Queue</div>
        <div class="section-desc">Live playback and queue management for this server powered by external Lavalink v4.</div>
      </div>

      <div id="music-queue-view" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div class="empty-state">Loading player state...</div>
      </div>
    </section>
  `;
}
