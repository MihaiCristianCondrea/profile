// Global DOM element references needed by multiple modules or for initialization
let pageContentAreaEl, mainContentPageOriginalEl, appBarHeadlineEl,
    navHomeLinkEl, navPrivacyPolicyLinkEl, topAppBarEl;

document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    pageContentAreaEl = getDynamicElement('pageContentArea');
    mainContentPageOriginalEl = getDynamicElement('mainContentPage'); // The initial home content div from index.html
    appBarHeadlineEl = getDynamicElement('appBarHeadline');
    navHomeLinkEl = getDynamicElement('navHomeLink');
    navPrivacyPolicyLinkEl = getDynamicElement('navPrivacyPolicyLink');
    topAppBarEl = getDynamicElement('topAppBar');


    // --- Initialize Modules ---
    setCopyrightYear(); // From utils.js
    initTheme();        // From theme.js
    initNavigationDrawer(); // From navigationDrawer.js

    let initialHomeHTMLString = "<p>Error: Home content missing.</p>"; // Fallback
    if (mainContentPageOriginalEl) {
        initialHomeHTMLString = mainContentPageOriginalEl.outerHTML;
    } else {
        console.error("App.js: Initial home content (#mainContentPage) not found!");
    }
    initRouter(pageContentAreaEl, appBarHeadlineEl, initialHomeHTMLString); // From router.js

    // --- Setup Event Listeners for SPA Navigation ---
    if (navHomeLinkEl) {
        navHomeLinkEl.addEventListener('click', (e) => {
            e.preventDefault();
            loadPageContent('home'); // From router.js
        });
    }
    if (navPrivacyPolicyLinkEl) {
        navPrivacyPolicyLinkEl.addEventListener('click', (e) => {
            e.preventDefault();
            loadPageContent('privacy-policy'); // From router.js
        });
    }
    // Add listeners for other SPA links here if any

    // --- Handle Initial Page Load & Browser History ---
    const initialPageIdFromHash = window.location.hash || '#home';
    loadPageContent(initialPageIdFromHash, false); // Load initial page without pushing to history

    window.addEventListener('popstate', (event) => {
        let pageId = '#home'; // Default
        if (event.state && event.state.page) {
            pageId = event.state.page;
        } else if (window.location.hash) {
            pageId = window.location.hash;
        }
        loadPageContent(pageId, false); // Load content based on popstate, don't push to history
    });

    // --- App Bar Scroll Behavior (from original script) ---
    if (topAppBarEl) {
        window.addEventListener('scroll', () => {
            const isScrolled = window.scrollY > 0;
            topAppBarEl.classList.toggle('scrolled', isScrolled);
        });
    }
});