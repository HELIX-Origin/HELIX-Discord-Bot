export function renderCommandsTab(): string {
  return `
    <!-- TAB: COMMANDS -->
    <section id="tab-commands" class="tab-pane">
      <div>
        <div class="section-title"><i class="fa-solid fa-terminal" style="color: var(--primary);"></i> Available Commands</div>
        <div class="section-desc">A read-only reference of every command this bot offers for servers.</div>
      </div>
      <div id="commands-catalog"><div class="empty-state">Loading commands...</div></div>
    </section>
  `;
}
