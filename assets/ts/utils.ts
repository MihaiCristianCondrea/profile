type Indexable = Record<string, unknown> | unknown[];

declare const module: { exports: unknown } | undefined;

/**
 * Safely retrieves a nested value from an object using a path string.
 */
function getNestedValue<T = unknown>(obj: Indexable | null | undefined, path: string, defaultValue: T | undefined = undefined): T | undefined {
    const travel = (regexp: RegExp): unknown => String(path)
        .split(regexp)
        .filter(Boolean)
        .reduce<unknown>((res, key) => {
            if (res === null || res === undefined) {
                return res;
            }

            if (Array.isArray(res)) {
                const index = Number(key);
                return Number.isInteger(index) ? res[index] : undefined;
            }

            if (typeof res === 'object') {
                return (res as Record<string, unknown>)[key];
            }

            return undefined;
        }, obj);

    const result = travel(/[,[\]]+?/) ?? travel(/[,[\].]+?/);
    return result === undefined || result === obj ? defaultValue : (result as T);
}

function extractFirstImageFromHtml(htmlContent: string): string | null {
    if (!htmlContent) return null;
    const imgTagMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    if (imgTagMatch?.[1] && !imgTagMatch[1].startsWith('data:image')) return imgTagMatch[1];
    const bloggerImageMatch = htmlContent.match(/(https?:\/\/[^\"]+\.googleusercontent\.com\/[^\"]+)/);
    if (bloggerImageMatch?.[1]) return bloggerImageMatch[1];
    return null;
}

function getDynamicElement(id: string): HTMLElement | null {
    return document.getElementById(id);
}

function setCopyrightYear(): void {
    const copyrightElement = document.getElementById('copyright-message');
    if (copyrightElement) {
        const currentYear = new Date().getFullYear();
        const yearText = currentYear === 2025 ? '2025' : `2025-${currentYear}`;
        copyrightElement.textContent = `Copyright © ${yearText}, Mihai-Cristian Condrea`;
    }
}

function showPageLoadingOverlay(): void {
    const overlay = document.getElementById('pageLoadingOverlay');
    overlay?.classList.add('active');
}

function hidePageLoadingOverlay(): void {
    const overlay = document.getElementById('pageLoadingOverlay');
    overlay?.classList.remove('active');
}

if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, {
        getNestedValue,
        extractFirstImageFromHtml,
        getDynamicElement,
        setCopyrightYear,
        showPageLoadingOverlay,
        hidePageLoadingOverlay
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getNestedValue,
        extractFirstImageFromHtml,
        getDynamicElement,
        setCopyrightYear,
        showPageLoadingOverlay,
        hidePageLoadingOverlay
    };
}
