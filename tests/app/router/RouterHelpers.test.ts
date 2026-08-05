import {
  isRegisteredRoute,
  normalizePageId,
} from '../../../src/app/router/Router';
import {
  DOCUMENT_TITLE_SUFFIX,
  pushState,
  updateTitle,
} from '../../../src/app/router/HistoryManager';

describe('router helpers', () => {
  test('normalizes hashes, empty routes, and resume query parameters', () => {
    expect(normalizePageId('')).toBe('home');
    expect(normalizePageId('#home')).toBe('home');
    expect(normalizePageId('index.html')).toBe('home');
    expect(normalizePageId('#resume?edit=true')).toBe('resume');
    expect(isRegisteredRoute('#projects')).toBe(true);
    expect(isRegisteredRoute('#missing')).toBe(false);
  });

  test('updates the shell title and document title', () => {
    const headline = document.createElement('h1');

    updateTitle(headline, 'Projects');

    expect(headline.textContent).toBe('Projects');
    expect(document.title).toBe(`Projects${DOCUMENT_TITLE_SUFFIX}`);
  });

  test('pushes history only when the destination changes', () => {
    window.location.hash = '#home';
    const pushStateSpy = jest
      .spyOn(window.history, 'pushState')
      .mockImplementation(() => undefined);

    pushState('projects', 'Projects', 'projects');
    pushState('home', 'Home', 'home');
    pushState('about', 'About', 'about', false);

    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(pushStateSpy).toHaveBeenCalledWith(
      { page: 'projects' },
      'Projects',
      '#projects',
    );
  });
});
