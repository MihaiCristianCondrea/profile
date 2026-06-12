// @ts-nocheck

const ODESLI_API_BASE_URL = 'https://publicapi.dev/songlink';
const D4RK_REKORDS_ARTIST_ID = 'd4rk-rekords';

async function fetchArtistSongData(artistId) {
    const url = `${ODESLI_API_BASE_URL}/api/odesli/${encodeURIComponent(artistId)}`;
    const resp = await fetch(url);

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`HTTP error! status: ${resp.status}, message: ${errorText}`);
    }

    return resp.json();
}

if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, {
        ODESLI_API_BASE_URL,
        D4RK_REKORDS_ARTIST_ID,
        fetchArtistSongData
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ODESLI_API_BASE_URL,
        D4RK_REKORDS_ARTIST_ID,
        fetchArtistSongData
    };
}
