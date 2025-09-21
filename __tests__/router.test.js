const moduleRegistryPath = require.resolve('../assets/js/modules/moduleRegistry.js');
const routerModulePath = require.resolve('../assets/js/modules/router/index.js');

function setupRouterTestEnvironment() {
  jest.resetModules();
  document.body.innerHTML = `
    <div id="navDrawer">
      <md-list-item id="nav-home" href="#home"></md-list-item>
      <button id="nestedToggle" aria-controls="nestedRoutes"></button>
      <div class="nested-list" id="nestedRoutes">
        <md-list-item id="nav-projects" href="#projects"></md-list-item>
      </div>
      <md-list-item id="nav-blog" href="#blog"></md-list-item>
    </div>
    <div id="pageContent"></div>
    <h1 id="appBarHeadline"></h1>
  `;

  const ModuleRegistry = require(moduleRegistryPath);
  ModuleRegistry.reset();

  const metadataUpdateMock = jest.fn();
  const fadeOutMock = jest.fn().mockResolvedValue(undefined);
  const fadeInMock = jest.fn().mockResolvedValue(undefined);
  const updateTitleMock = jest.fn();
  const pushStateMock = jest.fn();
  const onReadyMock = jest.fn();
  const fetchPageMarkupMock = jest.fn().mockResolvedValue({
    status: 'success',
    title: 'Projects',
    html: '<div class="page-section active">Projects</div>',
    onReady: onReadyMock
  });

  const routesMock = {
    getRoute: jest.fn().mockReturnValue({ id: 'projects', title: 'Projects' }),
    hasRoute: jest.fn(() => true)
  };

  ModuleRegistry.register('router.routes', routesMock);
  ModuleRegistry.register('router.animation', {
    fadeOut: fadeOutMock,
    fadeIn: fadeInMock
  });
  ModuleRegistry.register('router.contentLoader', {
    fetchPageMarkup: fetchPageMarkupMock,
    DEFAULT_PAGE_TITLE: "Mihai's Profile"
  });
  ModuleRegistry.register('router.history', {
    updateTitle: updateTitleMock,
    pushState: pushStateMock
  });
  ModuleRegistry.register('metadata', {
    updateForRoute: metadataUpdateMock
  });

  const RouterModule = require(routerModulePath);
  RouterModule.__testInternals.setMinimumLoadDurationForTests(0);

  return {
    ModuleRegistry,
    RouterModule,
    routesMock,
    metadataUpdateMock,
    fadeOutMock,
    fadeInMock,
    updateTitleMock,
    pushStateMock,
    fetchPageMarkupMock,
    onReadyMock
  };
}

describe('router module helpers', () => {
  test('callCallback handles falsy callbacks and errors gracefully', () => {
    const { RouterModule } = setupRouterTestEnvironment();
    const { callCallback } = RouterModule.__testInternals;

    expect(callCallback(null, 'noop')).toBe(false);

    const callback = jest.fn();
    expect(callCallback(callback, 'callback', 'arg1', 'arg2')).toBe(true);
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');

    const error = new Error('boom');
    const failing = jest.fn(() => {
      throw error;
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(callCallback(failing, 'failing callback', 'id')).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith('Router: Error running failing callback:', error);

    errorSpy.mockRestore();
  });

  test('normalizePageId standardizes inputs', () => {
    const { RouterModule } = setupRouterTestEnvironment();

    expect(RouterModule.normalizePageId('#about')).toBe('about');
    expect(RouterModule.normalizePageId('index.html')).toBe('home');
    expect(RouterModule.normalizePageId('')).toBe('home');
    expect(RouterModule.normalizePageId(null)).toBe('home');
    expect(RouterModule.normalizePageId('blog')).toBe('blog');
  });

  test('initRouter normalizes runtime options and page handlers', () => {
    const { RouterModule } = setupRouterTestEnvironment();

    const contentArea = document.getElementById('pageContent');
    const headline = document.getElementById('appBarHeadline');

    const showOverlay = jest.fn();
    const hideOverlay = 'not a function';
    const closeDrawer = jest.fn();
    const onHomeLoad = jest.fn();
    const projectsHandler = jest.fn();

    RouterModule.initRouter(contentArea, headline, '<div>Home</div>', {
      showOverlay,
      hideOverlay,
      closeDrawer,
      onHomeLoad,
      pageHandlers: {
        '#projects': projectsHandler,
        invalid: 'nope'
      }
    });

    const runtime = RouterModule.__testInternals.routerRuntime;
    expect(runtime.showOverlay).toBe(showOverlay);
    expect(typeof runtime.hideOverlay).toBe('function');
    expect(runtime.hideOverlay).not.toBe(hideOverlay);
    expect(runtime.closeDrawer).toBe(closeDrawer);
    expect(runtime.onHomeLoad).toBe(onHomeLoad);
    expect(runtime.pageHandlers.projects).toBe(projectsHandler);
    expect(Object.keys(runtime.pageHandlers)).toEqual(['projects']);
  });
});

describe('router loadPageContent behavior', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('loads a page successfully and updates navigation', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    const {
      RouterModule,
      routesMock,
      metadataUpdateMock,
      fadeOutMock,
      fadeInMock,
      updateTitleMock,
      pushStateMock,
      fetchPageMarkupMock,
      onReadyMock
    } = setupRouterTestEnvironment();

    window.scrollTo = jest.fn();

    const pageContentArea = document.getElementById('pageContent');
    const appBarHeadline = document.getElementById('appBarHeadline');
    const navHome = document.getElementById('nav-home');
    const navProjects = document.getElementById('nav-projects');
    const toggleButton = document.getElementById('nestedToggle');
    toggleButton.click = jest.fn();

    navHome.classList.add('nav-item-active');
    navHome.setAttribute('active', '');
    navHome.active = true;
    navProjects.active = false;

    const showOverlay = jest.fn();
    const hideOverlay = jest.fn();
    const closeDrawer = jest.fn();
    const onHomeLoad = jest.fn();
    const projectsHandler = jest.fn();

    RouterModule.initRouter(pageContentArea, appBarHeadline, '<div>Home</div>', {
      showOverlay,
      hideOverlay,
      closeDrawer,
      onHomeLoad,
      pageHandlers: {
        projects: projectsHandler
      }
    });

    const loadPromise = RouterModule.loadPageContent('#projects');

    expect(showOverlay).toHaveBeenCalledTimes(1);
    expect(closeDrawer).toHaveBeenCalledTimes(1);
    expect(routesMock.getRoute).toHaveBeenCalledWith('projects');
    expect(fadeOutMock).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    jest.runAllTimers();
    await loadPromise;

    expect(fetchPageMarkupMock).toHaveBeenCalledWith('projects', {
      initialHomeHTML: '<div>Home</div>'
    });
    expect(projectsHandler).toHaveBeenCalledTimes(1);
    expect(onReadyMock).toHaveBeenCalledTimes(1);
    expect(fadeInMock).toHaveBeenCalledTimes(1);
    expect(metadataUpdateMock).toHaveBeenCalledWith(
      { id: 'projects', title: 'Projects' },
      expect.any(Object)
    );
    expect(updateTitleMock).toHaveBeenCalledWith(appBarHeadline, 'Projects');
    expect(pushStateMock).toHaveBeenCalledWith('projects', 'Projects', 'projects', true);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(hideOverlay).toHaveBeenCalledTimes(1);

    const runtime = RouterModule.__testInternals.routerRuntime;
    expect(runtime.pageHandlers.projects).toBe(projectsHandler);

    jest.runOnlyPendingTimers();
  });
});
