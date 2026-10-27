import type {
  MaterialNextAppShell,
  NavigationRequestEvent,
} from 'material-next-web-components/app-shell.js';
import { isRegisteredRoute, loadPageContent } from './router/Router.ts';

export function profileShell(): MaterialNextAppShell | null {
  return document.querySelector<MaterialNextAppShell>('#profile-shell');
}

export function closeDrawer(): void {
  profileShell()?.closeDrawer();
}

export function initAppShell(): void {
  const shell = profileShell();
  shell?.addEventListener('navigation-request', async (event: NavigationRequestEvent) => {
    if (!isRegisteredRoute(event.detail.href)) return;
    event.preventDefault();
    await loadPageContent(event.detail.href);
    shell.focusHeading();
  });
}
