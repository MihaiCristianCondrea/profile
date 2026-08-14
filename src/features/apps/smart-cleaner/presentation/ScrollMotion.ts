/**
 * Scroll-driven motion for the Smart Cleaner presentation.
 *
 * Four rules keep this stable under fast scrolling:
 *
 * 1. Every frame reads all geometry first, then writes all custom properties.
 *    Interleaving reads and writes forces a synchronous reflow per element.
 * 2. Only elements near the viewport are measured. Everything else is clamped
 *    to its limit anyway, so measuring it just buys forced layout.
 * 3. A custom property is only written when its value actually changed, so an
 *    idle or settled layer costs no style invalidation.
 * 4. All smoothing is frame-rate independent. A fixed per-frame factor moves
 *    faster on a 120Hz display than a 60Hz one and overshoots when frames are
 *    dropped, so each factor is rescaled by the real frame delta.
 *
 * Motion is direction-aware: depth offsets are multiplied by a signed scroll
 * direction, so layers that trail on the way down lead on the way up.
 */

/** A custom property driven by an element's distance from the viewport centre. */
interface DepthBinding {
  /** Custom property name, e.g. `--story-forward`. */
  name: string;
  /** Multiplier applied to the centre offset. Negative inverts the layer. */
  strength: number;
  /** Absolute clamp in pixels. */
  limit: number;
}

interface DepthTarget {
  element: HTMLElement;
  bindings: DepthBinding[];
}

const REFERENCE_FRAME_MS = 1000 / 60;
/** Ignore absurd deltas from a backgrounded tab so nothing snaps on return. */
const MAX_FRAME_MS = 100;
const REVEAL_IN_RATIO = .14;
/** How far beyond the viewport a layer still gets measured. */
const MEASURE_MARGIN = '35% 0px 35% 0px';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Rescales a per-frame easing factor to the frame actually rendered, so motion
 * settles at the same rate regardless of refresh rate or dropped frames.
 */
function frameEasing(base: number, frameMs: number): number {
  return 1 - (1 - base) ** (frameMs / REFERENCE_FRAME_MS);
}

function mediaMatches(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Writes custom properties, skipping values that have not changed. */
function createStyleWriter(): (element: HTMLElement, name: string, value: string) => void {
  const written = new WeakMap<HTMLElement, Map<string, string>>();
  return (element, name, value) => {
    let properties = written.get(element);
    if (!properties) {
      properties = new Map();
      written.set(element, properties);
    }
    if (properties.get(name) === value) return;
    properties.set(name, value);
    element.style.setProperty(name, value);
  };
}

/**
 * Reveals elements as they enter the viewport and replays the animation when
 * they are scrolled back to.
 *
 * The travel direction comes from the current scroll direction rather than the
 * element's position: on a jump (an in-page anchor, `scrollIntoView`) the
 * element is already centred when the observer fires, so its rect says nothing
 * about which edge it came from.
 */
function startReveals(
  page: HTMLElement,
  reduceMotion: boolean,
  scrollingDown: () => boolean,
): () => void {
  const items = Array.from(page.querySelectorAll<HTMLElement>('.sc-reveal'));
  if (reduceMotion || typeof window.IntersectionObserver !== 'function') {
    items.forEach((item) => item.classList.add('is-visible'));
    return () => undefined;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const element = entry.target as HTMLElement;
      if (entry.intersectionRatio >= REVEAL_IN_RATIO) {
        // Scrolling down, content rises from below; scrolling up, it sinks
        // from above, so the whole reveal plays in reverse.
        element.style.setProperty('--reveal-from', scrollingDown() ? '42px' : '-42px');
        element.classList.add('is-visible');
        return;
      }
      // Only reset once the element is fully clear, so nothing flickers while
      // it straddles the viewport edge.
      if (entry.intersectionRatio === 0) element.classList.remove('is-visible');
    });
  }, { threshold: [0, REVEAL_IN_RATIO], rootMargin: '0px 0px -6% 0px' });

  items.forEach((item) => observer.observe(item));
  return () => observer.disconnect();
}

export interface ScrollMotionElements {
  heroStage: HTMLElement | null;
  problemSection: HTMLElement | null;
  featureStage: HTMLElement | null;
  storyCards: HTMLElement[];
  breathing: HTMLElement | null;
  performance: HTMLElement | null;
  finalCard: HTMLElement | null;
  onFrame?: () => void;
}

/**
 * Starts the scroll and pointer motion loop. Returns a stop function; the loop
 * also stops on its own once the page leaves the document.
 */
export function startScrollMotion(
  page: HTMLElement,
  elements: ScrollMotionElements,
): () => void {
  const reduceMotion = mediaMatches('(prefers-reduced-motion: reduce)');
  const finePointer = mediaMatches('(pointer: fine)');

  // Scroll direction is tracked here so the reveals and the parallax agree on
  // which way the page is moving.
  let lastScrollY = window.scrollY;
  let directionTarget = 1;
  const trackDirection = (): void => {
    const scrollY = window.scrollY;
    if (scrollY === lastScrollY) return;
    directionTarget = scrollY > lastScrollY ? 1 : -1;
    lastScrollY = scrollY;
  };
  window.addEventListener('scroll', trackDirection, { passive: true });

  const stopReveals = startReveals(page, reduceMotion, () => directionTarget > 0);
  const stopBase = (): void => {
    window.removeEventListener('scroll', trackDirection);
    stopReveals();
  };

  if (reduceMotion) return stopBase;

  const requestFrame = window.requestAnimationFrame?.bind(window);
  if (!requestFrame) return stopBase;

  const targets: DepthTarget[] = [];
  const track = (element: HTMLElement | null, bindings: DepthBinding[]): void => {
    if (element) targets.push({ element, bindings });
  };

  track(elements.problemSection, [
    { name: '--problem-forward', strength: -.055, limit: 50 },
    { name: '--problem-reverse', strength: .055, limit: 50 },
  ]);
  track(elements.featureStage, [
    { name: '--feature-forward', strength: -.07, limit: 42 },
    { name: '--feature-reverse', strength: .075, limit: 45 },
    { name: '--feature-badge-reverse', strength: .055, limit: 34 },
  ]);
  elements.storyCards.forEach((story) => {
    const invert = story.dataset.invert === 'true' ? -1 : 1;
    track(story, [
      { name: '--story-forward', strength: -.08 * invert, limit: 50 },
      { name: '--story-reverse', strength: .075 * invert, limit: 45 },
      { name: '--story-copy', strength: .04 * invert, limit: 25 },
    ]);
  });
  track(elements.breathing, [
    { name: '--breathing-forward', strength: .12, limit: 70 },
    { name: '--breathing-reverse', strength: -.12, limit: 70 },
  ]);
  track(elements.performance, [{ name: '--performance-core', strength: -.04, limit: 22 }]);
  track(elements.finalCard, [{ name: '--final-reverse', strength: .08, limit: 50 }]);

  // Only layers near the viewport are worth measuring; the rest sit at their
  // clamp limit regardless.
  const measurable = new Set<Element>();
  const proximityObserver = typeof window.IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) measurable.add(entry.target);
        else measurable.delete(entry.target);
      });
    }, { rootMargin: MEASURE_MARGIN })
    : null;
  if (proximityObserver) {
    targets.forEach(({ element }) => proximityObserver.observe(element));
    if (elements.heroStage) proximityObserver.observe(elements.heroStage);
  }
  const shouldMeasure = (element: Element): boolean => !proximityObserver || measurable.has(element);

  const write = createStyleWriter();
  let targetPointerX = 0;
  let targetPointerY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothScrollY = window.scrollY;
  let direction = 1;
  let lastFrame = 0;

  const onPointerMove = (event: PointerEvent): void => {
    const bounds = page.getBoundingClientRect();
    targetPointerX = clamp(((event.clientX - bounds.left) / Math.max(bounds.width, 1) - .5) * 2, -1, 1);
    targetPointerY = clamp((event.clientY / Math.max(window.innerHeight, 1) - .5) * 2, -1, 1);
  };
  const onPointerLeave = (): void => {
    targetPointerX = 0;
    targetPointerY = 0;
  };
  if (finePointer) {
    page.addEventListener('pointermove', onPointerMove, { passive: true });
    page.addEventListener('pointerleave', onPointerLeave, { passive: true });
  }

  const stop = (): void => {
    stopBase();
    proximityObserver?.disconnect();
    page.removeEventListener('pointermove', onPointerMove);
    page.removeEventListener('pointerleave', onPointerLeave);
  };

  const frame = (now: number): void => {
    if (!page.isConnected) {
      stop();
      return;
    }

    const frameMs = lastFrame ? clamp(now - lastFrame, 1, MAX_FRAME_MS) : REFERENCE_FRAME_MS;
    lastFrame = now;

    // --- read: gather every measurement before touching styles ---
    const scrollY = window.scrollY;
    const viewportCentre = window.innerHeight / 2;
    const offsets = targets.map(({ element }) => (shouldMeasure(element)
      ? (() => {
        const rect = element.getBoundingClientRect();
        return rect.top + rect.height / 2 - viewportCentre;
      })()
      : null));
    const heroStage = elements.heroStage;
    const heroRect = heroStage && shouldMeasure(heroStage)
      ? heroStage.getBoundingClientRect()
      : null;

    // --- compute ---
    trackDirection();
    direction += (directionTarget - direction) * frameEasing(.12, frameMs);
    smoothScrollY += (scrollY - smoothScrollY) * frameEasing(.18, frameMs);
    const pointerEase = frameEasing(.09, frameMs);
    pointerX += (targetPointerX - pointerX) * pointerEase;
    pointerY += (targetPointerY - pointerY) * pointerEase;

    // --- write ---
    write(page, '--sc-bg-forward', `${(smoothScrollY * .08).toFixed(1)}px`);
    write(page, '--sc-bg-reverse', `${(smoothScrollY * -.075).toFixed(1)}px`);
    write(page, '--sc-orbit-forward', `${(smoothScrollY * .024).toFixed(2)}deg`);
    write(page, '--sc-orbit-reverse', `${(smoothScrollY * -.032).toFixed(2)}deg`);
    write(page, '--sc-tilt-x', `${(pointerY * -3).toFixed(2)}deg`);
    write(page, '--sc-tilt-y', `${(pointerX * 3.5).toFixed(2)}deg`);
    write(page, '--sc-feature-tilt-x', `${(pointerY * -2).toFixed(2)}deg`);
    write(page, '--sc-feature-tilt-y', `${(pointerX * 2.2).toFixed(2)}deg`);
    write(page, '--sc-pointer-halo-x', `${(pointerX * -12).toFixed(1)}px`);
    write(page, '--sc-pointer-halo-y', `${(pointerY * -10).toFixed(1)}px`);
    write(page, '--sc-float-top-x', `${(pointerX * -20).toFixed(1)}px`);
    write(page, '--sc-float-bottom-x', `${(pointerX * 22).toFixed(1)}px`);

    if (heroRect) {
      const delta = (heroRect.top + heroRect.height / 2 - viewportCentre) * direction;
      const forward = clamp(delta * -.065, -45, 45);
      write(page, '--sc-hero-forward', `${forward.toFixed(1)}px`);
      write(page, '--sc-hero-reverse', `${clamp(delta * .025, -18, 18).toFixed(1)}px`);
      write(page, '--sc-float-top-y', `${(pointerY * -16 + forward * .7).toFixed(1)}px`);
      write(page, '--sc-float-bottom-y', `${(pointerY * 18 - forward * .7).toFixed(1)}px`);
    }

    targets.forEach((target, index) => {
      const offset = offsets[index];
      if (offset === null) return;
      const delta = offset * direction;
      target.bindings.forEach(({ name, strength, limit }) => {
        write(target.element, name, `${clamp(delta * strength, -limit, limit).toFixed(1)}px`);
      });
    });

    elements.onFrame?.();
    requestFrame(frame);
  };

  requestFrame(frame);
  return stop;
}
