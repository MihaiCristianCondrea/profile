const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');

const routerScript = fs.readFileSync(path.resolve(__dirname, '../assets/js/router.js'), 'utf8');

const DEFAULT_HTML = `
<!DOCTYPE html>
<html>
  <body>
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
  </body>
</html>
`;

function createRouterWindow(html = DEFAULT_HTML) {
  const dom = new JSDOM(html, { url: 'https://example.com/#home', runScripts: 'dangerously' });
  const { window } = dom;
  window.scrollTo = jest.fn();
  const context = dom.getInternalVMContext();
  vm.runInContext(
    `${routerScript}\nwindow.callCallback = callCallback;\nwindow.normalizePageId = normalizePageId;\nwindow.initRouter = initRouter;\nwindow.loadPageContent = loadPageContent;\nwindow.updateActiveNavLink = updateActiveNavLink;\nwindow.__getRouterRuntime = () => routerRuntime;`,
    context
  );
  vm.runInContext(
    'window.__applyTimerMocks = () => { setTimeout = globalThis.setTimeout; clearTimeout = globalThis.clearTimeout; };',
    context
  );
  vm.runInContext(
    'window.__wrapSetTimeout = handler => { const original = setTimeout; setTimeout = function(cb, delay, ...args) { handler(delay); return original.call(this, cb, delay, ...args); }; window.setTimeout = setTimeout; };',
    context
  );
  return window;
}

describe('router helpers', () => {
  test('callCallback handles falsy callbacks and errors gracefully', () => {
    const window = createRouterWindow();
    const { callCallback } = window;

    expect(callCallback(null, 'noop')).toBe(false);

    const callback = jest.fn();
    expect(callCallback(callback, 'callback', 'arg1', 'arg2')).toBe(true);
    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');

    const error = new Error('boom');
    const failing = jest.fn(() => { throw error; });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(callCallback(failing, 'failing callback', 'id')).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith('Router: Error running failing callback:', error);

    errorSpy.mockRestore();
  });

  test('normalizePageId standardizes inputs', () => {
    const window = createRouterWindow();
    const { normalizePageId } = window;

    expect(normalizePageId('#about')).toBe('about');
    expect(normalizePageId('index.html')).toBe('home');
    expect(normalizePageId('')).toBe('home');
    expect(normalizePageId(null)).toBe('home');
    expect(normalizePageId('blog')).toBe('blog');
  });

  test('initRouter normalizes runtime options and page handlers', () => {
    const window = createRouterWindow();
    const { document, initRouter } = window;

    const showOverlay = jest.fn();
    const hideOverlay = jest.fn();
    const closeDrawer = jest.fn();
    const onHomeLoad = jest.fn();
    const projectsHandler = jest.fn();

    initRouter(
      document.getElementById('pageContent'),
      document.getElementById('appBarHeadline'),
      '<div>Home</div>',
      {
        showOverlay,
        hideOverlay: 'not a function',
        closeDrawer,
        onHomeLoad,
        pageHandlers: {
          '#projects': projectsHandler,
          invalid: 'nope'
        }
      }
    );

    const runtime = window.__getRouterRuntime();
    expect(runtime.showOverlay).toBe(showOverlay);
    expect(typeof runtime.hideOverlay).toBe('function');
    expect(runtime.hideOverlay).not.toBe('not a function');
    expect(runtime.closeDrawer).toBe(closeDrawer);
    expect(runtime.onHomeLoad).toBe(onHomeLoad);
    expect(runtime.pageHandlers.projects).toBe(projectsHandler);
    expect(Object.keys(runtime.pageHandlers)).toEqual(['projects']);
  });
});

describe('loadPageContent behavior', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('loads a page successfully and updates navigation', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    const window = createRouterWindow();
    const { document, initRouter, loadPageContent } = window;
    window.setTimeout = setTimeout;
    window.clearTimeout = clearTimeout;
    window.__applyTimerMocks();
    jest.spyOn(window.Date, 'now').mockReturnValue(0);

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
    const readyHook = jest.fn();

    window.RouterRoutes = {
      getRoute: jest.fn().mockReturnValue({ id: 'projects', title: 'Projects' })
    };

    const fetchPageMarkup = jest.fn().mockResolvedValue({
      status: 'success',
      title: 'Projects',
      html: '<div class="page-section active">Projects</div>',
      onReady: readyHook
    });

    window.RouterContentLoader = {
      fetchPageMarkup,
      DEFAULT_PAGE_TITLE: "Mihai's Profile"
    };

    const updateTitle = jest.fn();
    const pushState = jest.fn();
    window.RouterHistory = {
      updateTitle,
      pushState
    };

    const fadeOut = jest.fn().mockResolvedValue();
    const fadeIn = jest.fn().mockResolvedValue();
    window.RouterAnimation = { fadeOut, fadeIn };

    initRouter(pageContentArea, appBarHeadline, '<div>Home</div>', {
      showOverlay,
      hideOverlay,
      closeDrawer,
      onHomeLoad,
      pageHandlers: {
        projects: projectsHandler
      }
    });

    const loadPromise = loadPageContent('#projects');

    expect(showOverlay).toHaveBeenCalledTimes(1);
    expect(closeDrawer).toHaveBeenCalledTimes(1);
    expect(hideOverlay).not.toHaveBeenCalled();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    await jest.advanceTimersByTimeAsync(599);
    expect(hideOverlay).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    await loadPromise;

    expect(hideOverlay).toHaveBeenCalledTimes(1);
    expect(fetchPageMarkup).toHaveBeenCalledWith('projects', { initialHomeHTML: '<div>Home</div>' });
    expect(fadeOut).toHaveBeenCalledWith(pageContentArea);
    expect(updateTitle).toHaveBeenCalledWith(appBarHeadline, 'Projects');
    expect(pushState).toHaveBeenCalledWith('projects', 'Projects', 'projects', true);

    expect(projectsHandler).toHaveBeenCalledWith('projects');
    expect(onHomeLoad).not.toHaveBeenCalled();
    expect(readyHook).not.toHaveBeenCalled();

    expect(pageContentArea.innerHTML).toContain('Projects');
    expect(navHome.classList.contains('nav-item-active')).toBe(false);
    expect(navHome.hasAttribute('active')).toBe(false);
    expect(navHome.active).toBe(false);

    expect(navProjects.classList.contains('nav-item-active')).toBe(true);
    expect(navProjects.getAttribute('aria-current')).toBe('page');
    expect(navProjects.getAttribute('aria-selected')).toBe('true');
    expect(navProjects.active).toBe(true);
    expect(toggleButton.click).toHaveBeenCalledTimes(1);

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(fadeIn).toHaveBeenCalledWith(pageContentArea);
  });

  test('handles unknown routes with not-found messaging', async () => {
    const window = createRouterWindow();
    const { document, initRouter, loadPageContent } = window;

    const pageContentArea = document.getElementById('pageContent');
    const appBarHeadline = document.getElementById('appBarHeadline');

    const showOverlay = jest.fn();
    const hideOverlay = jest.fn();
    const closeDrawer = jest.fn();

    window.RouterRoutes = {
      getRoute: jest.fn().mockReturnValue(null)
    };
    window.RouterContentLoader = {
      fetchPageMarkup: jest.fn()
    };
    const updateTitle = jest.fn();
    window.RouterHistory = { updateTitle };
    window.RouterAnimation = {
      fadeOut: jest.fn(),
      fadeIn: jest.fn()
    };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    initRouter(pageContentArea, appBarHeadline, '<div>Home</div>', {
      showOverlay,
      hideOverlay,
      closeDrawer
    });

    await loadPageContent('missing-page');

    expect(showOverlay).toHaveBeenCalledTimes(1);
    expect(closeDrawer).toHaveBeenCalledTimes(1);
    expect(window.RouterContentLoader.fetchPageMarkup).not.toHaveBeenCalled();

    expect(pageContentArea.innerHTML).toContain('Page not found: missing-page');
    expect(updateTitle).toHaveBeenCalledWith(appBarHeadline, 'Not Found');
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(hideOverlay).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('Router: Unknown page:', 'missing-page');

    warnSpy.mockRestore();
  });

  test('surfaces loader errors and updates fallback UI', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    const window = createRouterWindow();
    const { document, initRouter, loadPageContent } = window;
    window.setTimeout = setTimeout;
    window.clearTimeout = clearTimeout;
    window.__applyTimerMocks();
    jest.spyOn(window.Date, 'now').mockReturnValue(0);

    const pageContentArea = document.getElementById('pageContent');
    const appBarHeadline = document.getElementById('appBarHeadline');
    const navBlog = document.getElementById('nav-blog');
    navBlog.active = false;

    const showOverlay = jest.fn();
    const hideOverlay = jest.fn();
    const closeDrawer = jest.fn();

    window.RouterRoutes = {
      getRoute: jest.fn().mockReturnValue({ id: 'blog', title: 'Blog' })
    };

    const loaderError = new Error('Network issue');
    const fetchPageMarkup = jest.fn().mockRejectedValue(loaderError);
    window.RouterContentLoader = {
      fetchPageMarkup,
      DEFAULT_PAGE_TITLE: 'Profile'
    };

    const updateTitle = jest.fn();
    const pushState = jest.fn();
    window.RouterHistory = { updateTitle, pushState };

    const fadeOut = jest.fn().mockResolvedValue();
    const fadeIn = jest.fn().mockResolvedValue();
    window.RouterAnimation = { fadeOut, fadeIn };

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    initRouter(pageContentArea, appBarHeadline, '<div>Home</div>', {
      showOverlay,
      hideOverlay,
      closeDrawer
    });

    const loadPromise = loadPageContent('blog');

    expect(showOverlay).toHaveBeenCalledTimes(1);
    expect(closeDrawer).toHaveBeenCalledTimes(1);
    expect(hideOverlay).not.toHaveBeenCalled();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    await jest.advanceTimersByTimeAsync(600);
    await loadPromise;

    expect(fetchPageMarkup).toHaveBeenCalledWith('blog', { initialHomeHTML: '<div>Home</div>' });
    expect(fadeOut).toHaveBeenCalledWith(pageContentArea);
    expect(pageContentArea.innerHTML).toContain('Failed to load page. Network issue');
    expect(updateTitle).toHaveBeenCalledWith(appBarHeadline, 'Error');
    expect(pushState).toHaveBeenCalledWith('blog', 'Error', 'blog', true);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    expect(navBlog.classList.contains('nav-item-active')).toBe(true);
    expect(navBlog.getAttribute('aria-current')).toBe('page');
    expect(navBlog.getAttribute('aria-selected')).toBe('true');
    expect(navBlog.active).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith('Error loading Error:', loaderError);
    expect(hideOverlay).toHaveBeenCalledTimes(1);
    expect(fadeIn).toHaveBeenCalledWith(pageContentArea);

    errorSpy.mockRestore();
  });
});
