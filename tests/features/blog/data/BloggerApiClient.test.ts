import {
  extractFirstImageFromHtml,
  fetchBloggerPostsData,
  type BlogConfiguration,
} from '../../../../src/features/blog/data/BloggerApiClient';
import { createBlogPostCard } from '../../../../src/features/blog/presentation/BlogPosts';

const config: BlogConfiguration = {
  url: 'https://example.blogspot.com/',
  maxResults: 2,
  getApiKey: () => 'test-key',
};

describe('blog feature', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('loads blog identity and posts through the typed data source', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'blog-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ items: [{ title: 'Post' }] }),
      });

    const result = await fetchBloggerPostsData(config);

    expect(result[0]?.title).toBe('Post');
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(String((global.fetch as jest.Mock).mock.calls[0][0]))
      .toContain('blogs/byurl');
    expect(String((global.fetch as jest.Mock).mock.calls[1][0]))
      .toContain('/blogs/blog-123/posts');
    expect(String((global.fetch as jest.Mock).mock.calls[1][0]))
      .toContain('maxResults=2');
  });

  test('surfaces API error details', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue({
        error: { message: 'API access denied' },
      }),
    });

    await expect(fetchBloggerPostsData(config)).rejects.toThrow('API access denied');
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

    expect(card.tagName.toLowerCase()).toBe('md-outlined-card');
    expect(card.querySelector('h3')?.textContent).toBe('A safe title');
    expect(card.querySelector('.news-card-content p')?.textContent).toBe('Hello world');
    expect(card.querySelector('img')?.src).toContain('images/placeholder.png');
    const readButton = Array.from(card.querySelectorAll('md-text-button'))
      .find((button) => button.textContent?.includes('Read more'));
    expect(readButton?.getAttribute('href')).toBe('#');
    expect(readButton?.hasAttribute('disabled')).toBe(true);
    expect(card.querySelector('a md-text-button')).toBeNull();
  });
});
