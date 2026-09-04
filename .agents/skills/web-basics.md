# Skill: Modern Web Basics

## Overview
Standards and best practices for modern web application scaffolding using HTML5, CSS3, modern JavaScript (ESNext), TypeScript, and bundlers like Vite.

## Tooling & Bundlers
- **Vite**: Recommended ultra-fast ESM bundler with hot module replacement (HMR).
- **TypeScript**: Configured with strict type safety and DOM lib extensions.
- **PostCSS / Tailwind CSS**: Recommended for scalable design tokens and utility-first styling.

## Minimal Vite Vanilla TypeScript Setup

```bash
npm create vite@latest my-web-app -- --template vanilla-ts
cd my-web-app
npm install
npm run dev
```

## Structure Best Practices
- **Semantic HTML**: Leverage `<header>`, `<main>`, `<nav>`, `<article>`, `<section>`, and `<footer>` for accessibility (a11y) and SEO.
- **Modern CSS Variables**: Define design tokens in `:root` for effortless dark-mode switching.
- **Asset Handling**: Reference assets via relative paths or import statements to allow Vite hashing for aggressive production caching.
