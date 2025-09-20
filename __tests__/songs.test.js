import { jest } from '@jest/globals';
import { fetchChannelVideos, loadSongs } from '../assets/js/pages/songs.js';

describe('pages/songs', () => {
  let originalFetch;
  let animationsMock;

  beforeEach(() => {
    jest.resetModules();
    originalFetch = global.fetch;
    animationsMock = {
      animateSongCards: jest.fn()
    };
    window.SiteAnimations = animationsMock;

    document.body.innerHTML = `
      <div id="songsGrid"></div>
      <div id="songs-status" style="display:none"></div>
    `;
  });

  afterEach(() => {
    if (originalFetch === undefined) {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }
    delete window.SiteAnimations;
    document.body.innerHTML = '';
  });

  test('fetchChannelVideos throws an error when the request fails', async () => {
    const errorText = 'Something went wrong';
    const response = {
      ok: false,
      status: 502,
      text: jest.fn().mockResolvedValue(errorText)
    };

    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(fetchChannelVideos('channel123')).rejects.toThrow(
      `HTTP error! status: 502, message: ${errorText}`
    );
    expect(response.text).toHaveBeenCalledTimes(1);
  });

  test('loadSongs renders fetched tracks, applies fallback image, and hides status indicator', async () => {
    const mockJson = jest.fn().mockResolvedValue({
      relatedStreams: [
        {
          title: 'First Song',
          uploaderName: 'First Artist',
          thumbnail: 'https://cdn.example.com/thumb1.jpg',
          url: '/watch?v=first'
        },
        {
          title: 'Second Song',
          uploaderName: 'Second Artist',
          thumbnail: null,
          url: '/watch?v=second'
        }
      ]
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: mockJson
    });

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
    expect(firstCard.querySelector('a').href).toBe('https://www.youtube.com/watch?v=first');

    const secondImg = secondCard.querySelector('img');
    expect(secondImg.src).toContain('assets/images/placeholder.png');

    expect(status.style.display).toBe('none');
    expect(animationsMock.animateSongCards).toHaveBeenCalled();
  });
});
