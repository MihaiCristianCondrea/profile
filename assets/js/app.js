// Global DOM element references needed by multiple modules or for initialization
let pageContentAreaEl, mainContentPageOriginalEl, appBarHeadlineEl, topAppBarEl;

let routeLinkHandlerRegistered = false;

document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    pageContentAreaEl = getDynamicElement('pageContentArea');
    mainContentPageOriginalEl = getDynamicElement('mainContentPage');
    appBarHeadlineEl = getDynamicElement('appBarHeadline');
    topAppBarEl = getDynamicElement('topAppBar');


    // --- Initialize Modules ---
    setCopyrightYear();
    initTheme();
    initNavigationDrawer();

    let initialHomeHTMLString = "<p>Error: Home content missing.</p>";
    if (mainContentPageOriginalEl) {
        initialHomeHTMLString = mainContentPageOriginalEl.outerHTML;
    } else {
        console.error("App.js: Initial home content (#mainContentPage) not found!");
    }
    initRouter(pageContentAreaEl, appBarHeadlineEl, initialHomeHTMLString);

    // --- Setup Event Listeners for SPA Navigation ---
    setupRouteLinkInterception();


    // --- Handle Initial Page Load & Browser History ---
    const initialPageIdFromHash = window.location.hash || '#home';
    loadPageContent(initialPageIdFromHash, false);

    window.addEventListener('popstate', (event) => {
        let pageId = '#home';
        if (event.state && event.state.page) {
            pageId = event.state.page;
        } else if (window.location.hash) {
            pageId = window.location.hash;
        }
        loadPageContent(pageId, false);
    });

    // --- App Bar Scroll Behavior ---
    if (topAppBarEl) {
        window.addEventListener('scroll', () => {
            const isScrolled = window.scrollY > 0;
            topAppBarEl.classList.toggle('scrolled', isScrolled);
        });
    }
});

function setupRouteLinkInterception() {
    if (routeLinkHandlerRegistered) {
        return;
    }

    const routesApi = typeof RouterRoutes !== 'undefined' ? RouterRoutes : null;
    const hasRoute = routesApi
        ? (typeof routesApi.hasRoute === 'function'
            ? routesApi.hasRoute.bind(routesApi)
            : (routeId) => {
                if (typeof routesApi.getRoute === 'function') {
                    return !!routesApi.getRoute(routeId);
                }
                const routeMap = routesApi.PAGE_ROUTES;
                return !!(routeMap && routeMap[routeId]);
            })
        : null;

    if (!hasRoute) {
        console.warn('App.js: RouterRoutes API unavailable. Route link interception skipped.');
        return;
    }

    document.addEventListener('click', (event) => {
        const eventTarget = event.target;
        if (!eventTarget || typeof eventTarget.closest !== 'function') {
            return;
        }

        const interactiveElement = eventTarget.closest('a[href^="#"], md-list-item[href^="#"]');
        if (!interactiveElement) {
            return;
        }

        if (interactiveElement.getAttribute('target') === '_blank') {
            return;
        }

        const rawHref = interactiveElement.getAttribute('href');
        if (!rawHref) {
            return;
        }

        const normalizedId = normalizePageId(rawHref);
        if (!normalizedId || !hasRoute(normalizedId)) {
            return;
        }

        event.preventDefault();
        loadPageContent(normalizedId);
    }, true);

    routeLinkHandlerRegistered = true;
}
