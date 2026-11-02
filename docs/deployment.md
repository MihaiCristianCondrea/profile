# Deployment

GitHub Pages publishes the generated Vite output in `dist/`, while Git tracks only source files and runtime static assets.

## Generated output

The generated site lives under `dist/` and is intentionally ignored. `npm run build` recreates it by:

- running Vite against `index.html` and `src/main.ts`;
- copying static runtime assets from `public/`;
- emitting the Vite-bundled TypeScript and CSS module graph;
- copying route fragments from `src/features/**/presentation/*.html` to `dist/content/features/**/presentation/*.html`;
- copying root SEO/support files (`robots.txt`, `sitemap.xml`, and `app-ads.txt`) into `dist/`.

Do not edit or commit files from `dist/` manually. Change TypeScript, CSS, and feature-owned HTML fragments in `src/`; change runtime static assets in `public/`; and keep root SEO/support files at the repository root.

## Local release check

Run the same commands the Pages workflow relies on before publishing changes:

```bash
npm test -- --runInBand
npm run build
npm run deploy
```

`npm run deploy` runs the full build and verifies the generated `dist/` artifact contains `sitemap.xml`, `robots.txt`, `app-ads.txt`, and `manifest.json`.

## GitHub Pages workflow

`.github/workflows/pages.yml` performs the deployment in this order:

1. Check out the repository.
2. Install dependencies with `npm ci`.
3. Run the Jest suite against TypeScript source.
4. Run `npm run deploy`, which regenerates `dist/`.
5. Upload `dist/` with `actions/upload-pages-artifact`.
6. Deploy the uploaded artifact with `actions/deploy-pages`.

That keeps the repository source-first while the published GitHub Pages artifact still contains every runtime file, static asset, and route fragment needed by `index.html`.

## Unstyled live site (raw source published)

Symptom: the live site shows plain black-on-white HTML — the drawer links as a run-on line of text, no Material components, no theme.

Cause: the repository's Pages **Source** was set to *Deploy from a branch*. GitHub then runs its own legacy "pages build and deployment" job on every push, in parallel with `.github/workflows/pages.yml`. That job publishes the repository root instead of `dist/`. The root `index.html` loads `/src/main.ts`, which browsers cannot execute, and all CSS is imported from that module graph, so nothing styles the page. Because the legacy job usually finishes last, it silently overwrites the correct deployment even when the workflow succeeds.

Fix (one-time, repository admin): **Settings → Pages → Build and deployment → Source → GitHub Actions**. The legacy job then stops running and only the workflow deploys `dist/`.

Guard: the `verify` job in `pages.yml` runs after deployment, waits for competing deployments to settle, and runs `scripts/verify-live-site.mjs` against the live URL. It fails the workflow if the live `index.html` references `src/main.ts` or lacks the built `./assets` bundles, so this regression can never pass unnoticed again. Run it locally with:

```bash
node scripts/verify-live-site.mjs https://mihaicristiancondrea.github.io/profile/
```

## Dependency security

`npm run check` starts with `npm audit --audit-level=low`, so any advisory fails CI. `package.json` `overrides` keep Jest's transitive tooling on patched releases:

- `glob` `^14.0.3` and `minimatch` `^11.0.4` (fixed upstream advisories).
- `deepmerge` → `tools/deepmerge-safe/`. Upstream `deepmerge` has a prototype-poisoning advisory with no fixed release, and only `jest-config` uses it. The local package implements the same API (`deepmerge(a, b, options)` and `deepmerge.all`) and never copies `__proto__`, `constructor`, or `prototype`. Remove the override once a fixed `deepmerge` is published or Jest drops it.

TypeScript stays on 6.x: TypeScript 7 (the native compiler) does not expose the JavaScript API that `ts-jest` needs.

## Smart Cleaner presentation

`#smart-cleaner-for-android` is reachable only by its link: it has no drawer entry, and
`tests/features/apps/smart-cleaner/presentation/SmartCleanerDrawer.test.ts` keeps it that way.
It renders the app's real screens from the vendored UI kit in `vendor/smart-cleaner-ui/` (see its
README to update it) with runtime assets in `public/smart-cleaner-ui/`. The page is scroll-driven
(`ScrollScenes.ts`); with reduced motion every scene rests at its final state.
