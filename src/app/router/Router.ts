import type { PageLoadCallback, RouterOptions } from '../../core/types/index.ts';
import { SITE_TITLE } from '../../core/metadata/SiteMetadata.ts';
import { updateMetadataForRoute } from '../../core/metadata/MetadataManager.ts';
import { fetchPageMarkup } from './ContentLoader.ts';
import { pushState, updateTitle } from './HistoryManager.ts';
import { getRoute, hasRoute, normalizeRouteId } from './RouteRegistry.ts';

export { normalizeRouteId as normalizePageId };

const NOOP = (): void => undefined;

let pageContentArea: HTMLElement | null = null;
let appBarHeadline: HTMLElement | null = null;
let initialHomepageHTML = '';
let loadSequence = 0;

const routerRuntime: {
  showOverlay: PageLoadCallback;
  hideOverlay: PageLoadCallback;
  closeDrawer: PageLoadCallback;
  onHomeLoad: PageLoadCallback | null;
  pageHandlers: Record<string, PageLoadCallback>;
} = {
  showOverlay: NOOP,
  hideOverlay: NOOP,
  closeDrawer: NOOP,
  onHomeLoad: null,
  pageHandlers: Object.create(null),
};

function runCallback(callback: PageLoadCallback | null | undefined, description: string): void {
  if (!callback) return;
  try {
    callback();
  } catch (error) {
    console.error(`Router: ${description} failed.`, error);
  }
}

export function initRouter(
  contentAreaElement: HTMLElement | null,
  headlineElement: HTMLElement | null,
  homeHtml: string,
  options: RouterOptions = {},
): void {
  pageContentArea = contentAreaElement;
  appBarHeadline = headlineElement;
  initialHomepageHTML = homeHtml;
  routerRuntime.showOverlay = options.showOverlay ?? NOOP;
  routerRuntime.hideOverlay = options.hideOverlay ?? NOOP;
  routerRuntime.closeDrawer = options.closeDrawer ?? NOOP;
  routerRuntime.onHomeLoad = options.onHomeLoad ?? null;
  routerRuntime.pageHandlers = Object.create(null);

  Object.entries(options.pageHandlers ?? {}).forEach(([pageId, handler]) => {
    routerRuntime.pageHandlers[normalizeRouteId(pageId)] = handler;
  });
}

function runPageHandler(pageId: string): void {
  if (pageId === 'home') {
    runCallback(routerRuntime.onHomeLoad, 'home handler');
    return;
  }
  runCallback(routerRuntime.pageHandlers[pageId], `handler for ${pageId}`);
}

export function updateActiveNavLink(currentPageId: string): void {
  const normalizedCurrentPage = normalizeRouteId(currentPageId);

  document.querySelectorAll<HTMLElement>('#navDrawer .nav-item[href^="#"]').forEach((item) => {
    const selected = normalizeRouteId(item.getAttribute('href') ?? '') === normalizedCurrentPage;
    item.toggleAttribute('data-active', selected);
    if (selected) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
    item.querySelector('md-icon')?.classList.toggle('filled-icon', selected);
  });
}

export async function loadPageContent(pageId: string, updateHistory = true): Promise<void> {
  const currentLoad = ++loadSequence;
  const normalizedPageId = normalizeRouteId(pageId);
  const routeConfig = getRoute(normalizedPageId);

  routerRuntime.showOverlay();
  routerRuntime.closeDrawer();

  try {
    if (!pageContentArea) throw new Error('Page content area is not initialized.');

    const result = await fetchPageMarkup(normalizedPageId, {
      initialHomeHTML: initialHomepageHTML,
    });
    if (currentLoad !== loadSequence) return;

    pageContentArea.innerHTML = result.html;
    pageContentArea.classList.toggle('is-full-bleed', routeConfig?.fullBleed === true);
    if (result.status === 'success') {
      runPageHandler(normalizedPageId);
    } else if (result.error) {
      console.error(`Router: Failed to load ${result.sourceTitle ?? normalizedPageId}.`, result.error);
    }

    const pageTitle = result.title || routeConfig?.title || SITE_TITLE;
    updateMetadataForRoute(routeConfig, {
      pageId: normalizedPageId,
      pageTitle,
      loadStatus: result.status,
    });
    updateTitle(appBarHeadline, pageTitle);
    pushState(normalizedPageId, pageTitle, normalizedPageId, updateHistory);
    updateActiveNavLink(normalizedPageId);
    window.scrollTo(0, 0);
  } finally {
    if (currentLoad === loadSequence) routerRuntime.hideOverlay();
  }
}

export function isRegisteredRoute(pageId: string): boolean {
  return hasRoute(pageId);
}
