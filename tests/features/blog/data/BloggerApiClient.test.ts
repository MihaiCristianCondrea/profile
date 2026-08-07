import {
  extractFirstImageFromHtml,
  fetchBloggerPostsData,
  type BlogConfiguration,
} from '../../../../src/features/blog/data/BloggerApiClient';
import {
  createBlogPostCard,
  fetchBlogPosts,
} from '../../../../src/features/blog/presentation/BlogPosts';

const config: BlogConfiguration = {
  dataUrl: 'generated-blog-posts.json',
};

describe('blog feature', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    document.body.replaceChildren();
  });

  test('loads generated Blogger posts through the typed data source', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ items: [{ title: 'Post' }] }),
    });

    const result = await fetchBloggerPostsData(config);

    expect(result[0]?.title).toBe('Post');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('generated-blog-posts.json');
  });

  test('surfaces generated data loading errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(fetchBloggerPostsData(config))
      .rejects.toThrow('Unable to load generated blog posts (404).');
  });

  test('extracts the first non-inline image from Blogger HTML', () => {
    const html = '<img src="data:image/png;base64,AAAA"><img src="https://example.com/cover.jpg">';
    expect(extractFirstImageFromHtml(html)).toBe('https://example.com/cover.jpg');
    expect(extractFirstImageFromHtml('<p>No images</p>')).toBeNull();
  });

  test('renders remote data with text content and direct Material link behavior', () => {
    const card = createBlogPostCard({
      title: 'A safe title',
      content: '<p>Hello <strong>world</strong></p>',
      url: 'javascript:alert(1)',
      imageUrl: 'javascript:alert(2)',
    });

    expect(card.tagName.toLowerCase()).toBe('md-filled-card');
    expect(card.querySelector('h3')?.textContent).toBe('A safe title');
    expect(card.querySelector('.news-card-content p')?.textContent).toBe('Hello world');
    expect(card.querySelector('img')?.src).toContain('images/placeholder.png');
    const readButton = Array.from(card.querySelectorAll('md-filled-button'))
      .find((button) => button.textContent?.includes('Read more'));
    expect(readButton?.getAttribute('href')).toBe('#');
    expect(readButton?.hasAttribute('disabled')).toBe(true);
    expect(card.querySelector('a md-filled-button')).toBeNull();
  });

  test('keeps the complete latest news block hidden when no posts exist', async () => {
    document.body.innerHTML = `
      <h2 class="page-section-title">Latest news</h2>
      <div class="news-section">
        <div id="newsGrid">
          <div id="news-status"></div>
        </div>
      </div>
    `;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ items: [] }),
    });

    await fetchBlogPosts();

    const heading = document.querySelector<HTMLElement>('.page-section-title');
    const section = document.querySelector<HTMLElement>('.news-section');
    expect(heading?.hidden).toBe(true);
    expect(section?.hidden).toBe(true);
  });

  test('reveals the latest news block when generated posts exist', async () => {
    document.body.innerHTML = `
      <h2 class="page-section-title">Latest news</h2>
      <div class="news-section">
        <div id="newsGrid">
          <div id="news-status"></div>
        </div>
      </div>
    `;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ items: [{ title: 'Visible post' }] }),
    });

    await fetchBlogPosts();

    const heading = document.querySelector<HTMLElement>('.page-section-title');
    const section = document.querySelector<HTMLElement>('.news-section');
    expect(heading?.hidden).toBe(false);
    expect(section?.hidden).toBe(false);
    expect(document.querySelector('#newsGrid h3')?.textContent).toBe('Visible post');
  });
});
