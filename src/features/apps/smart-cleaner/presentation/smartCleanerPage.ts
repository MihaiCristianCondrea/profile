// @ts-nocheck
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
                child.style.setProperty('--reveal-delay', `${index * 70}ms`);
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

        let previousScrollY = global.scrollY || global.pageYOffset || 0;
        let currentScrollDirection = 'down';

        const applyRevealDirection = (section, direction) => {
            section.classList.remove('reveal-from-up', 'reveal-from-down');
            section.classList.add(direction === 'down' ? 'reveal-from-up' : 'reveal-from-down');
        };

        global.addEventListener('scroll', () => {
            const nextScrollY = global.scrollY || global.pageYOffset || previousScrollY;
            currentScrollDirection = nextScrollY > previousScrollY ? 'down' : 'up';
            previousScrollY = nextScrollY;
        }, { passive: true });

        const sectionObserver = new global.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const el = entry.target;

                if (entry.isIntersecting) {
                    if (el.classList.contains('is-visible')) {
                        return;
                    }

                    const items = el.querySelectorAll('.smart-cleaner-reveal-item');
                    el.style.transition = 'none';
                    items.forEach((item) => {
                        item.style.transition = 'none';
                    });

                    applyRevealDirection(el, currentScrollDirection);
                    void el.offsetWidth;

                    el.style.transition = '';
                    items.forEach((item) => {
                        item.style.transition = '';
                    });

                    el.classList.add('is-visible');
                    return;
                }

                const rect = entry.boundingClientRect;
                const viewportHeight = global.innerHeight || document.documentElement.clientHeight;
                const isFarAbove = rect.bottom < viewportHeight * 0.1;
                const isFarBelow = rect.top > viewportHeight * 0.9;

                if (isFarAbove || isFarBelow) {
                    el.classList.remove('is-visible');
                }
            });
        }, {
            threshold: [0, 0.15, 0.35, 0.6],
            rootMargin: '0px 0px -10% 0px'
        });

        sections.forEach((section) => sectionObserver.observe(section));
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

        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

        const applyParallax = () => {
            const viewportCenter = global.innerHeight / 2;
            const viewportSize = Math.max(global.innerHeight, 1);

            elements.forEach((element) => {
                const rect = element.getBoundingClientRect();
                const elementCenter = rect.top + (rect.height / 2);
                const delta = (elementCenter - viewportCenter) / viewportSize;
                const speed = Number.parseFloat(element.dataset.parallaxSpeed || '0.18');
                const axis = element.dataset.parallaxAxis === 'x' ? 'x' : 'y';
                const rawOffset = clamp(-delta * (speed * 64), -14, 14);
                const offset = rawOffset.toFixed(2);

                if (axis === 'x') {
                    element.style.setProperty('--parallax-x', `${offset}px`);
                } else {
                    element.style.setProperty('--parallax-y', `${offset}px`);
                }

                if (element.classList.contains('smart-cleaner-story-visual') || element.classList.contains('smart-cleaner-phone-frame')) {
                    const rotateX = clamp(delta * -5.2, -5, 5).toFixed(2);
                    const rotateY = clamp(delta * 4.1, -4, 4).toFixed(2);
                    element.style.setProperty('--parallax-rotate-x', `${rotateX}deg`);
                    element.style.setProperty('--parallax-rotate-y', `${rotateY}deg`);
                }
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
        initGallery(page);
        initParallax(page, prefersReducedMotion);
    }

    global.initSmartCleanerPage = initSmartCleanerPage;
})(typeof window !== 'undefined' ? window : globalThis);
