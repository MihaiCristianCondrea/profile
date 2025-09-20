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

    const WINDOW_BREAKPOINTS = Object.freeze({
        medium: 600,
        expanded: 1200
    });

    const ORIENTATION = Object.freeze({
        portrait: 'portrait',
        landscape: 'landscape'
    });

    const pointerQueries = typeof global.matchMedia === 'function'
        ? {
            fine: global.matchMedia('(any-pointer: fine)'),
            coarse: global.matchMedia('(any-pointer: coarse)'),
            none: global.matchMedia('(pointer: none)')
        }
        : { fine: null, coarse: null, none: null };

    let currentWindowSizeClass = 'compact';
    let currentOrientation = ORIENTATION.portrait;
    let currentPointerType = 'coarse';

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

    function computeWindowSizeClass(width) {
        if (typeof width !== 'number' || width <= 0) {
            return currentWindowSizeClass;
        }
        if (width >= WINDOW_BREAKPOINTS.expanded) {
            return 'expanded';
        }
        if (width >= WINDOW_BREAKPOINTS.medium) {
            return 'medium';
        }
        return 'compact';
    }

    function detectOrientation(width, height) {
        if (typeof width !== 'number' || typeof height !== 'number') {
            return currentOrientation;
        }
        if (height <= 0 && width <= 0) {
            return currentOrientation;
        }
        if (height <= 0) {
            return currentOrientation;
        }
        return width >= height ? ORIENTATION.landscape : ORIENTATION.portrait;
    }

    function updatePointerType() {
        const previous = currentPointerType;

        if (!pointerQueries.fine && !pointerQueries.coarse && !pointerQueries.none) {
            currentPointerType = 'coarse';
            return currentPointerType !== previous;
        }

        if (pointerQueries.fine && pointerQueries.fine.matches) {
            currentPointerType = 'fine';
        } else if (pointerQueries.coarse && pointerQueries.coarse.matches) {
            currentPointerType = 'coarse';
        } else if (pointerQueries.none && pointerQueries.none.matches) {
            currentPointerType = 'none';
        }

        if (!currentPointerType) {
            currentPointerType = 'coarse';
        }

        return currentPointerType !== previous;
    }

    function updateEnvironmentMetadata() {
        if (!root || !root.documentElement) {
            return;
        }

        const htmlElement = root.documentElement;

        if (currentWindowSizeClass) {
            htmlElement.dataset.windowSize = currentWindowSizeClass;
        }

        if (currentOrientation) {
            htmlElement.dataset.orientation = currentOrientation;
        }

        if (currentPointerType) {
            htmlElement.dataset.pointer = currentPointerType;
        }
    }

    function updateMotionTokensForContext() {
        if (!root || !root.documentElement || !root.documentElement.style) {
            return;
        }

        const htmlElement = root.documentElement;
        const style = htmlElement.style;
        const scheme = MOTION_SCHEMES[activeMotionScheme] || MOTION_SCHEMES[DEFAULT_MOTION_SCHEME];

        if (!scheme) {
            return;
        }

        const reduce = shouldReduceMotion();

        const spatialTokens = scheme.spatial || {};
        const effectTokens = scheme.effect || {};
        const fallbackScheme = MOTION_SCHEMES[DEFAULT_MOTION_SCHEME] || {};
        const fallbackSpatial = fallbackScheme.spatial || {};
        const fallbackEffect = fallbackScheme.effect || {};

        const shortToken = effectTokens.fast || fallbackEffect.fast || DEFAULT_MOTION_TOKEN;
        const mediumToken = effectTokens.default || fallbackEffect.default || DEFAULT_MOTION_TOKEN;

        let longToken = spatialTokens.default || fallbackSpatial.default || DEFAULT_MOTION_TOKEN;
        if (currentWindowSizeClass === 'expanded' && spatialTokens.slow) {
            longToken = spatialTokens.slow;
        } else if (currentWindowSizeClass === 'compact' && spatialTokens.fast) {
            longToken = spatialTokens.fast;
        }

        const reducedReference = effectTokens.default || spatialTokens.fast || DEFAULT_MOTION_TOKEN;

        const resolveDuration = (token, fallback) => {
            const baseToken = token || fallback || DEFAULT_MOTION_TOKEN;
            const duration = reduce
                ? (typeof baseToken.reducedDuration === 'number'
                    ? baseToken.reducedDuration
                    : DEFAULT_MOTION_TOKEN.reducedDuration)
                : (typeof baseToken.duration === 'number'
                    ? baseToken.duration
                    : DEFAULT_MOTION_TOKEN.duration);
            return Number.isFinite(duration) ? `${Math.round(duration)}ms` : null;
        };

        const shortValue = resolveDuration(shortToken, DEFAULT_MOTION_TOKEN);
        if (shortValue) {
            style.setProperty('--app-motion-duration-short', shortValue);
        }

        const mediumValue = resolveDuration(mediumToken, DEFAULT_MOTION_TOKEN);
        if (mediumValue) {
            style.setProperty('--app-motion-duration-medium', mediumValue);
        }

        const longValue = resolveDuration(longToken, DEFAULT_MOTION_TOKEN);
        if (longValue) {
            style.setProperty('--app-motion-duration-long', longValue);
        }

        const reducedDuration = typeof reducedReference.reducedDuration === 'number'
            ? `${Math.round(reducedReference.reducedDuration)}ms`
            : (DEFAULT_MOTION_TOKEN.reducedDuration
                ? `${Math.round(DEFAULT_MOTION_TOKEN.reducedDuration)}ms`
                : null);

        if (reducedDuration) {
            style.setProperty('--app-motion-reduced-duration', reducedDuration);
        }
    }

    function registerQueryListener(query, handler) {
        if (!query || !handler) {
            return;
        }

        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', handler);
        } else if (typeof query.addListener === 'function') {
            query.addListener(handler);
        }
    }

    function updateAdaptiveContext() {
        if (!root) {
            return false;
        }

        const htmlElement = root.documentElement;
        const width = htmlElement ? htmlElement.clientWidth : (typeof global.innerWidth === 'number' ? global.innerWidth : 0);
        const height = htmlElement ? htmlElement.clientHeight : (typeof global.innerHeight === 'number' ? global.innerHeight : 0);

        const nextWindowClass = computeWindowSizeClass(width);
        const nextOrientation = detectOrientation(width, height);

        let changed = false;

        if (nextWindowClass !== currentWindowSizeClass) {
            currentWindowSizeClass = nextWindowClass;
            changed = true;
        }

        if (nextOrientation !== currentOrientation) {
            currentOrientation = nextOrientation;
            changed = true;
        }

        const pointerChanged = updatePointerType();
        updateEnvironmentMetadata();

        return changed || pointerChanged;
    }

    function updateMotionSchemeForContext() {
        let targetScheme = DEFAULT_MOTION_SCHEME;

        if (shouldReduceMotion()) {
            targetScheme = 'standard';
        } else if (currentPointerType === 'none') {
            targetScheme = 'standard';
        } else if (currentWindowSizeClass === 'compact' && currentPointerType === 'coarse') {
            targetScheme = 'standard';
        } else if (currentWindowSizeClass === 'expanded') {
            targetScheme = 'expressive';
        } else if (currentPointerType === 'fine' && currentWindowSizeClass !== 'compact') {
            targetScheme = 'expressive';
        }

        if (!MOTION_SCHEMES[targetScheme]) {
            targetScheme = DEFAULT_MOTION_SCHEME;
        }

        setMotionScheme(targetScheme);
    }

    function observeAdaptiveConditions() {
        const applyContextUpdate = () => {
            const changed = updateAdaptiveContext();
            if (changed) {
                updateMotionSchemeForContext();
            } else {
                updateMotionTokensForContext();
            }
        };

        applyContextUpdate();

        if (typeof global.addEventListener === 'function') {
            let resizeHandle = null;
            const scheduleUpdate = () => {
                if (resizeHandle) {
                    return;
                }

                const run = () => {
                    resizeHandle = null;
                    applyContextUpdate();
                };

                if (typeof global.requestAnimationFrame === 'function') {
                    resizeHandle = global.requestAnimationFrame(run);
                } else {
                    resizeHandle = global.setTimeout(run, 120);
                }
            };

            global.addEventListener('resize', scheduleUpdate, { passive: true });
            global.addEventListener('orientationchange', scheduleUpdate);
        }

        const orientation = global.screen && global.screen.orientation;
        if (orientation && typeof orientation.addEventListener === 'function') {
            orientation.addEventListener('change', applyContextUpdate);
        }

        registerQueryListener(pointerQueries.fine, applyContextUpdate);
        registerQueryListener(pointerQueries.coarse, applyContextUpdate);
        registerQueryListener(pointerQueries.none, applyContextUpdate);
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
        updateMotionSchemeForContext();
    }

    function getMotionContext() {
        return {
            windowSize: currentWindowSizeClass,
            orientation: currentOrientation,
            pointer: currentPointerType,
            reduceMotion: shouldReduceMotion()
        };
    }

    function resolveAxis(preference, context) {
        if (preference === 'horizontal') {
            return 'X';
        }
        if (preference === 'vertical') {
            return 'Y';
        }
        if (context && context.orientation === ORIENTATION.landscape) {
            return 'X';
        }
        return 'Y';
    }

    function computeDistanceValue(baseDistance, context, axis) {
        const base = typeof baseDistance === 'number'
            ? baseDistance
            : parseFloat(baseDistance) || 0;
        const windowSize = context && context.windowSize
            ? context.windowSize
            : currentWindowSizeClass;

        let distance = base;

        if (windowSize === 'expanded') {
            distance += 12;
        } else if (windowSize === 'medium') {
            distance += 6;
        } else {
            distance = Math.max(6, distance - 2);
        }

        if (context && context.orientation === ORIENTATION.landscape && axis === 'X') {
            distance += 6;
        }

        if (context && context.pointer === 'coarse') {
            distance += 4;
        } else if (context && context.pointer === 'fine' && windowSize !== 'compact') {
            distance = Math.max(6, distance - 2);
        }

        return Math.round(distance);
    }

    function composeTransform(axis, distanceValue, scaleValue) {
        const distance = typeof distanceValue === 'number'
            ? `${distanceValue}px`
            : distanceValue;
        const translate = axis === 'X'
            ? `translate3d(${distance}, 0, 0)`
            : `translate3d(0, ${distance}, 0)`;
        const scale = typeof scaleValue === 'number' && scaleValue !== 1
            ? ` scale(${scaleValue})`
            : '';
        return `${translate}${scale}`;
    }

    function applyBlur(frame, blurValue) {
        if (!frame || typeof blurValue !== 'number') {
            return;
        }
        frame.filter = blurValue > 0 ? `blur(${blurValue}px)` : 'blur(0px)';
    }

    function makeEnterKeyframeFactory(config) {
        const {
            baseDistance = 16,
            axisPreference = 'auto',
            startScale = 1,
            endScale = 1,
            startOpacity = 0,
            endOpacity = 1,
            startBlur,
            endBlur,
            direction = 'positive'
        } = config || {};

        return (context) => {
            const motionContext = context || getMotionContext();
            const axis = resolveAxis(axisPreference, motionContext);
            const offset = computeDistanceValue(baseDistance, motionContext, axis);
            const signedOffset = direction === 'negative' ? -offset : offset;

            const firstFrame = {
                opacity: startOpacity,
                transform: composeTransform(axis, signedOffset, startScale)
            };
            const lastFrame = {
                opacity: endOpacity,
                transform: composeTransform(axis, 0, endScale)
            };

            if (startBlur !== undefined) {
                applyBlur(firstFrame, startBlur);
                applyBlur(lastFrame, endBlur !== undefined ? endBlur : 0);
            } else if (endBlur !== undefined) {
                applyBlur(lastFrame, endBlur);
            }

            return [firstFrame, lastFrame];
        };
    }

    const KEYFRAMES = {
        hero: makeEnterKeyframeFactory({
            baseDistance: 28,
            startScale: 0.97,
            startBlur: 6,
            endBlur: 0
        }),
        rise: makeEnterKeyframeFactory({
            baseDistance: 20,
            startBlur: 4,
            endBlur: 0
        }),
        subtleRise: makeEnterKeyframeFactory({
            baseDistance: 16,
            startBlur: 2,
            endBlur: 0
        }),
        pop: makeEnterKeyframeFactory({
            baseDistance: 14,
            startScale: 0.94,
            endScale: 1,
            startBlur: 2,
            endBlur: 0
        }),
        slideInRight: makeEnterKeyframeFactory({
            baseDistance: 22,
            axisPreference: 'horizontal',
            direction: 'negative',
            startBlur: 2,
            endBlur: 0
        })
    };

    function createPageTransitionKeyframes(direction = 'in') {
        const normalizedDirection = direction === 'out' ? 'out' : 'in';

        if (shouldReduceMotion()) {
            return normalizedDirection === 'out'
                ? [{ opacity: 1 }, { opacity: 0 }]
                : [{ opacity: 0 }, { opacity: 1 }];
        }

        const context = getMotionContext();
        const axis = resolveAxis('auto', context);
        const baseDistance = axis === 'X' ? 36 : 30;
        const offset = computeDistanceValue(baseDistance, context, axis);

        if (normalizedDirection === 'out') {
            const frames = [
                {
                    opacity: 1,
                    transform: composeTransform(axis, 0, 1)
                },
                {
                    opacity: 0,
                    transform: composeTransform(axis, -offset, 1)
                }
            ];
            applyBlur(frames[1], 4);
            return frames;
        }

        const frames = [
            {
                opacity: 0,
                transform: composeTransform(axis, offset, 1)
            },
            {
                opacity: 1,
                transform: composeTransform(axis, 0, 1)
            }
        ];
        applyBlur(frames[0], 4);
        applyBlur(frames[1], 0);
        return frames;
    }

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
        updateEnvironmentMetadata();
        updateMotionTokensForContext();
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

        if (currentWindowSizeClass === 'expanded') {
            computedGap = Math.round(computedGap * 1.3);
        } else if (currentWindowSizeClass === 'medium') {
            computedGap = Math.round(computedGap * 1.1);
        } else {
            computedGap = Math.round(computedGap * 0.9);
        }

        if (currentOrientation === ORIENTATION.landscape) {
            computedGap = Math.round(computedGap * 0.9);
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

        const motionContext = getMotionContext();
        const framesSource = typeof keyframes === 'function'
            ? keyframes(motionContext)
            : keyframes;
        const hasReducedMotion = shouldReduceMotion();
        const framesInput = Array.isArray(framesSource)
            ? framesSource
            : [framesSource];
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
        observeAdaptiveConditions();
        updateMotionPreferenceClasses();
        updateMotionSchemeForContext();

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
        getMotionSpec: (meta) => resolveMotionSpec(meta),
        getMotionScheme,
        getMotionContext,
        createPageTransitionKeyframes,
        animateElement,
        getWindowSizeClass: () => currentWindowSizeClass,
        getOrientation: () => currentOrientation,
        getPointerType: () => currentPointerType,
        schemes: MOTION_SCHEMES,
        shouldReduceMotion,
        canAnimate,
        easings: LINEAR_EASINGS,
        fallbacks: CUBIC_EASING_FALLBACKS
    };
})(typeof window !== 'undefined' ? window : globalThis);
