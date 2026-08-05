import type { RouterOptions } from '../core/types/index.ts';
import {
  getDynamicElement,
  hidePageLoadingOverlay,
  setCopyrightYear,
  showPageLoadingOverlay,
} from '../core/dom/DomUtils.ts';
import { initTheme } from '../core/theme/ThemeManager.ts';
import {
  closeDrawer,
  initNavigationDrawer,
} from '../features/navigation-drawer/presentation/NavigationDrawer.ts';
import { fetchBlogPosts } from '../features/blog/presentation/BlogPosts.ts';
import { renderHomeFaqSection, initFaqPage } from '../features/faq/presentation/FaqPage.ts';
import { fetchCommittersRanking } from '../features/resume/presentation/CommittersRanking.ts';
import { loadSongs } from '../features/songs/presentation/SongsPage.ts';
import { initProjectsPage } from '../features/projects/presentation/ProjectsPage.ts';
import { initResumePage } from '../features/resume/presentation/ResumePage.ts';
import { initContactPage } from '../features/profile/presentation/ContactPage.ts';
import { initSmartCleanerPage } from '../features/apps/smart-cleaner/presentation/SmartCleanerPage.ts';
import {
  initRouter,
  isRegisteredRoute,
  loadPageContent,
  normalizePageId,
} from './router/Router.ts';

const PROFILE_AVATAR_FALLBACK_SRC = 'images/profile/cv_profile_pic.png';
let initialized = false;

export function buildRouterOptions(): RouterOptions {
  return {
    showOverlay: showPageLoadingOverlay,
    hideOverlay: hidePageLoadingOverlay,
    closeDrawer,
    onHomeLoad: () => {
      if (document.getElementById('newsGrid')) void fetchBlogPosts();
      if (document.getElementById('committers-rank')) void fetchCommittersRanking();
      if (document.getElementById('homeFaqList')) void renderHomeFaqSection();
    },
    pageHandlers: {
      songs: () => { void loadSongs(); },
      projects: () => { void initProjectsPage(); },
      resume: initResumePage,
      contact: initContactPage,
      faqs: () => { void initFaqPage(); },
      'smart-cleaner-for-android': initSmartCleanerPage,
    },
  };
}

function getRouteElement(event: MouseEvent): Element | null {
  return event.composedPath().find((target): target is Element => (
    target instanceof Element && target.matches('[href^="#"]')
  )) ?? null;
}

function setupRouteLinkInterception(): void {
  document.addEventListener('click', (event) => {
    const routeElement = getRouteElement(event);
    if (!routeElement || routeElement.getAttribute('target') === '_blank') return;

    const href = routeElement.getAttribute('href');
    if (!href || !isRegisteredRoute(href)) return;
    event.preventDefault();
    void loadPageContent(normalizePageId(href));
  }, true);
}

function initProfileAvatarFallback(): void {
  const profileAvatar = document.querySelector<HTMLImageElement>('.profile-avatar');
  if (!profileAvatar) return;

  const applyFallback = (): void => {
    const fallbackUrl = new URL(PROFILE_AVATAR_FALLBACK_SRC, document.baseURI).href;
    if (profileAvatar.src !== fallbackUrl) {
      profileAvatar.src = PROFILE_AVATAR_FALLBACK_SRC;
    }
  };
  profileAvatar.addEventListener('error', applyFallback, { once: true });
  if (profileAvatar.complete && profileAvatar.naturalWidth === 0) applyFallback();
}

function initializeApp(): void {
  if (initialized) return;
  initialized = true;

  const pageContentArea = getDynamicElement('pageContentArea');
  const initialHome = getDynamicElement('mainContentPage');
  const appBarHeadline = getDynamicElement('appBarHeadline');
  if (!pageContentArea || !initialHome) {
    throw new Error('The application shell is incomplete.');
  }

  initProfileAvatarFallback();
  setCopyrightYear();
  initTheme();
  initNavigationDrawer();
  initRouter(pageContentArea, appBarHeadline, initialHome.outerHTML, buildRouterOptions());
  setupRouteLinkInterception();

  const initialRoute = isRegisteredRoute(window.location.hash)
    ? window.location.hash
    : '#home';
  void loadPageContent(initialRoute, false);

  window.addEventListener('hashchange', () => {
    if (isRegisteredRoute(window.location.hash)) {
      void loadPageContent(window.location.hash, false);
    }
  });
}

export function startApp(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
  } else {
    initializeApp();
  }
}
