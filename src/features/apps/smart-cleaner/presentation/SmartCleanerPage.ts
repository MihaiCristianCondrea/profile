import { fetchSmartCleanerMetadata } from '../data/SmartCleanerDataSource.ts';
import {
  CLEANER_FEATURES,
  isCleanerFeatureKey,
  type CleanerFeatureKey,
} from '../domain/CleanerFeature.ts';
import { startScrollMotion } from './ScrollMotion.ts';

/** Detail carried by `md-outlined-segmented-button-set`'s selection event. */
interface SegmentedButtonSelectionEvent extends Event {
  detail?: { button?: HTMLElement };
}

const FEATURE_SWAP_DELAY_MS = 130;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function reduceMotionEnabled(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initSmartCleanerPage(): void {
  const page = document.getElementById('smartCleanerPageContainer');
  if (!page) return;

  const query = <T extends HTMLElement>(selector: string): T | null => page.querySelector<T>(selector);
  const reduceMotion = reduceMotionEnabled();

  // --- Feature switcher ---------------------------------------------------

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

  // --- Screenshot gallery -------------------------------------------------

  const galleryTrack = query<HTMLElement>('#galleryTrack');
  const galleryProgress = query<HTMLElement>('#galleryProgress');
  const galleryShots = galleryTrack ? Array.from(galleryTrack.querySelectorAll<HTMLElement>('.sc-shot')) : [];

  const updateGallery = (): void => {
    if (!galleryTrack) return;
    const track = galleryTrack.getBoundingClientRect();
    const centre = track.left + track.width / 2;
    const distance = Math.max(track.width * .58, 1);
    const measured = galleryShots.map((shot) => shot.getBoundingClientRect());
    measured.forEach((rect, index) => {
      const normalized = clamp((rect.left + rect.width / 2 - centre) / distance, -1, 1);
      const closeness = 1 - Math.abs(normalized);
      const style = galleryShots[index].style;
      style.setProperty('--shot-rotate', `${normalized * -9}deg`);
      style.setProperty('--shot-y', `${(1 - closeness) * 16}px`);
      style.setProperty('--shot-scale', `${.92 + closeness * .08}`);
      style.setProperty('--shot-opacity', `${.55 + closeness * .45}`);
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
  window.addEventListener('resize', onResize, { passive: true });

  // --- Scroll-driven motion -----------------------------------------------

  const stopMotion = startScrollMotion(page, {
    heroStage: query<HTMLElement>('#heroStage'),
    problemSection: query<HTMLElement>('#smartCleanerProblemSection'),
    featureStage: query<HTMLElement>('#featureStage'),
    storyCards: Array.from(page.querySelectorAll<HTMLElement>('[data-parallax-story]')),
    breathing: query<HTMLElement>('#smartCleanerBreathing'),
    performance: query<HTMLElement>('#smartCleanerPerformance'),
    finalCard: query<HTMLElement>('#finalCtaCard'),
    onFrame: () => {
      if (page.isConnected) return;
      stopMotion();
      window.removeEventListener('resize', onResize);
    },
  });

  // --- Live app metadata --------------------------------------------------

  void fetchSmartCleanerMetadata().then(({ shortDescription, iconUrl }) => {
    if (!page.isConnected) return;

    const description = query<HTMLElement>('#appShortDescription');
    if (description && shortDescription) description.textContent = shortDescription;

    const icon = query<HTMLImageElement>('#appIconLogo');
    if (!icon || !iconUrl) return;

    // Preload off-DOM, then swap the generic Material glyph for the real app
    // icon. A hidden <img> is display:none, so loading it in place would stall
    // under lazy loading and never resolve; this also guarantees a broken URL
    // simply leaves the fallback glyph in place.
    const preload = new Image();
    preload.addEventListener('load', () => {
      if (!page.isConnected) return;
      icon.src = iconUrl;
      icon.hidden = false;
      query<HTMLElement>('#appIconFallback')?.setAttribute('hidden', '');
    }, { once: true });
    preload.src = iconUrl;
  });
}
