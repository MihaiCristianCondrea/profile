interface DrawerModule {
  initNavigationDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

function createDrawerMarkup(): HTMLElement & { opened: boolean } {
  document.body.innerHTML = `
    <header data-drawer-inert-target>
      <button id="menuButton"><span id="menuButtonIcon">menu</span></button>
    </header>
    <div id="drawer-layer" aria-hidden="true">
      <md-navigation-drawer-modal id="navDrawer">
        <button id="closeDrawerButton">Close</button>
        <a class="nav-item" href="#home">Home</a>
        <button id="aboutToggle" aria-controls="aboutContent" aria-expanded="false">About</button>
        <div id="aboutContent" aria-hidden="true">About content</div>
        <button id="androidAppsToggle" aria-controls="androidAppsContent" aria-expanded="false">Apps</button>
        <div id="androidAppsContent" aria-hidden="true">Apps content</div>
      </md-navigation-drawer-modal>
    </div>
    <main data-drawer-inert-target>Main</main>
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

  test('opens and closes while synchronizing focus and modal accessibility', () => {
    const drawer = createDrawerMarkup();
    const menu = document.getElementById('menuButton') as HTMLElement;
    const firstItem = drawer.querySelector('.nav-item') as HTMLElement;
    const firstFocus = jest.spyOn(firstItem, 'focus');
    const menuFocus = jest.spyOn(menu, 'focus');
    const drawerModule = require(
      '../../../../src/features/navigation-drawer/presentation/NavigationDrawer',
    ) as DrawerModule;

    drawerModule.initNavigationDrawer();
    drawerModule.openDrawer();

    expect(drawer.opened).toBe(true);
    expect(document.body.classList.contains('drawer-is-open')).toBe(true);
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(firstFocus).toHaveBeenCalledTimes(1);
    document.querySelectorAll<HTMLElement>('[data-drawer-inert-target]').forEach((element) => {
      expect(element.inert).toBe(true);
      expect(element.getAttribute('aria-hidden')).toBe('true');
    });

    drawerModule.closeDrawer();

    expect(drawer.opened).toBe(false);
    expect(document.body.classList.contains('drawer-is-open')).toBe(false);
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(menuFocus).toHaveBeenCalledTimes(1);
    document.querySelectorAll<HTMLElement>('[data-drawer-inert-target]').forEach((element) => {
      expect(element.inert).toBe(false);
      expect(element.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  test('keeps expandable section state and ARIA attributes aligned', () => {
    createDrawerMarkup();
    const drawerModule = require(
      '../../../../src/features/navigation-drawer/presentation/NavigationDrawer',
    ) as DrawerModule;
    drawerModule.initNavigationDrawer();
    const toggle = document.getElementById('aboutToggle') as HTMLElement;
    const content = document.getElementById('aboutContent') as HTMLElement;

    expect(content.hidden).toBe(true);
    toggle.click();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.classList.contains('expanded')).toBe(true);
    expect(content.hidden).toBe(false);
    expect(content.getAttribute('aria-hidden')).toBe('false');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(content.hidden).toBe(true);
    expect(content.getAttribute('aria-hidden')).toBe('true');
  });
});
