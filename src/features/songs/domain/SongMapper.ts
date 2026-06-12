// @ts-nocheck

function mapTrack(rawTrack) {
    return {
        title: rawTrack?.title || rawTrack?.song_name || 'Unknown title',
        artists: rawTrack?.artists || rawTrack?.artist_name || 'D4rK Rekords',
        image: rawTrack?.image || rawTrack?.thumbnail || rawTrack?.artwork || null,
        link: rawTrack?.link || rawTrack?.universal_link || rawTrack?.url || '#'
    };
}

function normalizeSongTracks(data) {
    const songs = Array.isArray(data?.songs)
        ? data.songs
        : Array.isArray(data?.tracks)
            ? data.tracks
            : Array.isArray(data)
                ? data
                : [];

    return songs.map(mapTrack);
}

if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, {
        mapTrack,
        normalizeSongTracks
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mapTrack,
        normalizeSongTracks
    };
}
