export function renderCommandsTab(): string {
  return `
    <!-- TAB: COMMANDS -->
    <section id="tab-commands" class="tab-pane">
      <div>
        <div class="section-title"><i class="fa-solid fa-terminal" style="color: var(--primary);"></i> Available Slash Commands</div>
        <div class="section-desc">A read-only reference of all in-chat slash commands. Feeds (RSS, Reddit, YouTube, Twitch, Free Games), Welcome announcements, Support tickets, and Server settings are managed directly in their dedicated dashboard tabs.</div>
      </div>
      <div id="commands-catalog"><div class="empty-state">Loading commands...</div></div>
    </section>
  `;
}
