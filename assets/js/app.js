// Global DOM element references needed by multiple modules or for initialization
let pageContentAreaEl, mainContentPageOriginalEl, appBarHeadlineEl,
    navHomeLinkEl, navPrivacyPolicyLinkEl, navSongsLinkEl, navContactLinkEl,
    topAppBarEl;

document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    pageContentAreaEl = getDynamicElement('pageContentArea');
    mainContentPageOriginalEl = getDynamicElement('mainContentPage');
    appBarHeadlineEl = getDynamicElement('appBarHeadline');
    navHomeLinkEl = getDynamicElement('navHomeLink');
    navPrivacyPolicyLinkEl = getDynamicElement('navPrivacyPolicyLink');
    navSongsLinkEl = getDynamicElement('navSongsLink');
    navContactLinkEl = getDynamicElement('navContactLink');
    topAppBarEl = getDynamicElement('topAppBar');


    // --- Initialize Modules ---
    setCopyrightYear();
    initTheme();
    initNavigationDrawer();

    let initialHomeHTMLString = "<p>Error: Home content missing.</p>";
    if (mainContentPageOriginalEl) {
        initialHomeHTMLString = mainContentPageOriginalEl.outerHTML;
    } else {
        console.error("App.js: Initial home content (#mainContentPage) not found!");
    }
    initRouter(pageContentAreaEl, appBarHeadlineEl, initialHomeHTMLString);

    // --- Setup Event Listeners for SPA Navigation ---
    if (navHomeLinkEl) {
        navHomeLinkEl.addEventListener('click', (e) => {
            e.preventDefault();
            loadPageContent('home');
        });
    }
    if (navPrivacyPolicyLinkEl) {
        navPrivacyPolicyLinkEl.addEventListener('click', (e) => {
            e.preventDefault();
            loadPageContent('privacy-policy');
        });
    }
    if (navSongsLinkEl) {
        navSongsLinkEl.addEventListener('click', (e) => {
            e.preventDefault();
            loadPageContent('songs');
        });
    }
    if (navContactLinkEl) {
        navContactLinkEl.addEventListener('click', (e) => {
            e.preventDefault();
            loadPageContent('contact');
        });
    }
    // Add listeners for other SPA links here if any

    // --- Handle Initial Page Load & Browser History ---
    const initialPageIdFromHash = window.location.hash || '#home';
    loadPageContent(initialPageIdFromHash, false);

    window.addEventListener('popstate', (event) => {
        let pageId = '#home';
        if (event.state && event.state.page) {
            pageId = event.state.page;
        } else if (window.location.hash) {
            pageId = window.location.hash;
        }
        loadPageContent(pageId, false);
    });

    // --- App Bar Scroll Behavior (from original script) ---
    if (topAppBarEl) {
        window.addEventListener('scroll', () => {
            const isScrolled = window.scrollY > 0;
            topAppBarEl.classList.toggle('scrolled', isScrolled);
        });
    }
});