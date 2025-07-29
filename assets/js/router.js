let pageContentArea, appBarHeadline;
let initialHomepageHTML = '';

/**
 * Initializes the router with necessary DOM elements.
 * Must be called after DOM is ready.
 * @param {HTMLElement} contentAreaEl - The main content area element.
 * @param {HTMLElement} appBarHeadlineEl - The app bar headline element.
 * @param {string} homeHTML - The initial HTML string for the home page.
 */
function initRouter(contentAreaEl, appBarHeadlineEl, homeHTML) {
    pageContentArea = contentAreaEl;
    appBarHeadline = appBarHeadlineEl;
    initialHomepageHTML = homeHTML;
}

/**
 * Loads content for a given pageId into the main content area.
 * @param {string} pageId - The ID of the page to load (e.g., 'home', 'privacy-policy').
 * @param {boolean} [updateHistory=true] - Whether to update browser history.
 */
async function loadPageContent(pageId, updateHistory = true) {
    if (typeof closeDrawer === 'function') closeDrawer();

    let pageTitle = "Mihai's Profile";
    let newUrlFragment = 'home';
    let pagePath = '';

    if (!pageContentArea) {
        console.error("Router: pageContentArea element not set. Call initRouter first.");
        return;
    }

    if (pageId.startsWith('#')) {
        pageId = pageId.substring(1);
    }
    if (pageId === '' || pageId === 'index.html') {
        pageId = 'home';
    }
    newUrlFragment = pageId;

    let errorContent = `<div class="page-section active"><p class="error-message text-red-500">Failed to load page. An unknown error occurred.</p></div>`;

    if (pageId === 'home') {
        pageContentArea.innerHTML = initialHomepageHTML;
        pageTitle = "Mihai's Profile";
        if (typeof fetchBlogPosts === 'function' && document.getElementById('newsGrid')) {
            fetchBlogPosts();
        }
    } else {
        switch (pageId) {
            case 'privacy-policy':
                pagePath = 'pages/drawer/more/privacy-policy.html';
                pageTitle = 'Privacy Policy';
                break;
            case 'songs':
                pagePath = 'pages/drawer/songs.html';
                pageTitle = 'My Music';
                break;
            case 'contact':
                pagePath = 'pages/drawer/contact.html';
                pageTitle = 'Contact';
                break;
            case 'ads-help-center':
                pagePath = 'pages/drawer/more/apps/ads-help-center.html';
                pageTitle = 'Ads Help Center';
                break;
            case 'legal-notices':
                pagePath = 'pages/drawer/more/apps/legal-notices.html';
                pageTitle = 'Legal Notices';
                break;
            case 'code-of-conduct':
                pagePath = 'pages/drawer/more/code-of-conduct.html';
                pageTitle = 'Code of Conduct';
                break;
            case 'privacy-policy-end-user-software':
                pagePath = 'pages/drawer/more/apps/privacy-policy-apps.html';
                pageTitle = 'Privacy Policy – End-User Software';
                break;
            case 'terms-of-service-end-user-software':
                pagePath = 'pages/drawer/more/apps/terms-of-service-apps.html';
                pageTitle = 'Terms of Service – End-User Software';
                break;
            case 'resume':
                pagePath = 'pages/resume/resume.html';
                pageTitle = "Mihai's Resume";
                break;

            default:
                console.warn('Router: Unknown page:', pageId);
                pageContentArea.innerHTML = `<div class="page-section active"><p>Page not found: ${pageId}</p></div>`;
                pageTitle = 'Not Found';
                if (appBarHeadline) appBarHeadline.textContent = pageTitle;
                document.title = pageTitle + " - Mihai's Profile";
                if (updateHistory && window.history.pushState) {
                     window.history.pushState({ page: pageId }, pageTitle, `#${newUrlFragment}`);
                }
                window.scrollTo(0, 0);
                updateActiveNavLink(newUrlFragment);
                return;
        }

        try {
            const response = await fetch(pagePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${pagePath}`);
            }
            const contentHTML = await response.text();
            pageContentArea.innerHTML = contentHTML;
            if (pageId === 'songs' && typeof loadSongs === 'function' && document.getElementById('songsGrid')) {
                loadSongs();
            } else if (pageId === 'resume' && typeof initResumePage === 'function') {
                initResumePage();
            }
        } catch (error) {
            console.error(`Error loading ${pageTitle}:`, error);
            errorContent = `<div class="page-section active"><p class="error-message text-red-500">Failed to load page: ${pageTitle}. ${error.message}</p></div>`;
            pageContentArea.innerHTML = errorContent;
            pageTitle = 'Error';
        }
    }

    if (appBarHeadline) appBarHeadline.textContent = pageTitle;
    document.title = pageTitle + " - Mihai's Profile";

    if (updateHistory && window.history.pushState) {
        window.history.pushState({ page: pageId }, pageTitle, `#${newUrlFragment}`);
    }
    window.scrollTo(0, 0);
    updateActiveNavLink(newUrlFragment);
}

/**
 * Updates the active state of navigation links in the drawer.
 * @param {string} currentPageId - The ID of the currently active page.
 */
function updateActiveNavLink(currentPageId) {
    if (currentPageId.startsWith('#')) {
        currentPageId = currentPageId.substring(1);
    }
    if (currentPageId === '' || currentPageId === 'index.html') {
        currentPageId = 'home';
    }

    document.querySelectorAll('#navDrawer md-list-item[href]').forEach(item => {
        item.classList.remove('nav-item-active');
        if (item.hasAttribute('active')) {
            item.removeAttribute('active');
        }
         if (typeof item.active === 'boolean' && item.active) {
            item.active = false;
        }


        let itemHref = item.getAttribute('href');
        if (itemHref) {
            itemHref = itemHref.startsWith('#') ? itemHref.substring(1) : itemHref;
            if (itemHref === currentPageId) {
                item.classList.add('nav-item-active');
                 if (typeof item.active === 'boolean') item.active = true;

                const nestedParent = item.closest('.nested-list');
                if (nestedParent && nestedParent.id) {
                    const toggleButton = document.querySelector(`[aria-controls="${nestedParent.id}"]`);
                    if (toggleButton && !toggleButton.classList.contains('expanded')) {
                        toggleButton.click();
                    }
                }
            }
        }
    });
}