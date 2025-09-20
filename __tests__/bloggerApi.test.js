import { jest } from '@jest/globals';

const modulePath = '../assets/js/services/bloggerApi.js';

describe('services/bloggerApi', () => {
  let fetchBlogPosts;
  let shareBlogPost;
  let displayShareFeedback;
  let utilsGetDynamicElementMock;
  let originalFetch;
  let originalNavigator;
  let originalPrompt;
  let originalExecCommand;

  const createFeedbackElement = () => {
    const element = document.createElement('span');
    element.className = 'share-feedback';
    element.hidden = true;
    return element;
  };

  beforeEach(async () => {
    jest.resetModules();
    jest.useRealTimers();

    document.body.innerHTML = '';

    originalFetch = global.fetch;
    originalNavigator = window.navigator;
    originalPrompt = window.prompt;
    originalExecCommand = document.execCommand;

    utilsGetDynamicElementMock = jest.fn((id) => document.getElementById(id));

    jest.unstable_mockModule('../assets/js/core/utils.js', () => ({
      __esModule: true,
      getNestedValue: (obj, path) => {
        if (!obj || typeof path !== 'string') {
          return undefined;
        }
        return path.split('.').reduce((value, segment) => {
          if (value == null) {
            return value;
          }
          if (/^\d+$/.test(segment)) {
            return value[Number(segment)];
          }
          return value[segment];
        }, obj);
      },
      extractFirstImageFromHtml: () => null,
      getDynamicElement: utilsGetDynamicElementMock
    }));

    ({ fetchBlogPosts, shareBlogPost, displayShareFeedback } = await import(modulePath));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = '';

    if (originalFetch === undefined) {
      delete global.fetch;
    } else {
      global.fetch = originalFetch;
    }

    if (originalPrompt === undefined) {
      delete window.prompt;
    } else {
      window.prompt = originalPrompt;
    }

    if (originalExecCommand === undefined) {
      delete document.execCommand;
    } else {
      document.execCommand = originalExecCommand;
    }

    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      configurable: true
    });

    jest.restoreAllMocks();
  });

  describe('shareBlogPost', () => {
    test('uses the Web Share API when available', async () => {
      jest.useFakeTimers();
      const feedbackElement = createFeedbackElement();
      const shareMock = jest.fn().mockResolvedValue(undefined);
      const clipboardMock = jest.fn();

      Object.defineProperty(window, 'navigator', {
        value: {
          share: shareMock,
          clipboard: { writeText: clipboardMock }
        },
        configurable: true
      });

      window.prompt = jest.fn();

      await shareBlogPost({
        title: 'Test Title',
        text: '   Some   spaced   text   ',
        url: 'https://example.com/post'
      }, feedbackElement);

      expect(shareMock).toHaveBeenCalledWith({
        title: 'Test Title',
        url: 'https://example.com/post',
        text: 'Some spaced text'
      });
      expect(clipboardMock).not.toHaveBeenCalled();
      expect(feedbackElement.textContent).toBe('Thanks for sharing!');
      expect(feedbackElement.hidden).toBe(false);

      jest.runOnlyPendingTimers();
    });

    test('falls back to the Clipboard API when share is unavailable', async () => {
      jest.useFakeTimers();
      const feedbackElement = createFeedbackElement();
      const writeTextMock = jest.fn().mockResolvedValue(undefined);

      Object.defineProperty(window, 'navigator', {
        value: {
          clipboard: { writeText: writeTextMock }
        },
        configurable: true
      });

      window.prompt = jest.fn();

      await shareBlogPost({
        title: 'Another Post',
        text: '',
        url: 'https://example.com/another'
      }, feedbackElement);

      expect(writeTextMock).toHaveBeenCalledWith('https://example.com/another');
      expect(window.prompt).not.toHaveBeenCalled();
      expect(feedbackElement.textContent).toBe('Link copied to clipboard.');
      expect(feedbackElement.hidden).toBe(false);

      jest.runOnlyPendingTimers();
    });

    test('shows manual copy instructions when all fallbacks fail', async () => {
      jest.useFakeTimers();
      const feedbackElement = createFeedbackElement();
      const shareMock = jest.fn().mockRejectedValue(new Error('Share failed'));
      const writeTextMock = jest.fn().mockRejectedValue(new Error('Clipboard failed'));

      Object.defineProperty(window, 'navigator', {
        value: {
          share: shareMock,
          clipboard: { writeText: writeTextMock }
        },
        configurable: true
      });

      window.prompt = jest.fn();
      document.execCommand = jest.fn().mockReturnValue(false);

      await shareBlogPost({
        title: 'Fallback Post',
        text: null,
        url: 'https://example.com/fallback'
      }, feedbackElement);

      expect(shareMock).toHaveBeenCalled();
      expect(writeTextMock).toHaveBeenCalled();
      expect(window.prompt).toHaveBeenCalledWith('Copy this link to share:', 'https://example.com/fallback');
      expect(feedbackElement.textContent).toBe('Copy the link shown to share this post.');
      expect(feedbackElement.hidden).toBe(false);

      jest.runOnlyPendingTimers();
    });
  });

  describe('displayShareFeedback', () => {
    test('applies classes and schedules hide transition', () => {
      jest.useFakeTimers();
      const element = createFeedbackElement();

      displayShareFeedback(element, 'Copied!', false);

      expect(element.textContent).toBe('Copied!');
      expect(element.hidden).toBe(false);
      expect(element.classList.contains('is-visible')).toBe(true);
      expect(element.classList.contains('error')).toBe(false);

      jest.runOnlyPendingTimers();
      expect(element.hidden).toBe(true);
      expect(element.textContent).toBe('');
    });
  });

  describe('fetchBlogPosts', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="newsGrid"></div>
        <div id="news-status"></div>
      `;
    });

    afterEach(() => {
      if (global.fetch) {
        global.fetch.mockReset?.();
      }
    });

    test('renders posts and hides the status indicator on success', async () => {
      const blogInfoResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'blog-123' })
      };
      const postsResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: [
            { title: 'Post One', content: '<p>First content</p>', url: 'https://example.com/1', images: [{ url: 'https://example.com/img1.png' }] },
            { title: 'Post Two', content: '<p>Second content</p>', url: 'https://example.com/2', images: [{ url: 'https://example.com/img2.png' }] }
          ]
        })
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce(blogInfoResponse)
        .mockResolvedValueOnce(postsResponse);

      await fetchBlogPosts();

      expect(utilsGetDynamicElementMock).toHaveBeenCalledWith('newsGrid');
      expect(utilsGetDynamicElementMock).toHaveBeenCalledWith('news-status');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(document.querySelectorAll('#newsGrid md-outlined-card')).toHaveLength(2);
      expect(document.getElementById('news-status').style.display).toBe('none');
    });

    test('shows a friendly message when the feed is empty', async () => {
      const blogInfoResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'blog-123' })
      };
      const postsResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ items: [] })
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce(blogInfoResponse)
        .mockResolvedValueOnce(postsResponse);

      await fetchBlogPosts();

      const statusElement = document.getElementById('news-status');
      expect(statusElement.innerHTML).toContain('No posts found.');
      expect(statusElement.style.display).toBe('flex');
      expect(document.getElementById('newsGrid').children).toHaveLength(0);
    });

    test('displays an error message when the blog info request fails', async () => {
      const errorResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: jest.fn().mockResolvedValue({ error: { message: 'Invalid key' } })
      };

      global.fetch = jest.fn().mockResolvedValueOnce(errorResponse);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await fetchBlogPosts();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const statusElement = document.getElementById('news-status');
      expect(statusElement.innerHTML).toContain('Failed to load posts. Error fetching blog info: 403 Forbidden - Invalid key.');
      expect(statusElement.style.display).toBe('flex');
      consoleErrorSpy.mockRestore();
    });
  });
});
