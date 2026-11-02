import { sceneProgress, startScrollScenes, within } from '../../../../../src/features/apps/smart-cleaner/presentation/ScrollScenes';

describe('ScrollScenes', () => {
  test('progress runs from the section top reaching the viewport top to its bottom reaching the bottom', () => {
    expect(sceneProgress(100, 3000, 1000)).toBe(0);
    expect(sceneProgress(-1000, 3000, 1000)).toBe(0.5);
    expect(sceneProgress(-2500, 3000, 1000)).toBe(1);
    expect(sceneProgress(-10, 800, 1000)).toBe(1);
  });

  test('within maps a value through a window and clamps it', () => {
    expect(within(0.5, 0.4, 0.6)).toBeCloseTo(0.5);
    expect(within(0.1, 0.4, 0.6)).toBe(0);
    expect(within(0.9, 0.4, 0.6)).toBe(1);
  });

  test('a still scene is published at its end state once', () => {
    const scenes = startScrollScenes({ still: true });
    const el = document.createElement('section');
    const update = jest.fn();
    scenes.add(el, update);

    expect(update).toHaveBeenCalledWith(1);
    expect(el.style.getPropertyValue('--p')).toBe('1');
    scenes.stop();
  });
});
