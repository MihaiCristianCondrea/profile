const APP_PATH = '../../src/app/App';

const OPTIONAL_GLOBALS = [
  'showPageLoadingOverlay',
  'hidePageLoadingOverlay',
  'closeDrawer',
  'fetchBlogPosts',
  'fetchCommittersRanking',
  'loadSongs',
  'initProjectsPage',
  'initResumePage',
  'initContactPage',
  'renderHomeFaqSection',
  'initFaqPage',
  'SiteAnimations'
];

const CORE_GLOBALS = [
  'getDynamicElement',
  'initRouter',
  'initTheme',
  'initNavigationDrawer',
  'loadPageContent',
  'normalizePageId',
  'RouterRoutes',
  'setCopyrightYear'
];

let documentEventSpy;
let windowEventSpy;
let registeredDocumentHandlers = [];
let registeredWindowHandlers = [];

function clearGlobals() {
  [...OPTIONAL_GLOBALS, ...CORE_GLOBALS].forEach((key) => delete global[key]);
}

function stubNormalizePageId(value) {
  if (typeof value !== 'string') return 'home';
  const withoutHash = value.startsWith('#') ? value.slice(1) : value;
  return withoutHash === '' ? 'home' : withoutHash;
}

function loadAndStartApp() {
  let startApp;
  jest.isolateModules(() => {
    ({ startApp } = require(APP_PATH));
  });
  startApp();

  const domReadyHandler = registeredDocumentHandlers.find(({ type }) => type === 'DOMContentLoaded');
  if (domReadyHandler) document.dispatchEvent(new Event('DOMContentLoaded'));
}

function removeRegisteredHandlers() {
  registeredDocumentHandlers.forEach(({ type, listener, options }) => {
    document.removeEventListener(type, listener, options);
  });
  registeredWindowHandlers.forEach(({ type, listener, options }) => {
    window.removeEventListener(type, listener, options);
  });
  registeredDocumentHandlers = [];
  registeredWindowHandlers = [];
}

describe('App.ts bootstrap integration', () => {
  beforeEach(() => {
    jest.resetModules();
    clearGlobals();
    document.body.innerHTML = '';
    window.location.hash = '#home';
    registeredDocumentHandlers = [];
    registeredWindowHandlers = [];

    const originalDocumentAddEventListener = document.addEventListener.bind(document);
    documentEventSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
      originalDocumentAddEventListener(type, listener, options);
      registeredDocumentHandlers.push({ type, listener, options });
    });

    const originalWindowAddEventListener = window.addEventListener.bind(window);
    windowEventSpy = jest.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      originalWindowAddEventListener(type, listener, options);
      registeredWindowHandlers.push({ type, listener, options });
    });
  });

  afterEach(() => {
    removeRegisteredHandlers();
    documentEventSpy?.mockRestore();
    windowEventSpy?.mockRestore();
    clearGlobals();
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('buildRouterOptions wires available callbacks and page handlers', () => {
    document.body.innerHTML = `
      <main id="pageContentArea"></main>
      <section id="mainContentPage"><p>Welcome!</p></section>
      <h1 id="appBarHeadline"></h1>
      <div id="newsGrid"></div>
      <div id="committers-rank"></div>
      <div id="songsGrid"></div>
    `;

    const initRouter = jest.fn();
    const showPageLoadingOverlay = jest.fn();
    const hidePageLoadingOverlay = jest.fn();
    const closeDrawer = jest.fn();
    const fetchBlogPosts = jest.fn();
    const fetchCommittersRanking = jest.fn();
    const loadSongs = jest.fn();
    const initProjectsPage = jest.fn();
    const initResumePage = jest.fn();

    Object.assign(global, {
      getDynamicElement: jest.fn((id) => document.getElementById(id)),
      initTheme: jest.fn(),
      initNavigationDrawer: jest.fn(),
      setCopyrightYear: jest.fn(),
      initRouter,
      loadPageContent: jest.fn(),
      normalizePageId: jest.fn(stubNormalizePageId),
      RouterRoutes: { hasRoute: jest.fn(() => true) },
      showPageLoadingOverlay,
      hidePageLoadingOverlay,
      closeDrawer,
      fetchBlogPosts,
      fetchCommittersRanking,
      loadSongs,
      initProjectsPage,
      initResumePage
    });

    loadAndStartApp();

    expect(initRouter).toHaveBeenCalledTimes(1);
    const routerOptions = initRouter.mock.calls[0][3];
    expect(routerOptions).toEqual(expect.objectContaining({
      showOverlay: expect.any(Function),
      hideOverlay: expect.any(Function),
      closeDrawer: expect.any(Function),
      onHomeLoad: expect.any(Function),
      pageHandlers: expect.objectContaining({
        songs: expect.any(Function),
        projects: initProjectsPage,
        resume: initResumePage
      })
    }));

    routerOptions.showOverlay();
    routerOptions.hideOverlay();
    routerOptions.closeDrawer();
    routerOptions.onHomeLoad();
    routerOptions.pageHandlers.songs();

    expect(showPageLoadingOverlay).toHaveBeenCalledTimes(1);
    expect(hidePageLoadingOverlay).toHaveBeenCalledTimes(1);
    expect(closeDrawer).toHaveBeenCalledTimes(1);
    expect(fetchBlogPosts).toHaveBeenCalledTimes(1);
    expect(fetchCommittersRanking).toHaveBeenCalledTimes(1);
    expect(loadSongs).toHaveBeenCalledTimes(1);
  });

  test('navigation interception delegates to loadPageContent without duplicate startup', () => {
    document.body.innerHTML = `
      <main id="pageContentArea"></main>
      <section id="mainContentPage"></section>
      <h1 id="appBarHeadline"></h1>
      <a id="songsLink" href="#songs"><span>Songs</span></a>
      <a id="missingLink" href="#missing"><span>Missing</span></a>
      <a id="externalLink" href="#home" target="_blank">External</a>
      <md-list-item id="projectsItem" href="#projects"></md-list-item>
    `;

    const loadPageContent = jest.fn();
    const hasRoute = jest.fn((id) => ['home', 'songs', 'projects'].includes(id));
    Object.assign(global, {
      getDynamicElement: jest.fn((id) => document.getElementById(id)),
      initTheme: jest.fn(),
      initNavigationDrawer: jest.fn(),
      setCopyrightYear: jest.fn(),
      initRouter: jest.fn(),
      loadPageContent,
      normalizePageId: jest.fn(stubNormalizePageId),
      RouterRoutes: { hasRoute }
    });

    loadAndStartApp();
    expect(loadPageContent).toHaveBeenCalledWith('#home', false);
    loadPageContent.mockClear();
    hasRoute.mockClear();

    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(loadPageContent).not.toHaveBeenCalled();

    document.querySelector('#songsLink span').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(hasRoute).toHaveBeenCalledWith('songs');
    expect(loadPageContent).toHaveBeenCalledWith('songs');

    loadPageContent.mockClear();
    hasRoute.mockClear();
    document.getElementById('projectsItem').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(hasRoute).toHaveBeenCalledWith('projects');
    expect(loadPageContent).toHaveBeenCalledWith('projects');

    loadPageContent.mockClear();
    hasRoute.mockClear();
    document.querySelector('#missingLink span').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(hasRoute).toHaveBeenCalledWith('missing');
    expect(loadPageContent).not.toHaveBeenCalled();

    hasRoute.mockClear();
    document.getElementById('externalLink').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(hasRoute).not.toHaveBeenCalled();
  });

  test('hash changes load the matching route without adding browser history', () => {
    document.body.innerHTML = `
      <main id="pageContentArea"></main>
      <section id="mainContentPage"></section>
      <h1 id="appBarHeadline"></h1>
    `;

    const loadPageContent = jest.fn();
    Object.assign(global, {
      getDynamicElement: jest.fn((id) => document.getElementById(id)),
      initTheme: jest.fn(),
      initNavigationDrawer: jest.fn(),
      setCopyrightYear: jest.fn(),
      initRouter: jest.fn(),
      loadPageContent,
      normalizePageId: jest.fn(stubNormalizePageId),
      RouterRoutes: { hasRoute: jest.fn(() => true) }
    });

    loadAndStartApp();
    loadPageContent.mockClear();
    window.location.hash = '#about-me';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(loadPageContent).toHaveBeenCalledTimes(1);
    expect(loadPageContent).toHaveBeenCalledWith('#about-me', false);
  });

  test('buildRouterOptions omits callbacks when optional globals are unavailable', () => {
    document.body.innerHTML = `
      <main id="pageContentArea"></main>
      <section id="mainContentPage"></section>
      <h1 id="appBarHeadline"></h1>
    `;

    const initRouter = jest.fn();
    Object.assign(global, {
      getDynamicElement: jest.fn((id) => document.getElementById(id)),
      initTheme: jest.fn(),
      initNavigationDrawer: jest.fn(),
      setCopyrightYear: jest.fn(),
      initRouter,
      loadPageContent: jest.fn(),
      normalizePageId: jest.fn(stubNormalizePageId),
      RouterRoutes: { hasRoute: jest.fn(() => false) }
    });

    loadAndStartApp();

    expect(initRouter).toHaveBeenCalledTimes(1);
    expect(initRouter.mock.calls[0][3]).toEqual({});
  });
});
