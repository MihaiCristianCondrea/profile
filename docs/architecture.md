# Architecture

The site is a small TypeScript SPA served from GitHub Pages. The source tree is intentionally split between reviewed source in `src/`, runtime static assets in `public/`, and generated deployment output in ignored `dist/`.

## Root layout

```text
index.html        Browser entry HTML used by Vite
vite.config.js    Vite build configuration and root SEO file copy plugin
public/           Runtime static assets copied as-is into dist/
src/              TypeScript, authored CSS, and feature-owned HTML fragments
scripts/          Build/deploy helper scripts
```

Required root files stay at the repository root so their public URLs remain stable when Vite copies them into `dist/`:

- `robots.txt`
- `sitemap.xml`
- `app-ads.txt`

## Source layers

```text
src/
  main.ts          Vite module entry for Material registration and authored CSS
  app/             Bootstrap, app-level wiring, and router orchestration
  core/            Shared DOM, metadata, theme, animation, Material, type, and style utilities
  features/        Feature-first app modules and route fragments
```

`src/app` owns application bootstrap and routing. `src/core` owns cross-cutting utilities and shared styles. `src/features` owns feature-specific data access, domain mapping, presentation behavior, and static HTML fragments.

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

Static HTML page fragments live beside the feature that owns them, under `src/features/**/presentation/*.html`. The browser does not fetch those source files directly in production. Instead, `npm run build:pages` copies them to ignored generated output under `dist/content/features/**/presentation/*.html`, and `src/app/router/RouteRegistry.ts` points route `path` values at the generated public `content/features/**/presentation/*.html` locations.

This keeps `src/features/**/presentation/*.html` as reviewed source while keeping GitHub Pages simple: the published artifact includes generated `content/**` and excludes source-only files.

## Routing flow

1. `index.html` is processed by Vite and loads `src/main.ts`, which registers Material Web components and bundles authored CSS from `src/core/styles/`.
2. Existing browser-global feature and app scripts are emitted by `tsc` into `dist/assets/js/**` and loaded by the script tags in `index.html`.
3. `src/app/App.ts` captures the initial home markup and initializes the router.
4. Route links with hash fragments are intercepted and passed to `loadPageContent`.
5. `Router.ts` asks `RouterContentLoader` for the registered route content.
6. `RouterContentLoader` fetches the route's generated fragment from `content/features/**/presentation/*.html`.
7. The router updates the page container, title, metadata, active drawer item, and page-specific ready hook.

## Styling rules

- Keep authored CSS in `src/core/styles/` and import it from `src/main.ts` so Vite bundles it.
- Keep design tokens in `src/core/styles/variables.css`.
- Keep reset and base element rules in `src/core/styles/base.css`.
- Keep shared reusable component classes in `src/core/styles/components.css`.
- Keep broad page-level styling in `src/core/styles/pages.css`, with dedicated files such as `resume.css` and `print.css` when a page needs them.
- Tailwind is not part of the current build pipeline; the former utility classes that are still used are represented by small authored CSS rules.
- Prefer Material/Web component defaults over custom CSS.
- Do not style component internals globally unless the file includes a comment explaining the exception and the component behavior being preserved.

## Adding a page or feature

1. Create or choose the owning feature under `src/features/<feature>/`.
2. Add the static route fragment under `src/features/<feature>/presentation/<page>.html` when the router will load HTML.
3. Add any feature behavior under `src/features/<feature>/...`, using `data/`, `domain`, and `presentation/` according to responsibility.
4. Register the route in `src/app/router/RouteRegistry.ts`, keeping the public hash route ID stable and pointing `path` at the generated `content/features/<feature>/presentation/<page>.html` copy.
5. Add any shared helper only if at least two features need it.
6. Add or update tests under `tests/`, mirroring `src/` where practical and importing TypeScript from `src/` instead of generated `dist/assets/js/`.
7. Run `npm test -- --runInBand` and `npm run build` as appropriate for the change.

## Static assets

Runtime static assets live in `public/` and are copied as-is into `dist/` by Vite:

- `public/manifest.json` → `manifest.json`
- `public/icons/**` → `icons/**`
- `public/images/**` → `images/**`
- `public/data/**` → `data/**`

Keep icon paths in `manifest.json` relative so they continue to work from the `/profile/` GitHub Pages base path. The Vite build also emits relative bundled CSS and JavaScript asset URLs, allowing the generated `dist/` output to work when served from either `/profile/` on GitHub Pages or `/` in local static previews.

## GitHub Pages deployment

The repository includes a GitHub Pages workflow at `.github/workflows/pages.yml`. It installs dependencies, runs the Jest suite against `src/`, runs `npm run deploy`, and uploads the generated `dist/` artifact. Generated output stays ignored and is recreated for every deployment.

## Material Web component policy

Use the browser and Material Web as the platform. `@material/web` is the default component system for interactive controls, cards, dividers, dialogs, navigation lists, progress indicators, tabs, and buttons. Site code should compose Material elements directly instead of wrapping them in a second in-house component layer.

Custom CSS is reserved for:

- page layout, responsive structure, and document flow;
- brand tokens and Material design-token values in `src/core/styles/variables.css`;
- feature-owned presentation details that Material Web does not own, such as resume document layout or project screenshots;
- small integration fixes that use documented Material attributes, slots, parts, or CSS custom properties.

Do not:

- edit generated `dist/` files;
- style Material shadow DOM internals or private classes;
- clone Material buttons, cards, tabs, switches, lists, or drawers with custom HTML/CSS;
- add global page-specific hacks when the rule can live in the owning feature or a reusable page pattern;
- introduce export/rendering workarounds before improving the semantic HTML, CSS, and print stylesheet.

When a Material override is unavoidable, keep it token-based where possible and add a comment explaining the browser or component behavior being preserved. Prefer deleting redundant styles over adding abstractions that only rename Material Web.

### New page/tool checklist

1. Register the route in `src/app/router/RouteRegistry.ts` and add drawer/navigation metadata when the page is user-facing.
2. Place route fragments under the owning `src/features/**/presentation/` directory; let `npm run build:pages` generate `dist/content/**`.
3. Use Material Web elements directly for controls and surfaces, with accessible labels and standard slots.
4. Add custom CSS only for layout, page identity, and tokens; avoid component reinvention.
5. Keep business logic separate from DOM rendering when the page has non-trivial behavior.
6. Verify `npm run build`, `npm run verify:production-assets`, and targeted tests before shipping.
