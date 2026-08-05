interface NavigationDrawerElement extends HTMLElement {
  opened: boolean;
}

interface NavigationDrawerChangedEvent extends Event {
  detail?: { opened?: boolean };
}

interface DrawerSectionConfig {
  id: string;
  label: string;
  icon: string;
  itemSelectors: readonly string[];
  defaultExpanded: boolean;
}

const DRAWER_SECTIONS: readonly DrawerSectionConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: 'info',
    itemSelectors: ['#navContactLink', '#navAboutMeLink'],
    defaultExpanded: false,
  },
  {
    id: 'androidApps',
    label: 'Android Apps',
    icon: 'apps',
    itemSelectors: [
      '#navSmartCleanerLink',
      '#navAdsHelpCenterLink',
      '[href="#privacy-policy-end-user-software"]',
      '[href="#terms-of-service-end-user-software"]',
      '#navLegalNoticesLink',
    ],
    defaultExpanded: true,
  },
];

let menuButton: HTMLElement | null = null;
let navDrawer: NavigationDrawerElement | null = null;
let closeDrawerButton: HTMLElement | null = null;
let drawerLayer: HTMLElement | null = null;
let sectionObserver: MutationObserver | null = null;
let initialized = false;

function syncDrawerState(opened: boolean): void {
  drawerLayer?.classList.toggle('open', opened);
  drawerLayer?.setAttribute('aria-hidden', String(!opened));

  menuButton?.setAttribute('aria-expanded', String(opened));
  menuButton?.setAttribute('aria-label', opened ? 'Close menu' : 'Open menu');

  const triggerIcon = document.getElementById('menuButtonIcon');
  if (triggerIcon) triggerIcon.textContent = opened ? 'menu_open' : 'menu';
}

function bindKeyboardActivation(element: HTMLElement): void {
  if (element.dataset.keyboardActivationInitialized === 'true') return;

  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    element.click();
  });
  element.dataset.keyboardActivationInitialized = 'true';
}

function setSectionExpanded(
  toggle: HTMLElement,
  content: HTMLElement,
  expanded: boolean,
): void {
  toggle.setAttribute('aria-expanded', String(expanded));
  content.hidden = !expanded;
  content.setAttribute('aria-hidden', String(!expanded));

  const chevron = toggle.querySelector<HTMLElement>('.drawer-section-chevron');
  if (chevron) chevron.textContent = expanded ? 'expand_less' : 'expand_more';
}

function bindSectionToggle(toggle: HTMLElement, content: HTMLElement): void {
  if (toggle.dataset.sectionInitialized === 'true') return;

  toggle.addEventListener('click', () => {
    setSectionExpanded(toggle, content, toggle.getAttribute('aria-expanded') !== 'true');
  });
  bindKeyboardActivation(toggle);
  toggle.dataset.sectionInitialized = 'true';
}

function createDrawerSection(
  drawerContent: HTMLElement,
  config: DrawerSectionConfig,
): void {
  const toggleId = `${config.id}Toggle`;
  const contentId = `${config.id}Content`;
  if (document.getElementById(toggleId)) return;

  const items = config.itemSelectors
    .map((selector) => drawerContent.querySelector<HTMLElement>(selector))
    .filter((item): item is HTMLElement => Boolean(item));
  const firstItem = items[0];
  if (!firstItem) return;

  const divider = document.createElement('md-divider');
  divider.className = 'drawer-section-divider';
  divider.setAttribute('aria-hidden', 'true');

  const toggle = document.createElement('md-item');
  toggle.id = toggleId;
  toggle.className = 'nav-item drawer-section-toggle';
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('tabindex', '0');
  toggle.setAttribute('aria-controls', contentId);
  toggle.innerHTML = `
    <span class="nav-item-container" slot="container" aria-hidden="true"></span>
    <md-icon slot="start">${config.icon}</md-icon>
    <span>${config.label}</span>
    <md-icon class="drawer-section-chevron" slot="end" aria-hidden="true"></md-icon>
  `;

  const content = document.createElement('div');
  content.id = contentId;
  content.className = 'drawer-section-content';
  content.setAttribute('role', 'group');
  content.setAttribute('aria-labelledby', toggleId);
  content.dataset.sectionToggleId = toggleId;

  drawerContent.insertBefore(divider, firstItem);
  drawerContent.insertBefore(toggle, firstItem);
  drawerContent.insertBefore(content, firstItem);

  items.forEach((item) => {
    item.classList.add('nested-nav-item');
    item.querySelector('md-icon[slot="start"]')?.remove();
    content.append(item);
  });

  setSectionExpanded(toggle, content, config.defaultExpanded);
  bindSectionToggle(toggle, content);
}

function initNavigationSections(): void {
  const drawerContent = navDrawer?.querySelector<HTMLElement>('.drawer-content');
  if (!drawerContent || drawerContent.dataset.sectionsInitialized === 'true') return;

  DRAWER_SECTIONS.forEach((config) => createDrawerSection(drawerContent, config));
  drawerContent.dataset.sectionsInitialized = 'true';
}

function revealSectionForActiveItem(item: HTMLElement): void {
  if (!item.hasAttribute('data-active')) return;

  const content = item.closest<HTMLElement>('.drawer-section-content');
  const toggleId = content?.dataset.sectionToggleId;
  const toggle = toggleId ? document.getElementById(toggleId) : null;
  if (content && toggle) setSectionExpanded(toggle, content, true);
}

function observeActiveNavigationItems(): void {
  sectionObserver?.disconnect();
  if (!navDrawer) return;

  sectionObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target instanceof HTMLElement) {
        revealSectionForActiveItem(mutation.target);
      }
    });
  });
  sectionObserver.observe(navDrawer, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-active'],
  });

  navDrawer
    .querySelectorAll<HTMLElement>('.drawer-section-content .nav-item[data-active]')
    .forEach(revealSectionForActiveItem);
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
    bindKeyboardActivation(item);
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

  initNavigationSections();
  initNavigationItems();
  observeActiveNavigationItems();
  syncDrawerState(Boolean(navDrawer?.opened));
}
