import { html } from "lit";

// The app's shell (status bar, app bars, navigation, drawers, sheets) is Material Next's Android preview, declared
// once in config/identity.js. This is the one drawing helper screens still share.

/**
 * Material Symbol icon (https://fonts.google.com/icons). `fill` mirrors Compose's Filled
 * variants; `rounded` uses Material Symbols Rounded (App Toolkit's ic_settings / ic_share).
 */
export const icon = (name, { fill = false, size, color, cls = "", rounded = false } = {}) =>
  html`<md-icon
    class=${cls}
    style="${size ? `--md-icon-size:${size}px;` : ""}${color ? `color:${color};` : ""}${fill ? "font-variation-settings:'FILL' 1;" : ""}${rounded ? "--md-icon-font:'Material Symbols Rounded';" : ""}"
    >${name}</md-icon
  >`;
