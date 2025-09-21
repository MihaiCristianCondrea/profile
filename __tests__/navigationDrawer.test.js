const {
  initNavigationDrawer,
  openDrawer,
  closeDrawer,
  syncDrawerState
} = require('../assets/js/modules/navigationDrawer.js');

describe('core/navigationDrawer', () => {
  let originalMatchMedia;
  let matchMediaChangeHandler;

  const createDrawerMarkup = () => {
    document.body.innerHTML = `
      <header data-drawer-inert-target id="header">
        <button id="menuButton" type="button">Menu</button>
      </header>
      <div id="drawerOverlay" aria-hidden="true"></div>
      <md-navigation-drawer id="navDrawer" aria-modal="true">
        <button id="closeDrawerButton" type="button">Close</button>
        <nav>
          <md-list>
            <md-list-item href="#home" id="homeLink">Home</md-list-item>
          </md-list>
        </nav>
        <section>
          <button id="aboutToggle" type="button" aria-controls="aboutContent" aria-expanded="false">About</button>
          <div id="aboutContent" aria-hidden="true" class="nested-list">About section</div>
        </section>
        <section>
          <button id="androidAppsToggle" type="button" aria-controls="androidAppsContent" aria-expanded="false">Apps</button>
          <div id="androidAppsContent" aria-hidden="true" class="nested-list">Apps section</div>
        </section>
      </md-navigation-drawer>
      <main data-drawer-inert-target id="mainContent">Main content</main>
      <footer data-drawer-inert-target id="footerContent">Footer content</footer>
    `;

    const navDrawerElement = document.getElementById('navDrawer');
    let openedState = false;
    Object.defineProperty(navDrawerElement, 'opened', {
      configurable: true,
      get() {
        return openedState;
      },
      set(value) {
        openedState = Boolean(value);
      }
    });

    const firstNavItem = navDrawerElement.querySelector('md-list-item[href]');
    firstNavItem.focus = jest.fn();

    const closeButton = document.getElementById('closeDrawerButton');
    closeButton.focus = jest.fn();
  };

  beforeEach(() => {
    matchMediaChangeHandler = null;
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change') {
            matchMediaChangeHandler = handler;
          }
        }),
        removeEventListener: jest.fn()
      }))
    });

    createDrawerMarkup();
    initNavigationDrawer();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, configurable: true });
  });

  test('opens and closes the drawer while managing overlay, inert targets, and focus', () => {
    const menuButtonElement = document.getElementById('menuButton');
    const overlay = document.getElementById('drawerOverlay');
    const navDrawerElement = document.getElementById('navDrawer');
    const inertElements = Array.from(document.querySelectorAll('[data-drawer-inert-target]'));
    const firstNavItem = navDrawerElement.querySelector('md-list-item[href]');

    const menuFocusSpy = jest.spyOn(menuButtonElement, 'focus');

    openDrawer();

    expect(navDrawerElement.opened).toBe(true);
    expect(document.body.classList.contains('drawer-is-open')).toBe(true);
    expect(menuButtonElement.getAttribute('aria-expanded')).toBe('true');
    expect(overlay.classList.contains('open')).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('false');
    expect(firstNavItem.focus).toHaveBeenCalledTimes(1);
    inertElements.forEach((element) => {
      expect(element.hasAttribute('inert')).toBe(true);
      expect(element.getAttribute('aria-hidden')).toBe('true');
    });

    closeDrawer();

    expect(navDrawerElement.opened).toBe(false);
    expect(document.body.classList.contains('drawer-is-open')).toBe(false);
    expect(menuButtonElement.getAttribute('aria-expanded')).toBe('false');
    expect(menuFocusSpy).toHaveBeenCalledTimes(1);
    expect(overlay.classList.contains('open')).toBe(false);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    inertElements.forEach((element) => {
      expect(element.hasAttribute('inert')).toBe(false);
      expect(element.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  test('toggle sections are mutually exclusive and maintain ARIA state', () => {
    const aboutToggleElement = document.getElementById('aboutToggle');
    const aboutContentElement = document.getElementById('aboutContent');
    const androidToggleElement = document.getElementById('androidAppsToggle');
    const androidContentElement = document.getElementById('androidAppsContent');

    aboutToggleElement.click();

    expect(aboutToggleElement.classList.contains('expanded')).toBe(true);
    expect(aboutToggleElement.getAttribute('aria-expanded')).toBe('true');
    expect(aboutContentElement.classList.contains('open')).toBe(true);
    expect(aboutContentElement.getAttribute('aria-hidden')).toBe('false');

    androidToggleElement.click();

    expect(aboutToggleElement.classList.contains('expanded')).toBe(false);
    expect(aboutToggleElement.getAttribute('aria-expanded')).toBe('false');
    expect(aboutContentElement.classList.contains('open')).toBe(false);
    expect(aboutContentElement.getAttribute('aria-hidden')).toBe('true');

    expect(androidToggleElement.classList.contains('expanded')).toBe(true);
    expect(androidToggleElement.getAttribute('aria-expanded')).toBe('true');
    expect(androidContentElement.classList.contains('open')).toBe(true);
    expect(androidContentElement.getAttribute('aria-hidden')).toBe('false');

    androidToggleElement.click();

    expect(androidToggleElement.classList.contains('expanded')).toBe(false);
    expect(androidToggleElement.getAttribute('aria-expanded')).toBe('false');
    expect(androidContentElement.classList.contains('open')).toBe(false);
    expect(androidContentElement.getAttribute('aria-hidden')).toBe('true');
  });

  test('switching layout modes updates accessibility state and overlay handling', () => {
    const menuButtonElement = document.getElementById('menuButton');
    const navDrawerElement = document.getElementById('navDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const inertElements = Array.from(document.querySelectorAll('[data-drawer-inert-target]'));

    openDrawer();
    expect(navDrawerElement.opened).toBe(true);

    // Simulate switching to standard layout (wider viewport)
    matchMediaChangeHandler?.({ matches: true });
    syncDrawerState(true);

    expect(navDrawerElement.getAttribute('aria-modal')).toBe('false');
    expect(navDrawerElement.ariaModal).toBe('false');
    expect(document.body.classList.contains('drawer-is-open')).toBe(false);
    expect(overlay.classList.contains('open')).toBe(false);
    expect(menuButtonElement.getAttribute('aria-expanded')).toBe('false');
    inertElements.forEach((element) => {
      expect(element.hasAttribute('inert')).toBe(false);
      expect(element.hasAttribute('aria-hidden')).toBe(false);
    });

    // Simulate returning to modal layout
    matchMediaChangeHandler?.({ matches: false });
    syncDrawerState(true);

    expect(navDrawerElement.getAttribute('aria-modal')).toBe('true');
    expect(navDrawerElement.ariaModal).toBe('true');
    expect(document.body.classList.contains('drawer-is-open')).toBe(true);
    expect(overlay.classList.contains('open')).toBe(true);
    expect(menuButtonElement.getAttribute('aria-expanded')).toBe('true');
    inertElements.forEach((element) => {
      expect(element.hasAttribute('inert')).toBe(true);
      expect(element.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
