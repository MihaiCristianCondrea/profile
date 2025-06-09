
const artistMbid = '1217497d-8afd-4c78-9071-9905631d5db4';

async function fetchArtistTracks(mbid) {
    const url = `https://musicbrainz.org/ws/2/recording?artist=${mbid}&fmt=json&limit=100&inc=releases`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return (data.recordings || []).map(rec => {
        const artists = (rec['artist-credit'] || []).map(a => a.name).join(', ');
        let image = '';
        const release = rec.releases && rec.releases[0];
        if (release && release['release-group'] && release['release-group'].id) {
            const rgid = release['release-group'].id;
            image = `https://coverartarchive.org/release-group/${rgid}/front-250`;
        }
        return {
            title: rec.title,
            artists,
            image,
            link: `https://musicbrainz.org/recording/${rec.id}`
        };
    });
}

async function loadSongs() {
    const grid = document.getElementById('songsGrid');
    const status = document.getElementById('songs-status');
    if (!grid) return;
    if (status) status.style.display = 'flex';
    grid.innerHTML = '';
    let tracks = [];
    try {
        tracks = await fetchArtistTracks(artistMbid);
    } catch (err) {
        console.error('Failed to fetch songs list', err);
    }
    for (const track of tracks) {
        const img = track.image || 'https://via.placeholder.com/250?text=No+Art';
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
                <div class="song-card-links"><a href="${link}" target="_blank" rel="noopener noreferrer">MusicBrainz</a></div>
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
