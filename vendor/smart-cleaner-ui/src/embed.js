/**
 * Framework-free entry for motion tools (Remotion, Playwright, anything with a DOM).
 *
 *   import { setup, mount, SCREENS } from "marketing/ui/src/embed.js";
 *   await setup({ assetBase: staticFile("fonts/GoogleSansFlex.ttf").replace("fonts/GoogleSansFlex.ttf", "") });
 *   await mount(element, "quick-clean", { progress: frame / 90 });   // call once per frame
 *
 * mount() resolves after every Material Web element has finished updating, so a frame
 * captured right after it is complete (deterministic rendering). The mounting and the device frame come from
 * material-next-web-components (createMarketingEmbed); this file adds Smart Cleaner's screens, theme and parts.
 */
import { createMarketingEmbed } from "material-next-web-components/marketing.js";
import { setAssetBase } from "./kit/assets.js";
import { loadFonts } from "./theme/index.js";
import { byId, SCREENS } from "./screens/index.js";

export { SCREENS, byId };
import { logo, LOGO_PARTS } from "./motion/logo.js";
import { storageRing, categoryTile, CATEGORIES } from "./motion/storage-ring.js";
import { photo } from "./motion/photo.js";
import { button, fileCard, fileItem, groupedList, illustration, quickScanButton, quickScanCard, selectionStatus } from "./kit/components.js";
import { icon } from "./kit/shell.js";
import { swipeActions, swipeCard, ROLL } from "./screens/gallery-cleaner.js";
import { QUICK_CLEAN_ITEMS, quickCleanArc, quickCleanIcon, quickCleanRow } from "./screens/quick-clean.js";
import { duplicateCard, duplicateRow } from "./screens/duplicates.js";
import { LARGE_FILES, largeFileCard, largeFileRow } from "./screens/large-files.js";
import { metadataDetail, metadataDetailRow, sanitizeFab, statusChip } from "./screens/metadata-sanitizer.js";

/**
 * Building blocks passed to mountPart(). Besides the motion parts, these are single pieces of real
 * screens, built by the same code the screen uses, so a piece can leave its screen and still match it.
 */
export const PARTS = {
  logo,
  LOGO_PARTS,
  storageRing,
  categoryTile,
  CATEGORIES,
  photo,
  illustration,
  icon,
  button,
  groupedList,
  fileItem,
  fileCard,
  selectionStatus,
  quickScanCard,
  quickScanButton,
  quickCleanRow,
  quickCleanIcon,
  quickCleanArc,
  QUICK_CLEAN_ITEMS,
  swipeCard,
  swipeActions,
  ROLL,
  duplicateCard,
  duplicateRow,
  largeFileRow,
  largeFileCard,
  LARGE_FILES,
  metadataDetail,
  metadataDetailRow,
  statusChip,
  sanitizeFab,
};
export { logo, LOGO_PARTS, storageRing, categoryTile, CATEGORIES, photo };

const embed = createMarketingEmbed({
  screens: SCREENS,
  parts: PARTS,
  loadTheme: async ({ assetBase = "/" }) => {
    setAssetBase(assetBase);
    await loadFonts();
  },
});

/**
 * `assetBase` is where the kit's public/ folder is served (Remotion: staticFile("/")). The device frames are in its
 * material-next/ folder, which npm run assets fills.
 */
export const setup = ({ assetBase = "/", palette, theme } = {}) =>
  embed.setup({ assetBase, marketingAssetBase: `${assetBase.replace(/\/?$/, "/")}material-next/`, palette, theme });

/**
 * Renders screen `id` with `state` merged over its defaults. `frame: true` wraps it in the device.
 * `palette` scopes a palette to this element: a palette name, or "captured" for the palette of the
 * screen's reference capture (videos often mix screens captured under different palettes). `window` lays the app
 * out for a phone (default), a fold or a desktop window, with the navigation the shell draws for it.
 */
export const mount = (el, id, state = {}, { frame = false, palette, window } = {}) => embed.mount(el, id, state, { frame, palette, window });

/**
 * Renders any kit template (a motion part such as logo(), photo() or storageRing(), or a
 * single piece of a screen from PARTS) into `el`, with the same settle guarantee as mount().
 *   await mountPart(el, (k) => k.logo(320, { red: { s: 0.8 } }), { palette: "android" })
 */
export const mountPart = (el, build, { palette } = {}) => embed.mountPart(el, build, { palette });
