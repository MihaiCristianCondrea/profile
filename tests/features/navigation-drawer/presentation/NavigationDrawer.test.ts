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
        <md-item class="nav-item" href="#home" role="link" tabindex="0">Home</md-item>
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
    const item = document.querySelector<HTMLElement>('.nav-item') as HTMLElement;
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
});
