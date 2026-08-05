export const DOCUMENT_TITLE_SUFFIX = " - Mihai's Profile";

export function updateTitle(appBarHeadline: HTMLElement | null, pageTitle: string): void {
  if (appBarHeadline) appBarHeadline.textContent = pageTitle;
  document.title = `${pageTitle}${DOCUMENT_TITLE_SUFFIX}`;
}

export function pushState(
  pageId: string,
  pageTitle: string,
  urlFragment: string,
  shouldUpdate = true,
): void {
  if (!shouldUpdate) return;

  const nextHash = `#${urlFragment}`;
  if (window.location.hash === nextHash) return;
  window.history.pushState({ page: pageId }, pageTitle, nextHash);
}

export const RouterHistory = { DOCUMENT_TITLE_SUFFIX, updateTitle, pushState };
