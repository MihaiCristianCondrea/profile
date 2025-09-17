(function (global) {
    const defaultFadeOutTiming = {
        duration: 90,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'forwards'
    };

    const defaultFadeInTiming = {
        duration: 210,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
        fill: 'forwards'
    };

    function setFinalOpacity(element, value) {
        if (element && element.style) {
            element.style.opacity = value;
        }
    }

    function performFade(element, keyframes, defaultTiming, overrides, finalOpacity) {
        if (!element) {
            return Promise.resolve();
        }

        const timing = Object.assign({}, defaultTiming, overrides || {});

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
