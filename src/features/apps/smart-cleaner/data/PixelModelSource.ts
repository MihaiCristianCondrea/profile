/**
 * The Pixel 9 Pro XL model (BlenderKit, Royalty Free licence: usable inside
 * this site, not redistributable on its own). Served from public/.
 */
export const PIXEL_MODEL_URL = './smart-cleaner-ui/models/pixel-9-pro-xl.glb';

/** Downloads the binary glTF; the presentation layer parses it. */
export async function fetchPixelModel(url: string = PIXEL_MODEL_URL): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pixel model unavailable (${response.status}).`);
  return response.arrayBuffer();
}
