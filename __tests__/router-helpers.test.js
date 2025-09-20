import { jest } from '@jest/globals';
import { fadeOut, fadeIn } from '../assets/js/router/animation.js';
import { DOCUMENT_TITLE_SUFFIX, updateTitle, pushState } from '../assets/js/router/history.js';

describe('router helpers', () => {
  describe('animation helpers', () => {
    test('fadeOut resolves after animate finished and targets opacity 0', async () => {
      const element = document.createElement('div');
      element.style.opacity = '1';
      const finishedPromise = Promise.resolve();
      element.animate = jest.fn(() => ({ finished: finishedPromise }));

      await expect(fadeOut(element)).resolves.toBeUndefined();

      const [frames, options] = element.animate.mock.calls[0];
      expect(frames[0]).toEqual(expect.objectContaining({ opacity: 1 }));
      expect(frames[1]).toEqual(expect.objectContaining({ opacity: 0 }));
      expect(options).toEqual(expect.objectContaining({ fill: 'both' }));
    });

    test('fadeIn falls back to CSS transition when animate is unavailable', async () => {
      const element = document.createElement('div');
      delete element.animate;

      await expect(fadeIn(element)).resolves.toBeUndefined();
      expect(element.style.opacity).toBe('1');
    });

    test('fadeOut handles animate throwing by using fallback', async () => {
      const element = document.createElement('div');
      element.animate = jest.fn(() => {
        throw new Error('animation failed');
      });

      await expect(fadeOut(element)).resolves.toBeUndefined();
      expect(element.style.opacity).toBe('0');
    });
  });

  describe('history helpers', () => {
    test('updateTitle updates headline text and document title', () => {
      const headline = document.createElement('div');
      const titleSetter = jest.spyOn(document, 'title', 'set');

      updateTitle(headline, 'About');

      expect(headline.textContent).toBe('About');
      expect(titleSetter).toHaveBeenCalledWith(`About${DOCUMENT_TITLE_SUFFIX}`);

      titleSetter.mockRestore();
    });

    test('pushState updates history when allowed and respects shouldUpdate flag', () => {
      const pushStateSpy = jest.spyOn(window.history, 'pushState').mockImplementation(() => {});

      pushState('about', 'About', 'about');
      expect(pushStateSpy).toHaveBeenCalledWith({ page: 'about' }, 'About', '#about');

      pushState('about', 'About', 'about', false);
      expect(pushStateSpy).toHaveBeenCalledTimes(1);

      pushStateSpy.mockRestore();
    });
  });
});
