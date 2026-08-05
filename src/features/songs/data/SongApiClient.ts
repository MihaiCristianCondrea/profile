export const ODESLI_API_BASE_URL = 'https://publicapi.dev/songlink';
export const D4RK_REKORDS_ARTIST_ID = 'd4rk-rekords';

export async function fetchArtistSongData(artistId: string): Promise<unknown> {
  const url = `${ODESLI_API_BASE_URL}/api/odesli/${encodeURIComponent(artistId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load songs (${response.status}).`);
  }
  return response.json() as Promise<unknown>;
}
