// @ts-nocheck

const ODESLI_API_BASE_URL = 'https://publicapi.dev/songlink';
const D4RK_REKORDS_ARTIST_ID = 'd4rk-rekords';

function mapTrack(rawTrack) {
    return {
        title: rawTrack?.title || rawTrack?.song_name || 'Unknown title',
        artists: rawTrack?.artists || rawTrack?.artist_name || 'D4rK Rekords',
        image: rawTrack?.image || rawTrack?.thumbnail || rawTrack?.artwork || null,
        link: rawTrack?.link || rawTrack?.universal_link || rawTrack?.url || '#'
    };
}

async function fetchArtistSongs(artistId) {
    const url = `${ODESLI_API_BASE_URL}/api/odesli/${encodeURIComponent(artistId)}`;
    const resp = await fetch(url);

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`HTTP error! status: ${resp.status}, message: ${errorText}`);
    }

    const data = await resp.json();
    const songs = Array.isArray(data?.songs)
        ? data.songs
        : Array.isArray(data?.tracks)
            ? data.tracks
            : Array.isArray(data)
                ? data
                : [];

    return songs.map(mapTrack);
}

async function loadSongs() {
    const grid = document.getElementById('songsGrid');
    const status = document.getElementById('songs-status');
    if (!grid) return;

    if (status) status.style.display = 'flex';
    grid.innerHTML = '';

    let tracks = [];
    try {
        tracks = await fetchArtistSongs(D4RK_REKORDS_ARTIST_ID);
    } catch (err) {
        console.error('Failed to fetch songs list from Songlink / Odesli API', err);
    }

    for (const track of tracks) {
        const img = track.image || 'assets/images/placeholder.png';
        const title = track.title;
        const artists = track.artists;
        const link = track.link;

        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img src="${img}" alt="${title}" loading="lazy">
            <div class="song-card-content">
                <h3>${title}</h3>
                <p>${artists}</p>
                <div class="song-card-links"><a href="${link}" target="_blank" rel="noopener noreferrer">Open Song</a></div>
            </div>`;
        grid.appendChild(card);
    }

    if (typeof SiteAnimations !== 'undefined' && SiteAnimations && typeof SiteAnimations.animateSongCards === 'function') {
        try {
            SiteAnimations.animateSongCards(grid.querySelectorAll('.song-card'));
        } catch (animationError) {
            console.error('Songs: Failed to animate song cards.', animationError);
        }
    }

    if (status) status.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('songsGrid')) {
        loadSongs();
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchArtistSongs,
        loadSongs
    };
}
