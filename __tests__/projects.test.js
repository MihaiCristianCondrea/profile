import { jest } from '@jest/globals';
import { ensureProjectsMarkedLoaded, initProjectsPage } from '../assets/js/pages/projects.js';

describe('pages/projects', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.marked;
    delete window.SiteAnimations;
  });

  test('ensureProjectsMarkedLoaded appends the Marked script when needed', async () => {
    delete window.marked;

    const loadPromise = ensureProjectsMarkedLoaded();

    const script = document.head.querySelector('script[src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"]');
    expect(script).not.toBeNull();

    const secondCallPromise = ensureProjectsMarkedLoaded();
    expect(secondCallPromise).toBe(loadPromise);

    script.dispatchEvent(new Event('load'));
    await expect(loadPromise).resolves.toBeInstanceOf(Event);
  });

  test('ensureProjectsMarkedLoaded resolves immediately when Marked is present', async () => {
    window.marked = {};
    await expect(ensureProjectsMarkedLoaded()).resolves.toBeUndefined();
  });

  test('initProjectsPage parses markdown, filters projects, and triggers animations', async () => {
    document.body.innerHTML = `
      <div id="projectsPageContainer">
        <div data-md>**Markdown**</div>
      </div>
      <div id="projectsFilterTabs">
        <md-primary-tab data-category="all"></md-primary-tab>
        <md-primary-tab data-category="android"></md-primary-tab>
      </div>
      <div class="projects-list">
        <div class="project-entry" data-category="android"></div>
        <div class="project-entry" data-category="design"></div>
      </div>
      <div class="carousel">
        <div class="carousel-slide active"></div>
        <button class="prev" type="button"></button>
        <button class="next" type="button"></button>
      </div>
    `;

    const projectsList = document.querySelector('.projects-list');
    projectsList.animate = jest.fn().mockReturnValue({ finished: Promise.resolve() });

    window.marked = {
      parse: jest.fn((text) => `<p>${text}</p>`)
    };

    window.SiteAnimations = {
      resolveEasing: jest.fn((preferred, fallback) => preferred || fallback),
      easings: { spring: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      animateProjectCards: jest.fn()
    };

    await initProjectsPage();

    expect(window.marked.parse).toHaveBeenCalled();

    const markdownElement = document.querySelector('#projectsPageContainer [data-md]');
    expect(markdownElement.innerHTML).toContain('<p>');

    const tabs = document.querySelectorAll('#projectsFilterTabs md-primary-tab');
    tabs[1].dispatchEvent(new Event('click'));
    await Promise.resolve();
    await Promise.resolve();

    expect(projectsList.animate).toHaveBeenCalled();
    const [firstProject, secondProject] = document.querySelectorAll('.project-entry');
    expect(firstProject.style.display).toBe('');
    expect(secondProject.style.display).toBe('none');
    expect(window.SiteAnimations.animateProjectCards).toHaveBeenCalled();
  });
});
