import { getDynamicElement } from '../core/utils.js';

export const YOUTUBE_CHANNEL_ID = 'UCtzlWsxUK8FSvLwLDbESw4A';

export async function fetchChannelVideos(channelId = YOUTUBE_CHANNEL_ID) {
  const url = `https://pipedapi.ducks.party/channel/${channelId}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  const data = await response.json();
  const streams = Array.isArray(data?.relatedStreams) ? data.relatedStreams : [];
  return streams.map((stream) => ({
    title: stream.title,
    artists: stream.uploaderName,
    image: stream.thumbnail,
    link: `https://www.youtube.com${stream.url}`
  }));
}

export async function loadSongs() {
  const grid = getDynamicElement('songsGrid');
  const status = getDynamicElement('songs-status');
  if (!grid) {
    return;
  }

  if (status) {
    status.style.display = 'flex';
  }
  grid.innerHTML = '';

  let tracks = [];
  try {
    tracks = await fetchChannelVideos();
  } catch (error) {
    console.error('Failed to fetch songs list', error);
  }

  tracks.forEach((track) => {
    const img = track.image || 'assets/images/placeholder.png';
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <img src="${img}" alt="${track.title}" loading="lazy" decoding="async">
      <div class="song-card-content">
        <h3>${track.title}</h3>
        <p>${track.artists}</p>
        <div class="song-card-links">
          <a href="${track.link}" target="_blank" rel="noopener noreferrer">YouTube</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  const animationsApi = window.SiteAnimations || null;
  if (animationsApi && typeof animationsApi.animateSongCards === 'function') {
    try {
      animationsApi.animateSongCards(grid.querySelectorAll('.song-card'));
    } catch (animationError) {
      console.error('Songs: Failed to animate song cards.', animationError);
    }
  }

  if (status) {
    status.style.display = 'none';
  }
}

export default {
  loadSongs,
  fetchChannelVideos
};
