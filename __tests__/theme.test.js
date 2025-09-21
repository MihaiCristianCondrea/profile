const moduleRegistryPath = require.resolve('../assets/js/modules/moduleRegistry.js');
const themeModulePath = require.resolve('../assets/js/modules/theme.js');

function createLocalStorageMock(initial = {}) {
  let store = Object.keys(initial).reduce((accumulator, key) => {
    accumulator[key] = String(initial[key]);
    return accumulator;
  }, {});

  return {
    getItem: jest.fn((key) =>
      Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    ),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    peek: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)
  };
}

function createMatchMediaMock(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set();

  const mediaQueryList = {
    media: '(prefers-color-scheme: dark)',
    get matches() {
      return matches;
    },
    addEventListener: jest.fn((event, listener) => {
      if (event === 'change') {
        listeners.add(listener);
      }
    }),
    removeEventListener: jest.fn((event, listener) => {
      if (event === 'change') {
        listeners.delete(listener);
      }
    })
  };

  const matchMedia = jest.fn(() => mediaQueryList);

  matchMedia.setMatches = (value) => {
    matches = value;
    listeners.forEach((listener) => listener({ matches: value, media: mediaQueryList.media }));
  };

  matchMedia.getListenerCount = () => listeners.size;
  matchMedia.mediaQueryList = mediaQueryList;

  return matchMedia;
}

function setupThemeTest({ savedTheme, mediaMatches = false } = {}) {
  jest.resetModules();
  document.body.innerHTML = `
    <button id="lightThemeButton" data-theme="light"></button>
    <button id="darkThemeButton" data-theme="dark"></button>
    <button id="autoThemeButton" data-theme="auto"></button>
  `;
  document.documentElement.className = '';

  const initialStore = savedTheme !== undefined ? { theme: savedTheme } : {};
  const localStorageMock = createLocalStorageMock(initialStore);
  const matchMediaMock = createMatchMediaMock(mediaMatches);

  const originalMatchMedia = window.matchMedia;
  const originalLocalStorage = window.localStorage;

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: matchMediaMock
  });
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorageMock
  });

  const ModuleRegistry = require(moduleRegistryPath);
  ModuleRegistry.reset();
  const themeModule = require(themeModulePath);

  const buttons = {
    light: document.getElementById('lightThemeButton'),
    dark: document.getElementById('darkThemeButton'),
    auto: document.getElementById('autoThemeButton')
  };

  const restore = () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia
    });
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  };

  return { themeModule, localStorageMock, matchMediaMock, buttons, restore };
}

describe('theme module', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.className = '';
  });

  test('initTheme applies saved preference and wires up the buttons', () => {
    const resources = setupThemeTest({
      savedTheme: 'dark',
      mediaMatches: false
    });

    const { themeModule, localStorageMock, matchMediaMock, buttons, restore } = resources;

    try {
      themeModule.initTheme();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(buttons.dark.classList.contains('selected')).toBe(true);
      expect(buttons.light.classList.contains('selected')).toBe(false);
      expect(buttons.auto.classList.contains('selected')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(matchMediaMock.mediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );

      buttons.light.dispatchEvent(new window.Event('click', { bubbles: true }));

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(buttons.light.classList.contains('selected')).toBe(true);
      expect(buttons.dark.classList.contains('selected')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'light');
      expect(localStorageMock.peek('theme')).toBe('light');
    } finally {
      restore();
    }
  });

  test('applyTheme("auto") responds to media preference changes and keeps storage in sync', () => {
    const resources = setupThemeTest({
      savedTheme: 'auto',
      mediaMatches: false
    });

    const { themeModule, localStorageMock, matchMediaMock, buttons, restore } = resources;

    try {
      themeModule.initTheme();

      expect(buttons.auto.classList.contains('selected')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorageMock.peek('theme')).toBe('auto');

      const baselineSetCalls = localStorageMock.setItem.mock.calls.length;
      const baselineGetCalls = localStorageMock.getItem.mock.calls.length;

      matchMediaMock.setMatches(true);

      expect(localStorageMock.getItem.mock.calls.length).toBe(baselineGetCalls + 1);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(buttons.auto.classList.contains('selected')).toBe(true);
      expect(localStorageMock.setItem.mock.calls.length).toBe(baselineSetCalls + 1);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'auto');
      expect(localStorageMock.peek('theme')).toBe('auto');

      matchMediaMock.setMatches(false);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(buttons.auto.classList.contains('selected')).toBe(true);
      expect(localStorageMock.setItem.mock.calls.length).toBe(baselineSetCalls + 2);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'auto');
      expect(localStorageMock.peek('theme')).toBe('auto');
    } finally {
      restore();
    }
  });
});
