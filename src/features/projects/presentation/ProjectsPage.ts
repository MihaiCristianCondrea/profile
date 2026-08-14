import { safeHttpUrl } from '../../../core/dom/SafeUrl.ts';
import { fetchAndroidApps } from '../data/AndroidAppsDataSource.ts';
import type { AndroidApp } from '../domain/AndroidApp.ts';

/** The slice of the `md-tabs` API this page reads. */
interface TabsElement extends HTMLElement {
  activeTab?: HTMLElement | null;
}

function normalizeScreenshots(screenshots: string[] | undefined): string[] {
  if (!Array.isArray(screenshots)) return [];
  return screenshots
    .map((screenshot) => safeHttpUrl(screenshot))
    .filter((url): url is string => url !== null);
}

function createCarouselButton(direction: 'prev' | 'next'): HTMLElement {
  const button = document.createElement('md-icon-button');
  button.className = direction;
  button.setAttribute('type', 'button');
  button.setAttribute('aria-label', direction === 'prev' ? 'Previous screenshot' : 'Next screenshot');
  const icon = document.createElement('md-icon');
  icon.textContent = direction === 'prev' ? 'chevron_left' : 'chevron_right';
  button.append(icon);
  return button;
}

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

  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('active')));
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

function createAndroidProjectCard(app: AndroidApp): HTMLElement {
  const card = document.createElement('md-filled-card');
  card.className = 'project-entry';
  card.dataset.category = 'android';

  const content = document.createElement('div');
  content.className = 'project-content';
  const info = document.createElement('div');
  info.className = 'project-info';

  const iconUrl = safeHttpUrl(app.iconLogo);
  if (iconUrl) {
    const icon = document.createElement('img');
    icon.className = 'project-app-icon';
    icon.src = iconUrl;
    icon.alt = '';
    icon.loading = 'lazy';
    info.append(icon);
  }

  const heading = document.createElement('h2');
  heading.textContent = app.name?.trim() || 'Android app';
  info.append(heading);

  const categoryLabel = app.categoryLabel;
  if (categoryLabel) {
    const category = document.createElement('p');
    category.className = 'project-category-label';
    category.textContent = categoryLabel;
    info.append(category);
  }

  if (app.description) {
    const description = document.createElement('p');
    description.className = 'project-description';
    description.textContent = app.description;
    info.append(description);
  }

  if (app.packageName) {
    const actions = document.createElement('div');
    actions.className = 'project-actions';
    const installButton = document.createElement('md-outlined-button');
    installButton.setAttribute(
      'href',
      `https://play.google.com/store/apps/details?id=${encodeURIComponent(app.packageName)}`,
    );
    installButton.setAttribute('target', '_blank');
    installButton.textContent = 'Install app';
    actions.append(installButton);
    info.append(actions);
  }

  const media = document.createElement('div');
  media.className = 'project-media';
  const carousel = document.createElement('div');
  carousel.className = 'carousel';
  const screenshots = normalizeScreenshots(app.screenshots);
  screenshots.forEach((url, index) => {
    const image = document.createElement('img');
    image.className = `carousel-slide${index === 0 ? ' active' : ''}`;
    image.src = url;
    image.alt = `${heading.textContent} screenshot ${index + 1}`;
    image.loading = 'lazy';
    carousel.append(image);
  });

  if (screenshots.length) {
    carousel.append(createCarouselButton('prev'), createCarouselButton('next'));
  } else {
    const emptyState = document.createElement('p');
    emptyState.className = 'carousel-empty';
    emptyState.textContent = 'No screenshots are available.';
    carousel.append(emptyState);
  }

  media.append(carousel);
  content.append(info, media);
  card.append(content);
  initializeCarousel(carousel);
  return card;
}

/**
 * Reads the selected filter from `md-tabs`. The component exposes the active
 * tab directly; `[active]` is only the reflected fallback for markup that has
 * not upgraded yet.
 */
function selectedCategory(tabs: TabsElement | null): string {
  const activeTab = tabs?.activeTab ?? tabs?.querySelector<HTMLElement>('md-primary-tab[active]');
  return activeTab?.dataset.category ?? 'all';
}

function applyCategoryFilter(category: string): void {
  const selected = category || 'all';
  document.querySelectorAll<HTMLElement>('#projectsPageContainer .project-entry').forEach((project) => {
    const categories = (project.dataset.category ?? '').split(',').map((value) => value.trim());
    project.hidden = selected !== 'all' && !categories.includes(selected);
  });
}

async function loadAndroidProjects(container: HTMLElement, tabs: TabsElement | null): Promise<void> {
  try {
    const apps = await fetchAndroidApps();
    container.removeAttribute('data-loading');
    if (!apps.length) {
      container.textContent = 'No Android apps are available right now.';
      return;
    }

    container.replaceChildren(...apps.map(createAndroidProjectCard));
    applyCategoryFilter(selectedCategory(tabs));
  } catch (error) {
    console.error('Projects: Failed to load Android apps.', error);
    container.removeAttribute('data-loading');
    container.textContent = 'Android apps are unavailable right now.';
    container.classList.add('projects-error');
  }
}

export async function initProjectsPage(): Promise<void> {
  const page = document.getElementById('projectsPageContainer');
  if (!page) return;

  page.querySelectorAll<HTMLElement>('.carousel').forEach(initializeCarousel);
  const tabs = page.querySelector<TabsElement>('#projectsFilterTabs');
  if (tabs && tabs.dataset.filterInitialized !== 'true') {
    tabs.addEventListener('change', () => applyCategoryFilter(selectedCategory(tabs)));
    tabs.dataset.filterInitialized = 'true';
  }
  applyCategoryFilter(selectedCategory(tabs));

  const androidContainer = page.querySelector<HTMLElement>('#androidProjectsContainer');
  if (androidContainer) await loadAndroidProjects(androidContainer, tabs);
}
