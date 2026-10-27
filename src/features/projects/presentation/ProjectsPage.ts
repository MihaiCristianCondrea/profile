import type { MaterialNextExpressiveTabBar } from 'material-next-web-components/expressive-tab-bar.js';

function initializeCarousel(carousel: HTMLElement): void {
  if (carousel.dataset.initialized === 'true') return;
  carousel.dataset.initialized = 'true';

  const slides = Array.from(carousel.querySelectorAll<HTMLElement>('.carousel-slide'));
  const previous = carousel.querySelector<HTMLElement>('.prev');
  const next = carousel.querySelector<HTMLElement>('.next');
  if (!slides.length || !previous || !next) {
    previous?.setAttribute('hidden', '');
    next?.setAttribute('hidden', '');
    return;
  }

  let activeIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.classList.contains('active')),
  );
  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Show screenshot ${index + 1}`);
    dot.addEventListener('click', () => {
      activeIndex = index;
      update();
    });
    return dot;
  });
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots';
  dotsContainer.append(...dots);
  carousel.append(dotsContainer);

  const update = (): void => {
    slides.forEach((slide, index) => slide.classList.toggle('active', index === activeIndex));
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === activeIndex);
      dot.toggleAttribute('aria-current', index === activeIndex);
    });
  };

  previous.addEventListener('click', () => {
    activeIndex = (activeIndex - 1 + slides.length) % slides.length;
    update();
  });
  next.addEventListener('click', () => {
    activeIndex = (activeIndex + 1) % slides.length;
    update();
  });

  const hasMultipleSlides = slides.length > 1;
  previous.toggleAttribute('hidden', !hasMultipleSlides);
  next.toggleAttribute('hidden', !hasMultipleSlides);
  dotsContainer.toggleAttribute('hidden', !hasMultipleSlides);
  update();
}

const CATEGORIES = ['all', 'web', 'android'];

function applyCategoryFilter(index: number): void {
  const category = CATEGORIES[index] ?? 'all';
  document
    .querySelectorAll<HTMLElement>('#projectsPageContainer [data-category]')
    .forEach((item) => {
      item.hidden = category !== 'all' && item.dataset.category !== category;
    });
}

export async function initProjectsPage(): Promise<void> {
  const page = document.getElementById('projectsPageContainer');
  if (!page) return;
  page.querySelectorAll<HTMLElement>('.carousel').forEach(initializeCarousel);
  const tabs = page.querySelector<MaterialNextExpressiveTabBar>('#projectsFilterTabs');
  if (!tabs || tabs.dataset.filterInitialized === 'true') return;
  tabs.tabs = [
    { label: 'All', href: '#all' },
    { label: 'Web', href: '#web' },
    { label: 'Android', href: '#android' },
  ];
  tabs.addEventListener('navigate', (event) => event.preventDefault());
  tabs.addEventListener('change', () => applyCategoryFilter(tabs.activeIndex));
  tabs.dataset.filterInitialized = 'true';
  applyCategoryFilter(tabs.activeIndex);
}
