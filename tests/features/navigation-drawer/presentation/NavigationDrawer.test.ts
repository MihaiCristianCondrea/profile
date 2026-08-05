interface DrawerModule {
  initNavigationDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

function createDrawerMarkup(): HTMLElement & { opened: boolean } {
  document.body.innerHTML = `
    <button id="menuButton" aria-expanded="false">
      <span id="menuButtonIcon">menu</span>
    </button>
    <div id="drawer-layer" aria-hidden="true">
      <md-navigation-drawer-modal id="navDrawer">
        <button id="closeDrawerButton">Close</button>
        <div class="drawer-content">
          <md-item id="navHomeLink" class="nav-item" href="#home" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">home</md-icon>
            Home
          </md-item>
          <md-item class="nav-item" href="https://example.com" target="_blank" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">article</md-icon>
            Blogs
          </md-item>
          <md-item id="navContactLink" class="nav-item" href="#contact" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">contact_mail</md-icon>
            Contact
          </md-item>
          <md-item id="navAboutMeLink" class="nav-item" href="#about-me" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">person</md-icon>
            About Me
          </md-item>
          <md-item id="navSmartCleanerLink" class="nav-item" href="#smart-cleaner-for-android" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">cleaning_services</md-icon>
            Smart Cleaner
          </md-item>
          <md-item id="navAdsHelpCenterLink" class="nav-item" href="#ads-help-center" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">ads_click</md-icon>
            Ads Help Center
          </md-item>
          <md-item class="nav-item" href="#privacy-policy-end-user-software" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">privacy_tip</md-icon>
            Privacy Policy
          </md-item>
          <md-item class="nav-item" href="#terms-of-service-end-user-software" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">gavel</md-icon>
            Terms of Service
          </md-item>
          <md-item id="navLegalNoticesLink" class="nav-item" href="#legal-notices" role="link" tabindex="0">
            <span class="nav-item-container" slot="container"></span>
            <md-icon slot="start">policy</md-icon>
            Legal Notices
          </md-item>
        </div>
      </md-navigation-drawer-modal>
    </div>
  `;

  const drawer = document.getElementById('navDrawer') as HTMLElement & { opened: boolean };
  drawer.opened = false;
  return drawer;
}

describe('NavigationDrawer', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.className = '';
  });

  test('opens and closes while synchronizing the reference drawer shell', () => {
    const drawer = createDrawerMarkup();
    const drawerModule = require(
      '../../../../src/features/navigation-drawer/presentation/NavigationDrawer',
    ) as DrawerModule;
    const menu = document.getElementById('menuButton') as HTMLElement;
    const menuIcon = document.getElementById('menuButtonIcon') as HTMLElement;
    const layer = document.getElementById('drawer-layer') as HTMLElement;

    drawerModule.initNavigationDrawer();
    drawerModule.openDrawer();

    expect(drawer.opened).toBe(true);
    expect(layer.classList.contains('open')).toBe(true);
    expect(layer.getAttribute('aria-hidden')).toBe('false');
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(menu.getAttribute('aria-label')).toBe('Close menu');
    expect(menuIcon.textContent).toBe('menu_open');

    drawerModule.closeDrawer();

    expect(drawer.opened).toBe(false);
    expect(layer.classList.contains('open')).toBe(false);
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(menu.getAttribute('aria-label')).toBe('Open menu');
    expect(menuIcon.textContent).toBe('menu');
  });

  test('activates md-item navigation from Enter and Space', () => {
    createDrawerMarkup();
    const drawerModule = require(
      '../../../../src/features/navigation-drawer/presentation/NavigationDrawer',
    ) as DrawerModule;
    const item = document.getElementById('navHomeLink') as HTMLElement;
    const clickListener = jest.fn();
    item.addEventListener('click', clickListener);

    drawerModule.initNavigationDrawer();
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(clickListener).toHaveBeenCalledTimes(2);
  });

  test('tracks changes emitted by the Material modal drawer', () => {
    const drawer = createDrawerMarkup();
    const drawerModule = require(
      '../../../../src/features/navigation-drawer/presentation/NavigationDrawer',
    ) as DrawerModule;
    const layer = document.getElementById('drawer-layer') as HTMLElement;

    drawerModule.initNavigationDrawer();
    drawer.opened = true;
    drawer.dispatchEvent(new CustomEvent('navigation-drawer-changed', {
      detail: { opened: true },
    }));

    expect(layer.classList.contains('open')).toBe(true);
    expect(layer.getAttribute('aria-hidden')).toBe('false');
  });

  test('creates independently expandable Profile and Android Apps groups', () => {
    createDrawerMarkup();
    const drawerModule = require(
      '../../../../src/features/navigation-drawer/presentation/NavigationDrawer',
    ) as DrawerModule;

    drawerModule.initNavigationDrawer();

    const profileToggle = document.getElementById('profileToggle') as HTMLElement;
    const profileContent = document.getElementById('profileContent') as HTMLElement;
    const androidToggle = document.getElementById('androidAppsToggle') as HTMLElement;
    const androidContent = document.getElementById('androidAppsContent') as HTMLElement;

    expect(profileToggle.getAttribute('aria-expanded')).toBe('false');
    expect(profileContent.hidden).toBe(true);
    expect(profileContent.querySelectorAll('.nested-nav-item')).toHaveLength(2);
    expect(androidToggle.getAttribute('aria-expanded')).toBe('true');
    expect(androidContent.hidden).toBe(false);
    expect(androidContent.querySelectorAll('.nested-nav-item')).toHaveLength(5);
    expect(document.querySelectorAll('.drawer-section-divider')).toHaveLength(2);

    profileToggle.click();
    expect(profileToggle.getAttribute('aria-expanded')).toBe('true');
    expect(profileContent.hidden).toBe(false);
    expect(profileToggle.querySelector('.drawer-section-chevron')?.textContent).toBe('expand_less');

    androidToggle.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(androidToggle.getAttribute('aria-expanded')).toBe('false');
    expect(androidContent.hidden).toBe(true);
  });

  test('opens a collapsed group when one of its routes becomes active', async () => {
    createDrawerMarkup();
    const drawerModule = require(
      '../../../../src/features/navigation-drawer/presentation/NavigationDrawer',
    ) as DrawerModule;

    drawerModule.initNavigationDrawer();

    const profileToggle = document.getElementById('profileToggle') as HTMLElement;
    const profileContent = document.getElementById('profileContent') as HTMLElement;
    const contact = document.getElementById('navContactLink') as HTMLElement;

    expect(profileContent.hidden).toBe(true);
    contact.setAttribute('data-active', '');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(profileToggle.getAttribute('aria-expanded')).toBe('true');
    expect(profileContent.hidden).toBe(false);
  });
});
