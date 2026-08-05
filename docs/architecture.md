# Architecture

This profile is a Vite-built TypeScript single-page application. It follows a
feature-first clean architecture influenced by the read-only
`resources/github_dev_tools` reference project.

## Runtime boot path

There is one production startup path:

1. `index.html` loads `src/main.ts`.
2. `src/main.ts` forwards to `src/app/main.ts`.
3. `src/app/main.ts` imports authored styles, registers Material Web, and calls
   `startApp()` from `src/app/App.ts`.
4. `App.ts` initializes app-wide services and supplies feature load handlers to
   the router.
5. The router loads feature-owned HTML fragments into the existing shell.

Do not add another entry point, initialize the application from a feature, or
attach new APIs to `globalThis`.

## Source ownership

```text
src/
|-- main.ts
|-- app/
|   |-- main.ts
|   |-- App.ts
|   `-- router/
|-- core/
|   |-- dom/
|   |-- material/
|   |-- metadata/
|   |-- styles/
|   |-- theme/
|   `-- types/
`-- features/
    |-- apps/
    |-- blog/
    |-- faq/
    |-- legal/
    |-- navigation-drawer/
    |-- profile/
    |-- projects/
    |-- resume/
    `-- songs/
```

- `app` owns startup and route orchestration.
- `core` owns infrastructure that is genuinely shared by multiple features.
- `features` own their data, domain, presentation code, and route fragments.

Create `data`, `domain`, or `presentation` only when it contains real code. A
feature must not reach another feature through browser globals; use explicit
imports and small typed contracts.

## Routing and static fragments

Hash routes are the public URL contract. `RouteRegistry.ts` contains route data,
`ContentLoader.ts` fetches markup, `HistoryManager.ts` owns title/history
updates, and `Router.ts` coordinates them.

Feature HTML belongs under `src/features/**/presentation/*.html`.
`scripts/copy-page-fragments.mjs` copies those files to `dist/content/**` at
build time. `dist` is generated output and must not be edited.

## TypeScript and bundling

Vite is the only JavaScript emitter. `tsc` validates `src` with `noEmit`, so the
build does not create a second unused JavaScript tree. Production files must
remain checked modules: no `@ts-nocheck`, CommonJS export shims, or ambient
application-global declarations.

## Material Web

`src/core/material/MaterialRegistry.ts` is the single registration boundary.
It uses explicit npm imports for the elements present in markup and generated
presentation code. See [Material Web usage](material-web.md).

Authored CSS may arrange content and apply design-system tokens. It must not
recreate Material state layers, resize internal component structure, or add
hover zoom/elevation behavior to Material controls.

## Verification

Run `npm run check` before merging when dependencies are available. It runs
tests, TypeScript validation, the production build, route-fragment generation,
SEO checks, and production-asset verification.
