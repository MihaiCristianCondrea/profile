# Mihai's Profile Website

This repository contains the source for a personal profile site built as a small Single Page Application (SPA). The site presents information about Mihai-Cristian Condrea (D4rK) and includes additional pages such as a privacy policy and code of conduct. It is designed as a Progressive Web App using Material Web Components and vanilla JavaScript.

## Features

- **Material Design Components** – UI is styled with Google's Material Web Components.
- **Navigation Drawer** – A slide‑out drawer provides access to the home page, blog link, music link and a "More" section with additional pages.
- **Light/Dark Theme** – A theme toggle stores your preference in `localStorage` and can automatically match the system theme.
- **Blogger Integration** – The home page fetches recent blog posts from Blogger using the Blogger API.
- **Client‑Side Routing** – JavaScript loads internal pages without a full reload (privacy policy, code of conduct, app related info, etc.).
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
  more/                   # Additional pages served through the router
    privacy-policy.html
    code-of-conduct.html
    apps/                 # App specific pages (ads help, legal notices, etc.)
LICENSE                   # GPLv3 license
```

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

### YouTube Channel Feed

The songs page fetches track information from the D4rK Rekords YouTube channel
using the public [Piped API](https://github.com/TeamPiped/Piped). For each
video it then queries the [Songlink API](https://song.link/api) to retrieve the
official cover art and streaming links on other platforms such as Spotify or
Apple Music. The Piped request does not require authentication while the
Songlink API is accessed anonymously at
`https://api.song.link/v1-alpha.1/links?url=<videoUrl>&songIfSingle=true`.
The returned data is used to populate the song cards with the cover image and
icons linking to all available services.

## License

This project is distributed under the terms of the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for the full text.

