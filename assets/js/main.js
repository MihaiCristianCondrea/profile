const globalScope = typeof window !== 'undefined' ? window : globalThis;
const ModuleRegistry =
  typeof module === 'object' && typeof module.exports === 'object'
    ? require('./modules/moduleRegistry.js')
    : globalScope.ModuleRegistry;

if (!ModuleRegistry || typeof ModuleRegistry.register !== 'function') {
  throw new Error('Main application bootstrap requires ModuleRegistry.');
}

const UtilsModule = ModuleRegistry.require('utils');
const ThemeModule = ModuleRegistry.require('theme');
const NavigationModule = ModuleRegistry.require('navigationDrawer');
const RouterModule = ModuleRegistry.require('router.core');
const RouterRoutesModule = ModuleRegistry.require('router.routes');
const AnimationsModule = ModuleRegistry.has('animations')
  ? ModuleRegistry.require('animations')
  : globalScope.SiteAnimations || null;
const BloggerModule = ModuleRegistry.has('bloggerApi')
  ? ModuleRegistry.require('bloggerApi')
  : null;
const CommittersModule = ModuleRegistry.has('committers')
  ? ModuleRegistry.require('committers')
  : null;
const SongsPageModule = ModuleRegistry.has('page.songs')
  ? ModuleRegistry.require('page.songs')
  : null;
const ProjectsPageModule = ModuleRegistry.has('page.projects')
  ? ModuleRegistry.require('page.projects')
  : null;
const ResumePageModule = ModuleRegistry.has('page.resume')
  ? ModuleRegistry.require('page.resume')
  : null;
const ContactPageModule = ModuleRegistry.has('page.contact')
  ? ModuleRegistry.require('page.contact')
  : null;

const { getDynamicElement, showPageLoadingOverlay, hidePageLoadingOverlay, setCopyrightYear } =
  UtilsModule;
const { initTheme } = ThemeModule;
const { initNavigationDrawer, closeDrawer } = NavigationModule;
const { initRouter, loadPageContent, normalizePageId } = RouterModule;

const PROFILE_AVATAR_FALLBACK_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

let pageContentAreaEl;
let mainContentPageOriginalEl;
let appBarHeadlineEl;
let topAppBarEl;
let routeLinkHandlerRegistered = false;

document.addEventListener('DOMContentLoaded', initializeApplication);

function initializeApplication() {
  const doc = globalScope.document;
  if (!doc) {
    return;
  }

  pageContentAreaEl = getDynamicElement('pageContentArea');
  mainContentPageOriginalEl = getDynamicElement('mainContentPage');
  appBarHeadlineEl = getDynamicElement('appBarHeadline');
  topAppBarEl = getDynamicElement('topAppBar');

  initProfileAvatarFallback();

  if (typeof setCopyrightYear === 'function') {
    setCopyrightYear();
  }
  if (typeof initTheme === 'function') {
    initTheme();
  }
  if (typeof initNavigationDrawer === 'function') {
    initNavigationDrawer();
  }

  if (AnimationsModule && typeof AnimationsModule.init === 'function') {
    try {
      AnimationsModule.init();
    } catch (error) {
      console.error('Main: Failed to initialize animations.', error);
    }
  }

  let initialHomeHTMLString = '<p>Error: Home content missing.</p>';
  if (mainContentPageOriginalEl) {
    initialHomeHTMLString = mainContentPageOriginalEl.outerHTML;
  } else {
    console.error('Main: Initial home content (#mainContentPage) not found.');
  }

  const routerOptions = buildRouterOptions();
  initRouter(pageContentAreaEl, appBarHeadlineEl, initialHomeHTMLString, routerOptions);

  setupRouteLinkInterception();

  const initialHash =
    globalScope.location && globalScope.location.hash ? globalScope.location.hash : '#home';
  loadPageContent(initialHash, false);

  globalScope.addEventListener('popstate', (event) => {
    let pageId = '#home';
    if (event.state && event.state.page) {
      pageId = event.state.page;
    } else if (globalScope.location && globalScope.location.hash) {
      pageId = globalScope.location.hash;
    }
    loadPageContent(pageId, false);
  });

  if (topAppBarEl) {
    globalScope.addEventListener('scroll', () => {
      const isScrolled = globalScope.scrollY > 0;
      topAppBarEl.classList.toggle('scrolled', isScrolled);
    });
  }
}

function buildRouterOptions() {
  const options = {};

  if (typeof showPageLoadingOverlay === 'function') {
    options.showOverlay = () => {
      showPageLoadingOverlay();
    };
  }

  if (typeof hidePageLoadingOverlay === 'function') {
    options.hideOverlay = () => {
      hidePageLoadingOverlay();
    };
  }

  if (typeof closeDrawer === 'function') {
    options.closeDrawer = () => {
      closeDrawer();
    };
  }

  if (BloggerModule || CommittersModule) {
    options.onHomeLoad = () => {
      const doc = globalScope.document;
      if (!doc) {
        return;
      }

      if (BloggerModule && typeof BloggerModule.fetchBlogPosts === 'function') {
        const newsGrid = doc.getElementById('newsGrid');
        if (newsGrid) {
          BloggerModule.fetchBlogPosts();
        }
      }

      if (CommittersModule && typeof CommittersModule.fetchCommittersRanking === 'function') {
        const rankingExists =
          doc.getElementById('committers-rank') ||
          doc.getElementById('committers-status') ||
          doc.querySelector('.achievement-card');
        if (rankingExists) {
          CommittersModule.fetchCommittersRanking();
        }
      }
    };
  }

  const pageHandlers = {};

  if (SongsPageModule && typeof SongsPageModule.loadSongs === 'function') {
    pageHandlers.songs = () => {
      const doc = globalScope.document;
      const songsGrid = doc ? doc.getElementById('songsGrid') : null;
      if (songsGrid) {
        SongsPageModule.loadSongs();
      }
    };
  }

  if (ProjectsPageModule && typeof ProjectsPageModule.initProjectsPage === 'function') {
    pageHandlers.projects = ProjectsPageModule.initProjectsPage;
  }

  if (ResumePageModule && typeof ResumePageModule.initResumePage === 'function') {
    pageHandlers.resume = ResumePageModule.initResumePage;
  }

  if (ContactPageModule && typeof ContactPageModule.initContactPage === 'function') {
    pageHandlers.contact = ContactPageModule.initContactPage;
  }

  if (Object.keys(pageHandlers).length > 0) {
    options.pageHandlers = pageHandlers;
  }

  return options;
}

function setupRouteLinkInterception() {
  if (routeLinkHandlerRegistered) {
    return;
  }

  const routesApi = RouterRoutesModule;
  const hasRoute = routesApi
    ? typeof routesApi.hasRoute === 'function'
      ? routesApi.hasRoute.bind(routesApi)
      : (routeId) => {
          const routeMap = routesApi.PAGE_ROUTES;
          return !!(routeMap && routeMap[routeId]);
        }
    : null;

  if (!hasRoute) {
    console.warn('Main: RouterRoutes API unavailable. Route link interception skipped.');
    return;
  }

  const doc = globalScope.document;
  if (!doc) {
    return;
  }

  doc.addEventListener(
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
      if (!normalizedId || !hasRoute(normalizedId)) {
        return;
      }

      event.preventDefault();
      loadPageContent(normalizedId);
    },
    true
  );

  routeLinkHandlerRegistered = true;
}

function initProfileAvatarFallback() {
  const doc = globalScope.document;
  if (!doc) {
    return;
  }

  const profileAvatar = doc.querySelector('.profile-avatar');
  if (!profileAvatar) {
    return;
  }

  const applyFallback = () => {
    profileAvatar.classList.add('profile-avatar-fallback');
    if (profileAvatar.src !== PROFILE_AVATAR_FALLBACK_SRC) {
      profileAvatar.src = PROFILE_AVATAR_FALLBACK_SRC;
    }
  };

  profileAvatar.addEventListener('error', applyFallback, { once: true });

  if (profileAvatar.complete && profileAvatar.naturalWidth === 0) {
    applyFallback();
  }
}

const MainAppModule = {
  initializeApplication,
  buildRouterOptions,
  setupRouteLinkInterception,
  initProfileAvatarFallback
};

ModuleRegistry.register('app.main', MainAppModule, { alias: 'SiteApp' });

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = MainAppModule;
}
