import { fetchSmartCleanerShortDescription } from '../data/SmartCleanerDataSource.ts';
import {
  CLEANER_FEATURES,
  isCleanerFeatureKey,
  type CleanerFeatureKey,
} from '../domain/CleanerFeature.ts';

/** Detail carried by `md-outlined-segmented-button-set`'s selection event. */
interface SegmentedButtonSelectionEvent extends Event {
  detail?: { button?: HTMLElement };
}

const FEATURE_SWAP_DELAY_MS = 130;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mediaMatches(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Distance from the viewport centre to an element's centre, in pixels. */
function centerOffset(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  return rect.top + rect.height / 2 - window.innerHeight / 2;
}

export function initSmartCleanerPage(): void {
  const page = document.getElementById('smartCleanerPageContainer');
  if (!page) return;

  const query = <T extends HTMLElement>(selector: string): T | null => page.querySelector<T>(selector);
  const reduceMotion = mediaMatches('(prefers-reduced-motion: reduce)');
  const finePointer = mediaMatches('(pointer: fine)');

  const featureSelector = query<HTMLElement>('#featureSelector');
  const featureTitle = query<HTMLElement>('#featureTitle');
  const featureDescription = query<HTMLElement>('#featureDescription');
  const featureImage = query<HTMLImageElement>('#featureImage');
  const featureBullets = query<HTMLUListElement>('#featureBullets');
  const featureBadge = query<HTMLElement>('#featureBadgeValue');
  const featureShotCard = query<HTMLElement>('#featureShotCard');

  const showFeature = (key: CleanerFeatureKey): void => {
    const feature = CLEANER_FEATURES[key];

    featureShotCard?.classList.add('is-changing');
    window.setTimeout(() => {
      if (!page.isConnected) return;
      if (featureTitle) featureTitle.textContent = feature.title;
      if (featureDescription) featureDescription.textContent = feature.description;
      if (featureImage) {
        featureImage.src = feature.image;
        featureImage.alt = feature.alt;
      }
      featureShotCard?.classList.toggle('is-wear', feature.isWear);
      if (featureBadge) featureBadge.textContent = feature.badge;
      if (featureBullets) {
        featureBullets.replaceChildren(...feature.bullets.map(({ icon, label }) => {
          const item = document.createElement('li');
          const materialIcon = document.createElement('md-icon');
          const text = document.createElement('span');
          materialIcon.textContent = icon;
          text.textContent = label;
          item.append(materialIcon, text);
          return item;
        }));
      }
      featureShotCard?.classList.remove('is-changing');
    }, FEATURE_SWAP_DELAY_MS);
  };

  // The segmented button set owns selection state: it deselects the previous
  // button and reports the new one. This listener only renders the result.
  featureSelector?.addEventListener('segmented-button-set-selection', (event) => {
    const key = (event as SegmentedButtonSelectionEvent).detail?.button?.dataset.feature;
    if (isCleanerFeatureKey(key)) showFeature(key);
  });

  const revealItems = Array.from(page.querySelectorAll<HTMLElement>('.sc-reveal'));
  let revealObserver: IntersectionObserver | null = null;
  if (reduceMotion || typeof window.IntersectionObserver !== 'function') {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach((item) => revealObserver?.observe(item));
  }

  const heroStage = query<HTMLElement>('#heroStage');
  const problemSection = query<HTMLElement>('#smartCleanerProblemSection');
  const featureStage = query<HTMLElement>('#featureStage');
  const featureCopy = query<HTMLElement>('.sc-feature-copy');
  const storyCards = Array.from(page.querySelectorAll<HTMLElement>('[data-parallax-story]'));
  const breathing = query<HTMLElement>('#smartCleanerBreathing');
  const performance = query<HTMLElement>('#smartCleanerPerformance');
  const finalCard = query<HTMLElement>('#finalCtaCard');

  let targetPointerX = 0;
  let targetPointerY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothScrollY = window.scrollY;

  if (finePointer && !reduceMotion) {
    page.addEventListener('pointermove', (event) => {
      const bounds = page.getBoundingClientRect();
      targetPointerX = clamp(((event.clientX - bounds.left) / Math.max(bounds.width, 1) - .5) * 2, -1, 1);
      targetPointerY = clamp((event.clientY / Math.max(window.innerHeight, 1) - .5) * 2, -1, 1);
    }, { passive: true });
    page.addEventListener('pointerleave', () => {
      targetPointerX = 0;
      targetPointerY = 0;
    }, { passive: true });
  }

  const setSectionDepth = (element: HTMLElement | null, forwardName: string, reverseName: string, strength = .07): void => {
    if (!element) return;
    const delta = centerOffset(element);
    element.style.setProperty(forwardName, `${clamp(delta * -strength, -50, 50)}px`);
    element.style.setProperty(reverseName, `${clamp(delta * strength, -50, 50)}px`);
  };

  const updateParallax = (): void => {
    smoothScrollY += (window.scrollY - smoothScrollY) * .15;
    page.style.setProperty('--sc-bg-forward', `${smoothScrollY * .08}px`);
    page.style.setProperty('--sc-bg-reverse', `${smoothScrollY * -.075}px`);
    page.style.setProperty('--sc-orbit-forward', `${smoothScrollY * .024}deg`);
    page.style.setProperty('--sc-orbit-reverse', `${smoothScrollY * -.032}deg`);

    pointerX += (targetPointerX - pointerX) * .08;
    pointerY += (targetPointerY - pointerY) * .08;
    page.style.setProperty('--sc-tilt-x', `${pointerY * -3}deg`);
    page.style.setProperty('--sc-tilt-y', `${pointerX * 3.5}deg`);
    page.style.setProperty('--sc-feature-tilt-x', `${pointerY * -2}deg`);
    page.style.setProperty('--sc-feature-tilt-y', `${pointerX * 2.2}deg`);
    page.style.setProperty('--sc-pointer-halo-x', `${pointerX * -12}px`);
    page.style.setProperty('--sc-pointer-halo-y', `${pointerY * -10}px`);
    page.style.setProperty('--sc-float-top-x', `${pointerX * -20}px`);
    page.style.setProperty('--sc-float-bottom-x', `${pointerX * 22}px`);

    if (heroStage) {
      const delta = centerOffset(heroStage);
      const forward = clamp(delta * -.065, -45, 45);
      const reverse = clamp(delta * .025, -18, 18);
      page.style.setProperty('--sc-hero-forward', `${forward}px`);
      page.style.setProperty('--sc-hero-reverse', `${reverse}px`);
      page.style.setProperty('--sc-float-top-y', `${pointerY * -16 + forward * .7}px`);
      page.style.setProperty('--sc-float-bottom-y', `${pointerY * 18 - forward * .7}px`);
    }

    setSectionDepth(problemSection, '--problem-forward', '--problem-reverse', .055);

    if (featureStage) {
      const delta = centerOffset(featureStage);
      featureStage.style.setProperty('--feature-forward', `${clamp(delta * -.07, -42, 42)}px`);
      featureStage.style.setProperty('--feature-reverse', `${clamp(delta * .075, -45, 45)}px`);
      featureStage.style.setProperty('--feature-badge-reverse', `${clamp(delta * .055, -34, 34)}px`);
      featureCopy?.style.setProperty('--feature-copy', `${clamp(delta * .03, -20, 20)}px`);
    }

    storyCards.forEach((story) => {
      const delta = centerOffset(story);
      const direction = story.dataset.invert === 'true' ? -1 : 1;
      story.style.setProperty('--story-forward', `${clamp(delta * -.08 * direction, -50, 50)}px`);
      story.style.setProperty('--story-reverse', `${clamp(delta * .075 * direction, -45, 45)}px`);
      story.style.setProperty('--story-copy', `${clamp(delta * .04 * direction, -25, 25)}px`);
    });

    if (breathing) {
      const delta = centerOffset(breathing);
      breathing.style.setProperty('--breathing-forward', `${clamp(delta * .12, -70, 70)}px`);
      breathing.style.setProperty('--breathing-reverse', `${clamp(delta * -.12, -70, 70)}px`);
    }

    if (performance) {
      performance.style.setProperty('--performance-core', `${clamp(centerOffset(performance) * -.04, -22, 22)}px`);
    }

    if (finalCard) {
      finalCard.style.setProperty('--final-reverse', `${clamp(centerOffset(finalCard) * .08, -50, 50)}px`);
    }
  };

  const galleryTrack = query<HTMLElement>('#galleryTrack');
  const galleryProgress = query<HTMLElement>('#galleryProgress');
  const galleryShots = galleryTrack ? Array.from(galleryTrack.querySelectorAll<HTMLElement>('.sc-shot')) : [];

  const updateGallery = (): void => {
    if (!galleryTrack) return;
    const track = galleryTrack.getBoundingClientRect();
    const center = track.left + track.width / 2;
    const distance = Math.max(track.width * .58, 1);
    galleryShots.forEach((shot) => {
      const rect = shot.getBoundingClientRect();
      const normalized = clamp((rect.left + rect.width / 2 - center) / distance, -1, 1);
      const closeness = 1 - Math.abs(normalized);
      shot.style.setProperty('--shot-rotate', `${normalized * -9}deg`);
      shot.style.setProperty('--shot-y', `${(1 - closeness) * 16}px`);
      shot.style.setProperty('--shot-scale', `${.92 + closeness * .08}`);
      shot.style.setProperty('--shot-opacity', `${.55 + closeness * .45}`);
    });
    const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
    const progress = maxScroll > 0 ? galleryTrack.scrollLeft / maxScroll * 100 : 100;
    galleryProgress?.style.setProperty('--gallery-progress', `${clamp(progress, 0, 100)}%`);
  };

  const scrollGallery = (direction: -1 | 1): void => {
    if (!galleryTrack || galleryShots.length === 0) return;
    const amount = galleryShots[0].getBoundingClientRect().width + 28;
    galleryTrack.scrollBy({ left: direction * amount, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  query<HTMLElement>('#galleryPrev')?.addEventListener('click', () => scrollGallery(-1));
  query<HTMLElement>('#galleryNext')?.addEventListener('click', () => scrollGallery(1));
  galleryTrack?.addEventListener('scroll', updateGallery, { passive: true });
  updateGallery();

  const onResize = (): void => updateGallery();
  if (!reduceMotion) window.addEventListener('resize', onResize, { passive: true });

  const requestFrame = window.requestAnimationFrame?.bind(window);
  if (!reduceMotion && requestFrame) {
    const animate = (): void => {
      if (!page.isConnected) {
        revealObserver?.disconnect();
        window.removeEventListener('resize', onResize);
        return;
      }
      updateParallax();
      requestFrame(animate);
    };
    requestFrame(animate);
  }

  void fetchSmartCleanerShortDescription().then((shortDescription) => {
    const target = query<HTMLElement>('#appShortDescription');
    if (page.isConnected && target && shortDescription) target.textContent = shortDescription;
  });
}
