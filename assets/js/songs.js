
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
    return streams.map(v => ({
        title: v.title,
        artists: v.uploaderName,
        image: v.thumbnail,
        link: `https://www.youtube.com${v.url}`
    }));
}

async function fetchSongInfo(youtubeUrl) {
    const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(youtubeUrl)}&songIfSingle=true`;
    const resp = await fetch(apiUrl);
    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`HTTP error! status: ${resp.status}, message: ${errorText}`);
    }
    return await resp.json();
}

const platformNames = {
    appleMusic: 'Apple Music',
    itunes: 'iTunes',
    spotify: 'Spotify',
    youtube: 'YouTube',
    youtubeMusic: 'YouTube Music',
    google: 'Google Play Music',
    googleStore: 'Google Store',
    pandora: 'Pandora',
    deezer: 'Deezer',
    tidal: 'Tidal',
    amazonStore: 'Amazon',
    amazonMusic: 'Amazon Music',
    soundcloud: 'SoundCloud',
    napster: 'Napster',
    yandex: 'Yandex Music',
    spinrilla: 'Spinrilla',
    audius: 'Audius',
    audiomack: 'Audiomack',
    anghami: 'Anghami',
    boomplay: 'Boomplay'
};

async function loadSongs() {
    const grid = document.getElementById('songsGrid');
    const status = document.getElementById('songs-status');
    if (!grid) return;
    if (status) status.style.display = 'flex';
    grid.innerHTML = '';
    let tracks = [];
    try {
        tracks = await fetchChannelVideos(youtubeChannelId);
    } catch (err) {
        console.error('Failed to fetch songs list', err);
    }
    for (const track of tracks) {
        let songInfo = null;
        try {
            songInfo = await fetchSongInfo(track.link);
        } catch (err) {
            console.error('Failed to fetch song info', err);
        }

        const entity = songInfo?.entitiesByUniqueId?.[songInfo?.entityUniqueId];
        const img = entity?.thumbnailUrl || track.image || 'https://via.placeholder.com/250?text=No+Art';
        const title = entity?.title || track.title;
        const artists = entity?.artistName || track.artists;
        const linksByPlatform = songInfo?.linksByPlatform || {};

        let linksHtml = '';
        if (Object.keys(linksByPlatform).length > 0) {
            for (const [platform, data] of Object.entries(linksByPlatform)) {
                const name = platformNames[platform] || platform;
                linksHtml += `<a href="${data.url}" target="_blank" rel="noopener noreferrer">${name}</a>`;
            }
        } else {
            linksHtml = `<a href="${track.link}" target="_blank" rel="noopener noreferrer">YouTube</a>`;
        }

        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img src="${img}" alt="${title}" loading="lazy">
            <div class="song-card-content">
                <h3>${title}</h3>
                <p>${artists}</p>
                <div class="song-card-links">${linksHtml}</div>
            </div>`;
        grid.appendChild(card);
    }
    if (status) status.style.display = 'none';
}

// When router loads the page dynamically
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('songsGrid')) {
        loadSongs();
    }
});
