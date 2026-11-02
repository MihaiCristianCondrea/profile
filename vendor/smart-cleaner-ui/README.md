# Smart Cleaner marketing UI kit (vendored)

`src/` is a copy of `marketing/ui/src` from
[Smart-Cleaner-for-Android](https://github.com/MihaiCristianCondrea/Smart-Cleaner-for-Android)
(`develop`), at the commit in `SOURCE`. It is the app's Jetpack Compose screens translated to
HTML with Material Web, and the Smart Cleaner presentation page
(`#smart-cleaner-for-android`) hosts those screens live.

**Do not edit these files here.** The app repository owns them: change a screen there, then sync:

```bash
npm run sync:smart-cleaner-ui -- ../smart-cleaner-for-android
```

The sync script (`scripts/sync-smart-cleaner-ui.mjs`) replaces `src/`, records the commit in
`SOURCE`, and regenerates the runtime assets in `public/smart-cleaner-ui/`: Google Sans Flex from
the Wear OS module, the brand logos and app icons, only the Android illustrations the screens
reference, and Material Next's device frames and Play badge.

## Why it lives outside `src/`

The kit is plain JavaScript that mirrors the app, including components this site's own UI policy
forbids for its pages (outlined cards, dividers). Keeping it in `vendor/` leaves the site's source
checks to the site's code. `src/features/apps/smart-cleaner/presentation/vendored-ui-kit.d.ts`
types the few entry points the page imports, and Vite resolves them through the
`@smart-cleaner-ui` alias.

## How the page uses it

- `SmartCleanerUiKit.ts` loads the kit on demand, so no other route downloads it. It does not
  call the kit's `embed.js` `setup()`, which freezes all CSS motion on the document for video
  rendering; it hosts screens with Material Next's `ScreenHost` instead.
- The kit's `material-symbols` imports are redirected (see `vite.config.js`) to
  `SmartCleanerIconFonts.css`: the npm fonts are 9.4 MB, while the site already serves Outlined
  and only needs a 0.5 MB Rounded face.
- The kit's `scrollArea` cancels every wheel event over a screen. The page hands the wheel back to
  the document when the screen is already at its top or bottom, so a phone never traps page scroll.
