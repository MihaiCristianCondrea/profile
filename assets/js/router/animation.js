const DEFAULT_FADE_DURATION = 250;
const DEFAULT_EASING_OUT = 'cubic-bezier(0.4, 0, 1, 1)';
const DEFAULT_EASING_IN = 'cubic-bezier(0, 0, 0.2, 1)';

function resolveTiming(options, fallbackDuration, fallbackEasing) {
  const duration = Number.isFinite(options?.duration) ? options.duration : fallbackDuration;
  const easing = typeof options?.easing === 'string' ? options.easing : fallbackEasing;
  return { duration, easing, fill: 'both' };
}

function runFallbackFade(element, finalOpacity, duration) {
  return new Promise((resolve) => {
    if (!element || !element.style) {
      resolve();
      return;
    }
    const originalTransition = element.style.transition;
    element.style.transition = `opacity ${duration}ms`; // basic fallback
    const frame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (cb) => setTimeout(cb, 16);
    frame(() => {
      element.style.opacity = String(finalOpacity);
      setTimeout(() => {
        element.style.transition = originalTransition;
        resolve();
      }, duration);
    });
  });
}

export function fadeOut(element, options = {}) {
  if (!element) {
    return Promise.resolve();
  }
  const timing = resolveTiming(options, DEFAULT_FADE_DURATION, DEFAULT_EASING_OUT);

  if (typeof element.animate === 'function') {
    try {
      return element
        .animate(
          [
            { opacity: Number.parseFloat(getComputedStyle(element).opacity) || 1 },
            { opacity: 0 }
          ],
          timing
        )
        .finished.catch(() => {});
    } catch (error) {
      console.error('RouterAnimation: fadeOut failed, falling back to CSS transition.', error);
    }
  }

  return runFallbackFade(element, 0, timing.duration);
}

export function fadeIn(element, options = {}) {
  if (!element) {
    return Promise.resolve();
  }
  const timing = resolveTiming(options, DEFAULT_FADE_DURATION + 100, DEFAULT_EASING_IN);

  if (typeof element.animate === 'function') {
    try {
      return element
        .animate(
          [
            { opacity: 0 },
            { opacity: 1 }
          ],
          timing
        )
        .finished.catch(() => {});
    } catch (error) {
      console.error('RouterAnimation: fadeIn failed, falling back to CSS transition.', error);
    }
  }

  if (element.style) {
    element.style.opacity = '0';
  }
  return runFallbackFade(element, 1, timing.duration);
}

export default {
  fadeOut,
  fadeIn
};
