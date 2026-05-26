// @ts-nocheck
(() => {
    const DOCUMENT_TITLE_SUFFIX = " - Mihai's Profile";

    function updateTitle(appBarHeadline: HTMLElement | null, pageTitle: string): void {
        if (appBarHeadline) {
            appBarHeadline.textContent = pageTitle;
        }

        if (typeof document !== 'undefined') {
            document.title = `${pageTitle}${DOCUMENT_TITLE_SUFFIX}`;
        }
    }

    function pushState(pageId: string, pageTitle: string, urlFragment: string, shouldUpdate = true): void {
        if (!shouldUpdate || !globalThis.history || typeof globalThis.history.pushState !== 'function') {
            return;
        }

        globalThis.history.pushState({ page: pageId }, pageTitle, `#${urlFragment}`);
    }

    (globalThis as typeof globalThis & {
        RouterHistory?: {
            DOCUMENT_TITLE_SUFFIX: string;
            updateTitle: typeof updateTitle;
            pushState: typeof pushState;
        };
    }).RouterHistory = {
        DOCUMENT_TITLE_SUFFIX,
        updateTitle,
        pushState
    };
})();
