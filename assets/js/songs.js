
const youtubeChannelId = 'UC80JI44n7GpRGrlR71PtvPg';
async function fetchChannelVideos(channelId) {
    const url = `https://piped.video/api/v1/channels/${channelId}/videos`;
    const resp = await fetch(url);
    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`HTTP error! status: ${resp.status}, message: ${errorText}`);
    }
    const data = await resp.json();
    return (data || []).map(v => ({
        title: v.title,
        artists: v.uploader,
        image: v.thumbnail,
        link: `https://www.youtube.com/watch?v=${v.id}`
    }));
}

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
                <div class="song-card-links"><a href="${link}" target="_blank" rel="noopener noreferrer">YouTube</a></div>
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
