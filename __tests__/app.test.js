import { jest } from '@jest/globals';

const appShellModulePath = '../assets/js/core/appShell.js';

describe('core/appShell', () => {
  let buildRouterOptions;
  let initializeAppShell;
  let getDynamicElementMock;
  let showOverlayMock;
  let hideOverlayMock;
  let closeDrawerMock;
  let setCopyrightYearMock;
  let initThemeMock;
  let initNavigationDrawerMock;
  let initRouterMock;
  let loadPageContentMock;
  let setupRouteLinkInterceptionMock;
  let siteAnimationsInitMock;

  beforeEach(async () => {
    jest.resetModules();

    document.body.innerHTML = `
      <main id="pageContentArea"></main>
      <section id="mainContentPage"><p>Welcome!</p></section>
      <h1 id="appBarHeadline"></h1>
      <header id="topAppBar"></header>
      <div id="songsGrid"></div>
    `;

    window.location.hash = '#projects';

    getDynamicElementMock = jest.fn((id) => document.getElementById(id));
    showOverlayMock = jest.fn();
    hideOverlayMock = jest.fn();
    closeDrawerMock = jest.fn();
    setCopyrightYearMock = jest.fn();
    initThemeMock = jest.fn();
    initNavigationDrawerMock = jest.fn();
    initRouterMock = jest.fn();
    loadPageContentMock = jest.fn();
    setupRouteLinkInterceptionMock = jest.fn();
    siteAnimationsInitMock = jest.fn();

    jest.unstable_mockModule('../assets/js/core/utils.js', () => ({
      __esModule: true,
      getDynamicElement: getDynamicElementMock,
      setCopyrightYear: setCopyrightYearMock,
      showPageLoadingOverlay: showOverlayMock,
      hidePageLoadingOverlay: hideOverlayMock
    }));

    jest.unstable_mockModule('../assets/js/core/theme.js', () => ({
      __esModule: true,
      initTheme: initThemeMock
    }));

    jest.unstable_mockModule('../assets/js/core/navigationDrawer.js', () => ({
      __esModule: true,
      initNavigationDrawer: initNavigationDrawerMock,
      closeDrawer: closeDrawerMock
    }));

    jest.unstable_mockModule('../assets/js/router/index.js', () => ({
      __esModule: true,
      initRouter: initRouterMock,
      loadPageContent: loadPageContentMock,
      setupRouteLinkInterception: setupRouteLinkInterceptionMock
    }));

    jest.unstable_mockModule('../assets/js/core/animations.js', () => ({
      __esModule: true,
      default: {
        init: siteAnimationsInitMock
      }
    }));

    ({ buildRouterOptions, initializeAppShell } = await import(appShellModulePath));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('buildRouterOptions wires callbacks and page handlers when provided', async () => {
    const fetchBlogPosts = jest.fn().mockResolvedValue(undefined);
    const fetchCommittersRanking = jest.fn().mockResolvedValue(undefined);
    const loadSongsHandler = jest.fn().mockResolvedValue(undefined);
    const initProjectsPageHandler = jest.fn().mockResolvedValue(undefined);
    const initResumePageHandler = jest.fn().mockResolvedValue(undefined);
    const initContactPageHandler = jest.fn().mockResolvedValue(undefined);

    const routerOptions = buildRouterOptions({
      showOverlay: showOverlayMock,
      hideOverlay: hideOverlayMock,
      closeDrawerHandler: closeDrawerMock,
      fetchBlogPosts,
      fetchCommittersRanking,
      loadSongsHandler,
      initProjectsPageHandler,
      initResumePageHandler,
      initContactPageHandler
    });

    expect(routerOptions.showOverlay).toBeInstanceOf(Function);
    expect(routerOptions.hideOverlay).toBeInstanceOf(Function);
    expect(routerOptions.closeDrawer).toBeInstanceOf(Function);
    expect(routerOptions.onHomeLoad).toBeInstanceOf(Function);
    expect(routerOptions.pageHandlers).toEqual(expect.objectContaining({
      songs: expect.any(Function),
      projects: expect.any(Function),
      resume: expect.any(Function),
      contact: expect.any(Function)
    }));

    await routerOptions.showOverlay();
    await routerOptions.hideOverlay();
    await routerOptions.closeDrawer();
    await routerOptions.onHomeLoad();
    await routerOptions.pageHandlers.songs();
    await routerOptions.pageHandlers.projects();
    await routerOptions.pageHandlers.resume();
    await routerOptions.pageHandlers.contact();

    expect(showOverlayMock).toHaveBeenCalledTimes(1);
    expect(hideOverlayMock).toHaveBeenCalledTimes(1);
    expect(closeDrawerMock).toHaveBeenCalledTimes(1);
    expect(fetchBlogPosts).toHaveBeenCalledTimes(1);
    expect(fetchCommittersRanking).toHaveBeenCalledTimes(1);
    expect(loadSongsHandler).toHaveBeenCalledTimes(1);
    expect(initProjectsPageHandler).toHaveBeenCalledTimes(1);
    expect(initResumePageHandler).toHaveBeenCalledTimes(1);
    expect(initContactPageHandler).toHaveBeenCalledTimes(1);
  });

  test('buildRouterOptions omits handlers when dependencies are missing', () => {
    const routerOptions = buildRouterOptions();
    expect(routerOptions.onHomeLoad).toBeUndefined();
    expect(routerOptions.pageHandlers).toBeUndefined();
  });

  test('initializeAppShell bootstraps the SPA shell with defaults', async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    initializeAppShell();

    expect(setCopyrightYearMock).toHaveBeenCalledTimes(1);
    expect(initThemeMock).toHaveBeenCalledTimes(1);
    expect(initNavigationDrawerMock).toHaveBeenCalledTimes(1);
    expect(siteAnimationsInitMock).toHaveBeenCalledTimes(1);

    expect(initRouterMock).toHaveBeenCalledTimes(1);
    const [contentArea, headlineElement, initialHtml, routerOptions] = initRouterMock.mock.calls[0];

    expect(contentArea).toBeInstanceOf(HTMLElement);
    expect(contentArea.id).toBe('pageContentArea');
    expect(headlineElement.id).toBe('appBarHeadline');
    expect(initialHtml).toContain('<section id="mainContentPage"');
    expect(routerOptions).toEqual(expect.objectContaining({
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
    }));

    routerOptions.showOverlay();
    routerOptions.hideOverlay();
    routerOptions.closeDrawer();

    expect(showOverlayMock).toHaveBeenCalledTimes(1);
    expect(hideOverlayMock).toHaveBeenCalledTimes(1);
    expect(closeDrawerMock).toHaveBeenCalledTimes(1);

    expect(loadPageContentMock).toHaveBeenCalledWith('#projects', false);
    expect(setupRouteLinkInterceptionMock).toHaveBeenCalledTimes(1);

    expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });
});
