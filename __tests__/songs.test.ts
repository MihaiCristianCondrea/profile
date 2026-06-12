const path = require('path');

const PLACEHOLDER_SRC = 'assets/images/placeholder.png';
const SONG_DATA_SCRIPT = path.join('..', 'assets', 'js', 'features', 'songs', 'data', 'songApi.js');
const SONG_DOMAIN_SCRIPT = path.join('..', 'assets', 'js', 'features', 'songs', 'domain', 'songMapper.js');
const SONG_PRESENTATION_SCRIPT = path.join('..', 'assets', 'js', 'features', 'songs', 'presentation', 'songs.js');

function loadSongsModule() {
    require(SONG_DATA_SCRIPT);
    require(SONG_DOMAIN_SCRIPT);
    return require(SONG_PRESENTATION_SCRIPT);
}

describe('songs module', () => {
    beforeEach(() => {
        jest.resetModules();
        global.fetch = jest.fn();
        document.body.innerHTML = `
            <div id="songsGrid"></div>
            <div id="songs-status" style="display:none"></div>
        `;
    });

    afterEach(() => {
        delete global.fetch;
    });

    test('fetchArtistSongs throws an error with response message when request fails', async () => {
        const errorText = 'Something went wrong';
        const mockText = jest.fn().mockResolvedValue(errorText);
        const response = {
            ok: false,
            status: 502,
            text: mockText
        };

        global.fetch.mockResolvedValue(response);

        const { fetchArtistSongs } = loadSongsModule();

        await expect(fetchArtistSongs('artist123')).rejects.toThrow(
            `HTTP error! status: 502, message: ${errorText}`
        );
        expect(mockText).toHaveBeenCalledTimes(1);
    });

    test('loadSongs renders fetched tracks, applies fallback image, and hides status indicator', async () => {
        const mockJson = jest.fn().mockResolvedValue({
            songs: [
                {
                    song_name: 'First Song',
                    artist_name: 'First Artist',
                    thumbnail: 'https://cdn.example.com/thumb1.jpg',
                    universal_link: 'https://song.link/first'
                },
                {
                    title: 'Second Song',
                    artists: 'Second Artist',
                    image: null,
                    link: 'https://song.link/second'
                }
            ]
        });

        global.fetch.mockResolvedValue({
            ok: true,
            json: mockJson
        });

        const { loadSongs } = loadSongsModule();
        const status = document.getElementById('songs-status');
        status.style.display = 'block';

        await loadSongs();

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(mockJson).toHaveBeenCalledTimes(1);

        const cards = document.querySelectorAll('#songsGrid .song-card');
        expect(cards).toHaveLength(2);

        const [firstCard, secondCard] = cards;
        const firstImg = firstCard.querySelector('img');
        expect(firstImg.src).toContain('https://cdn.example.com/thumb1.jpg');
        expect(firstImg.alt).toBe('First Song');
        expect(firstCard.querySelector('h3').textContent).toBe('First Song');
        expect(firstCard.querySelector('p').textContent).toBe('First Artist');
        expect(firstCard.querySelector('a').href).toBe('https://song.link/first');

        const secondImg = secondCard.querySelector('img');
        expect(secondImg.src).toContain(PLACEHOLDER_SRC);

        expect(status.style.display).toBe('none');
    });
});
