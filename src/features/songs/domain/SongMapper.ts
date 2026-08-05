type RawTrack = Record<string, unknown>;

export interface SongTrack {
  title: string;
  artists: string;
  image: string | null;
  link: string;
}

interface SongsApiResponse {
  songs?: unknown[];
  tracks?: unknown[];
}

function readString(track: RawTrack, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = track[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export function mapTrack(rawTrack: unknown): SongTrack {
  const track = rawTrack && typeof rawTrack === 'object' ? rawTrack as RawTrack : {};
  return {
    title: readString(track, 'title', 'song_name') ?? 'Unknown title',
    artists: readString(track, 'artists', 'artist_name') ?? 'D4rK Rekords',
    image: readString(track, 'image', 'thumbnail', 'artwork') ?? null,
    link: readString(track, 'link', 'universal_link', 'url') ?? '#',
  };
}

export function normalizeSongTracks(data: unknown): SongTrack[] {
  const response = data as SongsApiResponse | undefined;
  const songs = Array.isArray(response?.songs)
    ? response.songs
    : Array.isArray(response?.tracks)
      ? response.tracks
      : Array.isArray(data)
        ? data
        : [];
  return songs.map(mapTrack);
}
