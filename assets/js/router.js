let pageContentArea, appBarHeadline;
let initialHomepageHTML = '';
const MINIMUM_LOAD_DURATION = 600;

/**
 * Initializes the router with necessary DOM elements.
 * Must be called after DOM is ready.
 * @param {HTMLElement} contentAreaEl - The main content area element.
 * @param {HTMLElement} appBarHeadlineEl - The app bar headline element.
 * @param {string} homeHTML - The initial HTML string for the home page.
 */
function initRouter(contentAreaEl, appBarHeadlineEl, homeHTML) {
    pageContentArea = contentAreaEl;
    appBarHeadline = appBarHeadlineEl;
    initialHomepageHTML = homeHTML;
}

function normalizePageId(pageId) {
    if (typeof pageId !== 'string') {
        return 'home';
    }
    let normalizedId = pageId;
    if (normalizedId.startsWith('#')) {
        normalizedId = normalizedId.substring(1);
    }
    if (normalizedId === '' || normalizedId === 'index.html') {
        normalizedId = 'home';
    }
    return normalizedId;
}

function createGenericErrorHtml(message) {
    const finalMessage = message || 'Failed to load page. An unknown error occurred.';
    return `<div class="page-section active"><p class="error-message text-red-500">${finalMessage}</p></div>`;
}

function getRegisteredRoute(pageId) {
    if (typeof RouterRoutes === 'undefined' || !RouterRoutes) {
        return null;
    }
    if (typeof RouterRoutes.getRoute === 'function') {
        return RouterRoutes.getRoute(pageId);
    }
    const routesMap = RouterRoutes.PAGE_ROUTES;
    if (routesMap && typeof routesMap === 'object' && pageId in routesMap) {
        return routesMap[pageId];
    }
    return null;
}

function createNotFoundHtml(pageId) {
    const safeId = pageId || 'unknown';
    return `<div class="page-section active"><p class="error-message text-red-500">Page not found: ${safeId}</p></div>`;
}

/**
 * Loads content for a given pageId into the main content area.
 * @param {string} pageId - The ID of the page to load (e.g., 'home', 'privacy-policy').
 * @param {boolean} [updateHistory=true] - Whether to update browser history.
 */
async function loadPageContent(pageId, updateHistory = true) {
    const loadStart = Date.now();
    if (typeof showPageLoadingOverlay === "function") showPageLoadingOverlay();
    if (typeof closeDrawer === 'function') closeDrawer();

    if (!pageContentArea) {
        console.error("Router: pageContentArea element not set. Call initRouter first.");
        if (typeof hidePageLoadingOverlay === 'function') hidePageLoadingOverlay();
        return;
    }

    const normalizedPageId = normalizePageId(pageId);
    const newUrlFragment = normalizedPageId;

    const animationHelper = typeof RouterAnimation !== 'undefined' ? RouterAnimation : null;
    const contentLoader = typeof RouterContentLoader !== 'undefined' ? RouterContentLoader : null;
    const historyHelper = typeof RouterHistory !== 'undefined' ? RouterHistory : null;

    const routeConfig = getRegisteredRoute(normalizedPageId);

    if (typeof RouterRoutes !== 'undefined' && RouterRoutes && !routeConfig) {
        console.warn('Router: Unknown page:', normalizedPageId);
        pageContentArea.innerHTML = createNotFoundHtml(normalizedPageId);

        const notFoundTitle = 'Not Found';
        if (historyHelper && typeof historyHelper.updateTitle === 'function') {
            historyHelper.updateTitle(appBarHeadline, notFoundTitle);
        } else {
            if (appBarHeadline) appBarHeadline.textContent = notFoundTitle;
            document.title = `${notFoundTitle} - Mihai's Profile`;
        }

        if (typeof hidePageLoadingOverlay === 'function') hidePageLoadingOverlay();
        return;
    }

    if (animationHelper && typeof animationHelper.fadeOut === 'function') {
        await animationHelper.fadeOut(pageContentArea);
    } else if (pageContentArea.style) {
        pageContentArea.style.opacity = 0;
    }

    let loadResult;
    if (contentLoader && typeof contentLoader.fetchPageMarkup === 'function') {
        try {
            loadResult = await contentLoader.fetchPageMarkup(normalizedPageId, {
                initialHomeHTML: initialHomepageHTML
            });
        } catch (error) {
            loadResult = {
                status: 'error',
                title: 'Error',
                html: createGenericErrorHtml(`Failed to load page. ${error.message}`),
                error
            };
        }
    } else {
        loadResult = {
            status: 'error',
            title: 'Error',
            html: createGenericErrorHtml('Failed to load page. Router content loader is unavailable.')
        };
    }

    if (loadResult.status === 'not-found') {
        console.warn('Router: Unknown page:', normalizedPageId);
    }

    if (loadResult.status === 'error' && loadResult.error) {
        const contextTitle = loadResult.sourceTitle || loadResult.title || normalizedPageId;
        console.error(`Error loading ${contextTitle}:`, loadResult.error);
    }

    pageContentArea.innerHTML = typeof loadResult.html === 'string' ? loadResult.html : createGenericErrorHtml();

    if (typeof loadResult.onReady === 'function') {
        try {
            loadResult.onReady();
        } catch (error) {
            console.error('Router: Error running page ready hook:', error);
        }
    }

    const pageTitle = loadResult.title || (routeConfig && routeConfig.title) || (contentLoader && contentLoader.DEFAULT_PAGE_TITLE) || "Mihai's Profile";

    if (historyHelper && typeof historyHelper.updateTitle === 'function') {
        historyHelper.updateTitle(appBarHeadline, pageTitle);
    } else {
        if (appBarHeadline) appBarHeadline.textContent = pageTitle;
        document.title = `${pageTitle} - Mihai's Profile`;
    }

    if (historyHelper && typeof historyHelper.pushState === 'function') {
        historyHelper.pushState(normalizedPageId, pageTitle, newUrlFragment, updateHistory);
    } else if (updateHistory && window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({ page: normalizedPageId }, pageTitle, `#${newUrlFragment}`);
    }

    window.scrollTo(0, 0);
    updateActiveNavLink(newUrlFragment);

    if (animationHelper && typeof animationHelper.fadeIn === 'function') {
        await animationHelper.fadeIn(pageContentArea);
    } else if (pageContentArea.style) {
        pageContentArea.style.opacity = 1;
    }

    const elapsed = Date.now() - loadStart;
    await new Promise(r => setTimeout(r, Math.max(0, MINIMUM_LOAD_DURATION - elapsed)));
    if (typeof hidePageLoadingOverlay === 'function') hidePageLoadingOverlay();
}

/**
 * Updates the active state of navigation links in the drawer.
 * @param {string} currentPageId - The ID of the currently active page.
 */
function updateActiveNavLink(currentPageId) {
    const normalizedCurrentPage = normalizePageId(currentPageId);

    document.querySelectorAll('#navDrawer md-list-item[href]').forEach(item => {
        item.classList.remove('nav-item-active');
        if (item.hasAttribute('active')) {
            item.removeAttribute('active');
        }
         if (typeof item.active === 'boolean' && item.active) {
            item.active = false;
        }


        let itemHref = item.getAttribute('href');
        if (itemHref) {
            const normalizedHref = normalizePageId(itemHref);
            if (normalizedHref === normalizedCurrentPage) {
                item.classList.add('nav-item-active');
                 if (typeof item.active === 'boolean') item.active = true;

                const nestedParent = item.closest('.nested-list');
                if (nestedParent && nestedParent.id) {
                    const toggleButton = document.querySelector(`[aria-controls="${nestedParent.id}"]`);
                    if (toggleButton && !toggleButton.classList.contains('expanded')) {
                        toggleButton.click();
                    }
                }
            }
        }
    });
}
