type FeatureKey = 'memory' | 'duplicates' | 'apps' | 'wear';
type SegmentedButton = HTMLElement & { selected: boolean };

type FeatureInfo = {
  title: string;
  description: string;
  image: string;
  alt: string;
  badge: string;
  isWear: boolean;
  bullets: Array<[string, string]>;
};

const FEATURES: Record<FeatureKey, FeatureInfo> = {
  memory: {
    title: 'Clean what matters.',
    description: 'See what is taking space in seconds, then clear the files that actually move the needle.',
    image: 'https://play-lh.googleusercontent.com/s15b2PJk5VSkOykE_c-yOs3VqlA1db9XuV_BnQSubPSjp73EO5c262WP11p1fUAdjKyz=w2560-h1440-rw',
    alt: 'Cleaner memory manager screen',
    badge: 'Memory & Storage',
    isWear: false,
    bullets: [
      ['photo_size_select_large', 'Spot oversized files quickly.'],
      ['visibility', 'Preview before every action.'],
      ['verified_user', 'Keep cleanup deliberate and understandable.'],
    ],
  },
  duplicates: {
    title: 'Find duplicates instantly.',
    description: 'Repeated photos and files stop hiding. Keep the copy you want and remove the rest in one clear flow.',
    image: 'https://play-lh.googleusercontent.com/22xJupF9f3rszxorCDFYSDMFxPse31hA-wnfMWV-0iWuZqw9WIM8yJLd3bYZg2trqag=w2560-h1440-rw',
    alt: 'Cleaner duplicate files detection screen',
    badge: 'Duplicates',
    isWear: false,
    bullets: [
      ['content_copy', 'Group repeated files before cleanup.'],
      ['lightbulb', 'Keep recommendations visible and understandable.'],
      ['touch_app', 'Remove only what you choose.'],
    ],
  },
  apps: {
    title: 'App manager under control.',
    description: 'Inspect unused apps and residue directly instead of hunting through system settings.',
    image: 'https://play-lh.googleusercontent.com/RFPtMvrFEzPOSVxiCKosDVSqnqKdz_kbfkcJgw2Rf6IDcr9IfOfbqGmPE3ihVO3o98k0=w2560-h1440-rw',
    alt: 'Cleaner app manager screen',
    badge: 'App Manager',
    isWear: false,
    bullets: [
      ['apps', 'Sort apps by storage footprint.'],
      ['folder_open', 'Inspect cached components cleanly.'],
      ['tune', 'Keep user authority over uninstalls.'],
    ],
  },
  wear: {
    title: 'Wear OS on your wrist.',
    description: 'Trigger memory optimization and monitor storage metrics directly from your smartwatch tile.',
    image: 'https://play-lh.googleusercontent.com/Pbr3Un1Y7v-VIUR72Z4r4paIhrL9hjaCGqx1EUqoYRZQTh6jUaF6zaIFpgLXW3ODZLQo-3qjPaiAxaMLwDP2=w2560-h1440-rw',
    alt: 'Cleaner Wear OS tile',
    badge: 'Wear OS Tile',
    isWear: true,
    bullets: [
      ['watch', 'One-tap wrist cleanup triggers.'],
      ['sync', 'Useful phone metrics on your wrist.'],
      ['bolt', 'A lightweight companion experience.'],
    ],
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mediaMatches(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
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

  const selectFeature = (key: FeatureKey): void => {
    const feature = FEATURES[key];
    featureSelector?.querySelectorAll<SegmentedButton>('md-outlined-segmented-button').forEach((button) => {
      const selected = button.dataset.feature === key;
      button.toggleAttribute('selected', selected);
      button.selected = selected;
    });

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
        featureBullets.replaceChildren(...feature.bullets.map(([icon, text]) => {
          const item = document.createElement('li');
          const materialIcon = document.createElement('md-icon');
          const label = document.createElement('span');
          materialIcon.textContent = icon;
          label.textContent = text;
          item.append(materialIcon, label);
          return item;
        }));
      }
      featureShotCard?.classList.remove('is-changing');
    }, 130);
  };

  featureSelector?.querySelectorAll<SegmentedButton>('md-outlined-segmented-button').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.feature as FeatureKey | undefined;
      if (key && key in FEATURES) selectFeature(key);
    });
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
    const rect = element.getBoundingClientRect();
    const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
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
      const rect = heroStage.getBoundingClientRect();
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
      const forward = clamp(delta * -.065, -45, 45);
      const reverse = clamp(delta * .025, -18, 18);
      page.style.setProperty('--sc-hero-forward', `${forward}px`);
      page.style.setProperty('--sc-hero-reverse', `${reverse}px`);
      page.style.setProperty('--sc-float-top-y', `${pointerY * -16 + forward * .7}px`);
      page.style.setProperty('--sc-float-bottom-y', `${pointerY * 18 - forward * .7}px`);
    }

    setSectionDepth(problemSection, '--problem-forward', '--problem-reverse', .055);

    if (featureStage) {
      const rect = featureStage.getBoundingClientRect();
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
      featureStage.style.setProperty('--feature-forward', `${clamp(delta * -.07, -42, 42)}px`);
      featureStage.style.setProperty('--feature-reverse', `${clamp(delta * .075, -45, 45)}px`);
      featureStage.style.setProperty('--feature-badge-reverse', `${clamp(delta * .055, -34, 34)}px`);
      featureCopy?.style.setProperty('--feature-copy', `${clamp(delta * .03, -20, 20)}px`);
    }

    storyCards.forEach((story) => {
      const rect = story.getBoundingClientRect();
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
      const direction = story.dataset.invert === 'true' ? -1 : 1;
      story.style.setProperty('--story-forward', `${clamp(delta * -.08 * direction, -50, 50)}px`);
      story.style.setProperty('--story-reverse', `${clamp(delta * .075 * direction, -45, 45)}px`);
      story.style.setProperty('--story-copy', `${clamp(delta * .04 * direction, -25, 25)}px`);
    });

    if (breathing) {
      const rect = breathing.getBoundingClientRect();
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
      breathing.style.setProperty('--breathing-forward', `${clamp(delta * .12, -70, 70)}px`);
      breathing.style.setProperty('--breathing-reverse', `${clamp(delta * -.12, -70, 70)}px`);
    }

    if (performance) {
      const rect = performance.getBoundingClientRect();
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
      performance.style.setProperty('--performance-core', `${clamp(delta * -.04, -22, 22)}px`);
    }

    if (finalCard) {
      const rect = finalCard.getBoundingClientRect();
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
      finalCard.style.setProperty('--final-reverse', `${clamp(delta * .08, -50, 50)}px`);
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

  if (typeof fetch === 'function') {
    void fetch('https://android-apps-metadata-backend.mihaicristiancondrea.workers.dev/admin/api/v1/apps/com.d4rk.cleaner')
      .then((response) => response.json())
      .then((response) => {
        const shortDescription = response?.data?.app?.short_description;
        const target = query<HTMLElement>('#appShortDescription');
        if (page.isConnected && target && typeof shortDescription === 'string') target.textContent = shortDescription;
      })
      .catch(() => { /* Authored text is the offline fallback. */ });
  }
}
