# Architecture

The site is a TypeScript single-page application built with Vite and deployed to GitHub Pages. Its source boundaries mirror the feature-first structure used by `github-dev-tools`: application startup lives in `app`, reusable infrastructure lives in `core`, and product behavior lives in `features`.

## Root layout

```text
.github/workflows/  Pull-request validation and Pages deployment
index.html          Vite browser document
public/             Static assets copied directly to dist
scripts/            Build and deployment verification
src/                Application source
tests/              Jest tests that mirror source responsibilities
```

Generated `dist/` output is ignored and must never be edited or committed.

## Source layout

```text
src/
├── main.ts                 Compatibility browser entry
├── app/
│   ├── main.ts             Production module graph and startup call
│   ├── App.ts              Application initialization
│   └── router/             Route registry, loading, history, and transitions
├── core/
│   ├── animations/         Site-wide motion
│   ├── dom/                Shared DOM helpers
│   ├── material/           Central Material Web registration
│   ├── metadata/           Route metadata
│   ├── styles/             Authored global styles
│   ├── theme/              Theme behavior
│   └── types/              Shared TypeScript contracts
└── features/               Feature-owned data, domain, presentation, and HTML
```

`src/main.ts` exists only because the current `index.html` references it. It forwards immediately to `src/app/main.ts`; no application logic belongs in the compatibility file.

## Boot path

1. `index.html` loads `src/main.ts` through Vite.
2. `src/main.ts` forwards to `src/app/main.ts`.
3. `src/app/main.ts` imports the Material registry, shared infrastructure, feature modules, router modules, and authored CSS.
4. `src/app/main.ts` calls `startApp()` from `src/app/App.ts`.
5. `App.ts` waits for the document when needed, initializes shared UI behavior, captures the home fragment, configures the router, and installs navigation listeners.

There must be one boot path. Feature files must not initialize the whole application.

## TypeScript and bundling

Vite is the only JavaScript emitter. `tsc` validates every production TypeScript file with `noEmit`; it no longer creates a second `dist/assets/js` tree that the browser never loads. This follows the same compiler-and-bundler separation used by `github-dev-tools`.

The project still contains browser-global compatibility APIs from the older architecture. Existing modules may expose them while migration continues, but new code must use imports and exports. `App.ts` is now a checked module rather than an unchecked global script.

## Features

Each feature owns only the layers it needs. Do not create empty `data`, `domain`, or `presentation` directories merely to complete a diagram.

Examples:

- `features/blog/data` and `features/blog/presentation`
- `features/resume/data` and `features/resume/presentation`
- `features/songs/data`, `features/songs/domain`, and `features/songs/presentation`
- `features/legal/presentation`
- `features/apps/smart-cleaner/presentation`

Static route fragments live under `src/features/**/presentation/*.html`. `scripts/copy-page-fragments.mjs` copies them to `dist/content/**` during the build, and route definitions reference those generated public paths.

## Verification

`npm run check` is the pre-merge command. It runs:

1. Jest tests
2. TypeScript validation
3. Vite production build
4. Route-fragment generation
5. SEO asset checks
6. Production asset checks

`.github/workflows/ci.yml` runs this command for pull requests and pushes to `main`. `.github/workflows/pages.yml` remains responsible for publishing the built artifact.

## Material Web

Material registration is centralized in `src/core/material/MaterialRegistry.ts`. Use Material elements directly and prefer supported attributes, slots, and design tokens. Custom CSS belongs to layout, typography, brand tokens, responsive behavior, or feature presentation that Material does not provide.
