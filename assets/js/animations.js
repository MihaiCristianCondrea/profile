(function (global) {
    'use strict';

    const root = typeof global.document !== 'undefined' ? global.document : null;
    const ElementConstructor = typeof Element !== 'undefined' ? Element : null;
    const hasWaapiSupport = !!(ElementConstructor && ElementConstructor.prototype && typeof ElementConstructor.prototype.animate === 'function');
    const reduceMotionQuery = typeof global.matchMedia === 'function'
        ? global.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let prefersReducedMotion = reduceMotionQuery ? reduceMotionQuery.matches : false;

    if (reduceMotionQuery) {
        const updatePreference = (event) => {
            prefersReducedMotion = !!(event && event.matches);
        };

        if (typeof reduceMotionQuery.addEventListener === 'function') {
            reduceMotionQuery.addEventListener('change', updatePreference);
        } else if (typeof reduceMotionQuery.addListener === 'function') {
            reduceMotionQuery.addListener(updatePreference);
        }
    }

    function animationsEnabled() {
        return hasWaapiSupport && !prefersReducedMotion;
    }

    function cleanupElementStyles(element, immediate = false) {
        if (!element || !element.style) {
            return;
        }
        if (immediate) {
            element.style.opacity = '1';
        }
        element.style.transform = '';
        element.style.filter = '';
        element.style.willChange = '';
    }

    function coerceArray(value) {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value;
        }
        if (typeof value.length === 'number') {
            return Array.from(value);
        }
        return [value];
    }

    const KEYFRAMES = {
        hero: [
            { opacity: 0, transform: 'translateY(32px) scale(0.96)', filter: 'blur(10px)' },
            { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
        ],
        rise: [
            { opacity: 0, transform: 'translateY(20px)', filter: 'blur(6px)' },
            { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
        ],
        subtleRise: [
            { opacity: 0, transform: 'translateY(16px)', filter: 'blur(4px)' },
            { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
        ],
        pop: [
            { opacity: 0, transform: 'scale(0.85)', filter: 'blur(4px)' },
            { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }
        ],
        slideInRight: [
            { opacity: 0, transform: 'translateX(-28px)', filter: 'blur(4px)' },
            { opacity: 1, transform: 'translateX(0)', filter: 'blur(0)' }
        ]
    };

    function animateElement(element, keyframes, options) {
        if (!element) {
            return null;
        }

        if (!animationsEnabled()) {
            cleanupElementStyles(element, true);
            return null;
        }

        const frames = Array.isArray(keyframes) ? keyframes : [keyframes];
        const animationOptions = Object.assign({
            duration: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both'
        }, options || {});

        if (element.style) {
            const firstFrame = frames[0] || {};
            if (firstFrame.opacity !== undefined) {
                element.style.opacity = firstFrame.opacity;
            }
            if (firstFrame.transform !== undefined) {
                element.style.transform = firstFrame.transform;
            }
            if (firstFrame.filter !== undefined) {
                element.style.filter = firstFrame.filter;
            }
            element.style.willChange = 'opacity, transform';
        }

        try {
            const animation = element.animate(frames, animationOptions);
            if (animation && animation.finished && typeof animation.finished.finally === 'function') {
                animation.finished.finally(() => cleanupElementStyles(element));
            } else {
                cleanupElementStyles(element);
            }
            return animation;
        } catch (error) {
            console.error('SiteAnimations: Failed to animate element', error);
            cleanupElementStyles(element);
            return null;
        }
    }

    function animateSequence(elements, keyframes, options, gap = 80) {
        const nodes = coerceArray(elements).filter(Boolean);
        if (nodes.length === 0) {
            return;
        }

        nodes.forEach((element, index) => {
            const baseOptions = Object.assign({}, options || {});
            const existingDelay = typeof baseOptions.delay === 'number' ? baseOptions.delay : 0;
            baseOptions.delay = existingDelay + index * gap;
            animateElement(element, keyframes, baseOptions);
        });
    }

    function animateHome(container) {
        if (!container) {
            return;
        }

        const heroCard = container.querySelector('.profile-card');
        if (heroCard) {
            animateElement(heroCard, KEYFRAMES.hero, {
                duration: 720,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
            });
        }

        const chipElements = container.querySelectorAll('md-chip-set md-assist-chip');
        animateSequence(chipElements, KEYFRAMES.pop, {
            duration: 360,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        }, 40);

        const supportingSections = container.querySelectorAll('.achievement-card, .profile-card-actions, .podcast-embed, .news-section, .contribute-card');
        animateSequence(supportingSections, KEYFRAMES.rise, {
            duration: 640,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }, 90);

        const socialLinks = container.querySelectorAll('.social-icons a');
        animateSequence(socialLinks, KEYFRAMES.pop, {
            duration: 420,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        }, 50);
    }

    function animateResume(container) {
        const resumePage = container ? container.querySelector('#resumePage') : null;
        if (!resumePage) {
            animateDefault(container);
            return;
        }

        const formSections = resumePage.querySelectorAll('.form-container .form-section, .form-container h1');
        animateSequence(formSections, KEYFRAMES.slideInRight, {
            duration: 560,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }, 70);

        const previewPanel = resumePage.querySelector('#resume-preview .resume-content');
        if (previewPanel) {
            animateElement(previewPanel, KEYFRAMES.hero, {
                duration: 700,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                delay: 120
            });
        }

        const downloadButton = resumePage.querySelector('button[onclick="prepareAndPrintResume()"]');
        if (downloadButton) {
            animateElement(downloadButton, KEYFRAMES.pop, {
                duration: 420,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                delay: 220
            });
        }
    }

    function animateProjects(container) {
        const projectsPage = container ? container.querySelector('#projectsPageContainer') : null;
        if (!projectsPage) {
            animateDefault(container);
            return;
        }

        const heading = projectsPage.querySelector('h1');
        if (heading) {
            animateElement(heading, KEYFRAMES.slideInRight, {
                duration: 500,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
            });
        }

        const intro = projectsPage.querySelector('.projects-intro');
        if (intro) {
            animateElement(intro, KEYFRAMES.subtleRise, {
                duration: 520,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                delay: 60
            });
        }

        const tabs = projectsPage.querySelectorAll('#projectsFilterTabs md-primary-tab');
        animateSequence(tabs, KEYFRAMES.pop, {
            duration: 360,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        }, 40);

        const cards = projectsPage.querySelectorAll('.project-entry');
        animateProjectCards(cards);
    }

    function animateDefault(container) {
        if (!container) {
            return;
        }
        const sectionChildren = container.querySelectorAll('.page-section.active > *:not(script):not(style)');
        animateSequence(sectionChildren, KEYFRAMES.subtleRise, {
            duration: 520,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }, 70);
    }

    function animatePage(container, pageId) {
        const normalizedId = typeof pageId === 'string' ? pageId.toLowerCase() : '';
        const targetContainer = ElementConstructor && container instanceof ElementConstructor
            ? container
            : (root ? root.getElementById('pageContentArea') : null);
        if (!targetContainer) {
            return;
        }

        if (!animationsEnabled()) {
            return;
        }

        const run = () => {
            if (normalizedId === 'home' || normalizedId === '') {
                animateHome(targetContainer);
            } else if (normalizedId === 'resume') {
                animateResume(targetContainer);
            } else if (normalizedId === 'projects') {
                animateProjects(targetContainer);
            } else {
                animateDefault(targetContainer);
            }
        };

        if (typeof global.requestAnimationFrame === 'function') {
            global.requestAnimationFrame(run);
        } else {
            setTimeout(run, 16);
        }
    }

    function animateNewsCards(elements) {
        const cards = coerceArray(elements).filter(Boolean);
        if (cards.length === 0) {
            return;
        }
        animateSequence(cards, KEYFRAMES.rise, {
            duration: 560,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }, 90);
    }

    function animateSongCards(elements) {
        const cards = coerceArray(elements).filter(Boolean);
        if (cards.length === 0) {
            return;
        }
        animateSequence(cards, KEYFRAMES.pop, {
            duration: 420,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        }, 60);
    }

    function animateProjectCards(elements) {
        const cards = coerceArray(elements).filter((el) => {
            if (!el) {
                return false;
            }
            if (!ElementConstructor || !(el instanceof ElementConstructor)) {
                return true;
            }
            if (!el.style) {
                return true;
            }
            return el.style.display !== 'none';
        });
        if (cards.length === 0) {
            return;
        }
        animateSequence(cards, KEYFRAMES.rise, {
            duration: 640,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }, 110);
    }

    function init() {
        if (!root) {
            return;
        }

        if (!animationsEnabled()) {
            root.documentElement.classList.add('prefers-reduced-motion');
            return;
        }

        root.documentElement.classList.add('animations-enabled');

        const initialContainer = root.getElementById('pageContentArea');
        if (initialContainer && initialContainer.querySelector('.profile-card')) {
            animatePage(initialContainer, 'home');
        }
    }

    global.SiteAnimations = {
        init,
        animatePage,
        animateNewsCards,
        animateSongCards,
        animateProjectCards
    };
})(typeof window !== 'undefined' ? window : globalThis);
