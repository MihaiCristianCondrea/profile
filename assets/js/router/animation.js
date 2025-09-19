(function (global) {
    const FADE_OUT_EASING_FALLBACK = 'cubic-bezier(0.4, 0, 1, 1)';
    const FADE_IN_EASING_FALLBACK = 'cubic-bezier(0, 0, 0.2, 1)';

    function resolveRouterEasing(easingKey, fallback) {
        const siteAnimations = global.SiteAnimations;
        if (siteAnimations) {
            const fallbacks = siteAnimations.fallbacks || {};
            const preferred = siteAnimations.easings && siteAnimations.easings[easingKey];
            const effectiveFallback = fallbacks[easingKey] || fallback;
            if (typeof siteAnimations.resolveEasing === 'function') {
                return siteAnimations.resolveEasing(preferred, effectiveFallback);
            }
            return effectiveFallback;
        }
        return fallback;
    }

    const defaultFadeOutTiming = () => ({
        duration: 90,
        easing: resolveRouterEasing('accelerate', FADE_OUT_EASING_FALLBACK),
        fill: 'forwards'
    });

    const defaultFadeInTiming = () => ({
        duration: 210,
        easing: resolveRouterEasing('decelerate', FADE_IN_EASING_FALLBACK),
        fill: 'forwards'
    });

    function setFinalOpacity(element, value) {
        if (element && element.style) {
            element.style.opacity = value;
        }
    }

    function performFade(element, keyframes, defaultTiming, overrides, finalOpacity) {
        if (!element) {
            return Promise.resolve();
        }

        const baseTiming = typeof defaultTiming === 'function'
            ? defaultTiming()
            : Object.assign({}, defaultTiming);
        const timing = Object.assign(baseTiming, overrides || {});

        if (typeof element.animate !== 'function') {
            setFinalOpacity(element, finalOpacity);
            return Promise.resolve();
        }

        try {
            const animation = element.animate(keyframes, timing);
            return animation.finished
                .catch(() => { })
                .finally(() => {
                    setFinalOpacity(element, finalOpacity);
                });
        } catch (error) {
            setFinalOpacity(element, finalOpacity);
            return Promise.resolve();
        }
    }

    function fadeOut(element, timingOverrides) {
        return performFade(
            element,
            [{ opacity: 1 }, { opacity: 0 }],
            defaultFadeOutTiming,
            timingOverrides,
            0
        );
    }

    function fadeIn(element, timingOverrides) {
        return performFade(
            element,
            [{ opacity: 0 }, { opacity: 1 }],
            defaultFadeInTiming,
            timingOverrides,
            1
        );
    }

    global.RouterAnimation = {
        fadeIn,
        fadeOut
    };
})(typeof window !== 'undefined' ? window : globalThis);
