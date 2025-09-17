(function (global) {
    const DEFAULT_ROUTE_TITLE = "Mihai's Profile";
    const PAGE_ROUTES = Object.create(null);

    function normalizeRouteId(routeId) {
        if (typeof routeId !== 'string') {
            return '';
        }
        const trimmed = routeId.trim();
        if (!trimmed) {
            return '';
        }
        return trimmed.startsWith('#') ? trimmed.substring(1) : trimmed;
    }

    function sanitizeRouteConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new TypeError('RouterRoutes: Route configuration must be an object.');
        }

        const normalizedId = normalizeRouteId(config.id);
        if (!normalizedId) {
            throw new Error('RouterRoutes: Route configuration requires a non-empty "id".');
        }

        const sanitized = {
            id: normalizedId,
            path: typeof config.path === 'string' && config.path.trim() ? config.path.trim() : null,
            title: typeof config.title === 'string' && config.title.trim() ? config.title.trim() : DEFAULT_ROUTE_TITLE,
            onLoad: typeof config.onLoad === 'function' ? config.onLoad : null
        };

        return sanitized;
    }

    function registerRoute(config) {
        const sanitized = sanitizeRouteConfig(config);
        const isUpdate = Object.prototype.hasOwnProperty.call(PAGE_ROUTES, sanitized.id);
        PAGE_ROUTES[sanitized.id] = sanitized;
        if (isUpdate) {
            console.warn(`RouterRoutes: Route "${sanitized.id}" was overwritten.`);
        }
        return { ...sanitized };
    }

    function getRoute(routeId) {
        const normalizedId = normalizeRouteId(routeId);
        if (!normalizedId) {
            return null;
        }
        return PAGE_ROUTES[normalizedId] || null;
    }

    function hasRoute(routeId) {
        return !!getRoute(routeId);
    }

    function getRoutes() {
        return Object.values(PAGE_ROUTES).map(route => ({ ...route }));
    }

    function runHomeOnLoad() {
        if (
            typeof fetchBlogPosts === 'function' &&
            typeof document !== 'undefined' &&
            document.getElementById('newsGrid')
        ) {
            fetchBlogPosts();
        }
    }

    function runSongsOnLoad() {
        if (
            typeof loadSongs === 'function' &&
            typeof document !== 'undefined' &&
            document.getElementById('songsGrid')
        ) {
            loadSongs();
        }
    }

    function runProjectsOnLoad() {
        if (typeof initProjectsPage === 'function') {
            initProjectsPage();
        }
    }

    function runResumeOnLoad() {
        if (typeof initResumePage === 'function') {
            initResumePage();
        }
    }

    const defaultRoutes = [
        { id: 'home', title: DEFAULT_ROUTE_TITLE, onLoad: runHomeOnLoad },
        { id: 'privacy-policy', path: 'pages/drawer/more/privacy-policy.html', title: 'Privacy Policy' },
        { id: 'songs', path: 'pages/drawer/songs.html', title: 'My Music', onLoad: runSongsOnLoad },
        { id: 'projects', path: 'pages/drawer/projects.html', title: 'Projects', onLoad: runProjectsOnLoad },
        { id: 'contact', path: 'pages/drawer/contact.html', title: 'Contact' },
        { id: 'about-me', path: 'pages/drawer/about-me.html', title: 'About Me' },
        { id: 'ads-help-center', path: 'pages/drawer/more/apps/ads-help-center.html', title: 'Ads Help Center' },
        { id: 'legal-notices', path: 'pages/drawer/more/apps/legal-notices.html', title: 'Legal Notices' },
        { id: 'code-of-conduct', path: 'pages/drawer/more/code-of-conduct.html', title: 'Code of Conduct' },
        {
            id: 'privacy-policy-end-user-software',
            path: 'pages/drawer/more/apps/privacy-policy-apps.html',
            title: 'Privacy Policy – End-User Software'
        },
        {
            id: 'terms-of-service-end-user-software',
            path: 'pages/drawer/more/apps/terms-of-service-apps.html',
            title: 'Terms of Service – End-User Software'
        },
        { id: 'resume', path: 'pages/resume/resume.html', title: "Mihai's Resume", onLoad: runResumeOnLoad }
    ];

    defaultRoutes.forEach(registerRoute);

    const routesApi = {
        registerRoute,
        getRoute,
        hasRoute,
        getRoutes,
        normalizeRouteId,
        PAGE_ROUTES
    };

    global.RouterRoutes = routesApi;
    if (typeof global.registerRoute === 'undefined') {
        global.registerRoute = registerRoute;
    }
})(typeof window !== 'undefined' ? window : globalThis);
