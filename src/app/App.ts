import type { HomeLoadCallback, PageLoadCallback, RouterOptions } from '../core/types/index.ts';

const PROFILE_AVATAR_FALLBACK_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

let pageContentAreaEl: HTMLElement | null = null;
let mainContentPageOriginalEl: HTMLElement | null = null;
let appBarHeadlineEl: HTMLElement | null = null;
let routeLinkHandlerRegistered = false;

export function startApp(): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
        return;
    }

    initializeApp();
}

function initializeApp(): void {
    pageContentAreaEl = getDynamicElement('pageContentArea');
    mainContentPageOriginalEl = getDynamicElement('mainContentPage');
    appBarHeadlineEl = getDynamicElement('appBarHeadline');

    initProfileAvatarFallback();
    setCopyrightYear();
    initTheme();
    initNavigationDrawer();

    if (SiteAnimations?.init) {
        try {
            SiteAnimations.init();
        } catch (error) {
            console.error('App.ts: Failed to initialize animations.', error);
        }
    }

    let initialHomeHTMLString = '<p>Error: Home content missing.</p>';
    if (mainContentPageOriginalEl) {
        initialHomeHTMLString = mainContentPageOriginalEl.outerHTML;
    } else {
        console.error('App.ts: Initial home content (#mainContentPage) not found!');
    }

    initRouter(
        pageContentAreaEl,
        appBarHeadlineEl,
        initialHomeHTMLString,
        buildRouterOptions(),
    );
    setupRouteLinkInterception();
    loadPageContent(window.location.hash || '#home', false);

    window.addEventListener('popstate', (event: PopStateEvent) => {
        const pageId = event.state?.page || window.location.hash || '#home';
        loadPageContent(pageId, false);
    });

    window.addEventListener('hashchange', () => {
        loadPageContent(window.location.hash || '#home', false);
    });
}

function buildRouterOptions(): RouterOptions {
    const options: RouterOptions = {};

    if (typeof showPageLoadingOverlay === 'function') {
        options.showOverlay = showPageLoadingOverlay;
    }
    if (typeof hidePageLoadingOverlay === 'function') {
        options.hideOverlay = hidePageLoadingOverlay;
    }
    if (typeof closeDrawer === 'function') {
        options.closeDrawer = closeDrawer;
    }

    const homeLoadCallbacks: HomeLoadCallback[] = [];
    if (typeof fetchBlogPosts === 'function') {
        homeLoadCallbacks.push(() => {
            if (document.getElementById('newsGrid')) fetchBlogPosts();
        });
    }
    if (typeof fetchCommittersRanking === 'function') {
        homeLoadCallbacks.push(() => {
            const rankingCardPresent = document.getElementById('committers-rank')
                || document.getElementById('committers-status')
                || document.querySelector('.achievement-card');
            if (rankingCardPresent) fetchCommittersRanking();
        });
    }
    if (typeof renderHomeFaqSection === 'function') {
        homeLoadCallbacks.push(renderHomeFaqSection);
    }

    if (homeLoadCallbacks.length > 0) {
        options.onHomeLoad = () => {
            homeLoadCallbacks.forEach((callback) => {
                try {
                    callback();
                } catch (error) {
                    console.error('App.ts: Error running home load callback.', error);
                }
            });
        };
    }

    const pageHandlers: Record<string, PageLoadCallback> = {};
    if (typeof loadSongs === 'function') {
        pageHandlers.songs = () => {
            if (document.getElementById('songsGrid')) loadSongs();
        };
    }
    if (typeof initProjectsPage === 'function') pageHandlers.projects = initProjectsPage;
    if (typeof initResumePage === 'function') pageHandlers.resume = initResumePage;
    if (typeof initContactPage === 'function') pageHandlers.contact = initContactPage;
    if (typeof initFaqPage === 'function') pageHandlers.faqs = initFaqPage;

    if (Object.keys(pageHandlers).length > 0) options.pageHandlers = pageHandlers;
    return options;
}

function setupRouteLinkInterception(): void {
    if (routeLinkHandlerRegistered) return;

    const routesApi = typeof RouterRoutes !== 'undefined' ? RouterRoutes : null;
    const hasRoute: ((routeId: string) => boolean) | null = routesApi
        ? (typeof routesApi.hasRoute === 'function'
            ? routesApi.hasRoute.bind(routesApi)
            : (routeId: string) => {
                if (typeof routesApi.getRoute === 'function') {
                    return Boolean(routesApi.getRoute(routeId));
                }
                return Boolean(routesApi.PAGE_ROUTES?.[routeId]);
            })
        : null;

    if (!hasRoute) {
        console.warn('App.ts: RouterRoutes API unavailable. Route link interception skipped.');
        return;
    }

    document.addEventListener('click', (event: MouseEvent) => {
        const eventTarget = event.target;
        if (!(eventTarget instanceof Element)) return;

        const interactiveElement = eventTarget.closest('a[href^="#"], md-list-item[href^="#"]');
        if (!interactiveElement || interactiveElement.getAttribute('target') === '_blank') return;

        const rawHref = interactiveElement.getAttribute('href');
        if (!rawHref) return;

        const normalizedId = normalizePageId(rawHref);
        if (!normalizedId || !hasRoute(normalizedId)) return;

        event.preventDefault();
        loadPageContent(normalizedId);
    }, true);

    routeLinkHandlerRegistered = true;
}

function initProfileAvatarFallback(): void {
    const profileAvatar = document.querySelector<HTMLImageElement>('.profile-avatar');
    if (!profileAvatar) return;

    const applyFallback = (): void => {
        profileAvatar.classList.add('profile-avatar-fallback');
        if (profileAvatar.src !== PROFILE_AVATAR_FALLBACK_SRC) {
            profileAvatar.src = PROFILE_AVATAR_FALLBACK_SRC;
        }
    };

    profileAvatar.addEventListener('error', applyFallback, { once: true });
    if (profileAvatar.complete && profileAvatar.naturalWidth === 0) applyFallback();
}
