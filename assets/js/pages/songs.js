const globalScope = typeof window !== 'undefined' ? window : globalThis;
const ModuleRegistry =
  typeof module === 'object' && typeof module.exports === 'object'
    ? require('../modules/moduleRegistry.js')
    : globalScope.ModuleRegistry;

if (!ModuleRegistry || typeof ModuleRegistry.register !== 'function') {
  throw new Error('Songs page module requires ModuleRegistry.');
}

const AnimationsModule = ModuleRegistry.has('animations')
  ? ModuleRegistry.require('animations')
  : globalScope.SiteAnimations || null;

const youtubeChannelId = 'UCtzlWsxUK8FSvLwLDbESw4A';

async function fetchChannelVideos(channelId) {
  const url = `https://pipedapi.ducks.party/channel/${channelId}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`HTTP error! status: ${resp.status}, message: ${errorText}`);
  }
  const data = await resp.json();
  const streams = data.relatedStreams || [];
  return streams.map((video) => ({
    title: video.title,
    artists: video.uploaderName,
    image: video.thumbnail,
    link: `https://www.youtube.com${video.url}`
  }));
}

async function loadSongs() {
  const doc = globalScope.document;
  if (!doc) {
    return;
  }

  const grid = doc.getElementById('songsGrid');
  const status = doc.getElementById('songs-status');
  if (!grid) {
    return;
  }
  if (status) {
    status.style.display = 'flex';
  }
  grid.innerHTML = '';

  let tracks = [];
  try {
    tracks = await fetchChannelVideos(youtubeChannelId);
  } catch (error) {
    console.error('Songs: Failed to fetch songs list.', error);
  }

  for (const track of tracks) {
    const img = track.image || 'assets/images/placeholder.png';
    const title = track.title;
    const artists = track.artists;
    const link = track.link;

    const card = doc.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <img src="${img}" alt="${title}" loading="lazy">
      <div class="song-card-content">
        <h3>${title}</h3>
        <p>${artists}</p>
        <div class="song-card-links"><a href="${link}" target="_blank" rel="noopener noreferrer">YouTube</a></div>
      </div>`;
    grid.appendChild(card);
  }

  if (AnimationsModule && typeof AnimationsModule.animateSongCards === 'function') {
    try {
      AnimationsModule.animateSongCards(grid.querySelectorAll('.song-card'));
    } catch (animationError) {
      console.error('Songs: Failed to animate song cards.', animationError);
    }
  }
  if (status) {
    status.style.display = 'none';
  }
}

const SongsPageModule = { fetchChannelVideos, loadSongs };

ModuleRegistry.register('page.songs', SongsPageModule, { alias: 'SongsPage' });

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = SongsPageModule;
}

if (globalScope && typeof globalScope === 'object') {
  globalScope.fetchChannelVideos = SongsPageModule.fetchChannelVideos;
  globalScope.loadSongs = SongsPageModule.loadSongs;
}
