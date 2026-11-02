import { IDENTITY } from "../config/identity.js";

/**
 * Base URL for fonts, illustrations and logos: the identity's, so its icon and fonts move with everything else.
 * Vite serves public/ at "/"; other hosts (e.g. Remotion's staticFile) call setAssetBase() before rendering.
 */
export const setAssetBase = (b) => IDENTITY.setAssetBase(b);
export const asset = (path) => IDENTITY.asset(path);
