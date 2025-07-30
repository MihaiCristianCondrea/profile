let menuButton, navDrawer, closeDrawerButton, drawerOverlay,
    aboutToggle, aboutContent, androidAppsToggle, androidAppsContent;

/**
 * Initializes the navigation drawer functionality.
 * Must be called after DOM is ready.
 */
function initNavigationDrawer() {
    menuButton = getDynamicElement('menuButton');
    navDrawer = getDynamicElement('navDrawer');
    closeDrawerButton = getDynamicElement('closeDrawerButton');
    drawerOverlay = getDynamicElement('drawerOverlay');
    aboutToggle = getDynamicElement('aboutToggle');
    aboutContent = getDynamicElement('aboutContent');
    androidAppsToggle = getDynamicElement('androidAppsToggle');
    androidAppsContent = getDynamicElement('androidAppsContent');

    if (menuButton) menuButton.addEventListener('click', openDrawer);
    if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navDrawer && navDrawer.opened) {
            closeDrawer();
        }
    });

    _initToggleSection(aboutToggle, aboutContent);
    _initToggleSection(androidAppsToggle, androidAppsContent);
}

/**
 * Opens the navigation drawer.
 */
function openDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.opened = true;
        drawerOverlay.classList.add('open');
        document.body.classList.add('drawer-is-open');
        if (closeDrawerButton) closeDrawerButton.focus();
    }
}

/**
 * Closes the navigation drawer.
 */
function closeDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.opened = false;
        drawerOverlay.classList.remove('open');
        document.body.classList.remove('drawer-is-open');
        if (menuButton) menuButton.focus();
    }
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