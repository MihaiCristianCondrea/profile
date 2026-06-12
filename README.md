# Mihai's Profile Website

This repository contains the source for a personal profile site built as a small Single Page Application (SPA). The site presents information about Mihai-Cristian Condrea and includes additional pages such as a privacy policy and code of conduct. It is designed as a Progressive Web App using Material Web Components and TypeScript (compiled to browser JavaScript).

## Features

- **Material Design Components** – UI is styled with Google's Material Web Components.
- **Navigation Drawer** – A slide‑out drawer lists Home, Blogs, Music, Projects and collapsible "Profile" and "Android Apps" sections.
- **Light/Dark Theme** – A theme toggle stores your preference in `localStorage` and can automatically match the system theme.
- **Blogger Integration** – The home page fetches recent blog posts from Blogger using the Blogger API.
- **Client‑Side Routing** – TypeScript router modules load internal pages without a full reload (privacy policy, code of conduct, app related info, etc.).
- **Navigation Transitions** – Switching pages from the drawer fades content out
  and in using Material Design motion.
- **Progressive Web App** – Includes a `manifest.json` file and icons so it can be installed as a PWA.

## Repository Structure

```
index.html                # Main page of the site
index.ts                  # Rollup entry for Material Web registration
src/
  app/                    # Bootstrap, app-level wiring, and router orchestration
  core/                   # Shared DOM, metadata, theme, animation, Material, and type utilities
  features/               # Feature-first modules grouped by data/domain/presentation
    profile/presentation/ # About/contact route fragments
    projects/presentation/ # Projects behavior and projects.html
    resume/presentation/  # Resume behavior and resume.html
    songs/presentation/   # Songs behavior and songs.html
    apps/                 # App-specific feature and legal fragments
assets/
  content/                # Generated route fragments copied from src/features/**/*.html
  css/                    # Base styles, design tokens, component styles, Tailwind input
  data/                   # Static JSON loaded by the app
  js/                     # Generated TypeScript output (ignored; do not edit manually)
  images/                 # Illustrations used on various pages
  icons/                  # Favicon and PWA icons
  manifest.json           # Web app manifest
scripts/                  # Build/deploy helper scripts
LICENSE                   # GPLv3 license
```

### Hash Fragment Navigation

The router loads pages based on URL fragments (e.g., `#privacy-policy`). Important fragments include:

- `#privacy-policy` – Privacy Policy
- `#code-of-conduct` – Code of Conduct
- `#faqs` – FAQ & Support Center
- `#privacy-policy-end-user-software` – Privacy Policy – End-User Software
- `#terms-of-service-end-user-software` – Terms of Service – End-User Software
- `#resume` – Resume Builder
- `#projects` – Showcase of projects

## Running Locally

The project compiles Material Web, Tailwind CSS, and TypeScript ahead of time. After cloning the repo, install dependencies and run the build:

```bash
npm install
npm run build
```

The `build` script emits ignored generated output: `bundle.js`, minified `assets/css/tailwind.css`, browser scripts under `assets/js/`, and route fragments under `assets/content/` copied from `src/features/**/presentation/*.html`.

Then serve the files with any static HTTP server:

```bash
# Using Python
python3 -m http.server 8080
# Then open http://localhost:8080/ in your browser
```

You can also use any other static server such as `npx serve`.

### Deploying to GitHub Pages

When deploying the site at
`https://mihaicristiancondrea.github.io/profile/`, make sure the icon
paths in `assets/manifest.json` are **relative** (e.g.
`icons/icon-192.png`). Absolute paths like `/icons/icon-192.png` will
resolve to the domain root and result in 404 errors. Keeping the icon
sources relative ensures they work correctly from the `/profile/`
subdirectory served by GitHub Pages.

Run `npm run deploy` before publishing. It executes the full build and
verifies that the SEO metadata files (`sitemap.xml` and `robots.txt`) are present
in the project root so they are included in the published bundle. The GitHub
Pages workflow also runs this command before uploading its `_site/` artifact, so
ignored generated files (`bundle.js`, `assets/css/tailwind.css`, `assets/js/**`, and `assets/content/**`) are recreated before deployment.

### Search Engine Indexing

- The repository now provides `sitemap.xml` and `robots.txt` at the project root.
  They are served statically by GitHub Pages alongside the rest of the site.
- After each deployment, submit `https://mihaicristiancondrea.github.io/profile/sitemap.xml`
  in both [Google Search Console](https://search.google.com/search-console/about) and
  [Bing Webmaster Tools](https://www.bing.com/webmasters/about) to trigger a fresh crawl.
- You can re-run `npm run verify:seo` at any time to confirm the sitemap and robots files
  are still available before pushing a release.

### Metadata & Social Sharing

- Every client-side route now carries a `metadata` block defined in
  `src/app/router/routes.ts`. The router sanitizes those values and
  a lightweight metadata manager updates `<meta>` and canonical tags each
  time navigation occurs.
- When registering a new route you **must** provide the following fields to
  keep SEO and social previews accurate:
  - `description`: A short summary tailored to the page’s search intent.
  - `keywords`: An array (or comma-separated string) of focused keywords.
  - `canonicalSlug`: Either the hash slug (e.g. `projects`) or a fully
    qualified canonical URL.
  - `openGraph`: Supply at least a `title`, `description`, and `type`
    (`website`, `article`, `music.playlist`, etc.). The manager fills in the
    default image unless you override it.
  - `twitter`: Provide `title`/`description` overrides when they should differ
    from the Open Graph copy.
- Example route registration:

  ```js
  RouterRoutes.registerRoute({
    id: 'case-study',
    path: 'assets/content/features/case-study/presentation/case-study.html',
    title: 'Case Study',
    metadata: {
      description: 'Deep dive into a Compose motion project.',
      keywords: ['Jetpack Compose animation', 'Material motion case study'],
      canonicalSlug: 'case-study',
      openGraph: {
        title: 'Compose Motion Case Study | Mihai-Cristian Condrea',
        description: 'Deep dive into a Compose motion project.',
        type: 'article'
      },
      twitter: {
        title: 'Compose Motion Case Study',
        description: 'See how Material motion patterns were built for Android.'
      }
    }
  });
  ```

- The metadata manager lives in `src/core/metadata/metadataManager.ts`. It ensures
  the description, keyword, Open Graph, Twitter, and canonical tags always
  reflect the active route while falling back to opinionated defaults.

### YouTube Channel Feed

The songs page fetches track information from the D4rK Rekords YouTube channel
using the public [Piped API](https://github.com/TeamPiped/Piped). This service
does not require any authentication. The site requests
`https://pipedapi.ducks.party/channel/<channelId>` and renders the uploaded
tracks from the `relatedStreams` array.

## License

This project is distributed under the terms of the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for the full text.



## TypeScript Architecture

- Source of truth: `src/`, organized into `app/`, `core/`, and feature-first modules under `features/`.
- Generated artifacts: `bundle.js`, `assets/css/tailwind.css`, `assets/js/`, and `assets/content/` are produced by `npm run build`; these paths are ignored and should not be edited manually.
- New feature code must be added in `src/features/<feature>/`, using `data/`, `domain/`, and `presentation/` folders where those responsibilities are useful; shared helpers belong in `src/core/` only when more than one feature needs them.
- Generated `assets/js/` paths mirror `src/`, and generated `assets/content/` paths mirror feature-owned HTML under `src/features/`; update `index.html` script tags or route paths when source files move. Tests should import `src/` directly or transpile source for browser-global integration cases, not require committed generated JavaScript.
- See `docs/architecture.md` for source/generated file rules, routing flow, styling rules, static asset ownership, and the new-page checklist.

### Migration status

- Primary app modules have been migrated to TypeScript sources.
- Legacy global interop remains in some modules and is being phased into explicit typed imports over time.
