import type { MaterialNextAppShell } from 'material-next-web-components/app-shell.js';

export const DOCUMENT_TITLE_SUFFIX = " - Mihai's Profile";

export function updateTitle(
  appBarHeadline: Pick<MaterialNextAppShell, 'heading'> | null,
  pageTitle: string,
): void {
  if (appBarHeadline) appBarHeadline.heading = pageTitle;
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
