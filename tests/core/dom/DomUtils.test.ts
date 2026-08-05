const {
  getDynamicElement,
  showPageLoadingOverlay,
  hidePageLoadingOverlay
} = require('../../../src/core/dom/DomUtils');

describe('DOM utility helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-element"></div>
      <div id="pageLoadingOverlay" class="overlay"></div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('getDynamicElement returns the element if it exists', () => {
    const element = getDynamicElement('test-element');
    expect(element).not.toBeNull();
    expect(element.id).toBe('test-element');
  });

  test('getDynamicElement returns null for missing element', () => {
    expect(getDynamicElement('missing-element')).toBeNull();
  });

  test('showPageLoadingOverlay adds the active class', () => {
    const overlay = document.getElementById('pageLoadingOverlay');
    expect(overlay.classList.contains('active')).toBe(false);
    showPageLoadingOverlay();
    expect(overlay.classList.contains('active')).toBe(true);
  });

  test('hidePageLoadingOverlay removes the active class', () => {
    const overlay = document.getElementById('pageLoadingOverlay');
    overlay.classList.add('active');
    hidePageLoadingOverlay();
    expect(overlay.classList.contains('active')).toBe(false);
  });
});
