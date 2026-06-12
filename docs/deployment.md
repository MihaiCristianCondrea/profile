# Deployment

GitHub Pages publishes the generated Vite output in `dist/`, while Git tracks only source files and runtime static assets.

## Generated output

The generated site lives under `dist/` and is intentionally ignored. `npm run build` recreates it by:

- running Vite against `index.html` and `src/main.ts`;
- copying static runtime assets from `public/`;
- emitting legacy browser-global TypeScript files under `dist/assets/js/**` for the existing script tags;
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
