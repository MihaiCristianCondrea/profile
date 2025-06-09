const trackIds = [
    '2jAkanCtUEAJyULRjRI9Iv',
    '7w6QEs6LkFsI1Z780Pu7EB',
    '2h4SKinuoj3wVVpyVsG5sS',
    '3kgXhV03q7fJ6ROSCow42u',
    '3EAisNhDwQPEYQ9rZa9D6Z'
];

async function loadSongs() {
    const grid = document.getElementById('songsGrid');
    const status = document.getElementById('songs-status');
    if (!grid) return;
    if (status) status.style.display = 'flex';
    grid.innerHTML = '';
    for (const id of trackIds) {
        try {
            const resp = await fetch(`https://api.song.link/v1-alpha.1/links?url=spotify%3Atrack%3A${id}&userCountry=US&songIfSingle=true`);
            const data = await resp.json();
            const spotifyKey = `SPOTIFY_SONG::${id}`;
            const entity = data.entitiesByUniqueId[spotifyKey] || {};
            const title = entity.title || 'Unknown Title';
            const img = entity.thumbnailUrl || '';
            const links = data.linksByPlatform || {};
            let linksHtml = '';
            for (const [platform, info] of Object.entries(links)) {
                const label = platform.charAt(0).toUpperCase() + platform.slice(1);
                linksHtml += `<a href="${info.url}" target="_blank" rel="noopener noreferrer">${label}</a> `;
            }
            const card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <img src="${img}" alt="${title}" loading="lazy">
                <div class="song-card-content">
                    <h3>${title}</h3>
                    <div class="song-card-links">${linksHtml}</div>
                </div>`;
            grid.appendChild(card);
        } catch (err) {
            console.error('Failed to load song', id, err);
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
