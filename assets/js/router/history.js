export const DOCUMENT_TITLE_SUFFIX = " - Mihai's Profile";

export function updateTitle(appBarHeadline, pageTitle) {
  if (appBarHeadline) {
    appBarHeadline.textContent = pageTitle;
  }
  if (typeof document !== 'undefined') {
    document.title = `${pageTitle}${DOCUMENT_TITLE_SUFFIX}`;
  }
}

export function pushState(pageId, pageTitle, urlFragment, shouldUpdate = true) {
  if (!shouldUpdate || !window.history || typeof window.history.pushState !== 'function') {
    return;
  }
  window.history.pushState({ page: pageId }, pageTitle, `#${urlFragment}`);
}

export default {
  DOCUMENT_TITLE_SUFFIX,
  updateTitle,
  pushState
};
