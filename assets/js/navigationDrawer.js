let menuButton, navDrawer, closeDrawerButton, drawerOverlay,
    moreToggle, moreContent, appsToggle, appsContent;

/**
 * Initializes the navigation drawer functionality.
 * Must be called after DOM is ready.
 */
function initNavigationDrawer() {
    menuButton = getDynamicElement('menuButton');
    navDrawer = getDynamicElement('navDrawer');
    closeDrawerButton = getDynamicElement('closeDrawerButton');
    drawerOverlay = getDynamicElement('drawerOverlay');
    moreToggle = getDynamicElement('moreToggle');
    moreContent = getDynamicElement('moreContent');
    appsToggle = getDynamicElement('appsToggle');
    appsContent = getDynamicElement('appsContent');

    if (menuButton) menuButton.addEventListener('click', openDrawer);
    if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navDrawer && navDrawer.classList.contains('open')) {
            closeDrawer();
        }
    });

    _initToggleSection(moreToggle, moreContent);
    _initToggleSection(appsToggle, appsContent);
}

/**
 * Opens the navigation drawer.
 */
function openDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.add('open');
        drawerOverlay.classList.add('open');
        if (closeDrawerButton) closeDrawerButton.focus();
    }
}

/**
 * Closes the navigation drawer.
 */
function closeDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
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

        if (contentElement.id === 'moreContent' && appsContent && appsContent.classList.contains('open')) {
            appsContent.classList.remove('open');
            if (appsToggle) {
                appsToggle.setAttribute('aria-expanded', 'false');
                appsToggle.classList.remove('expanded');
            }
            appsContent.setAttribute('aria-hidden', 'true');
        } else if (contentElement.id === 'appsContent' && moreContent && moreContent.classList.contains('open')) {
            moreContent.classList.remove('open');
            if (moreToggle) {
                moreToggle.setAttribute('aria-expanded', 'false');
                moreToggle.classList.remove('expanded');
            }
            moreContent.setAttribute('aria-hidden', 'true');
        }

        contentElement.classList.toggle('open', !isExpanded);
        toggleButton.classList.toggle('expanded', !isExpanded);
        toggleButton.setAttribute('aria-expanded', String(!isExpanded));
        contentElement.setAttribute('aria-hidden', String(isExpanded));
    });
}