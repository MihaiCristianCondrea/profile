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

Layer responsibilities inside a feature:

- `data` owns network and storage access, and returns typed results. Presentation
  code must not call `fetch` or `localStorage` directly.
- `domain` owns the feature's model, defaults, and normalization of untrusted
  input. It has no DOM dependency and is directly unit-testable.
- `presentation` owns DOM construction, Material composition, and event wiring.

Remote and imported values reach the DOM only after normalization. Any value used
as a link or image source goes through `src/core/dom/SafeUrl.ts`, which keeps only
`http:` and `https:` URLs.

## Routing and static fragments

Hash routes are the public URL contract. `RouteRegistry.ts` contains route data,
`ContentLoader.ts` fetches markup, `HistoryManager.ts` owns title/history
updates, and `Router.ts` coordinates them.

`RouteRegistry.ts` holds a typed `RouteDefinition` table. Each route writes its
description and share title once; the Open Graph and Twitter blocks are expanded
from those fields, so the three copies never drift apart. `normalizeRouteId` is
the single hash-to-route-id normalizer, re-exported by `Router.ts` as
`normalizePageId`.

Site-wide identity — title, description, keywords, share image, Twitter handle,
canonical base URL — lives in `src/core/metadata/SiteMetadata.ts`. Both the route
table and the runtime metadata writer read it, so changing the site title is a
one-line edit.

Feature initialization is wired through the router's `pageHandlers` in
`App.ts`. There is no second per-route load hook.

A route may set `fullBleed: true` to opt out of the shell's centered content
column. The router mirrors that onto `#pageContentArea` as `.is-full-bleed`,
which drops the 900px column and side padding while keeping the safe-area
insets, and clears it again on the next navigation. The route is then
responsible for its own horizontal rhythm. Smart Cleaner uses this so its
1180px presentation layout is not clipped by the shell.

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
