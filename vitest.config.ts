import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for HELIX Discord Bot.
 *
 * The project uses TypeScript ESM with NodeNext module resolution, which means
 * source imports use `.js` extensions even though source files are `.ts`.
 * Vitest runs directly against TypeScript sources (no pre-compilation step),
 * so we register an alias that rewrites `*.js` → `*.ts` when resolving within
 * the `src/` directory.
 */
export default defineConfig({
  resolve: {
    alias: [
      // Rewrite all src-relative `.js` imports to their `.ts` counterparts so
      // Vitest can resolve TypeScript source files without a build step.
      {
        // Rewrite imports like `../../src/foo/bar.js` → absolute `<root>/src/foo/bar.ts`
        // so Vitest resolves TypeScript sources directly without a build step.
        find: /^((?:\.\.\/)+|\/)?src\/(.+)\.js$/,
        replacement: `${import.meta.dirname}/src/$2.ts`,
      },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    // Include every *.test.ts under tests/
    include: ['tests/**/*.test.ts'],
    // Exclude node_modules and dist explicitly
    exclude: ['node_modules/**', 'dist/**'],
    // Per-file test isolation (default) — each test file gets its own worker
    pool: 'forks',
    coverage: {
      provider: 'v8',
      // Only measure coverage for src/ (not dist/, tests/, or config files)
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
    },
  },
});
