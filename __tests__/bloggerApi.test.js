const moduleRegistryPath = require.resolve('../assets/js/modules/moduleRegistry.js');
const bloggerApiModulePath = require.resolve('../assets/js/modules/bloggerApi.js');

describe('modules/bloggerApi', () => {
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

  beforeEach(() => {
    jest.resetModules();
    jest.useRealTimers();

    document.body.innerHTML = '';

    originalFetch = global.fetch;
    originalNavigator = window.navigator;
    originalPrompt = window.prompt;
    originalExecCommand = document.execCommand;

    utilsGetDynamicElementMock = jest.fn((id) => document.getElementById(id));

    const ModuleRegistry = require(moduleRegistryPath);
    ModuleRegistry.reset();
    ModuleRegistry.register('utils', {
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
    });

    ({ fetchBlogPosts, shareBlogPost, displayShareFeedback } = require(bloggerApiModulePath));
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

      await shareBlogPost(
        {
          title: 'Test Title',
          text: '   Some   spaced   text   ',
          url: 'https://example.com/post'
        },
        feedbackElement
      );

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

      await shareBlogPost(
        {
          title: 'Another Post',
          text: '',
          url: 'https://example.com/another'
        },
        feedbackElement
      );

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

      await shareBlogPost(
        {
          title: 'Fallback Post',
          text: null,
          url: 'https://example.com/fallback'
        },
        feedbackElement
      );

      expect(shareMock).toHaveBeenCalled();
      expect(writeTextMock).toHaveBeenCalled();
      expect(window.prompt).toHaveBeenCalledWith(
        'Copy this link to share:',
        'https://example.com/fallback'
      );
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
    test('handles API errors gracefully and updates status element', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server error',
        json: jest.fn().mockResolvedValue({ error: { message: 'Failure' } })
      });

      document.body.innerHTML = `
        <div id="newsGrid"></div>
        <div id="news-status"></div>
      `;

      await fetchBlogPosts();

      const statusElement = document.getElementById('news-status');
      expect(statusElement.textContent).toContain('Failed to load posts');
      expect(statusElement.style.display).toBe('flex');
    });
  });
});
