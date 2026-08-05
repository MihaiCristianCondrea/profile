export type ThemePreference = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'theme';
const themeQuery = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;
let themeButtons: HTMLElement[] = [];
let initialized = false;

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'auto';
}

function readThemePreference(): ThemePreference {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedTheme) ? storedTheme : 'auto';
  } catch {
    return 'auto';
  }
}

function storeThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The applied theme still works when storage is unavailable.
  }
}

export function updateThemeButtonSelection(selectedTheme: ThemePreference): void {
  themeButtons.forEach((button) => {
    const isSelected = button.dataset.theme === selectedTheme;
    button.toggleAttribute('data-active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
}

export function applyTheme(theme: ThemePreference): void {
  const isDark = theme === 'dark' || (theme === 'auto' && themeQuery?.matches === true);
  document.documentElement.classList.toggle('dark', isDark);
  storeThemePreference(theme);
  updateThemeButtonSelection(theme);
}

export function initTheme(): void {
  themeButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-theme]'));

  if (!initialized) {
    themeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const requestedTheme = button.dataset.theme;
        if (isThemePreference(requestedTheme ?? null)) applyTheme(requestedTheme);
      });
    });

    themeQuery?.addEventListener('change', () => {
      if (readThemePreference() === 'auto') applyTheme('auto');
    });
    initialized = true;
  }

  applyTheme(readThemePreference());
}
