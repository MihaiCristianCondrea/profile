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


    if (pageId === 'home') {
        pageContentArea.innerHTML = initialHomepageHTML;
        pageTitle = "Mihai's Profile";
        if (typeof fetchBlogPosts === 'function' && document.getElementById('newsGrid')) {
            fetchBlogPosts();
        }
    } else if (pageId === 'privacy-policy') {
        try {
            const response = await fetch('pages/more/privacy-policy.html');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const contentHTML = await response.text();
            pageContentArea.innerHTML = contentHTML;
            pageTitle = 'Privacy Policy';
        } catch (error) {
            console.error('Error loading privacy policy:', error);
            pageContentArea.innerHTML = `<div class="page-section active"><p class="error-message text-red-500">Failed to load page. ${error.message}</p></div>`;
            pageTitle = 'Error';
        }
    } else if (pageId === 'ads-help-center') {
        try {
            const response = await fetch('pages/more/apps/ads-help-center.html');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const contentHTML = await response.text();
            pageContentArea.innerHTML = contentHTML;
            pageTitle = 'Ads Help Center';
        } catch (error) {
            console.error('Error loading Ads Help Center:', error);
            pageContentArea.innerHTML = `<div class="page-section active"><p class="error-message text-red-500">Failed to load page. ${error.message}</p></div>`;
            pageTitle = 'Error';
        }
    } else {
        console.warn('Router: Unknown page:', pageId);
        pageContentArea.innerHTML = `<div class="page-section active"><p>Page not found: ${pageId}</p></div>`;
        pageTitle = 'Not Found';
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