# Dashboard SSR View Template

Standard Dashboard SSR View Component Template.
Follows Rule 07: Management Dashboard Standards.

```typescript
export interface ExampleViewProps {
  title: string;
  description: string;
  items: Array<{ id: string; name: string; status: string }>;
}

export function renderExampleView(props: ExampleViewProps): string {
  const itemList = props.items
    .map(
      (item) => `
      <div class="card item-card p-4 rounded-lg mb-3 flex items-center justify-between">
        <div>
          <span class="font-semibold text-primary">${escapeHtml(item.name)}</span>
          <span class="text-xs text-muted ml-2">#${escapeHtml(item.id)}</span>
        </div>
        <span class="badge badge-accent">${escapeHtml(item.status)}</span>
      </div>
    `,
    )
    .join('');

  return `
    <div class="view-container max-w-4xl mx-auto p-6">
      <div class="view-header mb-6">
        <h2 class="text-2xl font-bold text-primary">${escapeHtml(props.title)}</h2>
        <p class="text-sm text-secondary">${escapeHtml(props.description)}</p>
      </div>

      <div class="items-list">
        ${itemList || '<p class="text-muted">No items configured yet.</p>'}
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```
