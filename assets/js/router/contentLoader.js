(function (global) {
    const DEFAULT_PAGE_TITLE = "Mihai's Profile";

    const PAGE_CONFIG = {
        'privacy-policy': {
            path: 'pages/drawer/more/privacy-policy.html',
            title: 'Privacy Policy'
        },
        'songs': {
            path: 'pages/drawer/songs.html',
            title: 'My Music',
            onReady: () => {
                if (
                    typeof loadSongs === 'function' &&
                    typeof document !== 'undefined' &&
                    document.getElementById('songsGrid')
                ) {
                    loadSongs();
                }
            }
        },
        'projects': {
            path: 'pages/drawer/projects.html',
            title: 'Projects',
            onReady: () => {
                if (typeof initProjectsPage === 'function') {
                    initProjectsPage();
                }
            }
        },
        'contact': {
            path: 'pages/drawer/contact.html',
            title: 'Contact'
        },
        'about-me': {
            path: 'pages/drawer/about-me.html',
            title: 'About Me'
        },
        'ads-help-center': {
            path: 'pages/drawer/more/apps/ads-help-center.html',
            title: 'Ads Help Center'
        },
        'legal-notices': {
            path: 'pages/drawer/more/apps/legal-notices.html',
            title: 'Legal Notices'
        },
        'code-of-conduct': {
            path: 'pages/drawer/more/code-of-conduct.html',
            title: 'Code of Conduct'
        },
        'privacy-policy-end-user-software': {
            path: 'pages/drawer/more/apps/privacy-policy-apps.html',
            title: 'Privacy Policy – End-User Software'
        },
        'terms-of-service-end-user-software': {
            path: 'pages/drawer/more/apps/terms-of-service-apps.html',
            title: 'Terms of Service – End-User Software'
        },
        'resume': {
            path: 'pages/resume/resume.html',
            title: "Mihai's Resume",
            onReady: () => {
                if (typeof initResumePage === 'function') {
                    initResumePage();
                }
            }
        }
    };

    function createErrorHtml(message) {
        return `<div class="page-section active"><p class="error-message text-red-500">${message}</p></div>`;
    }

    function createNotFoundHtml(pageId) {
        return `<div class="page-section active"><p>Page not found: ${pageId}</p></div>`;
    }

    function runHomeReadyHook() {
        if (
            typeof fetchBlogPosts === 'function' &&
            typeof document !== 'undefined' &&
            document.getElementById('newsGrid')
        ) {
            fetchBlogPosts();
        }
    }

    async function fetchPageMarkup(pageId, options = {}) {
        if (pageId === 'home') {
            return {
                status: 'success',
                title: DEFAULT_PAGE_TITLE,
                html: options.initialHomeHTML || '',
                onReady: runHomeReadyHook,
                sourceTitle: DEFAULT_PAGE_TITLE
            };
        }

        const pageConfig = PAGE_CONFIG[pageId];
        if (!pageConfig) {
            return {
                status: 'not-found',
                title: 'Not Found',
                html: createNotFoundHtml(pageId)
            };
        }

        try {
            const response = await fetch(pageConfig.path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${pageConfig.path}`);
            }
            const html = await response.text();
            return {
                status: 'success',
                title: pageConfig.title,
                html,
                onReady: pageConfig.onReady || null,
                sourceTitle: pageConfig.title
            };
        } catch (error) {
            return {
                status: 'error',
                title: 'Error',
                html: createErrorHtml(`Failed to load page: ${pageConfig.title}. ${error.message}`),
                error,
                sourceTitle: pageConfig.title
            };
        }
    }

    global.RouterContentLoader = {
        fetchPageMarkup,
        DEFAULT_PAGE_TITLE
    };
})(typeof window !== 'undefined' ? window : globalThis);
