const tracks = [
    { title: 'Thriller', artist: 'Michael Jackson' },
    { title: 'Billie Jean', artist: 'Michael Jackson' },
    { title: 'Beat It', artist: 'Michael Jackson' },
    { title: 'Smooth Criminal', artist: 'Michael Jackson' },
    { title: 'Bad', artist: 'Michael Jackson' }
];

async function fetchTrackInfo({ title, artist }) {
    const url =
        `https://musicbrainz.org/ws/2/recording/?query=recording:%22${encodeURIComponent(title)}%22%20AND%20artist:%22${encodeURIComponent(artist)}%22&fmt=json&limit=1&inc=releases`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    const rec = data.recordings && data.recordings[0];
    if (!rec) throw new Error('No recording found');
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
}

async function loadSongs() {
    const grid = document.getElementById('songsGrid');
    const status = document.getElementById('songs-status');
    if (!grid) return;
    if (status) status.style.display = 'flex';
    grid.innerHTML = '';
    for (const q of tracks) {
        try {
            const track = await fetchTrackInfo(q);
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
        } catch (err) {
            console.error('Failed to load song', q.title, err);
        }
    }
    if (status) status.style.display = 'none';
}

// When router loads the page dynamically
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('songsGrid')) {
        loadSongs();
    }
});
