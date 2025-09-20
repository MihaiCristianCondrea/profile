import { getDynamicElement } from './utils.js';

let lightThemeButton;
let darkThemeButton;
let autoThemeButton;
let themeButtons = [];
let htmlElement;

/**
 * Initializes theme switching functionality. Must be called after DOM is ready.
 */
export function initTheme() {
  lightThemeButton = getDynamicElement('lightThemeButton');
  darkThemeButton = getDynamicElement('darkThemeButton');
  autoThemeButton = getDynamicElement('autoThemeButton');
  themeButtons = [lightThemeButton, darkThemeButton, autoThemeButton].filter(Boolean);
  htmlElement = document.documentElement;

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.theme);
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        applyTheme(button.dataset.theme);
      }
    });
  });

  const savedTheme = localStorage.getItem('theme') || 'auto';
  applyTheme(savedTheme);

  const prefersDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  prefersDarkMedia.addEventListener('change', () => {
    if (localStorage.getItem('theme') === 'auto') {
      applyTheme('auto');
    }
  });
}

/**
 * Applies the selected theme to the document.
 * @param {string} theme - The theme to apply ('light', 'dark', or 'auto').
 */
export function applyTheme(theme) {
  if (!htmlElement) {
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  htmlElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', theme === 'auto' ? 'auto' : isDark ? 'dark' : 'light');
  updateThemeButtonSelection(theme);
}

/**
 * Updates the visual selection state of theme buttons.
 * @param {string} selectedTheme - The currently selected theme.
 */
export function updateThemeButtonSelection(selectedTheme) {
  themeButtons.forEach((button) => {
    const isSelected = button.dataset.theme === selectedTheme;
    button.classList.toggle('selected', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
}

export default {
  initTheme,
  applyTheme,
  updateThemeButtonSelection
};
