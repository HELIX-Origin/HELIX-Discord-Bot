# Skill: Vue Development

## Overview
Standards and best practices for Vue 3 applications utilizing the Composition API, `<script setup>`, TypeScript, Pinia, and Vite.

## Recommended Stack
- **Framework**: Vue 3 + TypeScript
- **Bundler**: Vite (`@vitejs/plugin-vue`)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **UI & Styling**: Tailwind CSS or UnoCSS

## Initialization Recipe
```bash
npm create vite@latest my-vue-app -- --template vue-ts
cd my-vue-app
npm install pinia vue-router
```

## `<script setup lang="ts">` Idiom
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  initialCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialCount: 0,
});

const emit = defineEmits<{
  (e: 'change', value: number): void;
}>();

const count = ref(props.initialCount);
const double = computed(() => count.value * 2);

function increment() {
  count.value++;
  emit('change', count.value);
}
</script>

<template>
  <button @click="increment">
    Count: {{ count }} (Double: {{ double }})
  </button>
</template>
```
