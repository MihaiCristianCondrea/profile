import { initSmartCleanerPage } from '../../../../../src/features/apps/smart-cleaner/presentation/SmartCleanerPage';

describe('SmartCleanerPage gallery', () => {
  const originalObserver = window.IntersectionObserver;

  beforeEach(() => {
    Reflect.deleteProperty(window, 'IntersectionObserver');
    document.body.innerHTML = `
      <div id="smartCleanerPageContainer">
        <div id="smartCleanerGalleryTrack">
          <figure class="smart-cleaner-shot" id="shot-one"></figure>
          <figure class="smart-cleaner-shot" id="shot-two"></figure>
        </div>
        <div id="smartCleanerGalleryDots"></div>
      </div>
    `;
  });

  afterAll(() => {
    if (originalObserver) {
      window.IntersectionObserver = originalObserver;
    }
  });

  test('creates accessible controls and updates the selected screenshot', () => {
    const first = document.getElementById('shot-one') as HTMLElement;
    const second = document.getElementById('shot-two') as HTMLElement;
    first.scrollIntoView = jest.fn();
    second.scrollIntoView = jest.fn();

    initSmartCleanerPage();

    const dots = Array.from(
      document.querySelectorAll<HTMLButtonElement>('#smartCleanerGalleryDots button'),
    );
    expect(dots).toHaveLength(2);
    expect(dots[0].classList.contains('is-active')).toBe(true);
    expect(dots[0].getAttribute('aria-current')).toBe('true');

    dots[1].click();

    expect(second.scrollIntoView).toHaveBeenCalledWith({
      inline: 'center',
      block: 'nearest',
    });
    expect(first.classList.contains('is-featured')).toBe(false);
    expect(second.classList.contains('is-featured')).toBe(true);
    expect(dots[1].classList.contains('is-active')).toBe(true);
  });
});
