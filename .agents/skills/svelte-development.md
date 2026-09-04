# Skill: Svelte Development

## Overview
Guidelines and architectural recipes for Svelte 5 applications utilizing Runes (`$state`, `$derived`, `$props`), Vite, and SvelteKit.

## Core Svelte 5 Concepts
- **Runes**: Explicit, universal fine-grained reactivity using `$state()`, `$derived()`, and `$effect()`.
- **Props**: Declared cleanly via `let { prop1, prop2 } = $props();`.
- **Snippets**: Replaces slots with flexible, first-class template snippets (`{#snippet name()}...{/snippet}`).

## Initialization Recipe
```bash
npm create vite@latest my-svelte-app -- --template svelte-ts
cd my-svelte-app
npm install
npm run dev
```

## Svelte 5 Component Example
```svelte
<script lang="ts">
  let { title = 'Default Title' }: { title?: string } = $props();

  let count = $state(0);
  let double = $derived(count * 2);

  function increment() {
    count += 1;
  }
</script>

<h1>{title}</h1>
<button onclick={increment}>
  Clicked {count} times (Double: {double})
</button>
```
