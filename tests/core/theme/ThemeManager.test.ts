interface ThemeModule {
  initTheme: () => void;
  applyTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

function installThemeMarkup(): void {
  document.body.innerHTML = '<mnw-app-shell-footer></mnw-app-shell-footer>';
}

describe('ThemeManager', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    document.documentElement.className = '';
    installThemeMarkup();
  });

  test('applies stored selection and updates accessible button state', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => ({
        matches: false,
        addEventListener: jest.fn(),
      })),
    });
    localStorage.setItem('theme', 'dark');
    const { initTheme } = require('../../../src/core/theme/ThemeManager') as ThemeModule;

    initTheme();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    const footer = document.querySelector('mnw-app-shell-footer') as HTMLElement & {theme: string};
    expect(footer.theme).toBe('dark');
    footer.dispatchEvent(new CustomEvent('theme-change', {detail: {theme: 'light'}}));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('tracks system changes while auto theme is selected', () => {
    let listener: (() => void) | undefined;
    const mediaQuery = {
      matches: false,
      addEventListener: jest.fn((_type: string, callback: () => void) => {
        listener = callback;
      }),
    };
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => mediaQuery),
    });
    localStorage.setItem('theme', 'auto');
    const { initTheme } = require('../../../src/core/theme/ThemeManager') as ThemeModule;

    initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    mediaQuery.matches = true;
    listener?.();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('auto');
  });
});
