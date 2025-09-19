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

    const LINEAR_EASINGS = Object.freeze({
        bounce: 'linear(0, 0.004, 0.016, 0.035, 0.063 9.1%, 0.141, 0.25, 0.391, 0.563, 0.765, 1, 0.891, 0.813 45.5%, 0.785, 0.766, 0.754, 0.75, 0.754, 0.766, 0.785, 0.813 63.6%, 0.891, 1 72.7%, 0.973, 0.953, 0.941, 0.938, 0.941, 0.953, 0.973, 1, 0.988, 0.984, 0.988, 1)',
        spring: 'linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)'
    });

    const supportsLinearEasing = typeof global.CSS !== 'undefined'
        && global.CSS
        && typeof global.CSS.supports === 'function'
        && global.CSS.supports('animation-timing-function', 'linear(0,0.5,1)');

    function resolveEasing(preferred, fallback) {
        if (supportsLinearEasing && preferred) {
            return preferred;
        }
        return fallback;
    }

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
            easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.22, 1, 0.36, 1)'),
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
                easing: resolveEasing(LINEAR_EASINGS.bounce, 'cubic-bezier(0.22, 1, 0.36, 1)')
            });
        }

        const chipElements = container.querySelectorAll('md-chip-set md-assist-chip');
        animateSequence(chipElements, KEYFRAMES.pop, {
            duration: 360,
            easing: resolveEasing(LINEAR_EASINGS.bounce, 'cubic-bezier(0.34, 1.56, 0.64, 1)')
        }, 40);

        const supportingSections = container.querySelectorAll('.achievement-card, .profile-card-actions, .podcast-embed, .news-section, .contribute-card');
        animateSequence(supportingSections, KEYFRAMES.rise, {
            duration: 640,
            easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.22, 1, 0.36, 1)')
        }, 90);

        const socialLinks = container.querySelectorAll('.social-icons a');
        animateSequence(socialLinks, KEYFRAMES.pop, {
            duration: 420,
            easing: resolveEasing(LINEAR_EASINGS.bounce, 'cubic-bezier(0.34, 1.56, 0.64, 1)')
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
            easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.16, 1, 0.3, 1)')
        }, 70);

        const previewPanel = resumePage.querySelector('#resume-preview .resume-content');
        if (previewPanel) {
            animateElement(previewPanel, KEYFRAMES.hero, {
                duration: 700,
                easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.16, 1, 0.3, 1)'),
                delay: 120
            });
        }

        const downloadButton = resumePage.querySelector('button[onclick="prepareAndPrintResume()"]');
        if (downloadButton) {
            animateElement(downloadButton, KEYFRAMES.pop, {
                duration: 420,
                easing: resolveEasing(LINEAR_EASINGS.bounce, 'cubic-bezier(0.34, 1.56, 0.64, 1)'),
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
                easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.22, 1, 0.36, 1)')
            });
        }

        const intro = projectsPage.querySelector('.projects-intro');
        if (intro) {
            animateElement(intro, KEYFRAMES.subtleRise, {
                duration: 520,
                easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.22, 1, 0.36, 1)'),
                delay: 60
            });
        }

        const tabs = projectsPage.querySelectorAll('#projectsFilterTabs md-primary-tab');
        animateSequence(tabs, KEYFRAMES.pop, {
            duration: 360,
            easing: resolveEasing(LINEAR_EASINGS.bounce, 'cubic-bezier(0.34, 1.56, 0.64, 1)')
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
            easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.22, 1, 0.36, 1)')
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
            easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.22, 1, 0.36, 1)')
        }, 90);
    }

    function animateSongCards(elements) {
        const cards = coerceArray(elements).filter(Boolean);
        if (cards.length === 0) {
            return;
        }
        animateSequence(cards, KEYFRAMES.pop, {
            duration: 420,
            easing: resolveEasing(LINEAR_EASINGS.bounce, 'cubic-bezier(0.34, 1.56, 0.64, 1)')
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
            easing: resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.22, 1, 0.36, 1)')
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
        animateProjectCards,
        easings: LINEAR_EASINGS
    };
})(typeof window !== 'undefined' ? window : globalThis);
