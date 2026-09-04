# Skill: React Development

## Overview
Guidelines and architectural recipes for React 19+ applications built with Vite, TypeScript, and modern state management.

## Recommended Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite (`@vitejs/plugin-react`)
- **State**: Zustand (client state) + TanStack Query (server state)
- **Styling**: Tailwind CSS + shadcn/ui or CSS Modules
- **Routing**: React Router v7 or TanStack Router

## Project Initialization
```bash
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
npm install lucide-react clsx tailwind-merge
```

## Component Architecture Patterns
- **Container / Presentational Separation**: Decouple data fetching hooks from pure rendering UI components.
- **Custom Hooks**: Extract reusable stateful logic into `src/hooks/use<Feature>.ts`.
- **Error Boundaries**: Wrap major route trees in React Error Boundaries to prevent total application crashes.
- **Suspense**: Use React `Suspense` for asynchronous component streaming and dynamic route loading.
