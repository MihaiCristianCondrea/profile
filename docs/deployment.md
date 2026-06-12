# Deployment

GitHub Pages publishes a generated static site, but Git tracks only source and required static assets.

## Generated output

The following paths are build output and are intentionally ignored:

- `bundle.js` from `npm run build:material`
- `assets/css/tailwind.css` from `npm run build:css`
- `assets/js/**` from `npm run build:ts`
- `assets/content/**` from `npm run build:pages`, copied from `src/features/**/presentation/*.html`
- `_site/`, `.tmp/`, and other cache/build folders

Do not edit or commit these files manually. Change TypeScript and feature-owned HTML fragments in `src/`, Tailwind input in `assets/css/tailwind.input.css`, or static assets under `assets/images/`, `assets/icons/`, `assets/data/`, and the root SEO/PWA files instead.

## Local release check

Run the same commands the Pages workflow relies on before publishing changes:

```bash
npm test -- --runInBand
npm run build
npm run deploy
```

`npm run deploy` runs the full build, including the page-fragment copy into `assets/content/**`, and verifies required SEO files exist.

## GitHub Pages workflow

`.github/workflows/pages.yml` performs the deployment in this order:

1. Check out the repository.
2. Install dependencies with `npm ci`.
3. Run the Jest suite against TypeScript source.
4. Run `npm run deploy`, which regenerates `bundle.js`, `assets/css/tailwind.css`, `assets/js/**`, and `assets/content/**`.
5. Copy the static site into `_site/` while excluding development-only source, tests, caches, and workflow files.
6. Upload `_site/` with `actions/upload-pages-artifact` and deploy it with `actions/deploy-pages`.

That means the repository stays source-first, while the published GitHub Pages artifact still contains every generated runtime file and route fragment needed by `index.html`.
