import { initSmartCleanerPage } from '../../../../../src/features/apps/smart-cleaner/presentation/SmartCleanerPage';

/**
 * Mirrors what `md-outlined-segmented-button-set` emits on user interaction.
 * The Material elements are not registered under jsdom, so the test stands in
 * for the component that would normally dispatch this.
 */
function selectFeatureButton(buttonId: string): void {
  const button = document.getElementById(buttonId) as HTMLElement;
  document.getElementById('featureSelector')?.dispatchEvent(
    new CustomEvent('segmented-button-set-selection', {
      detail: { button, selected: true },
      bubbles: true,
      composed: true,
    }),
  );
}

describe('SmartCleanerPage', () => {
  const originalObserver = window.IntersectionObserver;
  const originalAnimationFrame = window.requestAnimationFrame;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    Reflect.deleteProperty(window, 'IntersectionObserver');
    Reflect.deleteProperty(window, 'requestAnimationFrame');
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline')) as typeof fetch;
    document.body.innerHTML = `
      <div id="smartCleanerPageContainer">
        <md-outlined-segmented-button-set id="featureSelector">
          <md-outlined-segmented-button selected data-feature="memory"></md-outlined-segmented-button>
          <md-outlined-segmented-button id="duplicatesButton" data-feature="duplicates"></md-outlined-segmented-button>
        </md-outlined-segmented-button-set>
        <h3 id="featureTitle"></h3><p id="featureDescription"></p>
        <img id="featureImage" /><ul id="featureBullets"></ul>
        <span id="featureBadgeValue"></span><div id="featureShotCard"></div>
        <div class="sc-reveal" id="revealItem"></div>
        <button id="galleryPrev"></button><button id="galleryNext"></button>
        <div id="galleryTrack"><div class="sc-shot" id="shotOne"></div><div class="sc-shot"></div></div>
        <div id="galleryProgress"></div>
      </div>`;
    (document.getElementById('galleryTrack') as HTMLElement).scrollBy = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    if (originalObserver) window.IntersectionObserver = originalObserver;
    if (originalAnimationFrame) window.requestAnimationFrame = originalAnimationFrame;
    globalThis.fetch = originalFetch;
  });

  test('switches the interactive feature content', () => {
    initSmartCleanerPage();
    expect(document.getElementById('revealItem')?.classList.contains('is-visible')).toBe(true);

    // The segmented button set owns selection and reports the chosen button
    // through this event; the page only renders what the set decided.
    selectFeatureButton('duplicatesButton');
    jest.advanceTimersByTime(130);

    expect(document.getElementById('featureTitle')?.textContent).toBe('Find duplicates instantly.');
    expect((document.getElementById('featureImage') as HTMLImageElement).alt).toBe('Cleaner duplicate files detection screen');
    expect(document.querySelectorAll('#featureBullets li')).toHaveLength(3);
  });

  test('moves the gallery by one card', () => {
    const shot = document.getElementById('shotOne') as HTMLElement;
    shot.getBoundingClientRect = jest.fn(() => ({ width: 280, height: 500, top: 0, right: 280, bottom: 500, left: 0, x: 0, y: 0, toJSON: () => ({}) }));
    const track = document.getElementById('galleryTrack') as HTMLElement;

    initSmartCleanerPage();
    document.getElementById('galleryNext')?.click();

    expect(track.scrollBy).toHaveBeenCalledWith({ left: 308, behavior: 'smooth' });
  });
});
