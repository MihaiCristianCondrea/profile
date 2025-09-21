const moduleRegistryPath = require.resolve('../assets/js/modules/moduleRegistry.js');
const mainModulePath = require.resolve('../assets/js/main.js');

function setupAppModule({ includeDependencies = true } = {}) {
  jest.resetModules();

  document.body.innerHTML = `
    <main id="pageContentArea" data-drawer-inert-target>
      <section id="mainContentPage"><p>Welcome!</p></section>
    </main>
    <h1 id="appBarHeadline"></h1>
    <header id="topAppBar"></header>
    <div id="songsGrid"></div>
    <div id="newsGrid"></div>
    <div id="committers-rank"></div>
    <div id="committers-status"></div>
    <div class="achievement-card"></div>
    <a id="navProjectsLink" href="#projects">Projects</a>
    <a id="navSongsLink" href="#songs">Songs</a>
  `;

  window.location.hash = '#projects';

  const ModuleRegistry = require(moduleRegistryPath);
  ModuleRegistry.reset();

  const mocks = {
    getDynamicElementMock: jest.fn((id) => document.getElementById(id)),
    showOverlayMock: jest.fn(),
    hideOverlayMock: jest.fn(),
    closeDrawerMock: jest.fn(),
    setCopyrightYearMock: jest.fn(),
    initThemeMock: jest.fn(),
    initNavigationDrawerMock: jest.fn(),
    initRouterMock: jest.fn(),
    loadPageContentMock: jest.fn(),
    normalizePageIdMock: jest.fn((value) =>
      typeof value === 'string' && value.startsWith('#') ? value.slice(1) : value
    ),
    fetchBlogPostsMock: jest.fn().mockResolvedValue(undefined),
    fetchCommittersRankingMock: jest.fn().mockResolvedValue(undefined),
    loadSongsHandlerMock: jest.fn().mockResolvedValue(undefined),
    initProjectsPageMock: jest.fn().mockResolvedValue(undefined),
    initResumePageMock: jest.fn().mockResolvedValue(undefined),
    initContactPageMock: jest.fn().mockResolvedValue(undefined),
    siteAnimationsInitMock: jest.fn(),
    routesHasRouteMock: jest.fn(() => true),
    routesGetRouteMock: jest.fn((id) => (id ? { id, title: id } : null))
  };

  ModuleRegistry.register('utils', {
    getDynamicElement: mocks.getDynamicElementMock,
    setCopyrightYear: mocks.setCopyrightYearMock,
    showPageLoadingOverlay: mocks.showOverlayMock,
    hidePageLoadingOverlay: mocks.hideOverlayMock
  });
  ModuleRegistry.register('theme', { initTheme: mocks.initThemeMock });
  ModuleRegistry.register('navigationDrawer', {
    initNavigationDrawer: mocks.initNavigationDrawerMock,
    closeDrawer: mocks.closeDrawerMock
  });
  ModuleRegistry.register('router.core', {
    initRouter: mocks.initRouterMock,
    loadPageContent: mocks.loadPageContentMock,
    normalizePageId: mocks.normalizePageIdMock
  });
  ModuleRegistry.register('router.routes', {
    hasRoute: mocks.routesHasRouteMock,
    getRoute: mocks.routesGetRouteMock,
    PAGE_ROUTES: { home: { id: 'home' }, projects: { id: 'projects' }, songs: { id: 'songs' } }
  });
  ModuleRegistry.register('animations', { init: mocks.siteAnimationsInitMock });

  if (includeDependencies) {
    ModuleRegistry.register('bloggerApi', { fetchBlogPosts: mocks.fetchBlogPostsMock });
    ModuleRegistry.register('committers', {
      fetchCommittersRanking: mocks.fetchCommittersRankingMock
    });
    ModuleRegistry.register('page.songs', { loadSongs: mocks.loadSongsHandlerMock });
    ModuleRegistry.register('page.projects', { initProjectsPage: mocks.initProjectsPageMock });
    ModuleRegistry.register('page.resume', { initResumePage: mocks.initResumePageMock });
    ModuleRegistry.register('page.contact', { initContactPage: mocks.initContactPageMock });
  }

  const MainAppModule = require(mainModulePath);

  return { MainAppModule, mocks };
}

afterEach(() => {
  document.body.innerHTML = '';
  window.location.hash = '';
  jest.useRealTimers();
});

describe('app/main module', () => {
  test('buildRouterOptions wires callbacks and page handlers when provided', async () => {
    const { MainAppModule, mocks } = setupAppModule({ includeDependencies: true });

    const routerOptions = MainAppModule.buildRouterOptions();

    expect(routerOptions.showOverlay).toBeInstanceOf(Function);
    expect(routerOptions.hideOverlay).toBeInstanceOf(Function);
    expect(routerOptions.closeDrawer).toBeInstanceOf(Function);
    expect(routerOptions.onHomeLoad).toBeInstanceOf(Function);
    expect(routerOptions.pageHandlers).toEqual(
      expect.objectContaining({
        songs: expect.any(Function),
        projects: expect.any(Function),
        resume: expect.any(Function),
        contact: expect.any(Function)
      })
    );

    await routerOptions.showOverlay();
    await routerOptions.hideOverlay();
    await routerOptions.closeDrawer();
    routerOptions.onHomeLoad();
    await routerOptions.pageHandlers.songs();
    await routerOptions.pageHandlers.projects();
    await routerOptions.pageHandlers.resume();
    await routerOptions.pageHandlers.contact();

    expect(mocks.showOverlayMock).toHaveBeenCalledTimes(1);
    expect(mocks.hideOverlayMock).toHaveBeenCalledTimes(1);
    expect(mocks.closeDrawerMock).toHaveBeenCalledTimes(1);
    expect(mocks.fetchBlogPostsMock).toHaveBeenCalledTimes(1);
    expect(mocks.fetchCommittersRankingMock).toHaveBeenCalledTimes(1);
    expect(mocks.loadSongsHandlerMock).toHaveBeenCalledTimes(1);
    expect(mocks.initProjectsPageMock).toHaveBeenCalledTimes(1);
    expect(mocks.initResumePageMock).toHaveBeenCalledTimes(1);
    expect(mocks.initContactPageMock).toHaveBeenCalledTimes(1);
  });

  test('buildRouterOptions omits handlers when dependencies are missing', () => {
    const { MainAppModule } = setupAppModule({ includeDependencies: false });

    const routerOptions = MainAppModule.buildRouterOptions();
    expect(routerOptions.onHomeLoad).toBeUndefined();
    expect(routerOptions.pageHandlers).toBeUndefined();
  });

  test('initializeApplication bootstraps the SPA shell with defaults', () => {
    const { MainAppModule, mocks } = setupAppModule({ includeDependencies: true });
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    MainAppModule.initializeApplication();

    expect(mocks.setCopyrightYearMock).toHaveBeenCalledTimes(1);
    expect(mocks.initThemeMock).toHaveBeenCalledTimes(1);
    expect(mocks.initNavigationDrawerMock).toHaveBeenCalledTimes(1);
    expect(mocks.siteAnimationsInitMock).toHaveBeenCalledTimes(1);

    expect(mocks.initRouterMock).toHaveBeenCalledTimes(1);
    const [contentArea, headlineElement, initialHtml, routerOptions] =
      mocks.initRouterMock.mock.calls[0];

    expect(contentArea).toBeInstanceOf(HTMLElement);
    expect(contentArea.id).toBe('pageContentArea');
    expect(headlineElement.id).toBe('appBarHeadline');
    expect(initialHtml).toContain('<section id="mainContentPage"');
    expect(routerOptions).toEqual(
      expect.objectContaining({
        showOverlay: expect.any(Function),
        hideOverlay: expect.any(Function),
        closeDrawer: expect.any(Function),
        onHomeLoad: expect.any(Function),
        pageHandlers: expect.objectContaining({
          songs: expect.any(Function),
          projects: expect.any(Function),
          resume: expect.any(Function),
          contact: expect.any(Function)
        })
      })
    );

    routerOptions.showOverlay();
    routerOptions.hideOverlay();
    routerOptions.closeDrawer();

    expect(mocks.showOverlayMock).toHaveBeenCalledTimes(1);
    expect(mocks.hideOverlayMock).toHaveBeenCalledTimes(1);
    expect(mocks.closeDrawerMock).toHaveBeenCalledTimes(1);

    expect(mocks.loadPageContentMock).toHaveBeenCalledWith('#projects', false);
    expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    const navProjectsLink = document.getElementById('navProjectsLink');
    const clickEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    navProjectsLink.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(mocks.routesHasRouteMock).toHaveBeenCalledWith('projects');
    expect(mocks.loadPageContentMock).toHaveBeenCalledWith('projects');

    addEventListenerSpy.mockRestore();
  });
});
