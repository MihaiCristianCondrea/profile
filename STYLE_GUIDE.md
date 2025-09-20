# Project Style Guide

This document codifies the conventions used throughout the profile site so that future contributions remain consistent with the current structure and quality bar.

## Directory Structure

- `assets/`
  - `css/`: Compiled stylesheets. Source styles live in `assets/css/tailwind.input.css`; run `npm run build:css` to regenerate minified bundles.
  - `js/`: All JavaScript written as ES modules.
    - `core/`: Reusable framework utilities (app shell, theme, navigation, metadata, animations, etc.).
    - `router/`: SPA routing system, content loader, history helpers, and route configuration.
    - `pages/`: Page-specific controllers (e.g., resume builder, projects, songs, contact).
    - `services/`: API integrations and shared data services.
  - `images/`, `icons/`, `manifest.json`: Static assets referenced from HTML or modules.
- `pages/`: HTML fragments loaded by the SPA router. Each folder groups related content (e.g., `drawer`, `resume`).
- `scripts/`: Build tooling (`build-css.mjs`, `build-js.mjs`).
- `__tests__/`: Jest test suites written in ESM.

## Naming & File Conventions

- Use lowercase kebab-case for directories and HTML fragments.
- JavaScript modules use camelCase exports and PascalCase only for classes.
- Test files mirror the module name (e.g., `core/utils.js` ⇢ `__tests__/utils.test.js`).
- Avoid default exports unless a module exposes a primary object; prefer named exports for utilities.
- Write descriptive function names (no abbreviations) and document complex helpers with inline comments when necessary.

## HTML Guidelines

- Use semantic tags (`header`, `main`, `section`, `nav`, `footer`) and ARIA attributes to convey structure.
- Ensure all anchor hrefs use HTTPS for external resources.
- Indent using two spaces, lowercase tags, and include `lang` and `meta charset="utf-8"` declarations on full documents.
- Provide `alt` text for every `<img>` and `aria-*` attributes for interactive elements when needed.
- Include skip links, accessible nav landmarks, and ensure interactive elements are reachable via keyboard.

## CSS Guidelines

- Author source styles in Tailwind (utility classes) or component-specific CSS modules. Generated files under `assets/css/` are minified outputs—do not edit them directly.
- Use design tokens (Material You variables) and keep custom properties within component scopes when possible.
- Maintain responsive design via modern layout primitives (flex, grid) and prefer relative units.

## JavaScript Guidelines

- Write all modules using ES module syntax (`import`/`export`).
- Keep modules focused: utilities in `core/`, domain logic in `pages/`, and API integrations in `services/`.
- Use async/await for asynchronous flows and wrap network calls with graceful error handling.
- Lazy-load page-specific code via dynamic `import()` to optimize initial load performance.
- Never attach globals directly—export functions and import them where needed. Only the app shell should register global singletons (e.g., `window.SiteAnimations`).
- Avoid inline DOM event handlers; bind listeners within module initialization functions.

## Accessibility & UX

- Ensure every interactive control is focusable and keyboard operable.
- Maintain ARIA roles/states in sync with UI changes (e.g., drawer state, filter toggles).
- Provide live-region updates when content changes dynamically (loading indicators, share feedback, etc.).
- Respect reduced motion preferences and provide fallbacks for custom animations.

## Performance Practices

- Lazy-load heavy modules and data fetchers within `buildRouterOptions` or page initializers.
- Use the existing build scripts to minify JS (`npm run build:js`) and CSS (`npm run build:css`).
- Prefer `loading="lazy"` for non-critical images and `decoding="async"` where appropriate.

## Metadata & SEO

- Register new routes through `assets/js/router/routes.js` with complete metadata (title, description, keywords, OpenGraph, Twitter).
- Use `core/metadata.updateForRoute` to keep `<head>` meta tags synchronized during SPA navigation.

## Testing

- Write Jest tests in ESM (`import { describe } from '@jest/globals'`) and keep them colocated in `__tests__/`.
- Mock dependencies via `jest.unstable_mockModule` when isolating module behavior.
- Update tests alongside code changes; ensure `npm test` passes before committing.

## Workflow

1. Implement changes in modules/HTML.
2. Run `npm run build` to refresh bundled assets.
3. Execute `npm test` to validate unit tests.
4. Commit source and generated assets together so deployments remain deterministic.
