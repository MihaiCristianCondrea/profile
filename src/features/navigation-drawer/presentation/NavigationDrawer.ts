interface NavigationDrawerElement extends HTMLElement {
  opened: boolean;
}

interface NavigationDrawerChangedEvent extends Event {
  detail?: { opened?: boolean };
}

let menuButton: HTMLElement | null = null;
let navDrawer: NavigationDrawerElement | null = null;
let closeDrawerButton: HTMLElement | null = null;
let drawerLayer: HTMLElement | null = null;
let inertTargets: HTMLElement[] = [];
let initialized = false;
let drawerWasOpen = false;

/* `data-active` marks the selected destination and is owned by the router, so an
   expanded group is reported through `expanded` and `aria-expanded` only. */
function syncSection(toggle: HTMLElement, content: HTMLElement, expanded: boolean): void {
  content.classList.toggle('open', expanded);
  content.hidden = !expanded;
  content.setAttribute('aria-hidden', String(!expanded));
  toggle.classList.toggle('expanded', expanded);
  toggle.setAttribute('aria-expanded', String(expanded));
}

function initToggleSection(toggle: HTMLElement | null, content: HTMLElement | null): void {
  if (!toggle || !content || toggle.dataset.sectionInitialized === 'true') return;

  syncSection(toggle, content, toggle.getAttribute('aria-expanded') === 'true');
  toggle.addEventListener('click', () => {
    syncSection(toggle, content, toggle.getAttribute('aria-expanded') !== 'true');
  });
  toggle.dataset.sectionInitialized = 'true';
}

function updateModalAccessibilityState(opened: boolean): void {
  inertTargets.forEach((element) => {
    element.inert = opened;
    if (opened) element.setAttribute('aria-hidden', 'true');
    else element.removeAttribute('aria-hidden');
  });
}

function focusFirstNavItem(): void {
  const firstNavItem = navDrawer?.querySelector<HTMLElement>('.nav-item[href]');
  (firstNavItem ?? closeDrawerButton)?.focus();
}

function syncDrawerState(opened: boolean): void {
  drawerLayer?.classList.toggle('open', opened);
  drawerLayer?.setAttribute('aria-hidden', String(!opened));
  document.body.classList.toggle('drawer-is-open', opened);
  updateModalAccessibilityState(opened);

  menuButton?.setAttribute('aria-expanded', String(opened));
  menuButton?.setAttribute('aria-label', opened ? 'Close menu' : 'Open menu');

  const triggerIcon = document.getElementById('menuButtonIcon');
  if (triggerIcon) triggerIcon.textContent = opened ? 'menu_open' : 'menu';

  if (opened) focusFirstNavItem();
  else if (drawerWasOpen) menuButton?.focus();
  drawerWasOpen = opened;
}

export function toggleDrawer(forceOpen?: boolean): void {
  if (!navDrawer) return;
  const opened = forceOpen ?? !navDrawer.opened;
  navDrawer.opened = opened;
  syncDrawerState(opened);
}

export function closeDrawer(): void {
  toggleDrawer(false);
}

export function openDrawer(): void {
  toggleDrawer(true);
}

export function initNavigationDrawer(): void {
  menuButton = document.getElementById('menuButton');
  navDrawer = document.getElementById('navDrawer') as NavigationDrawerElement | null;
  closeDrawerButton = document.getElementById('closeDrawerButton');
  drawerLayer = document.getElementById('drawer-layer');
  inertTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-drawer-inert-target]'));

  if (!initialized) {
    menuButton?.addEventListener('click', () => toggleDrawer());
    closeDrawerButton?.addEventListener('click', closeDrawer);
    drawerLayer?.addEventListener('click', (event) => {
      if (event.target === drawerLayer) closeDrawer();
    });
    navDrawer?.addEventListener('navigation-drawer-changed', (event) => {
      const drawerEvent = event as NavigationDrawerChangedEvent;
      syncDrawerState(drawerEvent.detail?.opened ?? Boolean(navDrawer?.opened));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navDrawer?.opened) closeDrawer();
    });
    initialized = true;
  }

  initToggleSection(
    document.getElementById('aboutToggle'),
    document.getElementById('aboutContent'),
  );
  initToggleSection(
    document.getElementById('androidAppsToggle'),
    document.getElementById('androidAppsContent'),
  );

  syncDrawerState(Boolean(navDrawer?.opened));
}
