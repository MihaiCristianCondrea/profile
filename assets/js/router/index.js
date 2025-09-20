import routesApi, { getRoute } from './routes.js';
import { fetchPageMarkup, DEFAULT_PAGE_TITLE } from './contentLoader.js';
import { updateTitle, pushState } from './history.js';
import { fadeOut, fadeIn } from './animation.js';
import { updateForRoute as updateMetadataForRoute } from '../core/metadata.js';

const MINIMUM_LOAD_DURATION = 600;

const NOOP = () => {};

let pageContentArea;
let appBarHeadline;
let initialHomepageHTML = '';

const routerRuntime = {
  showOverlay: NOOP,
  hideOverlay: NOOP,
  closeDrawer: NOOP,
  onHomeLoad: null,
  pageHandlers: Object.create(null)
};

export function normalizePageId(pageId) {
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
  return getRoute(pageId);
}

function runInjectedPageHandlers(pageId) {
  let handled = false;

  if (pageId === 'home' && typeof routerRuntime.onHomeLoad === 'function') {
    handled = callCallback(routerRuntime.onHomeLoad, 'home page load callback', pageId) || handled;
  }

  const handler = routerRuntime.pageHandlers[pageId];
  if (typeof handler === 'function') {
    handled = callCallback(handler, `page handler for ${pageId}`, pageId) || handled;
  }

  return handled;
}

export function callCallback(callback, description, ...args) {
  if (typeof callback !== 'function') {
    return false;
  }
  try {
    callback(...args);
    return true;
  } catch (error) {
    console.error(`Router: Error running ${description}:`, error);
    return true;
  }
}

export function initRouter(contentAreaEl, appBarHeadlineEl, homeHTML, options = {}) {
  pageContentArea = contentAreaEl;
  appBarHeadline = appBarHeadlineEl;
  initialHomepageHTML = homeHTML;

  const normalizedOptions = options && typeof options === 'object' ? options : {};

  routerRuntime.showOverlay = typeof normalizedOptions.showOverlay === 'function'
    ? normalizedOptions.showOverlay
    : NOOP;
  routerRuntime.hideOverlay = typeof normalizedOptions.hideOverlay === 'function'
    ? normalizedOptions.hideOverlay
    : NOOP;
  routerRuntime.closeDrawer = typeof normalizedOptions.closeDrawer === 'function'
    ? normalizedOptions.closeDrawer
    : NOOP;
  routerRuntime.onHomeLoad = typeof normalizedOptions.onHomeLoad === 'function'
    ? normalizedOptions.onHomeLoad
    : null;

  routerRuntime.pageHandlers = Object.create(null);
  if (normalizedOptions.pageHandlers && typeof normalizedOptions.pageHandlers === 'object') {
    Object.entries(normalizedOptions.pageHandlers).forEach(([pageId, handler]) => {
      if (typeof handler !== 'function') {
        return;
      }
      const normalizedId = typeof pageId === 'string' ? normalizePageId(pageId) : '';
      if (!normalizedId) {
        return;
      }
      routerRuntime.pageHandlers[normalizedId] = handler;
    });
  }
}

function updateActiveNavLink(currentPageId) {
  const normalizedCurrentPage = normalizePageId(currentPageId);

  document.querySelectorAll('#navDrawer md-list-item[href]').forEach((item) => {
    item.classList.remove('nav-item-active');
    if (item.hasAttribute('active')) {
      item.removeAttribute('active');
    }
    if (typeof item.active === 'boolean' && item.active) {
      item.active = false;
    }
    item.removeAttribute('aria-current');
    item.removeAttribute('aria-selected');

    const itemHref = item.getAttribute('href');
    if (!itemHref) {
      return;
    }
    const normalizedHref = normalizePageId(itemHref);
    if (normalizedHref === normalizedCurrentPage) {
      item.classList.add('nav-item-active');
      item.setAttribute('aria-current', 'page');
      item.setAttribute('aria-selected', 'true');
      if (typeof item.active === 'boolean') {
        item.active = true;
      }

      const nestedParent = item.closest('.nested-list');
      if (nestedParent && nestedParent.id) {
        const toggleButton = document.querySelector(`[aria-controls="${nestedParent.id}"]`);
        if (toggleButton && !toggleButton.classList.contains('expanded')) {
          toggleButton.click();
        }
      }
    }
  });
}

export async function loadPageContent(pageId, updateHistory = true) {
  const loadStart = Date.now();
  callCallback(routerRuntime.showOverlay, 'showOverlay callback');
  callCallback(routerRuntime.closeDrawer, 'closeDrawer callback');

  if (!pageContentArea) {
    console.error('Router: pageContentArea element not set. Call initRouter first.');
    callCallback(routerRuntime.hideOverlay, 'hideOverlay callback');
    return;
  }

  const normalizedPageId = normalizePageId(pageId);
  const newUrlFragment = normalizedPageId;

  const routeConfig = getRegisteredRoute(normalizedPageId);

  if (!routeConfig) {
    console.warn('Router: Unknown page:', normalizedPageId);
    pageContentArea.innerHTML = createGenericErrorHtml(`Page not found: ${normalizedPageId}`);
    const notFoundTitle = 'Not Found';
    updateMetadataForRoute(null, {
      pageId: normalizedPageId,
      pageTitle: notFoundTitle,
      loadStatus: 'not-found'
    });
    updateTitle(appBarHeadline, notFoundTitle);
    return;
  }

  let minHeightApplied = false;
  const releaseMinHeight = () => {
    if (!minHeightApplied || !pageContentArea || !pageContentArea.style) {
      return;
    }
    pageContentArea.style.minHeight = '';
    minHeightApplied = false;
  };

  try {
    await fadeOut(pageContentArea);

    if (typeof pageContentArea.getBoundingClientRect === 'function' && pageContentArea.style) {
      const rect = pageContentArea.getBoundingClientRect();
      if (rect && Number.isFinite(rect.height) && rect.height > 0) {
        pageContentArea.style.minHeight = `${Math.round(rect.height)}px`;
        minHeightApplied = true;
      }
    }

    let loadResult;
    try {
      loadResult = await fetchPageMarkup(normalizedPageId, { initialHomeHTML: initialHomepageHTML });
    } catch (error) {
      loadResult = {
        status: 'error',
        title: 'Error',
        html: createGenericErrorHtml(`Failed to load page. ${error.message}`),
        error
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

    const handledByInjectedHandlers = runInjectedPageHandlers(normalizedPageId);
    if (!handledByInjectedHandlers && typeof loadResult.onReady === 'function') {
      callCallback(loadResult.onReady, 'page ready hook', normalizedPageId);
    }

    const pageTitle = loadResult.title
      || routeConfig?.title
      || DEFAULT_PAGE_TITLE;

    updateMetadataForRoute(routeConfig, {
      pageId: normalizedPageId,
      pageTitle,
      loadStatus: loadResult.status
    });

    updateTitle(appBarHeadline, pageTitle);
    pushState(normalizedPageId, pageTitle, newUrlFragment, updateHistory);

    window.scrollTo(0, 0);
    updateActiveNavLink(newUrlFragment);

    await fadeIn(pageContentArea);

    releaseMinHeight();

    const elapsed = Date.now() - loadStart;
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, MINIMUM_LOAD_DURATION - elapsed)));
  } finally {
    releaseMinHeight();
    callCallback(routerRuntime.hideOverlay, 'hideOverlay callback');
  }
}

export function setupRouteLinkInterception() {
  document.addEventListener(
    'click',
    (event) => {
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
      if (!normalizedId || !routesApi.hasRoute(normalizedId)) {
        return;
      }
      event.preventDefault();
      loadPageContent(normalizedId);
    },
    true
  );
}

export const runtime = routerRuntime;

export default {
  initRouter,
  loadPageContent,
  normalizePageId,
  callCallback,
  setupRouteLinkInterception,
  updateActiveNavLink,
  runtime
};
