import {
  hidePageLoadingOverlay,
  showPageLoadingOverlay,
} from '../../../src/core/dom/DomUtils';

describe('DOM utility helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="pageLoadingOverlay" class="overlay"></div>
      <p id="copyright-message"></p>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  test('showPageLoadingOverlay adds the active class', () => {
    const overlay = document.getElementById('pageLoadingOverlay') as HTMLElement;
    expect(overlay.classList.contains('active')).toBe(false);

    showPageLoadingOverlay();

    expect(overlay.classList.contains('active')).toBe(true);
  });

  test('hidePageLoadingOverlay removes the active class', () => {
    const overlay = document.getElementById('pageLoadingOverlay') as HTMLElement;
    overlay.classList.add('active');

    hidePageLoadingOverlay();

    expect(overlay.classList.contains('active')).toBe(false);
  });

  test('overlay helpers ignore a shell that has no overlay', () => {
    document.body.innerHTML = '';

    expect(() => {
      showPageLoadingOverlay();
      hidePageLoadingOverlay();
    }).not.toThrow();
  });

});
