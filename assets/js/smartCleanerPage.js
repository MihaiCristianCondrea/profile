(function (global) {
    'use strict';

    function revealImmediately(items) {
        items.forEach((item) => item.classList.add('is-visible'));
    }

    function initScrollReveal(page, prefersReducedMotion) {
        const sections = Array.from(page.querySelectorAll('.smart-cleaner-reveal'));

        if (!sections.length) {
            return;
        }

        if (prefersReducedMotion || typeof global.IntersectionObserver !== 'function') {
            revealImmediately(sections);
            return;
        }

        const sectionObserver = new global.IntersectionObserver((entries, localObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                entry.target.classList.add('is-visible');
                localObserver.unobserve(entry.target);
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -8% 0px'
        });

        sections.forEach((section) => sectionObserver.observe(section));
    }

    function initBeforeAfter(page, prefersReducedMotion) {
        const block = page.querySelector('#smartCleanerBeforeAfter');
        if (!block) {
            return;
        }

        const impactSpace = page.querySelector('#smartCleanerImpactSpace');
        const impactFiles = page.querySelector('#smartCleanerImpactFiles');
        const impactUsed = page.querySelector('#smartCleanerImpactUsed');

        const setProgress = (progress) => {
            const normalized = Math.max(0, Math.min(1, progress));
            page.style.setProperty('--smart-cleaner-progress', normalized.toFixed(3));

            if (impactSpace) {
                const reclaimed = 4.6 * normalized;
                impactSpace.textContent = `${reclaimed.toFixed(1)} GB`;
            }

            if (impactFiles) {
                const removed = Math.round(1480 * normalized);
                impactFiles.textContent = removed.toLocaleString();
            }

            if (impactUsed) {
                const used = Math.round(82 - (33 * normalized));
                impactUsed.textContent = `${used}%`;
            }
        };

        if (prefersReducedMotion || typeof global.IntersectionObserver !== 'function') {
            setProgress(1);
            return;
        }

        const onScroll = () => {
            const rect = block.getBoundingClientRect();
            const viewportHeight = Math.max(global.innerHeight, 1);
            const rawProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height * 0.75);
            setProgress(rawProgress);
        };

        let ticking = false;
        const updateOnScroll = () => {
            if (ticking) {
                return;
            }
            ticking = true;
            global.requestAnimationFrame(() => {
                onScroll();
                ticking = false;
            });
        };

        onScroll();
        global.addEventListener('scroll', updateOnScroll, { passive: true });
        global.addEventListener('resize', updateOnScroll);
    }

    function initGallery(page) {
        const track = page.querySelector('#smartCleanerGalleryTrack');
        const dotsContainer = page.querySelector('#smartCleanerGalleryDots');
        if (!track || !dotsContainer) {
            return;
        }

        const slides = Array.from(track.querySelectorAll('.smart-cleaner-shot'));
        if (!slides.length) {
            return;
        }

        const dots = slides.map((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', `Go to screenshot ${index + 1}`);
            dot.addEventListener('click', () => {
                slides[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            });
            dotsContainer.appendChild(dot);
            return dot;
        });

        const updateActive = (index) => {
            slides.forEach((slide, slideIndex) => slide.classList.toggle('is-featured', slideIndex === index));
            dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
        };

        updateActive(0);

        if (typeof global.IntersectionObserver === 'function') {
            const observer = new global.IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    const index = slides.indexOf(entry.target);
                    if (index >= 0) {
                        updateActive(index);
                    }
                });
            }, {
                root: track,
                threshold: 0.64
            });

            slides.forEach((slide) => observer.observe(slide));
        }
    }

    function initParallax(page, prefersReducedMotion) {
        const elements = Array.from(page.querySelectorAll('[data-parallax], .smart-cleaner-bg-shape'));
        if (!elements.length || prefersReducedMotion) {
            return;
        }

        const applyParallax = () => {
            const viewportCenter = global.innerHeight / 2;

            elements.forEach((element) => {
                const rect = element.getBoundingClientRect();
                const elementCenter = rect.top + (rect.height / 2);
                const delta = (elementCenter - viewportCenter) / Math.max(global.innerHeight, 1);
                const offset = element.classList.contains('smart-cleaner-bg-shape')
                    ? Math.max(-10, Math.min(10, -delta * 8))
                    : Math.max(-8, Math.min(8, -delta * 12));
                element.style.transform = `translateY(${offset.toFixed(2)}px)`;
            });
        };

        let ticking = false;
        const onScroll = () => {
            if (ticking) {
                return;
            }
            ticking = true;
            global.requestAnimationFrame(() => {
                applyParallax();
                ticking = false;
            });
        };

        applyParallax();
        global.addEventListener('scroll', onScroll, { passive: true });
        global.addEventListener('resize', onScroll);
    }

    function initStickyCta(page, prefersReducedMotion) {
        const sticky = page.querySelector('#smartCleanerStickyCta');
        const finalCta = page.querySelector('#smartCleanerFinalCta');

        if (!sticky || !finalCta || typeof global.IntersectionObserver !== 'function') {
            return;
        }

        const setVisibility = (isVisible) => {
            sticky.classList.toggle('is-visible', isVisible);
            sticky.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
        };

        if (prefersReducedMotion) {
            setVisibility(false);
            return;
        }

        let pastThreshold = false;
        let nearFooter = false;

        const updateState = () => {
            setVisibility(pastThreshold && !nearFooter);
        };

        const thresholdObserver = new global.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                pastThreshold = !entry.isIntersecting;
                updateState();
            });
        }, {
            threshold: 0,
            rootMargin: '-25% 0px 0px 0px'
        });

        thresholdObserver.observe(page.querySelector('#smartCleanerHero') || page);

        const footerObserver = new global.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                nearFooter = entry.isIntersecting;
                updateState();
            });
        }, {
            threshold: 0.2
        });

        footerObserver.observe(finalCta);
    }

    function initSmartCleanerPage() {
        if (typeof document === 'undefined') {
            return;
        }

        const page = document.getElementById('smartCleanerPageContainer');
        if (!page) {
            return;
        }

        const reduceMotionQuery = typeof global.matchMedia === 'function'
            ? global.matchMedia('(prefers-reduced-motion: reduce)')
            : null;
        const prefersReducedMotion = !!(reduceMotionQuery && reduceMotionQuery.matches);

        initScrollReveal(page, prefersReducedMotion);
        initBeforeAfter(page, prefersReducedMotion);
        initGallery(page);
        initParallax(page, prefersReducedMotion);
        initStickyCta(page, prefersReducedMotion);
    }

    global.initSmartCleanerPage = initSmartCleanerPage;
})(typeof window !== 'undefined' ? window : globalThis);
