# HELIX Test Suite

Vitest-based test suite for the HELIX Discord Bot workspace. The suite is split
into unit and integration layers so fast per-module checks run separately from
cross-module end-to-end coverage.

## Layout

```
tests/
├── unit/                     # Fast, isolated module tests
│   ├── commands/             # CommandDefinition metadata integrity (metadata.test.ts)
│   ├── config.test.ts        # Runtime config defaults
│   ├── dashboard/            # NextAuth config, auth handlers, router, dashboard HTML
│   ├── db/                   # BotDatabase lifecycle, tickets, config, sessions
│   ├── env/                  # src/env.ts accessors + platform URL auto-resolution
│   ├── handlers/             # message-handler, slash-handler, help-registrar, logs-handler
│   ├── plugins/              # registry, manifest, repo-config, SDK (ast, snippet, etc.)
│   ├── scaffolding/          # template-engine, file-generator, scaffold
│   ├── server/               # invite URL resolution
│   └── utils/, version.test.ts
├── integration/              # Cross-module, temp-dir / temp-DB end-to-end
│   ├── dashboard/            # full-stack: DB sessions → stats route → HTML
│   ├── events/               # BotEvent modules match discord.js gateway names
│   ├── plugins/              # whole built-in helix-origin plugin ecosystem via registry
│   └── scaffolding/          # executeScaffold e2e + dry-run into temp dirs
└── fixtures/                 # Shared test data (templates, code samples, plugin repos)
    ├── template-files.ts
    ├── code-samples.ts
    └── plugin-repo.ts
```

## Running

| Command | Scope |
|---------|-------|
| `npm test` | Full suite (unit + integration) |
| `npm run test:unit` | `tests/unit` only |
| `npm run test:integration` | `tests/integration` only |
| `npm run test:types` | Type-check the test tree (`tsconfig.test.json`) |
| `npm run typecheck` | `HELIX` package type-check (`tsc --noEmit`) |

Single file:

```bash
npx vitest run tests/unit/dashboard/auth-config.test.ts
```

## Conventions

- **No sub-index files.** Test modules export named definitions (`export const
  ping: CommandDefinition`) exactly as the source does — the metadata test
  validates export-name/definition-name symmetry.
- **Import from source via relative `.js` specifiers.**
  `tests/unit/... -> ../../../HELIX/src/...` and `tests/integration/... -> ../../../HELIX/src/...`.
- **Env isolation.** Never read live `.env` values: use `tests/helpers/env.ts`
  (`new EnvSandbox()`, `set(key, undefined)` deletes the key, `restore()` in
  `afterEach`). Discord OAuth env keys are loaded into `process.env` on import
  of `src/env.ts`, so dashboard/server tests must clear them explicitly.
- **Temp databases.** Anything touching `BotDatabase.getInstance()` must call
  `withTempDbEnvironment()` at module scope (`tests/helpers/db.ts`) before the
  first `getInstance()`; close the singleton in `afterAll` before `env.cleanup()`
  to avoid Windows file locks.
- **Dynamic imports of source.** Vite cannot resolve `pathToFileURL()` URLs for
  paths containing spaces, so runtime loaders (`loadPrefixCommands`,
  `loadEvents`, `loadAllPlugins`) are not exercised directly. Tests import the
  modules they would load using relative specifiers derived from the test file
  location and validate them through the real registry APIs.
- **Text-only fixtures.** All fixtures are `.ts` exports — no loose JSON/YAML
  snaphots that can drift from the source schema.

## Platform URL auto-resolution

`src/env.ts` derives `DISCORD_CALLBACK_URL` / `NEXTAUTH_URL` from one-click
platform vars (`RENDER_EXTERNAL_URL`, `KOYEB_PUBLIC_DOMAIN`, `RAILWAY_STATIC_URL`,
`RAILWAY_PUBLIC_DOMAIN`, `FLY_APP_NAME`, Heroku, `DOMAIN`) and normalizes any
`.../api/auth/callback/discord` suffix back to its base, so the full Discord
developer-portal callback form works without a double path. See `tests/unit/env/env.test.ts`
and `tests/integration/dashboard/dashboard-api.test.ts`.