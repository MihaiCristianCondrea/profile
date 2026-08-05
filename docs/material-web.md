# Material Web usage

This project uses Material Web 2.4.1 from the npm dependency and bundles it with
Vite. The read-only source snapshot in `resources/material-web-components` may
be inspected to confirm supported properties, slots, events, and tokens.

## Registration boundary

`src/core/material/MaterialRegistry.ts` is the only production file that
imports Material element definitions. Keep imports explicit:

```ts
import '@material/web/button/filled-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/labs/card/outlined-card.js';
```

Do not use `@material/web/all.js` in production and do not load Material
elements from a runtime CDN. Register a new element in the registry when the
application starts using it.

## Card variants

The bundled Material Web source exposes exactly three public card elements:

- `md-elevated-card` for separation created primarily by elevation;
- `md-filled-card` for tonal separation from the surrounding surface;
- `md-outlined-card` for separation created primarily by an outline.

There is no public `md-card`, `md-normal-card`, or plain card element. The
`Card` class under `labs/card/internal` is implementation detail and must not be
imported by application code.

```html
<md-elevated-card>
  <div class="card-content">Elevated content</div>
</md-elevated-card>

<md-filled-card>
  <div class="card-content">Filled content</div>
</md-filled-card>

<md-outlined-card>
  <div class="card-content">Outlined content</div>
</md-outlined-card>
```

Material cards provide the container, outline, shape, and elevation. The
application may style content layout inside the card, but it must not recreate
card elevation, outlines, state layers, or shapes with parallel CSS. A static
card should remain static. Put actions inside the card using Material buttons
instead of making the whole card zoom, lift, or scale on hover.

## Navigation actions

Material buttons and icon buttons support link behavior through `href` and
`target`. Use the component as the link:

```html
<md-outlined-button href="https://example.com" target="_blank">
  <md-icon slot="icon">open_in_new</md-icon>
  Open example
</md-outlined-button>
```

Do not wrap a Material button in an anchor and do not place an anchor inside a
Material button. Standalone icon buttons need an accessible `aria-label`.

## Styling contract

Prefer component attributes, slots, and documented custom properties. Authored
CSS is appropriate for:

- page and content layout;
- spacing between components;
- responsive behavior;
- application color and typography tokens;
- non-Material content such as images and editorial sections.

Do not override Material controls with custom padding, height, border radius,
box shadow, internal structure, state-layer behavior, or hover transforms.
Material owns those interactions.

Use Material text fields and checkboxes for supported form controls. Native
controls are appropriate only where Material Web does not support the input
type; the resume editor keeps native `file` and `color` inputs for that reason.

## Labs components

Cards and the modal navigation drawer are labs components. Their APIs may
change, so inspect the matching 2.4.1 files under
`resources/material-web-components/labs` before upgrading. Production imports
must still point to `@material/web/labs/...`.

## Fallback policy

Never register local fake components under official `md-*` names. If the npm
package cannot be bundled, fail the build instead of shipping incomplete
replacements.
