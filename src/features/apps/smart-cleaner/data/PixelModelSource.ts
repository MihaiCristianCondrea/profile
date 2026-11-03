/**
 * The Pixel 9 Pro XL model (BlenderKit, Royalty Free licence: usable inside
 * this site, not redistributable on its own). It lives in public/pixel-3d/,
 * apart from public/smart-cleaner-ui/, which the UI-kit sync replaces.
 */
export const PIXEL_MODEL_URL = './pixel-3d/pixel-9-pro-xl.glb';

/** Downloads the binary glTF; the presentation layer parses it. */
export async function fetchPixelModel(url: string = PIXEL_MODEL_URL): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pixel model unavailable (${response.status}).`);
  return response.arrayBuffer();
}
