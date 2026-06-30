// @ts-nocheck
let menuButton, navDrawer, closeDrawerButton, drawerLayer,
    aboutToggle, aboutContent, androidAppsToggle, androidAppsContent,
    inertTargets = [];

/**
 * Initializes the navigation drawer functionality.
 * Must be called after DOM is ready.
 */
function initNavigationDrawer() {
    menuButton = getDynamicElement('menuButton');
    navDrawer = getDynamicElement('navDrawer');
    closeDrawerButton = getDynamicElement('closeDrawerButton');
    drawerLayer = getDynamicElement('drawer-layer');
    aboutToggle = getDynamicElement('aboutToggle');
    aboutContent = getDynamicElement('aboutContent');
    androidAppsToggle = getDynamicElement('androidAppsToggle');
    androidAppsContent = getDynamicElement('androidAppsContent');

    inertTargets = Array.from(document.querySelectorAll('[data-drawer-inert-target]'));

    if (menuButton) {
        menuButton.addEventListener('click', () => toggleDrawer());
        menuButton.setAttribute('aria-expanded', 'false');
    }
    if (closeDrawerButton) {
        closeDrawerButton.addEventListener('click', () => toggleDrawer(false));
    }
    if (drawerLayer) {
        drawerLayer.addEventListener('click', (event) => {
            if (event.target === drawerLayer) {
                toggleDrawer(false);
            }
        });
    }

    if (navDrawer) {
        navDrawer.addEventListener('navigation-drawer-changed', (event) => {
            const opened = event && event.detail && typeof event.detail.opened === 'boolean'
                ? event.detail.opened
                : navDrawer.opened;
            syncDrawerState(opened);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navDrawer && navDrawer.opened) {
            toggleDrawer(false);
        }
    });

    _initToggleSection(aboutToggle, aboutContent);
    _initToggleSection(androidAppsToggle, androidAppsContent);

    syncDrawerState(Boolean(navDrawer && navDrawer.opened));
}

/**
 * Toggles the navigation drawer.
 */
function toggleDrawer(forceOpen) {
    if (!navDrawer) return;
    const isOpen = forceOpen !== undefined ? forceOpen : !navDrawer.opened;
    navDrawer.opened = isOpen;
    syncDrawerState(isOpen);
}

/**
 * Closes the navigation drawer.
 * Exported for router use.
 */
function closeDrawer() {
    toggleDrawer(false);
}

function openDrawer() {
    toggleDrawer(true);
}

/**
 * Initializes a toggleable section within the drawer.
 * @private
 * @param {HTMLElement} toggleButton - The button that triggers the toggle.
 * @param {HTMLElement} contentElement - The content element to show/hide.
 */
function _initToggleSection(toggleButton, contentElement) {
    if (!toggleButton || !contentElement) return;

    toggleButton.addEventListener('click', () => {
        const isExpanded = contentElement.classList.contains('open');

        if (contentElement.id === 'aboutContent' && androidAppsContent && androidAppsContent.classList.contains('open')) {
            androidAppsContent.classList.remove('open');
            if (androidAppsToggle) {
                androidAppsToggle.setAttribute('aria-expanded', 'false');
                androidAppsToggle.classList.remove('expanded');
            }
            androidAppsContent.setAttribute('aria-hidden', 'true');
        } else if (contentElement.id === 'androidAppsContent' && aboutContent && aboutContent.classList.contains('open')) {
            aboutContent.classList.remove('open');
            if (aboutToggle) {
                aboutToggle.setAttribute('aria-expanded', 'false');
                aboutToggle.classList.remove('expanded');
            }
            aboutContent.setAttribute('aria-hidden', 'true');
        }

        contentElement.classList.toggle('open', !isExpanded);
        toggleButton.classList.toggle('expanded', !isExpanded);
        toggleButton.setAttribute('aria-expanded', String(!isExpanded));
        contentElement.setAttribute('aria-hidden', String(isExpanded));
    });
}

function focusFirstNavItem() {
    if (!navDrawer) return;

    const firstNavItem = navDrawer.querySelector('.nav-item[href]');
    if (firstNavItem && typeof firstNavItem.focus === 'function') {
        firstNavItem.focus();
        return;
    }

    if (closeDrawerButton && typeof closeDrawerButton.focus === 'function') {
        closeDrawerButton.focus();
    }
}

function syncDrawerState(isOpened) {
    if (!navDrawer) return;

    const isDrawerOpen = Boolean(isOpened);

    if (drawerLayer) {
        drawerLayer.classList.toggle('open', isDrawerOpen);
        drawerLayer.setAttribute('aria-hidden', String(!isDrawerOpen));
    }

    updateModalAccessibilityState(isDrawerOpen);

    if (isDrawerOpen) {
        document.body.classList.add('drawer-is-open');
        focusFirstNavItem();
    } else {
        document.body.classList.remove('drawer-is-open');
        if (menuButton) menuButton.focus();
    }

    if (menuButton) {
        menuButton.setAttribute('aria-expanded', String(isDrawerOpen));
        menuButton.setAttribute('aria-label', isDrawerOpen ? 'Close menu' : 'Open menu');
        const triggerIcon = document.getElementById('menuButtonIcon');
        if (triggerIcon) {
            triggerIcon.textContent = isDrawerOpen ? 'menu_open' : 'menu';
        }
    }
}

function updateModalAccessibilityState(isOpened) {
    if (!Array.isArray(inertTargets) || inertTargets.length === 0) {
        return;
    }

    const shouldDisableTargets = Boolean(isOpened);

    inertTargets.forEach((element) => {
        if (!element) {
            return;
        }

        element.toggleAttribute('inert', shouldDisableTargets);

        if (shouldDisableTargets) {
            element.setAttribute('aria-hidden', 'true');
        } else {
            element.removeAttribute('aria-hidden');
        }
    });
}

if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, { initNavigationDrawer, toggleDrawer, openDrawer, closeDrawer });
}
