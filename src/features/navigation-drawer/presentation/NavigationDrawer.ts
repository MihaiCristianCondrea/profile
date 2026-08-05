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
let initialized = false;

function syncDrawerState(opened: boolean): void {
  drawerLayer?.classList.toggle('open', opened);
  drawerLayer?.setAttribute('aria-hidden', String(!opened));

  menuButton?.setAttribute('aria-expanded', String(opened));
  menuButton?.setAttribute('aria-label', opened ? 'Close menu' : 'Open menu');

  const triggerIcon = document.getElementById('menuButtonIcon');
  if (triggerIcon) triggerIcon.textContent = opened ? 'menu_open' : 'menu';
}

function activateExternalItem(item: HTMLElement): void {
  const href = item.getAttribute('href');
  if (!href || href.startsWith('#')) return;

  const target = item.getAttribute('target') ?? '_self';
  if (target === '_blank') {
    window.open(href, '_blank', 'noopener,noreferrer');
  } else {
    window.location.assign(href);
  }
  closeDrawer();
}

function initNavigationItems(): void {
  navDrawer?.querySelectorAll<HTMLElement>('.nav-item[href]').forEach((item) => {
    if (item.dataset.navigationInitialized === 'true') return;

    item.addEventListener('click', () => activateExternalItem(item));
    item.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      item.click();
    });
    item.dataset.navigationInitialized = 'true';
  });
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

  if (!initialized) {
    menuButton?.addEventListener('click', () => toggleDrawer());
    closeDrawerButton?.addEventListener('click', closeDrawer);
    navDrawer?.addEventListener('navigation-drawer-changed', (event) => {
      const drawerEvent = event as NavigationDrawerChangedEvent;
      syncDrawerState(drawerEvent.detail?.opened ?? Boolean(navDrawer?.opened));
    });
    initialized = true;
  }

  initNavigationItems();
  syncDrawerState(Boolean(navDrawer?.opened));
}
