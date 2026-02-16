(function (global) {
    'use strict';

    function revealImmediately(items) {
        items.forEach((item) => item.classList.add('is-visible'));
    }

    function initScrollReveal(page, prefersReducedMotion) {
        const sections = Array.from(page.querySelectorAll('.smart-cleaner-reveal'));
        const staggerItems = Array.from(page.querySelectorAll('.smart-cleaner-reveal-item'));

        if (!sections.length && !staggerItems.length) {
            return;
        }

        if (prefersReducedMotion || typeof global.IntersectionObserver !== 'function') {
            revealImmediately(sections);
            revealImmediately(staggerItems);
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

        const staggerObserver = new global.IntersectionObserver((entries, localObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const delay = Number(entry.target.dataset.staggerDelay || 0);
                global.setTimeout(() => entry.target.classList.add('is-visible'), delay);
                localObserver.unobserve(entry.target);
            });
        }, {
            threshold: 0.1
        });

        staggerItems.forEach((item, index) => {
            item.dataset.staggerDelay = String((index % 6) * 60);
            staggerObserver.observe(item);
        });
    }

    function initStickyCta(page, hero, endSentinel, prefersReducedMotion) {
        if (typeof global.IntersectionObserver !== 'function' || !hero) {
            return;
        }

        let heroVisible = true;
        let endVisible = false;

        const updateVisibility = () => {
            const show = !heroVisible && !endVisible;
            page.classList.toggle('sticky-cta-visible', show);
        };

        if (prefersReducedMotion) {
            heroVisible = false;
            endVisible = false;
            updateVisibility();
            return;
        }

        const heroObserver = new global.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                heroVisible = entry.isIntersecting;
                updateVisibility();
            });
        }, {
            threshold: 0.45
        });

        heroObserver.observe(hero);

        if (endSentinel) {
            const endObserver = new global.IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    endVisible = entry.isIntersecting;
                    updateVisibility();
                });
            }, {
                threshold: 0.05
            });
            endObserver.observe(endSentinel);
        }
    }

    function initBeforeAfter(page) {
        const block = page.querySelector('.smart-cleaner-before-after');
        if (!block || typeof global.IntersectionObserver !== 'function') {
            return;
        }

        const observer = new global.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                block.classList.toggle('is-clean', entry.isIntersecting);
            });
        }, {
            threshold: 0.65
        });

        observer.observe(block);
    }

    function initSpotlightStory(page, prefersReducedMotion) {
        const spotlightImage = page.querySelector('#smartCleanerSpotlightImage');
        const items = Array.from(page.querySelectorAll('.smart-cleaner-spotlight-item'));
        if (!spotlightImage || !items.length) {
            return;
        }

        const setActive = (item) => {
            items.forEach((entry) => entry.classList.toggle('is-active', entry === item));

            const image = item.getAttribute('data-image');
            const alt = item.getAttribute('data-alt') || 'Smart Cleaner feature screenshot';
            if (image) {
                spotlightImage.src = image;
                spotlightImage.alt = alt;
            }
        };

        setActive(items[0]);

        if (prefersReducedMotion || typeof global.IntersectionObserver !== 'function') {
            return;
        }

        const observer = new global.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActive(entry.target);
                }
            });
        }, {
            threshold: 0.62
        });

        items.forEach((item) => observer.observe(item));
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

        const prevButton = page.querySelector('.smart-cleaner-gallery-nav.prev');
        const nextButton = page.querySelector('.smart-cleaner-gallery-nav.next');
        let activeIndex = 0;

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
            activeIndex = index;
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

        const goTo = (offset) => {
            const next = Math.max(0, Math.min(slides.length - 1, activeIndex + offset));
            slides[next].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        };

        if (prevButton) {
            prevButton.addEventListener('click', () => goTo(-1));
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => goTo(1));
        }
    }

    function initTimelineProgress(page) {
        const steps = Array.from(page.querySelectorAll('.smart-cleaner-step'));
        if (!steps.length || typeof global.IntersectionObserver !== 'function') {
            return;
        }

        const setActive = (index) => {
            steps.forEach((step, stepIndex) => step.classList.toggle('is-active', stepIndex <= index));
        };

        setActive(0);

        const observer = new global.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const index = steps.indexOf(entry.target);
                if (index >= 0) {
                    setActive(index);
                }
            });
        }, {
            threshold: 0.55
        });

        steps.forEach((step) => observer.observe(step));
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

        const hero = page.querySelector('#smartCleanerHero');
        const endSentinel = page.querySelector('#smartCleanerEndSentinel');

        initScrollReveal(page, prefersReducedMotion);
        initStickyCta(page, hero, endSentinel, prefersReducedMotion);
        initBeforeAfter(page);
        initSpotlightStory(page, prefersReducedMotion);
        initGallery(page);
        initTimelineProgress(page);
    }

    global.initSmartCleanerPage = initSmartCleanerPage;
})(typeof window !== 'undefined' ? window : globalThis);
