# Architecture

The website is a source-first TypeScript SPA. Keep runtime behavior, public hash routes, and GitHub Pages deployment stable while organizing code around the same feature-first shape used by the other TypeScript web tools.

## Directory layout

```text
index.html        Main static shell loaded by the browser
index.ts          Rollup entry that registers Material Web components
src/
  app/            App bootstrap, route registration, routing orchestration, service wiring
  core/           Shared infrastructure used by multiple features
  features/       User-facing features grouped by data/domain/presentation
assets/
  content/        Generated HTML fragments copied from src/features/**/presentation/*.html
  css/            Shared styles and generated Tailwind output
  data/           Static JSON loaded by app code
  js/             Generated TypeScript output
  images/         Static images and illustrations
  icons/          PWA and favicon assets
scripts/          Build/deployment helpers
```

`src/` is the source of truth. Generated browser output stays ignored and is recreated by the build.

## App layer

Use `src/app/` for application-level wiring only:

- `main.ts` starts the app, captures initial home markup, wires drawer/theme/router integration, and exposes the initialization entry point.
- `router/routes.ts` owns route registration, route metadata, route IDs, route fragment output paths, and route-specific ready hooks.
- `router/contentLoader.ts` fetches generated HTML fragments from `assets/content/features/**/presentation/*.html`.
- `router/history.ts` updates the document title and hash history.
- `router/animation.ts` isolates route transition helpers.

Public hash route IDs such as `#projects`, `#resume`, and `#privacy-policy` are the stable URLs. Fragment file paths may change only when routes, tests, docs, and the build copy step are updated together.

## Core layer

Use `src/core/` for cross-feature code only:

- `dom/` contains shared DOM helpers and loading overlay utilities.
- `metadata/` owns route metadata tag updates.
- `theme/` owns theme selection.
- `animations/` owns shared animation utilities reused across routes and features.
- `material/` registers Material Web components for the Rollup bundle.
- `types/` contains shared TypeScript interfaces and global declarations.

If code belongs to one feature, keep it in that feature instead of putting it in core.

## Feature layer

Feature modules are grouped first by feature, then by layer:

- `data/` fetches or reads external/static data and normalizes transport concerns.
- `domain/` holds feature-specific mappers, models, and rules that are not tied to the DOM.
- `presentation/` owns DOM rendering, event wiring, page/component behavior, and static HTML fragments for routes owned by the feature.

Create `data/`, `domain/`, or `presentation/` only when that layer has real responsibility for the feature. Small static pages can be only a `presentation/*.html` file; larger features can add TypeScript presentation logic and data/domain layers when needed.

Current feature examples:

- `features/navigation-drawer/presentation/`
- `features/blog/data/` and `features/blog/presentation/`
- `features/profile/presentation/` for the about/contact fragments
- `features/projects/presentation/` for project rendering and `projects.html`
- `features/resume/data/` and `features/resume/presentation/`
- `features/songs/data/`, `features/songs/domain/`, and `features/songs/presentation/`
- `features/faq/data/` and `features/faq/presentation/`
- `features/legal/presentation/` for site privacy/code-of-conduct fragments
- `features/apps/smart-cleaner/presentation/`
- `features/apps/legal/presentation/` for app privacy, terms, ads, and legal notices

## Static route fragments

Static HTML page fragments live beside the feature that owns them, under `src/features/**/presentation/*.html`. The browser does not fetch those source files directly in production. Instead, `npm run build:pages` copies them to ignored generated output under `assets/content/features/**/presentation/*.html`, and `src/app/router/routes.ts` points route `path` values at that generated public location.

This keeps `src/features/**/presentation/*.html` as the reviewed source while keeping GitHub Pages dead simple: the published artifact includes generated `assets/content/**` and excludes `src/`.

## Routing flow

1. `index.html` loads Material Web from `bundle.js`; `index.ts` delegates Material registration to `src/core/material/registerMaterial.ts`. It then loads generated feature/app scripts from `assets/js/**`.
2. `src/app/main.ts` captures the initial home markup and initializes the router.
3. Route links with hash fragments are intercepted and passed to `loadPageContent`.
4. `Router.ts` asks `RouterContentLoader` for the registered route content.
5. `RouterContentLoader` fetches the route's generated fragment from `assets/content/features/**/presentation/*.html`.
6. The router updates the page container, title, metadata, active drawer item, and page-specific ready hook.

## Styling rules

- Keep design tokens in `assets/css/variables.css`.
- Keep reset and base element rules in `assets/css/base.css`.
- Keep shared reusable component classes in `assets/css/components.css`.
- Keep page-specific styling in clearly named page files such as `assets/css/pages.css` or `assets/css/resume.css` until a future CSS split is introduced.
- Prefer Material/Web component defaults over custom CSS.
- Do not style component internals globally unless the file includes a comment explaining the exception and the component behavior being preserved.

## Adding a page or feature

1. Create or choose the owning feature under `src/features/<feature>/`.
2. Add the static route fragment under `src/features/<feature>/presentation/<page>.html` when the router will load HTML.
3. Add any feature behavior under `src/features/<feature>/...`, using `data/`, `domain/`, and `presentation/` according to responsibility.
4. Register the route in `src/app/router/routes.ts`, keeping the public hash route ID stable and pointing `path` at the generated `assets/content/features/<feature>/presentation/<page>.html` copy.
5. Add any shared helper only if at least two features need it.
6. Add or update tests under `__tests__/`, importing TypeScript from `src/` instead of generated `assets/js/`.
7. Run `npm test -- --runInBand`, `npm run build:pages`, `npm run build:ts`, `npm run build:css`, and `npm run build` as appropriate for the change.

## Static assets

Keep SEO and PWA files at their existing public URLs:

- `robots.txt`
- `sitemap.xml`
- `assets/manifest.json`
- `assets/icons/**`
- `app-ads.txt`

Static JSON belongs in `assets/data/`. Images and illustrations belong in `assets/images/`. Icons belong in `assets/icons/` unless a hosting migration introduces a dedicated `public/` copy step.

## GitHub Pages deployment

The repository includes a GitHub Pages workflow at `.github/workflows/pages.yml`. It installs dependencies, runs the Jest suite against `src/`, runs `npm run deploy`, and uploads a prepared `_site/` artifact after `bundle.js`, `assets/css/tailwind.css`, `assets/js/**`, and `assets/content/**` have been regenerated. This keeps generated output out of Git while still publishing a complete static site.
