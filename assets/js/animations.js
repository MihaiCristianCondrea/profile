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
            updateMotionPreferenceClasses();
        };

        if (typeof reduceMotionQuery.addEventListener === 'function') {
            reduceMotionQuery.addEventListener('change', updatePreference);
        } else if (typeof reduceMotionQuery.addListener === 'function') {
            reduceMotionQuery.addListener(updatePreference);
        }
    }

    function canAnimate() {
        return hasWaapiSupport;
    }

    function shouldReduceMotion() {
        return prefersReducedMotion;
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

    function updateMotionPreferenceClasses() {
        if (!root || !root.documentElement) {
            return;
        }

        const htmlElement = root.documentElement;
        const reduce = shouldReduceMotion();

        if (reduce) {
            htmlElement.classList.add('prefers-reduced-motion');
        } else {
            htmlElement.classList.remove('prefers-reduced-motion');
        }

        htmlElement.classList.toggle('animations-enabled', canAnimate() && !reduce);
    }

    const KEYFRAMES = {
        hero: [
            { opacity: 0, transform: 'translateY(24px) scale(0.97)', filter: 'blur(6px)' },
            { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
        ],
        rise: [
            { opacity: 0, transform: 'translateY(18px)', filter: 'blur(4px)' },
            { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
        ],
        subtleRise: [
            { opacity: 0, transform: 'translateY(12px)', filter: 'blur(2px)' },
            { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }
        ],
        pop: [
            { opacity: 0, transform: 'translateY(8px) scale(0.94)', filter: 'blur(2px)' },
            { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
        ],
        slideInRight: [
            { opacity: 0, transform: 'translateX(-20px)', filter: 'blur(3px)' },
            { opacity: 1, transform: 'translateX(0)', filter: 'blur(0)' }
        ]
    };

    const REDUCED_KEYFRAMES = Object.freeze({
        fade: [
            { opacity: 0 },
            { opacity: 1 }
        ]
    });

    const LINEAR_EASINGS = Object.freeze({
        accelerate: 'linear(0, 0.003 3.8%, 0.011 7.7%, 0.025 11.7%, 0.043 15.8%, 0.066 19.9%, 0.092 24.1%, 0.123 28.3%, 0.156 32.5%, 0.193 36.7%, 0.232 40.9%, 0.273 45.1%, 0.316 49.2%, 0.407 57.3%, 0.5 65%, 0.593 72.2%, 0.684 78.9%, 0.768 84.9%, 0.844 90%, 0.957 97.3%, 1)',
        bounce: 'linear(0, 0.004, 0.016, 0.035, 0.063 9.1%, 0.141, 0.25, 0.391, 0.563, 0.765, 1, 0.891, 0.813 45.5%, 0.785, 0.766, 0.754, 0.75, 0.754, 0.766, 0.785, 0.813 63.6%, 0.891, 1 72.7%, 0.973, 0.953, 0.941, 0.938, 0.941, 0.953, 0.973, 1, 0.988, 0.984, 0.988, 1)',
        decelerate: 'linear(0, 0.043 1%, 0.092 2.4%, 0.123 3.3%, 0.156 4.4%, 0.193 5.6%, 0.232 7.1%, 0.273 8.7%, 0.316 10.5%, 0.361 12.6%, 0.407 14.8%, 0.453 17.3%, 0.5 20%, 0.547 22.9%, 0.593 26.1%, 0.639 29.5%, 0.684 33.2%, 0.727 37.1%, 0.768 41.4%, 0.807 45.8%, 0.844 50.6%, 0.877 55.7%, 0.908 61.1%, 0.934 66.7%, 0.957 72.7%, 0.975 79%, 0.989 85.7%, 0.997 92.7%, 1)',
        spring: 'linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)'
    });

    const CUBIC_EASING_FALLBACKS = Object.freeze({
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)'
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

    const DEFAULT_MOTION_TOKEN = Object.freeze({
        duration: 480,
        easing: LINEAR_EASINGS.decelerate,
        fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
        reducedDuration: 220
    });

    const DEFAULT_MOTION_SCHEME = 'expressive';

    const MOTION_SCHEMES = Object.freeze({
        expressive: {
            spatial: {
                fast: {
                    duration: 260,
                    easing: LINEAR_EASINGS.bounce,
                    fallbackEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                    reducedDuration: 160
                },
                default: {
                    duration: 520,
                    easing: LINEAR_EASINGS.spring,
                    fallbackEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    reducedDuration: 220
                },
                slow: {
                    duration: 720,
                    easing: LINEAR_EASINGS.spring,
                    fallbackEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    reducedDuration: 260
                }
            },
            effect: {
                fast: {
                    duration: 200,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 160
                },
                default: {
                    duration: 320,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 200
                },
                slow: {
                    duration: 420,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 240
                }
            }
        },
        standard: {
            spatial: {
                fast: {
                    duration: 220,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 150
                },
                default: {
                    duration: 420,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 200
                },
                slow: {
                    duration: 520,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 240
                }
            },
            effect: {
                fast: {
                    duration: 160,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 120
                },
                default: {
                    duration: 240,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 160
                },
                slow: {
                    duration: 320,
                    easing: LINEAR_EASINGS.decelerate,
                    fallbackEasing: CUBIC_EASING_FALLBACKS.decelerate,
                    reducedDuration: 200
                }
            }
        }
    });

    let activeMotionScheme = DEFAULT_MOTION_SCHEME;
    let currentMotionSchemeClass = '';

    function getMotionScheme() {
        return activeMotionScheme;
    }

    function applyMotionSchemeAttributes() {
        if (!root || !root.documentElement) {
            return;
        }

        const htmlElement = root.documentElement;
        if (currentMotionSchemeClass) {
            htmlElement.classList.remove(currentMotionSchemeClass);
        }

        currentMotionSchemeClass = `motion-scheme-${activeMotionScheme}`;
        htmlElement.classList.add(currentMotionSchemeClass);
        htmlElement.dataset.motionScheme = activeMotionScheme;
    }

    function setMotionScheme(schemeName) {
        if (!schemeName || !MOTION_SCHEMES[schemeName]) {
            return activeMotionScheme;
        }

        activeMotionScheme = schemeName;
        applyMotionSchemeAttributes();
        return activeMotionScheme;
    }

    function resolveMotionSpec(meta) {
        const motionMeta = meta && typeof meta === 'object' ? meta : {};
        const type = motionMeta.type === 'effect' ? 'effect' : 'spatial';
        const speed = motionMeta.speed === 'fast' || motionMeta.speed === 'slow'
            ? motionMeta.speed
            : 'default';

        const requestedScheme = motionMeta.scheme && MOTION_SCHEMES[motionMeta.scheme]
            ? motionMeta.scheme
            : getMotionScheme();
        const scheme = MOTION_SCHEMES[requestedScheme] || MOTION_SCHEMES[DEFAULT_MOTION_SCHEME];
        const bucket = scheme[type] || scheme.spatial;
        const token = (bucket && bucket[speed]) || (bucket && bucket.default) || DEFAULT_MOTION_TOKEN;

        return {
            duration: typeof token.duration === 'number' ? token.duration : DEFAULT_MOTION_TOKEN.duration,
            easing: token.easing || DEFAULT_MOTION_TOKEN.easing,
            fallbackEasing: token.fallbackEasing || DEFAULT_MOTION_TOKEN.fallbackEasing,
            reducedDuration: typeof token.reducedDuration === 'number'
                ? token.reducedDuration
                : DEFAULT_MOTION_TOKEN.reducedDuration
        };
    }

    function getReducedKeyframes(frames) {
        const normalizedFrames = Array.isArray(frames) ? frames : [frames];
        const lastFrame = normalizedFrames[normalizedFrames.length - 1] || {};
        const finalOpacity = typeof lastFrame.opacity === 'number' ? lastFrame.opacity : 1;
        return [
            { opacity: 0 },
            { opacity: finalOpacity }
        ];
    }

    function getAdaptiveStagger(baseGap) {
        let computedGap = typeof baseGap === 'number' ? baseGap : 0;

        if (root && root.documentElement) {
            const width = root.documentElement.clientWidth || 0;
            if (width >= 1440) {
                computedGap = Math.round(computedGap * 1.25);
            } else if (width <= 480) {
                computedGap = Math.round(computedGap * 0.8);
            }
        }

        if (shouldReduceMotion()) {
            computedGap = Math.max(0, Math.min(120, Math.round(computedGap * 0.55)));
        }

        return computedGap;
    }

    function animateElement(element, keyframes, options, motionMeta) {
        if (!element) {
            return null;
        }

        if (!canAnimate()) {
            cleanupElementStyles(element, true);
            return null;
        }

        const hasReducedMotion = shouldReduceMotion();
        const framesInput = Array.isArray(keyframes) ? keyframes : [keyframes];
        const frames = hasReducedMotion ? getReducedKeyframes(framesInput) : framesInput;
        const motionSpec = resolveMotionSpec(motionMeta);

        const animationOptions = Object.assign({
            fill: 'both'
        }, options || {});

        if (animationOptions.duration === undefined) {
            animationOptions.duration = motionSpec.duration;
        }

        const resolvedFallback = motionSpec.fallbackEasing || DEFAULT_MOTION_TOKEN.fallbackEasing;
        const baseEasing = animationOptions.easing === undefined
            ? motionSpec.easing
            : animationOptions.easing;
        animationOptions.easing = resolveEasing(baseEasing, resolvedFallback);

        if (hasReducedMotion) {
            const reducedDuration = motionSpec.reducedDuration || DEFAULT_MOTION_TOKEN.reducedDuration;
            if (typeof reducedDuration === 'number') {
                animationOptions.duration = Math.min(animationOptions.duration, reducedDuration);
            }
            animationOptions.easing = resolveEasing(LINEAR_EASINGS.decelerate, CUBIC_EASING_FALLBACKS.decelerate);
        }

        if (element.style) {
            const firstFrame = frames[0] || {};
            if (firstFrame.opacity !== undefined) {
                element.style.opacity = firstFrame.opacity;
            }
            if (!hasReducedMotion && firstFrame.transform !== undefined) {
                element.style.transform = firstFrame.transform;
            } else if (hasReducedMotion) {
                element.style.transform = '';
            }
            if (!hasReducedMotion && firstFrame.filter !== undefined) {
                element.style.filter = firstFrame.filter;
            } else if (hasReducedMotion) {
                element.style.filter = '';
            }
            element.style.willChange = hasReducedMotion ? 'opacity' : 'opacity, transform';
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

    function animateSequence(elements, keyframes, options, gap = 80, motionMeta) {
        const nodes = coerceArray(elements).filter(Boolean);
        if (nodes.length === 0) {
            return;
        }

        const computedGap = getAdaptiveStagger(typeof gap === 'number' ? gap : 0);

        nodes.forEach((element, index) => {
            const baseOptions = Object.assign({}, options || {});
            const existingDelay = typeof baseOptions.delay === 'number' ? baseOptions.delay : 0;
            baseOptions.delay = existingDelay + index * computedGap;
            animateElement(element, keyframes, baseOptions, motionMeta);
        });
    }

    function animateHome(container) {
        if (!container) {
            return;
        }

        const heroCard = container.querySelector('.profile-card');
        if (heroCard) {
            animateElement(heroCard, KEYFRAMES.hero, null, {
                scheme: 'expressive',
                type: 'spatial',
                speed: 'slow'
            });
        }

        const chipElements = container.querySelectorAll('md-chip-set md-assist-chip');
        animateSequence(chipElements, KEYFRAMES.pop, { delay: 40 }, 40, {
            scheme: 'expressive',
            type: 'spatial',
            speed: 'fast'
        });

        const supportingSections = container.querySelectorAll('.achievement-card, .profile-card-actions, .podcast-embed, .news-section, .contribute-card');
        animateSequence(supportingSections, KEYFRAMES.rise, { delay: 80 }, 96, {
            scheme: 'expressive',
            type: 'spatial',
            speed: 'default'
        });

        const socialLinks = container.querySelectorAll('.social-icons a');
        animateSequence(socialLinks, KEYFRAMES.pop, { delay: 120 }, 48, {
            scheme: 'expressive',
            type: 'spatial',
            speed: 'fast'
        });
    }

    function animateResume(container) {
        const resumePage = container ? container.querySelector('#resumePage') : null;
        if (!resumePage) {
            animateDefault(container);
            return;
        }

        const formSections = resumePage.querySelectorAll('.form-container .form-section, .form-container h1');
        animateSequence(formSections, KEYFRAMES.slideInRight, { delay: 24 }, 70, {
            scheme: 'standard',
            type: 'spatial',
            speed: 'default'
        });

        const previewPanel = resumePage.querySelector('#resume-preview .resume-content');
        if (previewPanel) {
            animateElement(previewPanel, KEYFRAMES.hero, { delay: 120 }, {
                scheme: 'standard',
                type: 'spatial',
                speed: 'slow'
            });
        }

        const downloadButton = resumePage.querySelector('button[onclick="prepareAndPrintResume()"]');
        if (downloadButton) {
            animateElement(downloadButton, KEYFRAMES.pop, { delay: 200 }, {
                scheme: 'standard',
                type: 'spatial',
                speed: 'fast'
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
            animateElement(heading, KEYFRAMES.slideInRight, null, {
                scheme: 'expressive',
                type: 'spatial',
                speed: 'default'
            });
        }

        const intro = projectsPage.querySelector('.projects-intro');
        if (intro) {
            animateElement(intro, KEYFRAMES.subtleRise, { delay: 60 }, {
                scheme: 'expressive',
                type: 'spatial',
                speed: 'default'
            });
        }

        const tabs = projectsPage.querySelectorAll('#projectsFilterTabs md-primary-tab');
        animateSequence(tabs, KEYFRAMES.pop, { delay: 40 }, 36, {
            scheme: 'expressive',
            type: 'spatial',
            speed: 'fast'
        });

        const cards = projectsPage.querySelectorAll('.project-entry');
        animateProjectCards(cards);
    }

    function animateDefault(container) {
        if (!container) {
            return;
        }
        const sectionChildren = container.querySelectorAll('.page-section.active > *:not(script):not(style)');
        animateSequence(sectionChildren, KEYFRAMES.subtleRise, { delay: 24 }, 70, {
            scheme: 'standard',
            type: 'spatial',
            speed: 'default'
        });
    }

    function animatePage(container, pageId) {
        const normalizedId = typeof pageId === 'string' ? pageId.toLowerCase() : '';
        const targetContainer = ElementConstructor && container instanceof ElementConstructor
            ? container
            : (root ? root.getElementById('pageContentArea') : null);
        if (!targetContainer) {
            return;
        }

        if (!canAnimate()) {
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
        animateSequence(cards, KEYFRAMES.rise, { delay: 32 }, 90, {
            scheme: 'standard',
            type: 'spatial',
            speed: 'default'
        });
    }

    function animateSongCards(elements) {
        const cards = coerceArray(elements).filter(Boolean);
        if (cards.length === 0) {
            return;
        }
        animateSequence(cards, KEYFRAMES.pop, { delay: 36 }, 60, {
            scheme: 'expressive',
            type: 'spatial',
            speed: 'fast'
        });
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
        animateSequence(cards, KEYFRAMES.rise, { delay: 48 }, 110, {
            scheme: 'standard',
            type: 'spatial',
            speed: 'default'
        });
    }

    function applyMotionEasingCustomProperties() {
        if (!root || !root.documentElement || !root.documentElement.style || typeof root.documentElement.style.setProperty !== 'function') {
            return;
        }

        const accelerateValue = supportsLinearEasing
            ? LINEAR_EASINGS.accelerate
            : CUBIC_EASING_FALLBACKS.accelerate;
        const decelerateValue = supportsLinearEasing
            ? LINEAR_EASINGS.decelerate
            : CUBIC_EASING_FALLBACKS.decelerate;
        const standardValue = decelerateValue;
        const springValue = resolveEasing(LINEAR_EASINGS.spring, 'cubic-bezier(0.22, 1, 0.36, 1)');
        const bounceValue = resolveEasing(LINEAR_EASINGS.bounce, 'cubic-bezier(0.34, 1.56, 0.64, 1)');

        if (accelerateValue) {
            root.documentElement.style.setProperty('--app-motion-ease-accelerate', accelerateValue);
        }

        if (decelerateValue) {
            root.documentElement.style.setProperty('--app-motion-ease-decelerate', decelerateValue);
        }

        if (standardValue) {
            root.documentElement.style.setProperty('--app-motion-ease-standard', standardValue);
        }

        if (springValue) {
            root.documentElement.style.setProperty('--app-motion-spring', springValue);
        }

        if (bounceValue) {
            root.documentElement.style.setProperty('--app-motion-bounce', bounceValue);
        }
    }

    function init() {
        if (!root) {
            return;
        }

        applyMotionEasingCustomProperties();

        if (root.documentElement) {
            const existingScheme = root.documentElement.dataset.motionScheme;
            if (existingScheme && MOTION_SCHEMES[existingScheme]) {
                activeMotionScheme = existingScheme;
            }
        }

        applyMotionSchemeAttributes();
        updateMotionPreferenceClasses();

        if (!canAnimate()) {
            return;
        }

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
        resolveEasing,
        setMotionScheme,
        getMotionScheme,
        schemes: MOTION_SCHEMES,
        shouldReduceMotion,
        canAnimate,
        easings: LINEAR_EASINGS,
        fallbacks: CUBIC_EASING_FALLBACKS
    };
})(typeof window !== 'undefined' ? window : globalThis);
