# Mihai's Profile Website

This repository contains the source for a personal profile site built as a small Single Page Application (SPA). The site presents information about Mihai-Cristian Condrea and includes additional pages such as a privacy policy and code of conduct. It is designed as a Progressive Web App using Material Web Components and vanilla JavaScript.

## Features

- **Material Design Components** – UI is styled with Google's Material Web Components.
- **Navigation Drawer** – A slide‑out drawer lists Home, Blogs, Music, Projects and collapsible "Profile" and "Android Apps" sections.
- **Light/Dark Theme** – A theme toggle stores your preference in `localStorage` and can automatically match the system theme.
- **Blogger Integration** – The home page fetches recent blog posts from Blogger using the Blogger API.
- **Client‑Side Routing** – JavaScript loads internal pages without a full reload (privacy policy, code of conduct, app related info, etc.).
- **Navigation Transitions** – Switching pages from the drawer fades content out
  and in using Material Design motion.
- **Progressive Web App** – Includes a `manifest.json` file and icons so it can be installed as a PWA.

## Repository Structure

```
index.html                # Main page of the site
assets/
  css/                    # Base styles and component styles
  js/                     # JavaScript modules (router, theme, navigation, Blogger API)
  images/                 # Illustrations used on various pages
  icons/                  # Favicon and PWA icons
  manifest.json           # Web app manifest
pages/
  drawer/                 # Pages accessible from the navigation drawer
    songs.html
    projects.html
    contact.html
    more/
      privacy-policy.html
      code-of-conduct.html
      apps/               # App specific pages (ads help, legal notices, etc.)
  resume/                 # Resume builder module loaded via `#resume`
    resume.html
LICENSE                   # GPLv3 license
```

### Hash Fragment Navigation

The router loads pages based on URL fragments (e.g., `#privacy-policy`). Important fragments include:

- `#privacy-policy` – Privacy Policy
- `#code-of-conduct` – Code of Conduct
- `#privacy-policy-end-user-software` – Privacy Policy – End-User Software
- `#terms-of-service-end-user-software` – Terms of Service – End-User Software
- `#resume` – Resume Builder
- `#projects` – Showcase of projects

## Running Locally

The project now compiles Tailwind CSS ahead of time. After cloning the repo, install dependencies and run the Tailwind build:

```bash
npm install
npx tailwindcss -i ./assets/css/tailwind.input.css -o ./assets/css/tailwind.css --minify
```

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

### YouTube Channel Feed

The songs page fetches track information from the D4rK Rekords YouTube channel
using the public [Piped API](https://github.com/TeamPiped/Piped). This service
does not require any authentication. The site requests
`https://pipedapi.ducks.party/channel/<channelId>` and renders the uploaded
tracks from the `relatedStreams` array.

## License

This project is distributed under the terms of the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for the full text.

