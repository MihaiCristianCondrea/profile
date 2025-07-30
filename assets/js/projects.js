let markedLoadPromiseProjects;

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

function initProjectsPage() {
  ensureProjectsMarkedLoaded().then(() => {
    document.querySelectorAll('#projectsPageContainer [data-md]').forEach(el => {
      if (window.marked) {
        el.innerHTML = marked.parse(el.textContent.trim());
      }
    });

    const tabs = document.querySelectorAll('#projectsFilterTabs md-primary-tab');
    const projects = document.querySelectorAll('.project-entry');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.removeAttribute('active'));
        tab.setAttribute('active', '');
        const cat = tab.dataset.category;
        projects.forEach(p => {
          if (cat === 'all') { p.style.display = ''; return; }
          p.style.display = p.dataset.category.includes(cat) ? '' : 'none';
        });
      });
    });

    document.querySelectorAll('.carousel').forEach(carousel => {
      const slides = carousel.querySelectorAll('.carousel-slide');
      let index = 0;

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
        slides.forEach((s,i) => s.classList.toggle('active', i===index));
        dots.forEach((d,i) => d.classList.toggle('active', i===index));
      };
      update();

      carousel.querySelector('.prev').addEventListener('click', () => {
        index = (index - 1 + slides.length) % slides.length; update();
      });
      carousel.querySelector('.next').addEventListener('click', () => {
        index = (index + 1) % slides.length; update();
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('projectsPageContainer')) {
    initProjectsPage();
  }
});
