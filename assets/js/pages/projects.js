let markedLoadPromiseProjects;

export function ensureProjectsMarkedLoaded() {
  if (window.marked) {
    return Promise.resolve();
  }
  if (markedLoadPromiseProjects) {
    return markedLoadPromiseProjects;
  }
  markedLoadPromiseProjects = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
  });
  return markedLoadPromiseProjects;
}

function resolveProjectsEasing(preferred, fallback) {
  const animationsApi = window.SiteAnimations || null;
  if (animationsApi && typeof animationsApi.resolveEasing === 'function') {
    return animationsApi.resolveEasing(preferred, fallback);
  }

  const css = typeof CSS !== 'undefined' && CSS && typeof CSS.supports === 'function'
    ? CSS
    : window.CSS && typeof window.CSS.supports === 'function'
      ? window.CSS
      : null;

  if (preferred && css && css.supports('animation-timing-function', 'linear(0,0.5,1)')) {
    return preferred;
  }
  return fallback;
}

export async function initProjectsPage() {
  await ensureProjectsMarkedLoaded();

  document.querySelectorAll('#projectsPageContainer [data-md]').forEach((element) => {
    if (window.marked) {
      element.innerHTML = window.marked.parse(element.textContent.trim());
    }
  });

  const tabs = document.querySelectorAll('#projectsFilterTabs md-primary-tab');
  const projects = document.querySelectorAll('.project-entry');
  const projectsList = document.querySelector('.projects-list');
  const animationsApi = window.SiteAnimations || null;
  const projectsListEasing = resolveProjectsEasing(
    animationsApi && animationsApi.easings ? animationsApi.easings.spring : null,
    'cubic-bezier(0.4,0,0.2,1)'
  );

  let activeTabIndex = 0;
  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', async () => {
      if (tab.hasAttribute('active')) {
        return;
      }

      if (projectsList && typeof projectsList.animate === 'function') {
        const direction = idx > activeTabIndex ? 1 : -1;
        try {
          await projectsList.animate(
            [
              { opacity: 1, transform: 'translateX(0)' },
              { opacity: 0, transform: `translateX(${ -20 * direction }px)` }
            ],
            { duration: 150, easing: projectsListEasing, fill: 'forwards' }
          ).finished;
        } catch (error) {
          console.error('Projects: Failed to animate filter transition (out).', error);
        }
      }

      tabs.forEach((otherTab) => otherTab.removeAttribute('active'));
      tab.setAttribute('active', '');
      const selectedCategory = tab.dataset.category;
      projects.forEach((project) => {
        if (selectedCategory === 'all') {
          project.style.display = '';
          return;
        }
        project.style.display = project.dataset.category.includes(selectedCategory) ? '' : 'none';
      });

      if (projectsList && typeof projectsList.animate === 'function') {
        const direction = idx > activeTabIndex ? 1 : -1;
        try {
          await projectsList.animate(
            [
              { opacity: 0, transform: `translateX(${20 * direction}px)` },
              { opacity: 1, transform: 'translateX(0)' }
            ],
            { duration: 150, easing: projectsListEasing, fill: 'forwards' }
          ).finished;
        } catch (error) {
          console.error('Projects: Failed to animate filter transition (in).', error);
        }
      }
      activeTabIndex = idx;

      if (animationsApi && typeof animationsApi.animateProjectCards === 'function') {
        try {
          const visibleProjects = Array.from(projects).filter((project) => project.style.display !== 'none');
          animationsApi.animateProjectCards(visibleProjects);
        } catch (animationError) {
          console.error('Projects: Failed to animate filtered project cards.', animationError);
        }
      }
    });
  });

  document.querySelectorAll('.carousel').forEach((carousel) => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
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
    placeholderImg.alt = 'Placeholder image';
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
    slides.forEach((_, dotIndex) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.type = 'button';
      dot.addEventListener('click', () => {
        index = dotIndex;
        update();
      });
      dotsContainer.appendChild(dot);
    });
    carousel.appendChild(dotsContainer);
    const dots = dotsContainer.querySelectorAll('.carousel-dot');

    const update = () => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
      });
    };
    update();

    const hideControls = () => {
      if (prevBtn) {
        prevBtn.style.display = 'none';
      }
      if (nextBtn) {
        nextBtn.style.display = 'none';
      }
      dotsContainer.style.display = 'none';
    };

    const showControls = () => {
      if (slides.length < 2) {
        return;
      }
      if (prevBtn) {
        prevBtn.style.display = '';
      }
      if (nextBtn) {
        nextBtn.style.display = '';
      }
      dotsContainer.style.display = '';
    };

    hideControls();

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        index = (index - 1 + slides.length) % slides.length;
        update();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        index = (index + 1) % slides.length;
        update();
      });
    }

    const loadingFinished = () => {
      hideLoadingOverlay();
      showControls();
    };

    let loadedCount = 0;
    const hideLoading = () => {
      loadedCount += 1;
      if (loadedCount === slides.length) {
        loadingFinished();
      }
    };

    slides.forEach((slide) => {
      if (slide.complete) {
        hideLoading();
      } else {
        slide.addEventListener('load', hideLoading);
        slide.addEventListener('error', hideLoading);
      }
    });
  });
}

export default {
  initProjectsPage,
  ensureProjectsMarkedLoaded
};
