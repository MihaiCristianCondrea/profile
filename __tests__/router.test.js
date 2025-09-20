import { jest } from '@jest/globals';

const modulePath = '../assets/js/router/index.js';

describe('router/index', () => {
  let initRouter;
  let loadPageContent;
  let normalizePageId;
  let callCallback;
  let getRouteMock;
  let fetchPageMarkupMock;
  let updateTitleMock;
  let pushStateMock;
  let fadeOutMock;
  let fadeInMock;
  let updateMetadataMock;

  beforeEach(async () => {
    jest.resetModules();

    document.body.innerHTML = `
      <div id="navDrawer">
        <md-list-item id="navHome" href="#home"></md-list-item>
        <md-list-item id="navProjects" href="#projects"></md-list-item>
      </div>
      <div id="pageContent"></div>
      <h1 id="appBarHeadline"></h1>
    `;
    window.scrollTo = jest.fn();

    const pageContentArea = document.getElementById('pageContent');
    pageContentArea.getBoundingClientRect = () => ({ height: 120 });

    getRouteMock = jest.fn();
    fetchPageMarkupMock = jest.fn();
    updateTitleMock = jest.fn();
    pushStateMock = jest.fn();
    fadeOutMock = jest.fn().mockResolvedValue();
    fadeInMock = jest.fn().mockResolvedValue();
    updateMetadataMock = jest.fn();

    jest.unstable_mockModule('../assets/js/router/routes.js', () => ({
      __esModule: true,
      default: {
        getRoute: getRouteMock,
        hasRoute: jest.fn()
      },
      getRoute: getRouteMock
    }));

    jest.unstable_mockModule('../assets/js/router/contentLoader.js', () => ({
      __esModule: true,
      fetchPageMarkup: fetchPageMarkupMock,
      DEFAULT_PAGE_TITLE: "Mihai's Profile"
    }));

    jest.unstable_mockModule('../assets/js/router/history.js', () => ({
      __esModule: true,
      updateTitle: updateTitleMock,
      pushState: pushStateMock
    }));

    jest.unstable_mockModule('../assets/js/router/animation.js', () => ({
      __esModule: true,
      fadeOut: fadeOutMock,
      fadeIn: fadeInMock
    }));

    jest.unstable_mockModule('../assets/js/core/metadata.js', () => ({
      __esModule: true,
      updateForRoute: updateMetadataMock
    }));

    ({ initRouter, loadPageContent, normalizePageId, callCallback } = await import(modulePath));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('normalizePageId standardizes inputs', () => {
    expect(normalizePageId('#about')).toBe('about');
    expect(normalizePageId('index.html')).toBe('home');
    expect(normalizePageId('')).toBe('home');
    expect(normalizePageId(null)).toBe('home');
    expect(normalizePageId('projects')).toBe('projects');
  });

  test('callCallback returns false for non-functions and handles errors gracefully', () => {
    expect(callCallback(null, 'noop')).toBe(false);

    const callback = jest.fn();
    expect(callCallback(callback, 'callback', 'arg1')).toBe(true);
    expect(callback).toHaveBeenCalledWith('arg1');

    const error = new Error('boom');
    const failing = jest.fn(() => { throw error; });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(callCallback(failing, 'failing callback', 'id')).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Router: Error running failing callback:', error);
    consoleSpy.mockRestore();
  });

  test('initRouter registers callbacks and loadPageContent renders routes', async () => {
    const pageContentArea = document.getElementById('pageContent');
    const appBarHeadline = document.getElementById('appBarHeadline');
    const showOverlay = jest.fn();
    const hideOverlay = jest.fn();
    const closeDrawer = jest.fn();
    const onHomeLoad = jest.fn();
    const projectsHandler = jest.fn();

    getRouteMock.mockImplementation((id) => {
      if (id === 'projects') {
        return { id: 'projects', title: 'Projects' };
      }
      if (id === 'home') {
        return { id: 'home', title: 'Home' };
      }
      return null;
    });

    fetchPageMarkupMock.mockResolvedValue({
      status: 'success',
      title: 'Projects',
      html: '<div class="page-section active">Projects</div>',
      onReady: jest.fn()
    });

    initRouter(pageContentArea, appBarHeadline, '<div>Home</div>', {
      showOverlay,
      hideOverlay,
      closeDrawer,
      onHomeLoad,
      pageHandlers: {
        '#projects': projectsHandler,
        invalid: 'nope'
      }
    });

    await loadPageContent('#projects');

    expect(showOverlay).toHaveBeenCalled();
    expect(closeDrawer).toHaveBeenCalled();
    expect(fetchPageMarkupMock).toHaveBeenCalledWith('projects', expect.objectContaining({ initialHomeHTML: '<div>Home</div>' }));
    expect(pageContentArea.innerHTML).toContain('Projects');
    expect(projectsHandler).toHaveBeenCalledWith('projects');
    expect(updateMetadataMock).toHaveBeenCalledWith({ id: 'projects', title: 'Projects' }, expect.objectContaining({
      pageId: 'projects',
      pageTitle: 'Projects'
    }));
    expect(updateTitleMock).toHaveBeenCalledWith(appBarHeadline, 'Projects');
    expect(pushStateMock).toHaveBeenCalledWith('projects', 'Projects', 'projects', true);
    expect(fadeOutMock).toHaveBeenCalledWith(pageContentArea);
    expect(fadeInMock).toHaveBeenCalledWith(pageContentArea);

    const activeNav = document.getElementById('navProjects');
    expect(activeNav.classList.contains('nav-item-active')).toBe(true);
    expect(activeNav.getAttribute('aria-current')).toBe('page');

    await loadPageContent('#home');
    expect(onHomeLoad).toHaveBeenCalled();
  });

  test('loadPageContent handles unknown routes gracefully', async () => {
    const pageContentArea = document.getElementById('pageContent');
    const appBarHeadline = document.getElementById('appBarHeadline');

    getRouteMock.mockReturnValue(null);

    initRouter(pageContentArea, appBarHeadline, '<div>Home</div>');

    await loadPageContent('#missing');

    expect(pageContentArea.innerHTML).toContain('Page not found');
    expect(updateMetadataMock).toHaveBeenCalledWith(null, expect.objectContaining({
      pageId: 'missing',
      pageTitle: 'Not Found',
      loadStatus: 'not-found'
    }));
    expect(updateTitleMock).toHaveBeenCalledWith(appBarHeadline, 'Not Found');
    expect(pushStateMock).not.toHaveBeenCalled();
  });
});
