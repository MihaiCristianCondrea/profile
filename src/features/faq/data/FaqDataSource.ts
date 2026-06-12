// @ts-nocheck

const FAQ_DATA_URL = 'data/faqs.json';

let faqItemsCache = null;
let faqDataPromise = null;

function normalizeFaqItem(item, index) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const normalized = {
        id: typeof item.id === 'string' ? item.id.trim() : '',
        question: typeof item.question === 'string' ? item.question.trim() : '',
        iconSymbol: typeof item.iconSymbol === 'string' && item.iconSymbol.trim() ? item.iconSymbol.trim() : 'help',
        featured: Boolean(item.featured),
        answerHtml: typeof item.answerHtml === 'string' ? item.answerHtml.trim() : '',
        homeAnswerHtml: typeof item.homeAnswerHtml === 'string' ? item.homeAnswerHtml.trim() : ''
    };

    if (!normalized.id) {
        const safeQuestion = normalized.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        normalized.id = safeQuestion ? `faq-${safeQuestion}` : `faq-item-${index}`;
    }

    return normalized.question && normalized.answerHtml ? normalized : null;
}

function loadFaqData() {
    if (faqItemsCache) {
        return Promise.resolve(faqItemsCache);
    }

    if (faqDataPromise) {
        return faqDataPromise;
    }

    faqDataPromise = fetch(FAQ_DATA_URL)
        .then((response) => {
            if (!response || !response.ok) {
                throw new Error(`FAQ: Failed to fetch data (${response ? response.status : 'no response'})`);
            }
            return response.json();
        })
        .then((data) => {
            if (!Array.isArray(data)) {
                throw new Error('FAQ: FAQ data is not an array.');
            }

            const normalizedItems = data
                .map((item, index) => normalizeFaqItem(item, index))
                .filter((item) => item);

            if (!normalizedItems.length) {
                throw new Error('FAQ: No valid FAQ entries found.');
            }

            faqItemsCache = normalizedItems;
            return faqItemsCache;
        })
        .catch((error) => {
            faqDataPromise = null;
            throw error;
        });

    return faqDataPromise;
}

if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, {
        FAQ_DATA_URL,
        normalizeFaqItem,
        loadFaqData
    });
}
