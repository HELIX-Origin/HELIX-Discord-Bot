import { FileToGenerate } from '../file-generator.js';

export function generateWebFiles(
  projectName: string,
  framework: 'react' | 'vue',
  variables: Record<string, string>
): FileToGenerate[] {
  if (framework === 'vue') {
    return [
      {
        relativePath: 'package.json',
        content: JSON.stringify(
          {
            name: projectName,
            version: '0.1.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vue-tsc && vite build',
              preview: 'vite preview',
            },
            dependencies: {
              vue: '^3.4.29',
              pinia: '^2.1.7',
            },
            devDependencies: {
              '@vitejs/plugin-vue': '^5.0.5',
              typescript: '^5.4.5',
              vite: '^5.3.1',
              'vue-tsc': '^2.0.21',
            },
          },
          null,
          2
        ) + '\n',
      },
      {
        relativePath: 'vite.config.ts',
        content: `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
`,
      },
      {
        relativePath: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
      },
      {
        relativePath: 'src/main.ts',
        content: `import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
`,
      },
      {
        relativePath: 'src/App.vue',
        content: `<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <main style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem;">
    <h1>${projectName}</h1>
    <p>Powered by Vue 3 + Vite + TypeScript (HELIX CLI)</p>
    <button @click="count++" style="padding: 0.5rem 1rem; cursor: pointer;">
      Count is: {{ count }}
    </button>
  </main>
</template>
`,
      },
    ];
  }

  // Default: React 19 / TypeScript
  return [
    {
      relativePath: 'package.json',
      content: JSON.stringify(
        {
          name: projectName,
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview',
          },
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            lucide: '^0.395.0',
          },
          devDependencies: {
            '@types/react': '^19.0.0',
            '@types/react-dom': '^19.0.0',
            '@vitejs/plugin-react': '^4.3.1',
            typescript: '^5.4.5',
            vite: '^5.3.1',
          },
        },
        null,
        2
      ) + '\n',
    },
    {
      relativePath: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      relativePath: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      relativePath: 'src/main.tsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    {
      relativePath: 'src/App.tsx',
      content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '2rem' }}>
      <h1>${projectName}</h1>
      <p>Powered by React 19 + Vite + TypeScript (HELIX CLI)</p>
      <button onClick={() => setCount(c => c + 1)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
        Count is: {count}
      </button>
    </div>
  );
}
`,
    },
  ];
}
