const DEFAULT_EASINGS = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)'
};

const DEFAULT_FALLBACKS = {
  accelerate: DEFAULT_EASINGS.accelerate,
  decelerate: DEFAULT_EASINGS.decelerate
};

const reduceMotionQuery = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

let prefersReducedMotion = reduceMotionQuery ? reduceMotionQuery.matches : false;

if (reduceMotionQuery) {
  const updatePreference = (event) => {
    prefersReducedMotion = Boolean(event?.matches);
  };
  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', updatePreference);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(updatePreference);
  }
}

function getWindowSizeClass() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  if (width >= 1200) {
    return 'expanded';
  }
  if (width >= 600) {
    return 'medium';
  }
  return 'compact';
}

function baseMotionSpec(speed = 'default') {
  if (prefersReducedMotion) {
    return {
      duration: 160,
      easing: DEFAULT_EASINGS.standard,
      reducedDuration: 120
    };
  }

  switch (speed) {
    case 'fast':
      return {
        duration: 180,
        easing: DEFAULT_EASINGS.accelerate,
        reducedDuration: 120
      };
    case 'slow':
      return {
        duration: 360,
        easing: DEFAULT_EASINGS.decelerate,
        reducedDuration: 200
      };
    default:
      return {
        duration: 260,
        easing: DEFAULT_EASINGS.standard,
        reducedDuration: 160
      };
  }
}

function animateElements(elements, keyframes, options) {
  const targets = Array.isArray(elements) ? elements : Array.from(elements || []);
  targets.forEach((element, index) => {
    if (!element) {
      return;
    }
    const delay = options?.stagger ? options.stagger * index : 0;
    if (typeof element.animate === 'function') {
      element.animate(keyframes, {
        duration: options?.duration ?? 240,
        easing: options?.easing ?? DEFAULT_EASINGS.standard,
        delay,
        fill: 'forwards'
      });
    } else {
      element.style.opacity = keyframes[keyframes.length - 1]?.opacity ?? 1;
    }
  });
}

export function shouldReduceMotion() {
  return prefersReducedMotion;
}

export function canAnimate() {
  return typeof Element !== 'undefined' && Element.prototype && typeof Element.prototype.animate === 'function';
}

export function resolveEasing(preferred, fallback) {
  if (prefersReducedMotion) {
    return DEFAULT_EASINGS.standard;
  }
  if (preferred) {
    return preferred;
  }
  return fallback || DEFAULT_EASINGS.standard;
}

export function getMotionContext() {
  return { windowSize: getWindowSizeClass() };
}

export function getMotionSpec({ speed = 'default' } = {}) {
  const spec = baseMotionSpec(speed);
  return {
    ...spec,
    fallbackEasing: DEFAULT_EASINGS.standard
  };
}

export function createPageTransitionKeyframes(direction = 'in') {
  if (direction === 'out') {
    return [
      { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      { opacity: 0, transform: 'translate3d(-16px, 0, 0)' }
    ];
  }
  return [
    { opacity: 0, transform: 'translate3d(16px, 0, 0)' },
    { opacity: 1, transform: 'translate3d(0, 0, 0)' }
  ];
}

export function animateSongCards(cards) {
  animateElements(cards, [
    { opacity: 0, transform: 'translateY(12px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 240, stagger: 40 });
}

export function animateProjectCards(cards) {
  animateElements(cards, [
    { opacity: 0, transform: 'scale(0.96)' },
    { opacity: 1, transform: 'scale(1)' }
  ], { duration: 280, stagger: 60 });
}

export function animateNewsCards(cards) {
  animateElements(cards, [
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 260, stagger: 50 });
}

export function animatePage(container) {
  if (!container) {
    return Promise.resolve();
  }
  if (typeof container.animate !== 'function') {
    container.style.opacity = '1';
    return Promise.resolve();
  }
  const frames = createPageTransitionKeyframes('in');
  const spec = getMotionSpec({ speed: 'default' });
  return container.animate(frames, {
    duration: spec.duration,
    easing: resolveEasing(spec.easing, spec.fallbackEasing),
    fill: 'both'
  }).finished.catch(() => {});
}

export function init() {
  document.documentElement.dataset.windowSize = getWindowSizeClass();
}

export const easings = {
  spring: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  ...DEFAULT_EASINGS
};

export const fallbacks = { ...DEFAULT_FALLBACKS };

const siteAnimations = {
  init,
  shouldReduceMotion,
  canAnimate,
  resolveEasing,
  getMotionContext,
  getMotionSpec,
  createPageTransitionKeyframes,
  animateSongCards,
  animateProjectCards,
  animateNewsCards,
  animatePage,
  easings,
  fallbacks
};

if (typeof window !== 'undefined') {
  window.SiteAnimations = siteAnimations;
}

export default siteAnimations;
