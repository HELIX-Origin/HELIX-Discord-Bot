# Web Development Agent

This agent provides conventions, architecture, and workflow standards for modern web applications across **React**, **Vue 3**, **Svelte 5**, **Angular**, **Next.js**, and vanilla web setups with **Vite** and **TypeScript**.

## Architecture & Structure

```
web-app/
├── src/
│   ├── assets/               # Static images, fonts, icons
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Buttons, modals, inputs
│   │   └── layout/           # Header, Sidebar, Footer
│   ├── hooks/ / composables/ # State hooks or Vue composables
│   ├── services/ / api/      # HTTP clients & API fetchers
│   ├── styles/               # Global CSS / Tailwind directives
│   │   └── globals.css
│   ├── types/                # Domain and response interfaces
│   ├── App.tsx / App.vue     # Root component
│   └── main.tsx / main.ts    # Application bootstrap
├── public/                   # Public assets served as root
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## Supported Frameworks & Starters

| Framework | Scaffolding Command | Primary Tools |
|-----------|---------------------|---------------|
| **React** | `helix create web-app my-react --template web-react` | React 19, Vite, Tailwind CSS, TanStack Query |
| **Vue 3** | `helix create web-app my-vue --template web-vue` | Vue 3, Vite, Pinia, Vue Router |
| **Svelte** | `helix create web-app my-svelte --template web-svelte` | Svelte 5 (Runes), SvelteKit / Vite |
| **Angular** | `helix create web-app my-angular --template web-angular`| Standalone components, Signals, Angular CLI |
| **Next.js** | `npx create-next-app@latest` | App Router, Server Components, SSR |

## Setup & Development Commands

```bash
# Install dependencies
npm install

# Start local dev server with HMR
npm run dev

# Run type check and linting
npm run typecheck
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

## Best Practices

1. **Strict Typing**: Enforce strict TypeScript compilation without implicit `any`.
2. **Component Modularity**: Maintain single-responsibility components with co-located or scoped styles.
3. **Environment Separation**: Use `.env.local` for local secrets and `.env.production` for build-time configurations using Vite prefixes (`VITE_`).
4. **Performance**: Utilize dynamic imports (`React.lazy` or `defineAsyncComponent`) for route-based code splitting.