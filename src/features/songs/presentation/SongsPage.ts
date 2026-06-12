// @ts-nocheck

async function fetchArtistSongs(artistId) {
    const data = await fetchArtistSongData(artistId);
    return normalizeSongTracks(data);
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
        const img = track.image || 'images/placeholder.png';
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

if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, {
        fetchArtistSongs,
        loadSongs
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchArtistSongs,
        loadSongs
    };
}
