import type { RouterOptions } from './index';

declare global {
  const SiteAnimations: {
    init?: () => void;
    animateSongCards?: (nodes: NodeListOf<Element>) => void;
    animateNewsCards?: (nodes: NodeListOf<Element>) => void;
  } | undefined;

  const SiteMetadata: {
    updateForRoute?: (routeConfig: unknown, context: unknown) => void;
  } | undefined;

  const RouterRoutes: any;
  const RouterAnimation: any;
  const RouterContentLoader: any;
  const RouterHistory: any;
  const initSmartCleanerPage: (() => void) | undefined;

  function getDynamicElement(id: string): HTMLElement | null;
  function setCopyrightYear(): void;
  function showPageLoadingOverlay(): void;
  function hidePageLoadingOverlay(): void;
  function initTheme(): void;
  function initNavigationDrawer(): void;
  function closeDrawer(): void;
  function initRouter(
    contentContainer: HTMLElement | null,
    appBarHeadline: HTMLElement | null,
    initialHomeHTML: string,
    options?: RouterOptions
  ): void;
  function loadPageContent(pageId: string, shouldPushState?: boolean): Promise<void>;
  function normalizePageId(pageId: string): string;
  function fetchBlogPosts(): unknown;
  function fetchCommittersRanking(): unknown;
  function loadSongs(): unknown;
  function initProjectsPage(): unknown;
  function initResumePage(): unknown;
  function renderHomeFaqSection(): unknown;
  function initFaqPage(): unknown;

  interface Window {
    marked?: { parse: (markdown: string) => string };
  }
}

export {};
