const SMART_CLEANER_PAGE_SCRIPT = '../assets/js/smartCleanerPage.js';

function loadScript() {
  jest.isolateModules(() => {
    require(SMART_CLEANER_PAGE_SCRIPT);
  });
}

describe('smartCleanerPage scroll reveal', () => {
  let originalIntersectionObserver;
  let intersectionCallback;

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '';

    originalIntersectionObserver = window.IntersectionObserver;
    intersectionCallback = null;

    window.IntersectionObserver = jest.fn(function MockIntersectionObserver(callback) {
      intersectionCallback = callback;
      this.observe = jest.fn();
      this.disconnect = jest.fn();
    });
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
    delete window.initSmartCleanerPage;
    jest.restoreAllMocks();
  });

  test('removes visibility when section leaves viewport below while scrolling up', () => {
    document.body.innerHTML = `
      <div id="smartCleanerPageContainer">
        <section class="smart-cleaner-reveal" id="target-section">
          <h2>Overview</h2>
          <p>Details</p>
        </section>
      </div>
    `;

    Object.defineProperty(window, 'innerHeight', {
      value: 1000,
      configurable: true,
      writable: true
    });

    window.scrollY = 500;

    loadScript();
    window.initSmartCleanerPage();

    const section = document.getElementById('target-section');

    intersectionCallback([
      {
        target: section,
        isIntersecting: true,
        boundingClientRect: { top: 300 }
      }
    ]);

    expect(section.classList.contains('is-visible')).toBe(true);

    window.scrollY = 400;
    window.dispatchEvent(new Event('scroll'));

    intersectionCallback([
      {
        target: section,
        isIntersecting: false,
        boundingClientRect: { top: 920 }
      }
    ]);

    expect(section.classList.contains('is-visible')).toBe(false);
  });
});
