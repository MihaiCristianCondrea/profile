import type {
  AppShellThemeChangeEvent,
  MaterialNextAppShellFooter,
} from 'material-next-web-components/app-shell.js';
export type ThemePreference = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'theme';
const themeQuery =
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
let initialized = false;

function isThemePreference(value: string | null | undefined): value is ThemePreference {
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

export function applyTheme(theme: ThemePreference): void {
  const isDark = theme === 'dark' || (theme === 'auto' && themeQuery?.matches === true);
  document.documentElement.classList.toggle('dark', isDark);
  storeThemePreference(theme);
  const footer = document.querySelector<MaterialNextAppShellFooter>('mnw-app-shell-footer');
  if (footer) footer.theme = theme === 'auto' ? 'system' : theme;
}

export function initTheme(): void {
  if (!initialized) {
    document
      .querySelector<MaterialNextAppShellFooter>('mnw-app-shell-footer')
      ?.addEventListener('theme-change', (event: AppShellThemeChangeEvent) => {
        applyTheme(event.detail.theme === 'system' ? 'auto' : event.detail.theme);
      });

    themeQuery?.addEventListener('change', () => {
      if (readThemePreference() === 'auto') applyTheme('auto');
    });
    initialized = true;
  }

  applyTheme(readThemePreference());
}
