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
import '@material/web/labs/card/filled-card.js';
```

Do not use `@material/web/all.js` in production and do not load Material
elements from a runtime CDN. Register a new element in the registry when the
application starts using it.

## Intentional surface and shape policy

The following rules are deliberate parts of the portfolio design. They should
not be normalized back to Material defaults during cleanup or refactoring.

### Google blue brand accent

The portfolio uses Google blue `#4285F4` as its intentional brand seed instead of Android green. The light Material primary role, browser theme metadata, PWA manifest, and resume-builder default accent must stay synchronized. Dark mode uses a lighter blue primary for legibility while preserving `#4285F4` as the inverse brand role.

### Search fields look like search bars

The FAQ `Search questions` field uses the documented outlined text-field shape
token with a 28px radius:

```css
.faq-search md-outlined-text-field {
  --md-outlined-text-field-container-shape: 28px;
}
```

The field is 56px tall, so a 28px container shape creates the fully rounded
search-bar silhouette expected for search rather than the standard text-field
shape. Use the Material token instead of styling shadow DOM or applying an
unrelated wrapper radius.

### Grouped FAQ cards share one visual outline

Adjacent FAQ cards intentionally use the same grouped-item geometry as the
Android UI. The web values use pixels; their Android equivalents use dp.

- First item: `16px 16px 2px 2px`.
- Middle items: `2px` on every corner.
- Last item: `2px 2px 16px 16px`.
- A single visible item: `16px` on every corner.
- The seam between adjacent items is `2px`.

The FAQ renderer assigns `single`, `first`, `middle`, or `last` from the
currently visible items. Search filtering must recompute those positions so a
filtered middle item can correctly become the new first or last item.

### Filled cards are the production default

Material Web exposes elevated, filled, and outlined card variants, but this
portfolio intentionally uses `md-filled-card` for production cards. Tonal
separation is preferred over outlines and artificial elevation.

Normal cards use the neutral filled surface defined in
`src/core/styles/ui-policy.css`. This includes the grouped profile header made
from the `profile-card` and `achievement-card`, FAQ cards, news cards, song
cards, project cards, resume cards, and legal-content cards. The profile and
GitHub ranking pair must remain visibly filled in both light and dark themes;
it must not blend into the page background.

The single tonal exception is the **Do you like my projects?** contribution
card. It remains an `md-filled-card`, but intentionally uses
`primary-container` instead of the neutral card fill so it reads as a support
callout rather than another content card.

Do not introduce `md-outlined-card` or `md-elevated-card` into production code
without first changing this documented policy and its verification script.
The read-only files under `resources/` are references and are not governed by
this application rule.

Material cards own their container, shape, state layers, and elevation. The
application may style content layout inside a card and may use documented
component tokens for the intentional policies above. Do not recreate card
outlines, shadows, or hover elevation with parallel CSS. A static card should
remain static. Put actions inside the card using Material buttons instead of
making the whole card zoom, lift, or scale on hover.


### Divider-free composition and footer shell

The production interface intentionally avoids standalone dividers and
separator rules. Section hierarchy comes from spacing, typography, grouped
corners, and filled tonal surfaces instead of horizontal lines. Do not add
`md-divider` elements, register the divider component, or introduce separator
borders around the drawer sections, FAQ answers, or footer content.

Social profile actions belong inside the global footer shell beside the
copyright message. The shell uses the same neutral filled surface as normal
cards, has one rounded container, and contains no internal divider. On narrow
screens the copyright and icon row stack inside that same surface.

## Navigation actions

Material buttons and icon buttons support link behavior through `href` and
`target`. Use the component as the link:

```html
<md-filled-button href="https://example.com" target="_blank">
  <md-icon slot="icon">open_in_new</md-icon>
  Open example
</md-filled-button>
```

Do not wrap a Material button in an anchor and do not place an anchor inside a
Material button. Standalone icon buttons need an accessible `aria-label`.

## Drawer disclosure groups

Material Web provides the modal drawer and item layout, but it does not provide
a dedicated accordion API for drawer categories. The profile drawer therefore
uses app-owned disclosure groups composed around `md-item` elements.

This is an intentional information-architecture choice for shorter scrolling
and clearer route grouping. It does not modify Material shadow DOM, state
layers, ripple behavior, drawer elevation, or component shapes.

Each disclosure header must:

- use an `md-item` with `role="button"` and keyboard focus;
- expose `aria-expanded` and `aria-controls`;
- support Enter and Space activation;
- keep the controlled group synchronized with `hidden` and `aria-hidden`;
- automatically expand when one of its nested routes becomes active.

Icons, selected states, and drawer surfaces remain Material components.
Application CSS is limited to hierarchy, indentation, spacing, and visibility.

## Styling contract

Prefer component attributes, slots, and documented custom properties. Authored
CSS is appropriate for:

- page and content layout;
- spacing between components;
- responsive behavior;
- application color and typography tokens;
- intentional component shapes expressed through supported Material tokens;
- non-Material content such as images and editorial sections.

Do not override Material controls with custom internal padding, height, raw
shadow-DOM border radii, box shadows, internal structure, state-layer behavior,
or hover transforms. Material owns those interactions.

Use Material text fields and checkboxes for supported form controls. Native
controls are appropriate only where Material Web does not support the input
type; the resume editor keeps native `file` and `color` inputs for that reason.

## Components own their own state

Where a Material component already manages selection, the application listens
instead of reimplementing it. Writing the same state the component writes causes
two owners for one value.

The Smart Cleaner feature switcher is the reference case.
`md-outlined-segmented-button-set` handles the click, deselects the previous
button, and reports the result:

```ts
featureSelector.addEventListener('segmented-button-set-selection', (event) => {
  const key = event.detail?.button?.dataset.feature;
  if (isCleanerFeatureKey(key)) showFeature(key);
});
```

Do not bind `click` on each `md-outlined-segmented-button` and assign `selected`
by hand. Likewise, read the projects filter from `md-tabs.activeTab` rather than
querying the reflected `[active]` attribute.

Because these elements delegate ARIA into their shadow root, put `aria-label` on
the component itself. An `aria-label` on a plain wrapper `div` has no role to
attach to and is ignored by assistive technology.

## Labs components

Cards and the modal navigation drawer are labs components. Their APIs may
change, so inspect the matching 2.4.1 files under
`resources/material-web-components/labs` before upgrading. Production imports
must still point to `@material/web/labs/...`.

## Fallback policy

Never register local fake components under official `md-*` names. If the npm
package cannot be bundled, fail the build instead of shipping incomplete
replacements.
