import {
  D4RK_REKORDS_ARTIST_ID,
  fetchArtistSongData,
} from '../data/SongApiClient.ts';
import {
  normalizeSongTracks,
  type SongTrack,
} from '../domain/SongMapper.ts';
import { safeHttpUrlOr } from '../../../core/dom/SafeUrl.ts';

export async function fetchArtistSongs(artistId: string): Promise<SongTrack[]> {
  return normalizeSongTracks(await fetchArtistSongData(artistId));
}

export function createSongCard(track: SongTrack): HTMLElement {
  const card = document.createElement('md-filled-card');
  card.className = 'song-card';

  const image = document.createElement('img');
  image.src = safeHttpUrlOr(track.image, 'images/placeholder.png');
  image.alt = '';
  image.loading = 'lazy';

  const content = document.createElement('div');
  content.className = 'song-card-content';

  const title = document.createElement('h3');
  title.textContent = track.title;
  const artists = document.createElement('p');
  artists.textContent = track.artists;

  const action = document.createElement('md-text-button');
  const songUrl = safeHttpUrlOr(track.link, '#');
  action.setAttribute('href', songUrl);
  action.setAttribute('target', '_blank');
  action.textContent = 'Open song';
  if (songUrl === '#') action.setAttribute('disabled', '');
  const icon = document.createElement('md-icon');
  icon.slot = 'icon';
  icon.textContent = 'open_in_new';
  action.append(icon);

  content.append(title, artists, action);
  card.append(image, content);
  return card;
}

export async function loadSongs(): Promise<void> {
  const grid = document.getElementById('songsGrid');
  const status = document.getElementById('songs-status');
  if (!grid) return;

  grid.replaceChildren();
  if (status) {
    status.hidden = false;
    status.textContent = 'Loading songs…';
  }

  try {
    const tracks = await fetchArtistSongs(D4RK_REKORDS_ARTIST_ID);
    grid.replaceChildren(...tracks.map(createSongCard));
    if (status) {
      status.textContent = tracks.length ? '' : 'No songs are available right now.';
      status.hidden = tracks.length > 0;
    }
  } catch (error) {
    console.error('Songs: Failed to load the song list.', error);
    if (status) status.textContent = 'Songs are unavailable right now.';
  }
}
