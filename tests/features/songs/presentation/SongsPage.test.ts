import {
  createSongCard,
  fetchArtistSongs,
  loadSongs,
} from '../../../../src/features/songs/presentation/SongsPage';

describe('songs feature', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    document.body.innerHTML = `
      <div id="songsGrid"></div>
      <div id="songs-status"></div>
    `;
  });

  test('reports unsuccessful API responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 502 });

    await expect(fetchArtistSongs('artist')).rejects.toThrow(
      'Unable to load songs (502).',
    );
  });

  test('renders normalized tracks as Material cards and link buttons', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        songs: [{
          song_name: 'First Song',
          artist_name: 'First Artist',
          thumbnail: 'https://example.com/cover.png',
          universal_link: 'https://song.link/first',
        }],
      }),
    });

    await loadSongs();

    const card = document.querySelector('#songsGrid md-outlined-card');
    expect(card?.querySelector('h3')?.textContent).toBe('First Song');
    expect(card?.querySelector('p')?.textContent).toBe('First Artist');
    expect(card?.querySelector('img')?.alt).toBe('');
    const action = card?.querySelector('md-text-button');
    expect(action?.getAttribute('href')).toBe('https://song.link/first');
    expect(action?.closest('a')).toBeNull();
    expect((document.getElementById('songs-status') as HTMLElement).hidden).toBe(true);
  });

  test('rejects unsafe image and action schemes', () => {
    const card = createSongCard({
      title: 'Unsafe',
      artists: 'Unknown',
      image: 'javascript:alert(1)',
      link: 'javascript:alert(2)',
    });

    expect(card.querySelector('img')?.src).toContain('images/placeholder.png');
    const action = card.querySelector('md-text-button');
    expect(action?.getAttribute('href')).toBe('#');
    expect(action?.hasAttribute('disabled')).toBe(true);
  });
});
