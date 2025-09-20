import { getDynamicElement, setCopyrightYear, showPageLoadingOverlay, hidePageLoadingOverlay } from './utils.js';
import { initTheme } from './theme.js';
import { initNavigationDrawer, closeDrawer } from './navigationDrawer.js';
import { initRouter, loadPageContent, setupRouteLinkInterception } from '../router/index.js';
import siteAnimations from './animations.js';

function lazyHandler(loader) {
  let cached;
  return async (...args) => {
    if (!cached) {
      cached = loader();
    }
    const fn = await cached;
    if (typeof fn === 'function') {
      return fn(...args);
    }
    return null;
  };
}

export function buildRouterOptions({
  showOverlay = showPageLoadingOverlay,
  hideOverlay = hidePageLoadingOverlay,
  closeDrawerHandler = closeDrawer,
  fetchBlogPosts,
  fetchCommittersRanking,
  loadSongsHandler,
  initProjectsPageHandler,
  initResumePageHandler,
  initContactPageHandler
} = {}) {
  const options = {};

  if (typeof showOverlay === 'function') {
    options.showOverlay = () => {
      showOverlay();
    };
  }

  if (typeof hideOverlay === 'function') {
    options.hideOverlay = () => {
      hideOverlay();
    };
  }

  if (typeof closeDrawerHandler === 'function') {
    options.closeDrawer = () => {
      closeDrawerHandler();
    };
  }

  if (fetchBlogPosts || fetchCommittersRanking) {
    options.onHomeLoad = async () => {
      if (fetchBlogPosts) {
        await fetchBlogPosts();
      }
      if (fetchCommittersRanking) {
        await fetchCommittersRanking();
      }
    };
  }

  const pageHandlers = {};

  if (loadSongsHandler) {
    pageHandlers.songs = async () => {
      const songsGrid = getDynamicElement('songsGrid');
      if (songsGrid) {
        await loadSongsHandler();
      }
    };
  }

  if (initProjectsPageHandler) {
    pageHandlers.projects = async () => {
      await initProjectsPageHandler();
    };
  }

  if (initResumePageHandler) {
    pageHandlers.resume = async () => {
      await initResumePageHandler();
    };
  }

  if (initContactPageHandler) {
    pageHandlers.contact = async () => {
      await initContactPageHandler();
    };
  }

  if (Object.keys(pageHandlers).length > 0) {
    options.pageHandlers = pageHandlers;
  }

  return options;
}

function createLazyDependencies() {
  return buildRouterOptions({
    fetchBlogPosts: lazyHandler(async () => {
      const { fetchBlogPosts } = await import('../services/bloggerApi.js');
      const newsGrid = getDynamicElement('newsGrid');
      if (!newsGrid) {
        return null;
      }
      return () => fetchBlogPosts();
    }),
    fetchCommittersRanking: lazyHandler(async () => {
      const { fetchCommittersRanking } = await import('../services/committers.js');
      const rankElement = getDynamicElement('committers-rank');
      if (!rankElement) {
        return null;
      }
      return () => fetchCommittersRanking();
    }),
    loadSongsHandler: lazyHandler(async () => {
      const { loadSongs } = await import('../pages/songs.js');
      return () => loadSongs();
    }),
    initProjectsPageHandler: lazyHandler(async () => {
      const { initProjectsPage } = await import('../pages/projects.js');
      return () => initProjectsPage();
    }),
    initResumePageHandler: lazyHandler(async () => {
      const { initResumePage } = await import('../pages/resume.js');
      return () => initResumePage();
    }),
    initContactPageHandler: lazyHandler(async () => {
      const { initContactPage } = await import('../pages/contact.js');
      return () => initContactPage();
    })
  });
}

export function initializeAppShell() {
  const pageContentArea = getDynamicElement('pageContentArea');
  const mainContentPage = getDynamicElement('mainContentPage');
  const appBarHeadline = getDynamicElement('appBarHeadline');
  const topAppBar = getDynamicElement('topAppBar');

  if (!pageContentArea || !mainContentPage) {
    throw new Error('AppShell: Required DOM elements are missing.');
  }

  setCopyrightYear();
  initTheme();
  initNavigationDrawer();
  siteAnimations.init();

  const initialHomeHTMLString = mainContentPage ? mainContentPage.outerHTML : '<p>Error: Home content missing.</p>';

  const routerOptions = createLazyDependencies();
  initRouter(pageContentArea, appBarHeadline, initialHomeHTMLString, routerOptions);

  setupRouteLinkInterception();

  const initialPageId = window.location.hash || '#home';
  loadPageContent(initialPageId, false);

  window.addEventListener('popstate', (event) => {
    let pageId = '#home';
    if (event.state && event.state.page) {
      pageId = event.state.page;
    } else if (window.location.hash) {
      pageId = window.location.hash;
    }
    loadPageContent(pageId, false);
  });

  if (topAppBar) {
    window.addEventListener('scroll', () => {
      const isScrolled = window.scrollY > 0;
      topAppBar.classList.toggle('scrolled', isScrolled);
    });
  }
}

export default {
  initializeAppShell,
  buildRouterOptions
};
