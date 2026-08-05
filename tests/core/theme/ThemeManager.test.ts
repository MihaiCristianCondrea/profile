interface ThemeModule {
  initTheme: () => void;
  applyTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

function installThemeMarkup(): void {
  document.body.innerHTML = `
    <button data-theme="light"></button>
    <button data-theme="dark"></button>
    <button data-theme="auto"></button>
  `;
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
    expect(document.querySelector('[data-theme="dark"]')?.getAttribute('aria-pressed'))
      .toBe('true');
    expect(document.querySelector('[data-theme="dark"]')?.hasAttribute('data-active'))
      .toBe(true);

    (document.querySelector('[data-theme="light"]') as HTMLElement).click();
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
