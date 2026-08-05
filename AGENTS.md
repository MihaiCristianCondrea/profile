# Repository Instructions

## Application source

The production application lives in `src/` and follows the same feature-first boundaries used by `github-dev-tools`:

- `src/app/` owns startup and routing orchestration.
- `src/core/` contains app-wide infrastructure and authored styles.
- `src/features/` contains feature-owned data, domain, presentation code, and route fragments.

The application boot path is `src/main.ts` -> `src/app/main.ts` -> `startApp()` in `src/app/App.ts`. Do not create another startup path or initialize application modules from feature files.

## Source boundaries

Create `data`, `domain`, or `presentation` directories only when they contain real code. Do not add empty architectural placeholders. Keep feature-only behavior inside its feature and move code to `core` only when multiple features use it.

Do not attach new APIs to `globalThis`. Existing browser globals are compatibility boundaries being retired gradually. New code must use explicit imports and exports.

## TypeScript

All production TypeScript is checked by `tsc` and bundled by Vite. TypeScript must not emit a second unused JavaScript tree into `dist`.

- Do not add `@ts-nocheck` to production files.
- Avoid `any` unless a browser or third-party boundary genuinely requires it.
- Remove unused variables, parameters, imports, and compatibility code when their callers are gone.
- Keep `src/main.ts` and `src/app/main.ts` inside TypeScript validation.

## Material Web

Material Web registration stays centralized in `src/core/material/MaterialRegistry.ts`. Prefer Material component attributes, slots, and supported design tokens over custom replicas or structural CSS overrides.

## Static route fragments

Feature HTML lives under `src/features/**/presentation/*.html`. The build copies these files to `dist/content/**`; never edit generated `dist` files.

## Verification

The toolchain targets Node 24 (`.nvmrc`, `engines`, and both GitHub Actions workflows).

Run `npm run check` before merging. It runs tests, type checking, the production build, SEO verification, and production-asset verification.

Tests run on jsdom, which lacks a few platform APIs that every supported browser ships. `tests/setup/structuredClone.ts` fills those gaps for the test environment only; production code keeps calling the platform API directly instead of carrying a compatibility layer.
