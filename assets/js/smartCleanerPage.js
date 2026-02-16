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
        const elements = Array.from(page.querySelectorAll('[data-parallax]'));
        if (!elements.length || prefersReducedMotion) {
            return;
        }

        const applyParallax = () => {
            const viewportCenter = global.innerHeight / 2;

            elements.forEach((element) => {
                const rect = element.getBoundingClientRect();
                const elementCenter = rect.top + (rect.height / 2);
                const delta = (elementCenter - viewportCenter) / Math.max(global.innerHeight, 1);
                const offset = Math.max(-8, Math.min(8, -delta * 12));
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
        initBeforeAfter(page);
        initGallery(page);
        initParallax(page, prefersReducedMotion);
    }

    global.initSmartCleanerPage = initSmartCleanerPage;
})(typeof window !== 'undefined' ? window : globalThis);
