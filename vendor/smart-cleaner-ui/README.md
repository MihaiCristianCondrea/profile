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

## The 3D Pixel

`public/smart-cleaner-ui/models/pixel-9-pro-xl.glb` is the Google Pixel 9 Pro XL from
BlenderKit (`asset_base_id:511e7e71-de38-4d6e-99da-9b34cc4dd738`), a free asset under BlenderKit's
Royalty Free licence: it may be used inside this site, but not redistributed on its own, so do not
copy it into public repositories or offer it as a download. Its meshes are Draco-compressed;
`public/smart-cleaner-ui/draco/` holds three.js's decoder, copied from
`node_modules/three/examples/jsm/libs/draco/gltf/`.

`Pixel3D.ts` renders it with three.js (loaded only on this page, and never with reduced motion).
Every phone on the page is this model with the live screen on its display: WebGL cannot paint a live
page into a texture, so a CSS3DRenderer layer, drawn with the same camera, places the real
`ScreenHost` element on the display plane, inset by the bezel and rounded like the panel. It stays
interactive and hides when the display faces away. Without WebGL or the model, the screens keep
Material Next's flat device frame.
