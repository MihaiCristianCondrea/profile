(function (global) {
    'use strict';

    function revealImmediately(items) {
        items.forEach((item) => item.classList.add('is-visible'));
    }


    function prepareRevealChildren(sections) {
        sections.forEach((section) => {
            const children = Array.from(section.children).filter((child) => !child.classList.contains('smart-cleaner-bg-shape'));

            children.forEach((child, index) => {
                child.classList.add('smart-cleaner-reveal-item');
                child.style.setProperty('--smart-reveal-delay', `${(index + 1) * 100}ms`);
            });
        });
    }

        prepareRevealChildren(sections);

    function prepareRevealChildren(sections) {
        sections.forEach((section) => {
            const children = Array.from(section.children)
                .filter((child) => !child.hasAttribute('data-parallax'));

            children.forEach((child, index) => {
                child.classList.add('smart-cleaner-reveal-item');
                child.style.setProperty('--smart-reveal-delay', `${(index + 1) * 100}ms`);
            });
        });
    }

    function initScrollReveal(page, prefersReducedMotion) {
        const sections = Array.from(page.querySelectorAll('.smart-cleaner-reveal'));

        if (!sections.length) {
            return;
        }

        prepareRevealChildren(sections);

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

        const setProgress = (progress) => {
            const normalized = Math.max(0, Math.min(1, progress));
            page.style.setProperty('--smart-cleaner-progress', normalized.toFixed(3));
        };

        if (prefersReducedMotion) {
            setProgress(1);
            return;
        }

        const onScroll = () => {
            const rect = block.getBoundingClientRect();
            const start = Math.min(global.innerHeight * 0.72, global.innerHeight - 40);
            const distance = 30;
            const rawProgress = (start - rect.top) / distance;
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

                if (element.classList.contains('smart-cleaner-bg-shape')) {
                    const offset = Math.max(-10, Math.min(10, -delta * 10));
                    element.style.setProperty('--smart-shape-shift-y', `${offset.toFixed(2)}px`);
                    return;
                }

                const offset = Math.max(-20, Math.min(20, -delta * 20));
                element.style.setProperty('--smart-cleaner-parallax-y', `${offset.toFixed(2)}px`);
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
    }

    global.initSmartCleanerPage = initSmartCleanerPage;
})(typeof window !== 'undefined' ? window : globalThis);
