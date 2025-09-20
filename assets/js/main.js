import { initializeAppShell } from './core/appShell.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeAppShell();
  });
} else {
  initializeAppShell();
}
