# Project Style Guide

This document summarizes the conventions used across the project so future changes remain
consistent with the Google and Chrome engineering guidelines applied during the refactor.

## Repository Structure

```
assets/
  css/        Core stylesheets, shared tokens, and component rules.
  icons/, images/  Static assets served by the site.
  js/
    main.js   Application bootstrap that wires registered modules together.
    modules/  Reusable functionality (utilities, services, router, etc.).
    pages/    Page-specific controllers that register themselves with the module registry.
pages/        HTML partials that the router loads on demand.
__tests__/    Jest unit tests grouped by module.
```

- Place any new reusable JavaScript in `assets/js/modules` and register it with the
  `ModuleRegistry`. Page-specific behavior belongs in `assets/js/pages`.
- Static assets (images, fonts) live under `assets/` to keep HTML clean and enforce HTTPS-only
  references.

## JavaScript Conventions

- Two-space indentation, no hard tabs. `prettier` is configured to enforce formatting.
- Use single quotes for strings except when HTML attributes require double quotes.
- Wrap reusable functionality in modules that call
  `ModuleRegistry.register('<module-name>', exports, { alias })`. Tests rely on the registry to
  supply mocks.
- Avoid polluting the global scope; if global access is required for legacy consumers, expose it via
  controlled aliases inside the module after registering with the registry.
- Guard browser-specific APIs (`window`, `document`, `navigator`) behind capability checks so tests
  running in Node can load the modules.
- Prefer pure functions and return promises for async workflows. Handle errors with `try/catch` and
  log concise diagnostic messages.
- Keep router metadata in `assets/js/modules/router/routes.js`. Every new route must include a
  `metadata` object (description, keywords, Open Graph, and Twitter data) to keep SEO tags
  consistent.

## HTML Conventions

- Use semantic elements (`<header>`, `<main>`, `<nav>`, `<footer>`, `<section>`) wherever possible.
- Indent with two spaces, keep tags lowercase, and declare `<!doctype html>` with `lang="en"`.
- Reference external resources with HTTPS URLs and include accessibility attributes (`aria-*`,
  `alt`, `title`) for interactive controls and media.
- Load scripts with `defer` and respect the dependency order: `moduleRegistry` → core modules →
  page modules → router → `main.js`.
- Provide skip links and keyboard-friendly focus styles for accessibility. All overlays must update
  `aria-hidden`/`aria-busy` state when toggled.

## CSS Conventions

- Two-space indentation and kebab-case class names.
- Tokenize shared colors and motion values in `assets/css/variables.css`. Avoid hard-coding color
  values inside components when a variable exists.
- Add accessibility helpers such as `.skip-link` focus styles and respect reduced motion by using
  the variables provided by the animations module.

## Testing

- Unit tests live in `__tests__` and use Jest with the JSDOM environment.
- Tests should reset modules with `jest.resetModules()` and, when necessary, call
  `ModuleRegistry.reset()` before registering mocks.
- Prefer requiring modules via `require('../assets/js/modules/...')` to exercise the CommonJS
  exports used in production.
- Use fake timers when validating asynchronous UI transitions and restore timers in `afterEach`.

## Tooling

- Run `npm run format` after making changes to apply Prettier's formatting rules.
- `npm test` executes the Jest suite; ensure it passes before committing.
- CSS builds are generated with `npm run build` (Tailwind CLI). Run before deployment if you touch
  Tailwind input files.

Following these guidelines keeps the project consistent, accessible, and performant.
