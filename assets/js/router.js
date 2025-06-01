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
            case 'privacy-policy-website':
                pagePath = 'pages/more/privacy-policy.html';
                pageTitle = 'Privacy Policy';
                break;
            case 'ads-help-center':
                pagePath = 'pages/more/apps/ads-help-center.html';
                pageTitle = 'Ads Help Center';
                break;
            case 'legal-notices':
                pagePath = 'pages/more/apps/legal-notices.html';
                pageTitle = 'Legal Notices';
                break;
            case 'code-of-conduct-website':
                pagePath = 'pages/more/code-of-conduct.html';
                pageTitle = 'Code of Conduct';
                break;
            case 'privacy-policy-apps':
                pagePath = 'pages/more/apps/privacy-policy-apps.html';
                pageTitle = 'Privacy Policy';
                break;
            case 'terms-of-service-apps':
                pagePath = 'pages/more/apps/terms-of-service-apps.html';
                pageTitle = 'Terms of Service';
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