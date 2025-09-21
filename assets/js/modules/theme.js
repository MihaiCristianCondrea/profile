const globalScope = typeof window !== 'undefined' ? window : globalThis;
const ModuleRegistry =
  typeof module === 'object' && typeof module.exports === 'object'
    ? require('./moduleRegistry.js')
    : globalScope.ModuleRegistry;

if (!ModuleRegistry || typeof ModuleRegistry.register !== 'function') {
  throw new Error('Theme module requires ModuleRegistry.');
}

const { getDynamicElement } = ModuleRegistry.has('utils')
  ? ModuleRegistry.require('utils')
  : require('./utils.js');

let lightThemeButton;
let darkThemeButton;
let autoThemeButton;
let themeButtons = [];
let htmlElement;

function initTheme() {
  lightThemeButton = getDynamicElement('lightThemeButton');
  darkThemeButton = getDynamicElement('darkThemeButton');
  autoThemeButton = getDynamicElement('autoThemeButton');
  htmlElement = globalScope.document ? globalScope.document.documentElement : null;

  themeButtons = [lightThemeButton, darkThemeButton, autoThemeButton].filter(Boolean);
  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.theme);
    });
    button.setAttribute('role', 'button');
  });

  const savedTheme =
    (globalScope.localStorage && globalScope.localStorage.getItem('theme')) || 'auto';
  applyTheme(savedTheme);

  if (globalScope.matchMedia) {
    const darkQuery = globalScope.matchMedia('(prefers-color-scheme: dark)');
    if (typeof darkQuery.addEventListener === 'function') {
      darkQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof darkQuery.addListener === 'function') {
      darkQuery.addListener(handleSystemThemeChange);
    }
  }
}

function handleSystemThemeChange() {
  if (globalScope.localStorage && globalScope.localStorage.getItem('theme') === 'auto') {
    applyTheme('auto');
  }
}

function applyTheme(theme) {
  if (!htmlElement) {
    return;
  }

  const prefersDark = globalScope.matchMedia
    ? globalScope.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);

  htmlElement.classList.toggle('dark', isDark);
  if (globalScope.localStorage) {
    const storageValue = theme === 'auto' ? 'auto' : isDark ? 'dark' : 'light';
    globalScope.localStorage.setItem('theme', storageValue);
  }
  updateThemeButtonSelection(theme);
}

function updateThemeButtonSelection(selectedTheme) {
  themeButtons.forEach((button) => {
    const isSelected = button.dataset.theme === selectedTheme;
    button.classList.toggle('selected', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
}

const ThemeModule = {
  initTheme,
  applyTheme,
  updateThemeButtonSelection
};

ModuleRegistry.register('theme', ThemeModule, { alias: 'SiteTheme' });

if (globalScope && typeof globalScope === 'object') {
  globalScope.initTheme = ThemeModule.initTheme;
  globalScope.applyTheme = ThemeModule.applyTheme;
  globalScope.updateThemeButtonSelection = ThemeModule.updateThemeButtonSelection;
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = ThemeModule;
}
