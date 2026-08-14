import { startScrollMotion } from '../../../../../src/features/apps/smart-cleaner/presentation/ScrollMotion';

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

const observers: Array<{ callback: ObserverCallback; options?: IntersectionObserverInit }> = [];

function entry(target: Element, ratio: number): IntersectionObserverEntry {
  return {
    target,
    intersectionRatio: ratio,
    isIntersecting: ratio > 0,
    boundingClientRect: { top: 300 } as DOMRectReadOnly,
  } as IntersectionObserverEntry;
}

/** Delivers an entry to every observer whose thresholds include the reveal ratio. */
function deliverReveal(target: Element, ratio: number): void {
  observers.forEach(({ callback, options }) => {
    if (Array.isArray(options?.threshold)) callback([entry(target, ratio)]);
  });
}

describe('ScrollMotion reveals', () => {
  let stop: () => void = () => undefined;

  beforeEach(() => {
    observers.length = 0;
    window.IntersectionObserver = class {
      constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
        observers.push({ callback, options });
      }

      observe(): void { /* targets are delivered manually */ }
      disconnect(): void { /* no-op */ }
      unobserve(): void { /* no-op */ }
    } as unknown as typeof IntersectionObserver;

    document.body.innerHTML = `
      <div id="page">
        <section class="sc-reveal" id="revealTarget"></section>
      </div>`;
    // jsdom does not implement scrollTo; the engine only reads scrollY.
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  afterEach(() => {
    stop();
    document.body.innerHTML = '';
  });

  const start = (): void => {
    stop = startScrollMotion(document.getElementById('page') as HTMLElement, {
      heroStage: null,
      problemSection: null,
      featureStage: null,
      storyCards: [],
      breathing: null,
      performance: null,
      finalCard: null,
    });
  };

  const target = (): HTMLElement => document.getElementById('revealTarget') as HTMLElement;

  test('reveals travel up from below while scrolling down', () => {
    start();
    deliverReveal(target(), 0.5);

    expect(target().classList.contains('is-visible')).toBe(true);
    expect(target().style.getPropertyValue('--reveal-from')).toBe('42px');
  });

  test('reveals travel down from above while scrolling up', () => {
    start();
    // Move down, then back up so the tracked direction flips.
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    deliverReveal(target(), 0.5);

    expect(target().style.getPropertyValue('--reveal-from')).toBe('-42px');
  });

  test('a fully cleared element resets so the reveal can replay', () => {
    start();
    deliverReveal(target(), 0.5);
    expect(target().classList.contains('is-visible')).toBe(true);

    deliverReveal(target(), 0);

    expect(target().classList.contains('is-visible')).toBe(false);
  });

  test('an element straddling the edge keeps its revealed state', () => {
    start();
    deliverReveal(target(), 0.5);

    deliverReveal(target(), 0.05);

    expect(target().classList.contains('is-visible')).toBe(true);
  });

  test('stopping removes the scroll listener', () => {
    const remove = jest.spyOn(window, 'removeEventListener');
    start();

    stop();

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    remove.mockRestore();
  });
});
