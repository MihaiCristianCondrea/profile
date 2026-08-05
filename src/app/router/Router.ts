import type { PageLoadCallback, RouterOptions } from '../../core/types/index.ts';
import { updateMetadataForRoute } from '../../core/metadata/MetadataManager.ts';
import { fetchPageMarkup } from './ContentLoader.ts';
import { pushState, updateTitle } from './HistoryManager.ts';
import { getRoute, hasRoute } from './RouteRegistry.ts';

const NOOP = (): void => undefined;

let pageContentArea: HTMLElement | null = null;
let appBarHeadline: HTMLElement | null = null;
let initialHomepageHTML = '';
let loadSequence = 0;

const routerRuntime: Required<Omit<RouterOptions, 'onHomeLoad' | 'pageHandlers'>> & {
  onHomeLoad: PageLoadCallback | null;
  pageHandlers: Record<string, PageLoadCallback>;
} = {
  showOverlay: NOOP,
  hideOverlay: NOOP,
  closeDrawer: NOOP,
  onHomeLoad: null,
  pageHandlers: Object.create(null),
};

export function normalizePageId(pageId: string): string {
  const normalized = pageId.trim().replace(/^#/, '').split('?')[0];
  return !normalized || normalized === 'index.html' ? 'home' : normalized;
}

function runCallback(callback: PageLoadCallback | null | undefined, description: string): boolean {
  if (!callback) return false;
  try {
    callback();
  } catch (error) {
    console.error(`Router: ${description} failed.`, error);
  }
  return true;
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
    routerRuntime.pageHandlers[normalizePageId(pageId)] = handler;
  });
}

function runPageHandler(pageId: string): void {
  if (pageId === 'home' && runCallback(routerRuntime.onHomeLoad, 'home handler')) return;
  runCallback(routerRuntime.pageHandlers[pageId], `handler for ${pageId}`);
}

export function updateActiveNavLink(currentPageId: string): void {
  const normalizedCurrentPage = normalizePageId(currentPageId);

  document.querySelectorAll<HTMLElement>('#navDrawer md-list-item[href]').forEach((item) => {
    const selected = normalizePageId(item.getAttribute('href') ?? '') === normalizedCurrentPage;
    item.toggleAttribute('data-active', selected);
    item.toggleAttribute('aria-current', selected);
    if (selected) item.setAttribute('aria-current', 'page');
    item.querySelector('md-icon')?.classList.toggle('filled-icon', selected);

    if (selected) {
      const nestedParent = item.closest<HTMLElement>('.nested-list');
      if (nestedParent?.hidden) {
        document.querySelector<HTMLElement>(`[aria-controls="${nestedParent.id}"]`)?.click();
      }
    }
  });
}

export async function loadPageContent(pageId: string, updateHistory = true): Promise<void> {
  const currentLoad = ++loadSequence;
  const normalizedPageId = normalizePageId(pageId);
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
    if (result.status === 'success') {
      runPageHandler(normalizedPageId);
      if (!routerRuntime.pageHandlers[normalizedPageId] && normalizedPageId !== 'home') {
        runCallback(result.onReady, `route hook for ${normalizedPageId}`);
      }
    } else if (result.error) {
      console.error(`Router: Failed to load ${result.sourceTitle ?? normalizedPageId}.`, result.error);
    }

    const pageTitle = result.title || routeConfig?.title || "Mihai's Profile";
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
  return hasRoute(normalizePageId(pageId));
}
