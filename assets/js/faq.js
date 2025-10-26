(function (global) {
    const reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const FAQ_DATA_URL = (() => {
        if (typeof document === 'undefined') {
            return 'assets/data/faqs.json';
        }

        let baseUrl = '';
        const currentScript = document.currentScript;
        if (currentScript && currentScript.src) {
            baseUrl = currentScript.src;
        } else {
            const scripts = document.getElementsByTagName('script');
            for (let index = scripts.length - 1; index >= 0; index -= 1) {
                const script = scripts[index];
                if (script && script.src && script.src.includes('faq.js')) {
                    baseUrl = script.src;
                    break;
                }
            }

            if (!baseUrl && scripts.length) {
                const fallbackScript = scripts[scripts.length - 1];
                if (fallbackScript && fallbackScript.src) {
                    baseUrl = fallbackScript.src;
                }
            }
        }

        try {
            return baseUrl ? new URL('../data/faqs.json', baseUrl).toString() : 'assets/data/faqs.json';
        } catch (error) {
            return 'assets/data/faqs.json';
        }
    })();

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

    function createFaqItem(item, context) {
        const faqItemEl = document.createElement('div');
        faqItemEl.className = 'faq-item';
        faqItemEl.dataset.faqId = item.id;
        faqItemEl.setAttribute('role', 'listitem');
        faqItemEl.id = context === 'page' ? item.id : `${item.id}-home`;

        const summaryButton = document.createElement('button');
        summaryButton.className = 'faq-summary';
        summaryButton.type = 'button';
        const summaryId = `${faqItemEl.id}-summary`;
        summaryButton.id = summaryId;

        const iconWrapper = document.createElement('span');
        iconWrapper.className = 'faq-icon';
        iconWrapper.setAttribute('aria-hidden', 'true');

        const iconGlyph = document.createElement('span');
        iconGlyph.className = 'material-symbols-outlined';
        iconGlyph.textContent = item.iconSymbol || 'help';
        iconWrapper.appendChild(iconGlyph);
        summaryButton.appendChild(iconWrapper);

        const questionSpan = document.createElement('span');
        questionSpan.className = 'faq-question';
        questionSpan.textContent = item.question;
        summaryButton.appendChild(questionSpan);

        const expandIcon = document.createElement('span');
        expandIcon.className = 'material-symbols-outlined expand-icon';
        expandIcon.setAttribute('aria-hidden', 'true');
        expandIcon.textContent = 'expand_more';
        summaryButton.appendChild(expandIcon);

        faqItemEl.appendChild(summaryButton);

        const answerEl = document.createElement('div');
        const answerId = `${faqItemEl.id}-answer`;
        answerEl.className = 'faq-answer';
        answerEl.id = answerId;
        answerEl.setAttribute('role', 'region');
        answerEl.setAttribute('aria-labelledby', summaryId);
        answerEl.hidden = true;
        answerEl.style.height = '0px';

        const answerContent = document.createElement('div');
        answerContent.className = 'faq-answer-content';
        const answerHtml = context === 'home' && item.homeAnswerHtml ? item.homeAnswerHtml : item.answerHtml;
        answerContent.innerHTML = typeof answerHtml === 'string' ? answerHtml.trim() : '';

        answerEl.appendChild(answerContent);
        faqItemEl.appendChild(answerEl);

        summaryButton.setAttribute('aria-controls', answerId);
        summaryButton.setAttribute('aria-expanded', 'false');

        attachFaqInteractions(faqItemEl, summaryButton, answerEl, answerContent);

        const searchText = buildSearchText(item);
        faqItemEl.dataset.searchText = searchText;

        return faqItemEl;
    }

    function attachFaqInteractions(itemEl, summaryButton, answerEl, answerContent) {
        const animate = !reduceMotionQuery.matches;

        const closeAnswer = () => {
            if (!itemEl.classList.contains('is-open')) {
                return;
            }
            summaryButton.setAttribute('aria-expanded', 'false');
            itemEl.classList.remove('is-open');

            if (!animate) {
                answerEl.style.height = '0px';
                answerEl.hidden = true;
                return;
            }

            const startHeight = answerContent.offsetHeight;
            answerEl.style.height = `${startHeight}px`;
            requestAnimationFrame(() => {
                answerEl.style.height = '0px';
            });

            const handleCloseTransitionEnd = (event) => {
                if (event.propertyName !== 'height') {
                    return;
                }
                answerEl.hidden = true;
                answerEl.style.height = '';
                answerEl.removeEventListener('transitionend', handleCloseTransitionEnd);
            };

            answerEl.addEventListener('transitionend', handleCloseTransitionEnd);
        };

        const openAnswer = () => {
            if (itemEl.classList.contains('is-open')) {
                return;
            }

            answerEl.hidden = false;
            summaryButton.setAttribute('aria-expanded', 'true');
            itemEl.classList.add('is-open');

            if (!animate) {
                answerEl.style.height = 'auto';
                return;
            }

            const startHeight = answerEl.offsetHeight;
            const endHeight = answerContent.offsetHeight;
            answerEl.style.height = `${startHeight}px`;
            requestAnimationFrame(() => {
                answerEl.style.height = `${endHeight}px`;
            });

            const handleOpenTransitionEnd = (event) => {
                if (event.propertyName !== 'height') {
                    return;
                }
                answerEl.style.height = 'auto';
                answerEl.removeEventListener('transitionend', handleOpenTransitionEnd);
            };

            answerEl.addEventListener('transitionend', handleOpenTransitionEnd);
        };

        summaryButton.addEventListener('click', () => {
            if (itemEl.classList.contains('is-open')) {
                closeAnswer();
            } else {
                openAnswer();
            }
        });

        itemEl.addEventListener('faq:open', openAnswer);
        itemEl.addEventListener('faq:close', closeAnswer);
    }

    function buildSearchText(item) {
        const temp = document.createElement('div');
        temp.innerHTML = item.answerHtml;
        const textContent = temp.textContent || temp.innerText || '';
        return `${item.question} ${textContent}`.toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function renderFaqList(container, items, context) {
        if (!container) {
            return [];
        }

        container.innerHTML = '';
        const renderedItems = [];
        const list = Array.isArray(items) ? items : [];

        list.forEach((item) => {
            const faqElement = createFaqItem(item, context);
            container.appendChild(faqElement);
            renderedItems.push({
                data: item,
                element: faqElement
            });
        });

        return renderedItems;
    }

    function renderHomeFaqSection() {
        const container = document.getElementById('homeFaqList');
        if (!container) {
            return;
        }

        loadFaqData()
            .then((items) => {
                const featuredItems = items.filter((item) => item.featured);
                renderFaqList(container, featuredItems, 'home');
            })
            .catch((error) => {
                container.innerHTML = '';
                console.error('FAQ: Failed to render home FAQ section.', error);
            });
    }

    function initFaqPage() {
        const container = document.getElementById('faqPageList');
        if (!container) {
            return;
        }

        const emptyMessageEl = document.getElementById('faqEmptyMessage');
        const searchField = document.getElementById('faqSearchField');

        loadFaqData()
            .then((items) => {
                const renderedItems = renderFaqList(container, items, 'page');

                const updateVisibility = (searchTerm) => {
                    const normalizedTerm = (searchTerm || '').trim().toLowerCase();
                    let visibleCount = 0;

                    renderedItems.forEach(({ element }) => {
                        if (!normalizedTerm) {
                            element.hidden = false;
                            element.setAttribute('aria-hidden', 'false');
                            visibleCount += 1;
                            return;
                        }

                        const matches = element.dataset.searchText.includes(normalizedTerm);
                        element.hidden = !matches;
                        element.setAttribute('aria-hidden', matches ? 'false' : 'true');
                        if (matches) {
                            visibleCount += 1;
                        } else if (element.classList.contains('is-open')) {
                            element.dispatchEvent(new Event('faq:close'));
                        }
                    });

                    if (emptyMessageEl) {
                        emptyMessageEl.hidden = visibleCount !== 0;
                    }
                };

                updateVisibility('');

                if (searchField) {
                    const applySearch = () => {
                        updateVisibility(searchField.value);
                    };

                    searchField.addEventListener('input', applySearch);
                    searchField.addEventListener('change', applySearch);
                }
            })
            .catch((error) => {
                container.innerHTML = '';
                console.error('FAQ: Failed to initialize FAQ page.', error);
            });
    }

    document.addEventListener('DOMContentLoaded', () => {
        try {
            renderHomeFaqSection();
        } catch (error) {
            console.error('FAQ: Failed to render home FAQ section.', error);
        }
    });

    global.initFaqPage = initFaqPage;
    global.renderHomeFaqSection = renderHomeFaqSection;
})(typeof window !== 'undefined' ? window : globalThis);
