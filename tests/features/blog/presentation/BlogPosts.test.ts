import { fetchBlogPosts } from '../../../../src/features/blog/presentation/BlogPosts';

const NEWS_MARKUP = `
  <h2 class="page-section-title">Latest news</h2>
  <div class="news-section">
    <div class="news-grid" id="newsGrid">
      <div id="news-status">
        <md-circular-progress indeterminate></md-circular-progress>
        <span>Loading latest posts...</span>
      </div>
    </div>
  </div>
`;

function sectionState(): { section: boolean; heading: boolean } {
  return {
    section: (document.querySelector('.news-section') as HTMLElement).hidden,
    heading: (document.querySelector('.page-section-title') as HTMLElement).hidden,
  };
}

describe('fetchBlogPosts', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    document.body.innerHTML = NEWS_MARKUP;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  const mockFeed = (body: unknown, ok = true): void => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 404,
      json: async () => body,
    }) as unknown as typeof fetch;
  };

  // The Pages build writes an empty feed when Blogger is unavailable, so this
  // is the path a degraded deploy takes. It must leave a clean page.
  test('hides the news section for an empty generated feed', async () => {
    mockFeed({ items: [] });

    await fetchBlogPosts();

    expect(sectionState()).toEqual({ section: true, heading: true });
    expect(document.getElementById('news-status')?.hidden).toBe(true);
    expect(document.querySelectorAll('.news-card')).toHaveLength(0);
  });

  test('hides the news section when the feed file is missing', async () => {
    mockFeed({}, false);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await fetchBlogPosts();

    expect(sectionState()).toEqual({ section: true, heading: true });
    expect(document.getElementById('news-status')?.hidden).toBe(true);
  });

  test('renders cards and reveals the section when posts are available', async () => {
    mockFeed({
      items: [
        { title: 'First post', content: '<p>Hello</p>', url: 'https://example.com/1' },
        { title: 'Second post', content: '<p>World</p>', url: 'https://example.com/2' },
      ],
    });

    await fetchBlogPosts();

    expect(sectionState()).toEqual({ section: false, heading: false });
    expect(document.querySelectorAll('.news-card')).toHaveLength(2);
    expect(document.querySelector('.news-card h3')?.textContent).toBe('First post');
  });
});
