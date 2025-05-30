let pageContentArea, appBarHeadline;
let initialHomepageHTML = ''; // Will be set by app.js

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
    if (typeof closeDrawer === 'function') closeDrawer(); // Assumes closeDrawer is globally available

    let pageTitle = "Mihai's Profile";
    let newUrlFragment = 'home'; // For history and active nav link

    if (!pageContentArea) {
        console.error("Router: pageContentArea element not set. Call initRouter first.");
        return;
    }

    // Normalize pageId (e.g., if coming from hash like #home)
    if (pageId.startsWith('#')) {
        pageId = pageId.substring(1);
    }
    if (pageId === '' || pageId === 'index.html') {
        pageId = 'home'; // Normalize to 'home'
    }
    newUrlFragment = pageId;


    if (pageId === 'home') {
        pageContentArea.innerHTML = initialHomepageHTML;
        pageTitle = "Mihai's Profile";
        if (typeof fetchBlogPosts === 'function' && getDynamicElement('newsGrid')) {
            fetchBlogPosts(); // Re-fetch blog posts for home page
        }
    } else if (pageId === 'privacy-policy') {
        try {
            // Ensure correct path relative to index.html
            const response = await fetch('pages/privacy-policy-content.html');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const contentHTML = await response.text();
            pageContentArea.innerHTML = contentHTML;
            pageTitle = 'Privacy Policy';
        } catch (error) {
            console.error('Error loading privacy policy:', error);
            pageContentArea.innerHTML = `<div class="page-section"><p class="error-message text-red-500">Failed to load page. ${error.message}</p></div>`;
            pageTitle = 'Error';
        }
    } else {
        console.warn('Router: Unknown page:', pageId);
        pageContentArea.innerHTML = `<div class="page-section"><p>Page not found: ${pageId}</p></div>`;
        pageTitle = 'Not Found';
    }

    if (appBarHeadline) appBarHeadline.textContent = pageTitle;
    document.title = pageTitle + " - Mihai's Profile"; // Update browser tab title

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
    // Normalize
    if (currentPageId.startsWith('#')) {
        currentPageId = currentPageId.substring(1);
    }
    if (currentPageId === '' || currentPageId === 'index.html') {
        currentPageId = 'home';
    }

    document.querySelectorAll('#navDrawer md-list-item[href]').forEach(item => {
        item.classList.remove('nav-item-active'); // Using a custom class for styling
        if (item.hasAttribute('active')) { // For MWC components that might use 'active' attribute
            item.removeAttribute('active');
        }
         if (typeof item.active === 'boolean' && item.active) { // For MWC components property
            item.active = false;
        }


        let itemHref = item.getAttribute('href');
        if (itemHref) {
            itemHref = itemHref.startsWith('#') ? itemHref.substring(1) : itemHref;
            if (itemHref === currentPageId) {
                item.classList.add('nav-item-active');
                 if (typeof item.active === 'boolean') item.active = true;


                // Expand parent accordion if item is inside a nested list
                const nestedParent = item.closest('.nested-list');
                if (nestedParent && nestedParent.id) {
                    const toggleButton = document.querySelector(`[aria-controls="${nestedParent.id}"]`);
                    if (toggleButton && !toggleButton.classList.contains('expanded')) {
                        // Simulate a click or directly call the toggle logic if available
                        // For simplicity, if _initToggleSection is global or accessible, you could call it
                        // Or, more robustly, the toggleButton itself should handle its state.
                        // A direct click might be simplest if event listeners are attached.
                        toggleButton.click(); // This assumes the click listener in navigationDrawer.js handles expansion.
                    }
                }
            }
        }
    });
}