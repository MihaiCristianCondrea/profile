let markedLoadPromiseProjects;

const ANDROID_APPS_ENDPOINT = 'https://mihaicristiancondrea.github.io/com.d4rk.apis/api/app_toolkit/v2/release/en/home/api_android_apps.json';

function ensureProjectsMarkedLoaded() {
  if (window.marked) return Promise.resolve();
  if (markedLoadPromiseProjects) return markedLoadPromiseProjects;
  markedLoadPromiseProjects = new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
  });
  return markedLoadPromiseProjects;
}

function resolveProjectsEasing(preferred, fallback) {
  const animationsApi = typeof SiteAnimations !== 'undefined' && SiteAnimations ? SiteAnimations : null;
  if (animationsApi && typeof animationsApi.resolveEasing === 'function') {
    return animationsApi.resolveEasing(preferred, fallback);
  }

  const css = (typeof CSS !== 'undefined' && CSS && typeof CSS.supports === 'function')
    ? CSS
    : (typeof window !== 'undefined' && window.CSS && typeof window.CSS.supports === 'function'
      ? window.CSS
      : null);

  if (preferred && css && css.supports('animation-timing-function', 'linear(0,0.5,1)')) {
    return preferred;
  }

  return fallback;
}

function getGlobalFetch() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }
  return null;
}

function loadImageDimensions(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function isSixteenNine(width, height) {
  if (!width || !height) return false;
  const ratio = width / height;
  const target = 16 / 9;
  return Math.abs(ratio - target) <= 0.02;
}

function isSixteenNineLabel(ratioLabel) {
  if (!ratioLabel) return false;
  const normalized = String(ratioLabel)
    .replace(/\s+/g, '')
    .replace(/[×x]/gi, ':')
    .replace(/\//g, ':');
  if (!normalized.includes(':')) {
    const numeric = Number(normalized);
    if (Number.isNaN(numeric) || numeric <= 0) return false;
    return Math.abs(numeric - 16 / 9) <= 0.02;
  }
  const parts = normalized.split(':').map(Number);
  if (parts.length !== 2 || parts.some(num => Number.isNaN(num) || num <= 0)) {
    return false;
  }
  return Math.abs(parts[0] / parts[1] - 16 / 9) <= 0.02;
}

function normalizeScreenshots(screenshots) {
  if (!Array.isArray(screenshots)) return [];
  return screenshots
    .map(item => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { url: item, aspectRatio: null };
      }
      if (typeof item === 'object' && item.url) {
        const ratioValue = typeof item.aspectRatio !== 'undefined' ? item.aspectRatio : item.ratio;
        const ratio = typeof ratioValue === 'string' ? ratioValue.trim() : ratioValue;
        return { url: item.url, aspectRatio: ratio || null };
      }
      return null;
    })
    .filter(Boolean);
}

async function filterSixteenNineScreenshots(screenshots) {
  const normalized = normalizeScreenshots(screenshots);
  if (!normalized.length) return [];

  const immediateMatches = [];
  const pendingChecks = [];

  normalized.forEach((item, index) => {
    if (isSixteenNineLabel(item.aspectRatio)) {
      immediateMatches.push({ index, url: item.url });
    } else if (!item.aspectRatio) {
      pendingChecks.push({ index, url: item.url });
    }
  });

  if (!pendingChecks.length) {
    return immediateMatches.map(item => item.url);
  }

  const dimensionResults = await Promise.all(pendingChecks.map(entry => loadImageDimensions(entry.url)));
  const dimensionMatches = dimensionResults
    .map((result, resultIndex) => {
      if (!result || !isSixteenNine(result.width, result.height)) return null;
      return pendingChecks[resultIndex];
    })
    .filter(Boolean);

  const combined = immediateMatches.concat(dimensionMatches);
  combined.sort((a, b) => a.index - b.index);
  return combined.map(item => item.url);
}

function initializeCarousel(carousel) {
  if (!carousel || carousel.dataset.initialized) return;
  carousel.dataset.initialized = 'true';

  const slides = carousel.querySelectorAll('.carousel-slide');
  const prevBtn = carousel.querySelector('.prev');
  const nextBtn = carousel.querySelector('.next');

  if (!prevBtn || !nextBtn) return;

  let index = 0;

  const loading = document.createElement('div');
  loading.classList.add('carousel-loading');
  const loader = document.createElement('dotlottie-wc');
  loader.setAttribute('src', 'https://lottie.host/ed183b18-bffe-4e7f-a222-d554908e33b8/FhsNasBleM.lottie');
  loader.setAttribute('autoplay', '');
  loader.setAttribute('loop', '');
  loader.setAttribute('speed', '1');
  loader.style.width = '120px';
  loader.style.height = '120px';
  loading.appendChild(loader);
  carousel.appendChild(loading);

  const placeholder = document.createElement('div');
  placeholder.classList.add('carousel-placeholder');
  const placeholderImg = document.createElement('img');
  placeholderImg.src = 'assets/images/placeholder.png';
  placeholder.appendChild(placeholderImg);
  carousel.appendChild(placeholder);

  const startTime = Date.now();
  const minDisplay = 3000;
  const placeholderDelay = 5000;
  const hideLoadingOverlay = () => {
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, minDisplay - elapsed);
    setTimeout(() => {
      loading.classList.add('fade-out');
      setTimeout(() => loading.remove(), 500);
      placeholder.classList.add('fade-out');
      setTimeout(() => placeholder.remove(), 500);
      clearTimeout(placeholderTimer);
    }, delay);
  };

  const placeholderTimer = setTimeout(() => {
    loading.classList.add('fade-out');
    setTimeout(() => loading.remove(), 500);
    placeholder.classList.add('show');
  }, placeholderDelay);

  const dotsContainer = document.createElement('div');
  dotsContainer.classList.add('carousel-dots');
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    dot.addEventListener('click', () => { index = i; update(); });
    dotsContainer.appendChild(dot);
  });
  carousel.appendChild(dotsContainer);
  const dots = dotsContainer.querySelectorAll('.carousel-dot');

  const update = () => {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  };
  update();

  const hideControls = () => {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    dotsContainer.style.display = 'none';
  };

  const showControls = () => {
    if (slides.length < 2) {
      hideControls();
      return;
    }
    if (prevBtn) prevBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = '';
    dotsContainer.style.display = '';
  };

  hideControls();

  prevBtn.addEventListener('click', () => {
    if (!slides.length) return;
    index = (index - 1 + slides.length) % slides.length;
    update();
  });
  nextBtn.addEventListener('click', () => {
    if (!slides.length) return;
    index = (index + 1) % slides.length;
    update();
  });

  const loadingFinished = () => {
    hideLoadingOverlay();
    showControls();
  };

  if (!slides.length) {
    loadingFinished();
    return;
  }

  let loadedCount = 0;
  const handleSettled = () => {
    loadedCount += 1;
    if (loadedCount === slides.length) {
      loadingFinished();
    }
  };

  slides.forEach(img => {
    if (img.complete) {
      handleSettled();
    } else {
      img.addEventListener('load', handleSettled);
      img.addEventListener('error', handleSettled);
    }
  });

  if (loadedCount === slides.length) {
    loadingFinished();
  }
}

function initializeCarousels(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  root.querySelectorAll('.carousel').forEach(initializeCarousel);
}

async function createAndroidProjectCard(app) {
  const card = document.createElement('md-filled-card');
  card.classList.add('project-entry');
  card.dataset.category = 'android';

  const content = document.createElement('div');
  content.classList.add('project-content');
  card.appendChild(content);

  const info = document.createElement('div');
  info.classList.add('project-info');
  content.appendChild(info);

  if (app.iconLogo) {
    const icon = document.createElement('img');
    icon.classList.add('project-app-icon');
    icon.src = app.iconLogo;
    icon.alt = `${app.name} app icon`;
    icon.loading = 'lazy';
    info.appendChild(icon);
  }

  const title = document.createElement('h2');
  title.textContent = app.name || 'Android App';
  info.appendChild(title);

  if (app.category || app.categoryLabel) {
    const categoryTag = document.createElement('div');
    categoryTag.classList.add('project-category-label');
    const categoryLabel = app.category
      ? (app.category.label || app.category.category_id || app.category)
      : app.categoryLabel;
    categoryTag.textContent = categoryLabel || '';
    info.appendChild(categoryTag);
  }

  if (app.description) {
    const description = document.createElement('div');
    description.classList.add('project-description');
    if (typeof window !== 'undefined' && window.marked) {
      description.innerHTML = window.marked.parse(app.description);
    } else {
      description.setAttribute('data-md', '');
      description.textContent = app.description;
    }
    info.appendChild(description);
  }

  const actions = document.createElement('div');
  actions.classList.add('project-actions');
  info.appendChild(actions);

  if (app.packageName) {
    const playLink = document.createElement('a');
    playLink.href = `https://play.google.com/store/apps/details?id=${app.packageName}`;
    playLink.target = '_blank';
    playLink.rel = 'noopener noreferrer';
    const installButton = document.createElement('md-filled-button');
    installButton.textContent = 'Install App';
    playLink.appendChild(installButton);
    actions.appendChild(playLink);
  }

  const media = document.createElement('div');
  media.classList.add('project-media');
  content.appendChild(media);

  const carousel = document.createElement('div');
  carousel.classList.add('carousel');
  media.appendChild(carousel);

  const screenshots = await filterSixteenNineScreenshots(app.screenshots || []);
  screenshots.forEach((url, index) => {
    const slide = document.createElement('img');
    slide.classList.add('carousel-slide');
    if (index === 0) {
      slide.classList.add('active');
    }
    slide.src = url;
    slide.alt = `${app.name} screenshot ${index + 1}`;
    slide.loading = 'lazy';
    carousel.appendChild(slide);
  });

  if (!screenshots.length) {
    const emptyState = document.createElement('p');
    emptyState.classList.add('carousel-empty');
    emptyState.textContent = 'No 16:9 screenshots available.';
    carousel.appendChild(emptyState);
  }

  const prevBtn = document.createElement('button');
  prevBtn.classList.add('prev');
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
  carousel.appendChild(prevBtn);

  const nextBtn = document.createElement('button');
  nextBtn.classList.add('next');
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
  carousel.appendChild(nextBtn);

  return { card, carousel };
}

function loadAndroidProjects({ container, applyCategoryFilter, animationsApi }) {
  if (!container) return;

  const renderMessage = message => {
    container.innerHTML = '';
    const messageEl = document.createElement('p');
    messageEl.classList.add('projects-error');
    messageEl.textContent = message;
    container.appendChild(messageEl);
    container.removeAttribute('data-loading');
  };

  const fetchFn = getGlobalFetch();
  if (!fetchFn) {
    renderMessage('Android apps require a modern browser to load.');
    return;
  }

  fetchFn(ANDROID_APPS_ENDPOINT)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Projects: HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(async payload => {
      const apps = payload && payload.data && Array.isArray(payload.data.apps) ? payload.data.apps : [];
      if (!apps.length) {
        renderMessage('No Android apps available right now.');
        return;
      }

      container.innerHTML = '';
      container.removeAttribute('data-loading');

      const cards = await Promise.all(apps.map(app => {
        return createAndroidProjectCard(app).catch(error => {
          console.error('Projects: Failed to render Android app.', error);
          return null;
        });
      }));

      const createdCards = cards.filter(Boolean);
      if (!createdCards.length) {
        renderMessage('Android apps could not be displayed.');
        return;
      }

      createdCards.forEach(({ card, carousel }) => {
        container.appendChild(card);
        initializeCarousel(carousel);
      });

      const activeTab = document.querySelector('#projectsFilterTabs md-primary-tab[active]');
      const activeCategory = activeTab ? activeTab.dataset.category || 'all' : 'all';
      applyCategoryFilter(activeCategory);

      if (animationsApi && typeof animationsApi.animateProjectCards === 'function') {
        try {
          animationsApi.animateProjectCards(createdCards.map(item => item.card));
        } catch (animationError) {
          console.error('Projects: Failed to animate project cards.', animationError);
        }
      }
    })
    .catch(error => {
      console.error('Projects: Failed to load Android apps.', error);
      renderMessage('Unable to load Android apps right now.');
    });
}

function initProjectsPage() {
  return ensureProjectsMarkedLoaded().then(() => {
    document.querySelectorAll('#projectsPageContainer [data-md]').forEach(el => {
      if (typeof window !== 'undefined' && window.marked) {
        el.innerHTML = window.marked.parse(el.textContent.trim());
      }
    });

    const tabs = document.querySelectorAll('#projectsFilterTabs md-primary-tab');
    const projectsList = document.querySelector('.projects-list');
    const animationsApi = typeof SiteAnimations !== 'undefined' && SiteAnimations ? SiteAnimations : null;
    const projectsListEasing = resolveProjectsEasing(
      animationsApi && animationsApi.easings ? animationsApi.easings.spring : null,
      'cubic-bezier(0.4,0,0.2,1)'
    );

    let activeTabIndex = Array.from(tabs).findIndex(tab => tab.hasAttribute('active'));
    if (activeTabIndex < 0) {
      activeTabIndex = 0;
    }

    const getProjects = () => Array.from(document.querySelectorAll('.project-entry'));
    const animateCards = cards => {
      if (!animationsApi || typeof animationsApi.animateProjectCards !== 'function') return;
      try {
        animationsApi.animateProjectCards(cards);
      } catch (animationError) {
        console.error('Projects: Failed to animate project cards.', animationError);
      }
    };

    const applyCategoryFilter = category => {
      const cat = category || 'all';
      const projects = getProjects();
      projects.forEach(project => {
        if (cat === 'all') {
          project.style.display = '';
          return;
        }

        const projectCategories = (project.dataset.category || '')
          .split(',')
          .map(part => part.trim())
          .filter(Boolean);
        project.style.display = projectCategories.includes(cat) || (project.dataset.category || '').includes(cat)
          ? ''
          : 'none';
      });

      const visibleProjects = projects.filter(project => project.style.display !== 'none');
      animateCards(visibleProjects);
    };

    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', async () => {
        if (tab.hasAttribute('active')) return;
        if (projectsList && projectsList.animate) {
          const dir = idx > activeTabIndex ? 1 : -1;
          try {
            await projectsList.animate(
              [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${ -20 * dir }px)` }],
              { duration: 150, easing: projectsListEasing, fill: 'forwards' }
            ).finished;
          } catch (e) {}
        }

        tabs.forEach(t => t.removeAttribute('active'));
        tab.setAttribute('active', '');

        const category = tab.dataset.category || 'all';
        applyCategoryFilter(category);

        if (projectsList && projectsList.animate) {
          const dir = idx > activeTabIndex ? 1 : -1;
          try {
            await projectsList.animate(
              [{ opacity: 0, transform: `translateX(${20 * dir}px)` }, { opacity: 1, transform: 'translateX(0)' }],
              { duration: 150, easing: projectsListEasing, fill: 'forwards' }
            ).finished;
          } catch (e) {}
        }

        activeTabIndex = idx;
      });
    });

    initializeCarousels(document);

    const initialCategory = tabs[activeTabIndex] ? tabs[activeTabIndex].dataset.category || 'all' : 'all';
    applyCategoryFilter(initialCategory);

    const androidContainer = document.getElementById('androidProjectsContainer');
    loadAndroidProjects({
      container: androidContainer,
      applyCategoryFilter,
      animationsApi
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('projectsPageContainer')) {
    initProjectsPage();
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ensureProjectsMarkedLoaded, initProjectsPage };
}
