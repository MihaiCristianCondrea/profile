const ROUTES_PATH = '../assets/js/router/routes.js';
const CONTENT_LOADER_PATH = '../assets/js/router/contentLoader.js';

const originalGlobalFetch = global.fetch;
const originalWindowFetch = typeof window !== 'undefined' ? window.fetch : undefined;

function loadRouterModules() {
  jest.resetModules();

  delete global.RouterRoutes;
  delete global.RouterContentLoader;
  delete global.registerRoute;

  if (typeof window !== 'undefined') {
    delete window.RouterRoutes;
    delete window.RouterContentLoader;
    delete window.registerRoute;
  }

  require(ROUTES_PATH);
  require(CONTENT_LOADER_PATH);

  return {
    RouterRoutes: global.RouterRoutes,
    RouterContentLoader: global.RouterContentLoader
  };
}

afterEach(() => {
  if (originalGlobalFetch === undefined) {
    delete global.fetch;
  } else {
    global.fetch = originalGlobalFetch;
  }

  if (typeof window !== 'undefined') {
    if (originalWindowFetch === undefined) {
      delete window.fetch;
    } else {
      window.fetch = originalWindowFetch;
    }
  }

  jest.restoreAllMocks();
});

describe('RouterRoutes registry', () => {
  let RouterRoutes;

  beforeEach(() => {
    ({ RouterRoutes } = loadRouterModules());
  });

  test('registers routes and exposes helper lookups', () => {
    const onLoad = () => 'ready';
    const registered = RouterRoutes.registerRoute({
      id: '  custom-route ',
      path: ' pages/custom.html ',
      title: 'Custom Route',
      onLoad
    });

    expect(registered).toEqual({
      id: 'custom-route',
      path: 'pages/custom.html',
      title: 'Custom Route',
      onLoad
    });

    expect(RouterRoutes.hasRoute('#custom-route')).toBe(true);

    const storedRoute = RouterRoutes.getRoute(' custom-route ');
    expect(storedRoute).toMatchObject({
      id: 'custom-route',
      path: 'pages/custom.html',
      title: 'Custom Route',
      onLoad
    });

    expect(registered).not.toBe(storedRoute);
    expect(RouterRoutes.normalizeRouteId('  #custom-route ')).toBe('custom-route');

    const allRoutes = RouterRoutes.getRoutes();
    expect(allRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'custom-route', path: 'pages/custom.html', title: 'Custom Route' })
      ])
    );
  });

  test('warns when overriding a registered route', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    RouterRoutes.registerRoute({ id: 'override-me', path: 'pages/one.html', title: 'First' });
    const updated = RouterRoutes.registerRoute({ id: 'override-me', path: 'pages/two.html', title: 'Updated' });

    expect(warnSpy).toHaveBeenCalledWith('RouterRoutes: Route "override-me" was overwritten.');
    expect(RouterRoutes.getRoute('override-me').path).toBe('pages/two.html');
    expect(updated.path).toBe('pages/two.html');
  });
});

describe('RouterContentLoader.fetchPageMarkup', () => {
  let RouterRoutes;
  let RouterContentLoader;

  beforeEach(() => {
    ({ RouterRoutes, RouterContentLoader } = loadRouterModules());
  });

  test('returns markup when fetch resolves successfully', async () => {
    RouterRoutes.registerRoute({ id: 'async-route', path: '/partials/async.html', title: 'Async Title' });

    const markup = '<div>Loaded!</div>';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(markup)
    });

    global.fetch = fetchMock;
    if (typeof window !== 'undefined') {
      window.fetch = fetchMock;
    }

    const result = await RouterContentLoader.fetchPageMarkup('async-route');

    expect(fetchMock).toHaveBeenCalledWith('/partials/async.html');
    expect(result).toEqual({
      status: 'success',
      title: 'Async Title',
      html: markup,
      onReady: null,
      sourceTitle: 'Async Title'
    });
  });

  test('returns error payload when fetch resolves without ok status', async () => {
    RouterRoutes.registerRoute({ id: 'broken-route', path: '/partials/broken.html', title: 'Broken Title' });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn()
    });

    global.fetch = fetchMock;
    if (typeof window !== 'undefined') {
      window.fetch = fetchMock;
    }

    const result = await RouterContentLoader.fetchPageMarkup('broken-route');

    expect(fetchMock).toHaveBeenCalledWith('/partials/broken.html');
    expect(result.status).toBe('error');
    expect(result.title).toBe('Error');
    expect(result.sourceTitle).toBe('Broken Title');
    expect(result.html).toContain('Failed to load page: Broken Title.');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toContain('HTTP error! status: 500');
  });

  test('returns error payload when fetch rejects with a network error', async () => {
    RouterRoutes.registerRoute({ id: 'network-route', path: '/partials/network.html', title: 'Network Title' });

    const networkError = new Error('Network down');
    const fetchMock = jest.fn().mockRejectedValue(networkError);

    global.fetch = fetchMock;
    if (typeof window !== 'undefined') {
      window.fetch = fetchMock;
    }

    const result = await RouterContentLoader.fetchPageMarkup('network-route');

    expect(fetchMock).toHaveBeenCalledWith('/partials/network.html');
    expect(result.status).toBe('error');
    expect(result.title).toBe('Error');
    expect(result.sourceTitle).toBe('Network Title');
    expect(result.html).toContain('Failed to load page: Network Title. Network down');
    expect(result.error).toBe(networkError);
  });

  test('returns initial home markup for the home route without a path', async () => {
    const initialHomeHTML = '<section>Home</section>';
    const fetchSpy = jest.fn();

    global.fetch = fetchSpy;
    if (typeof window !== 'undefined') {
      window.fetch = fetchSpy;
    }

    const result = await RouterContentLoader.fetchPageMarkup('home', { initialHomeHTML });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.status).toBe('success');
    expect(result.title).toBe("Mihai's Profile");
    expect(result.html).toBe(initialHomeHTML);
    expect(typeof result.onReady).toBe('function');
    expect(result.sourceTitle).toBe("Mihai's Profile");
  });

  test('returns empty content for non-home routes without a path', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    RouterRoutes.registerRoute({ id: 'no-path-route', title: 'No Path Title' });

    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;
    if (typeof window !== 'undefined') {
      window.fetch = fetchSpy;
    }

    const result = await RouterContentLoader.fetchPageMarkup('no-path-route');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'success',
      title: 'No Path Title',
      html: '',
      onReady: null,
      sourceTitle: 'No Path Title'
    });
    expect(warnSpy).toHaveBeenCalledWith(
      'RouterContentLoader: Route "no-path-route" does not define a path. Using empty content placeholder.'
    );
  });
});
