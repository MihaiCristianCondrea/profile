import { jest } from '@jest/globals';
import { initTheme, applyTheme } from '../assets/js/core/theme.js';

function createLocalStorageMock(initial = {}) {
  let store = { ...initial };
  return {
    getItem: jest.fn((key) => (key in store ? store[key] : null)),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    peek: (key) => (key in store ? store[key] : null)
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
  matchMedia.mediaQueryList = mediaQueryList;
  return matchMedia;
}

function setupThemeTest({ savedTheme, mediaMatches = false } = {}) {
  document.body.innerHTML = `
    <button id="lightThemeButton" data-theme="light"></button>
    <button id="darkThemeButton" data-theme="dark"></button>
    <button id="autoThemeButton" data-theme="auto"></button>
  `;
  document.documentElement.className = '';

  const initialStore = savedTheme ? { theme: savedTheme } : {};
  const localStorageMock = createLocalStorageMock(initialStore);
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true });
  const matchMediaMock = createMatchMediaMock(mediaMatches);
  Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, configurable: true });

  return {
    localStorageMock,
    matchMediaMock,
    buttons: {
      light: document.getElementById('lightThemeButton'),
      dark: document.getElementById('darkThemeButton'),
      auto: document.getElementById('autoThemeButton')
    }
  };
}

describe('theme.js', () => {
  let originalMatchMedia;
  let originalLocalStorage;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.className = '';
    originalMatchMedia = window.matchMedia;
    originalLocalStorage = window.localStorage;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    if (originalMatchMedia !== undefined) {
      Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, configurable: true });
    }
    if (originalLocalStorage !== undefined) {
      Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, configurable: true });
    }
  });

  test('initTheme applies the saved preference and wires up the buttons', () => {
    const { localStorageMock, matchMediaMock, buttons } = setupThemeTest({
      savedTheme: 'dark',
      mediaMatches: false
    });

    initTheme();

    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(buttons.dark.classList.contains('selected')).toBe(true);
    expect(buttons.light.classList.contains('selected')).toBe(false);
    expect(buttons.auto.classList.contains('selected')).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(matchMediaMock.mediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    buttons.light.dispatchEvent(new Event('click', { bubbles: true }));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(buttons.light.classList.contains('selected')).toBe(true);
    expect(buttons.dark.classList.contains('selected')).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'light');
    expect(localStorageMock.peek('theme')).toBe('light');
  });

  test('applyTheme("auto") tracks media preference changes and keeps storage in sync', () => {
    const { localStorageMock, matchMediaMock, buttons } = setupThemeTest({
      savedTheme: 'auto',
      mediaMatches: false
    });

    initTheme();

    expect(buttons.auto.classList.contains('selected')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorageMock.peek('theme')).toBe('auto');

    const baselineSetCalls = localStorageMock.setItem.mock.calls.length;

    matchMediaMock.setMatches(true);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(buttons.auto.classList.contains('selected')).toBe(true);
    expect(localStorageMock.setItem.mock.calls.length).toBe(baselineSetCalls + 1);
    expect(localStorageMock.peek('theme')).toBe('auto');

    matchMediaMock.setMatches(false);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(buttons.auto.classList.contains('selected')).toBe(true);
    expect(localStorageMock.setItem.mock.calls.length).toBe(baselineSetCalls + 2);
    expect(localStorageMock.peek('theme')).toBe('auto');
  });
});
