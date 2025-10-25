(function (global) {
    const reduceMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

    const FAQ_ITEMS = [
        {
            id: 'faq-gms',
            question: 'Why do your apps require Google Play Services?',
            iconSymbol: 'support_agent',
            featured: true,
            homeAnswerHtml: `
                <p>
                  My apps rely on Firebase tools, Google Ads / AdMob, in-app updates,
                  and in-app reviews to deliver analytics, crash reporting, and
                  monetization features that keep development sustainable.
                </p>
                <p>
                  Without Play Services, ads, update prompts, or performance
                  telemetry would stop working, so the Play Store build remains the
                  most stable way to ship new features.
                </p>
            `,
            answerHtml: `
                <p>
                  My apps integrate several components from Google Play Services because they
                  provide reliable, well-maintained solutions for everyday needs:
                </p>
                <ul>
                  <li><strong>Firebase Analytics, Performance, and Crashlytics</strong> keep me informed about stability issues and feature adoption.</li>
                  <li><strong>Google Ads / AdMob</strong> offsets the costs of hosting, design tools, and test devices.</li>
                  <li><strong>In-App Reviews &amp; Play In-App Updates</strong> help deliver a polished experience without forcing manual store checks.</li>
                </ul>
                <p>
                  Removing these SDKs would mean rewriting entire systems from scratch and
                  losing the telemetry that keeps the apps healthy. For now, the Play Store
                  build remains the most sustainable option for both me and the people using
                  the apps every day.
                </p>
            `
        },
        {
            id: 'faq-fdroid',
            question: 'Why aren’t your apps on F-Droid or other stores?',
            iconSymbol: 'storefront',
            featured: true,
            homeAnswerHtml: `
                <p>
                  F-Droid’s policies exclude proprietary SDKs like Play Services,
                  AdMob, and Firebase—exactly the technologies that power my apps’
                  analytics and compliance.
                </p>
                <p>
                  To guarantee verified, policy-compliant builds, I distribute
                  exclusively through Google Play and mirrored releases on GitHub.
                </p>
            `,
            answerHtml: `
                <p>
                  I love the open-source mindset behind F-Droid and similar stores. However,
                  their repository policies prevent shipping binaries that rely on
                  proprietary SDKs like Play Services, AdMob, or Firebase.
                </p>
                <p>
                  Because those SDKs are essential to my workflow, the apps currently would
                  not pass F-Droid’s inclusion checks. To avoid confusing, unverified builds
                  scattered across the web, I focus distribution on:
                </p>
                <ul>
                  <li><strong>Google Play Store</strong> for the primary, auto-updated release.</li>
                  <li><strong>GitHub Releases</strong> for developers who prefer sideloading directly from me.</li>
                </ul>
                <p>
                  That combination guarantees fast updates, verified signatures, and clear
                  communication around policy changes.
                </p>
            `
        },
        {
            id: 'faq-analytics',
            question: 'Why do you use analytics and ads at all?',
            iconSymbol: 'insights',
            featured: true,
            homeAnswerHtml: `
                <p>
                  Building and maintaining apps involves hosting, testing devices,
                  and tool licenses. Ads and anonymous analytics keep projects
                  funded while revealing crashes or slowdowns before they affect
                  everyone.
                </p>
                <p>
                  I keep placements minimal and respectful so the experience stays
                  focused on utility—not interruptions.
                </p>
            `,
            answerHtml: `
                <p>
                  Independent development involves recurring costs: domain renewals, build
                  tooling, Firebase quotas, music licensing, and a growing fleet of test
                  devices. Anonymous analytics and respectful advertising make it possible to
                  keep the apps free while still covering those expenses.
                </p>
                <p>
                  Metrics such as screen load time, crash frequency, and feature usage help
                  me prioritize fixes and improvements. Ads are placed sparingly and follow
                  Google’s content policies so they remain as unobtrusive as possible.
                </p>
            `
        },
        {
            id: 'faq-privacy',
            question: 'Do you collect personal data?',
            iconSymbol: 'shield_person',
            featured: true,
            homeAnswerHtml: `
                <p>
                  I don’t sell or personally collect user data. Google’s SDKs handle
                  analytics and ads according to their privacy policy, while I only
                  review aggregated trends like active installs or crash types.
                </p>
                <p>
                  Read the full details in my
                  <a href="#privacy-policy">Privacy Policy</a> for transparency on
                  data processing.
                </p>
            `,
            answerHtml: `
                <p>
                  I do not personally collect, store, or sell any individual user data. All
                  analytics and advertising are handled by Google’s SDKs under their
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </p>
                <p>
                  The dashboards I see only include aggregated, anonymous information—for
                  example, how many people opened the app this week or which device model is
                  crashing after a new release. You can always review the
                  <a href="#privacy-policy">website privacy policy</a> for the full breakdown
                  of how data is processed and how you can opt out.
                </p>
            `
        },
        {
            id: 'faq-gms-free',
            question: 'Will you ever make GMS-free or F-Droid builds?',
            iconSymbol: 'build',
            answerHtml: `
                <p>
                  I have explored prototypes of lightweight, offline-friendly builds. The
                  challenge is maintaining two separate release pipelines, testing matrices,
                  and support documents—effectively doubling the workload for every update.
                </p>
                <p>
                  For now, consolidating around a single Play Store release lets me deliver
                  modern APIs such as Firebase Remote Config, Play Integrity, and in-app
                  reviews faster. If a practical, sustainable path to a GMS-free edition
                  appears, I will share updates in the news feed and on GitHub.
                </p>
            `
        },
        {
            id: 'faq-support',
            question: 'How can I support your work without ads?',
            iconSymbol: 'volunteer_activism',
            answerHtml: `
                <p>
                  If you prefer ad-free support, here are the most impactful options:
                </p>
                <ul>
                  <li>Leave a positive review or rating on the Google Play Store.</li>
                  <li>Share the apps with friends, family, or communities that may benefit.</li>
                  <li>Explore my music and creative projects released under <strong>D4rK Rekords</strong>.</li>
                </ul>
                <p>
                  Every signal of support fuels future updates and allows me to experiment
                  with new ideas that benefit the entire community.
                </p>
            `
        },
        {
            id: 'faq-downloads',
            question: 'Where can I find official builds?',
            iconSymbol: 'cloud_download',
            answerHtml: `
                <p>
                  Stick to these trusted sources to ensure you are downloading authentic,
                  malware-free builds directly from me:
                </p>
                <ul>
                  <li><strong>Google Play Store</strong> – the primary distribution channel with automatic updates.</li>
                  <li><strong>GitHub Releases</strong> – mirrors the Play build for sideloading or archival purposes.</li>
                </ul>
                <p>
                  Third-party APK mirrors are not verified or monitored, so they might host
                  outdated versions or tampered packages. When in doubt, always circle back
                  to the official listings above.
                </p>
            `
        }
    ];

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

        items.forEach((item) => {
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

        const featuredItems = FAQ_ITEMS.filter((item) => item.featured);
        renderFaqList(container, featuredItems, 'home');
    }

    function initFaqPage() {
        const container = document.getElementById('faqPageList');
        if (!container) {
            return;
        }

        const renderedItems = renderFaqList(container, FAQ_ITEMS, 'page');
        const emptyMessageEl = document.getElementById('faqEmptyMessage');
        const searchField = document.getElementById('faqSearchField');

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
